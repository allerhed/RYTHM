/**
 * Database Backup Service
 * 
 * Provides PostgreSQL backup and restore functionality with Azure Blob Storage.
 * Features:
 * - Create full database backups (pg_dump format)
 * - Upload to Azure Blob Storage
 * - List available backups
 * - Restore from backup
 * - Automatic retention policy (10 days)
 * - Scheduled backups via cron
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { db } from '@rythm/db';

const execAsync = promisify(exec);

interface BackupMetadata {
  filename: string;
  timestamp: Date;
  size: number;
  databaseName: string;
  status: 'completed' | 'failed' | 'in_progress';
}

interface BackupSchedule {
  enabled: boolean;
  cronExpression: string;
  retentionDays: number;
}

export class BackupService {
  private containerClient: ContainerClient;
  private tempDir: string;
  private readonly RETENTION_DAYS = 30;

  constructor() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = process.env.AZURE_BACKUP_CONTAINER || 'database-backups';

    if (!connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set');
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = blobServiceClient.getContainerClient(containerName);
    this.tempDir = path.join(os.tmpdir(), 'rythm-backups');

    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Create a new database backup
   */
  async createBackup(options?: { userId?: string; type?: 'manual' | 'scheduled' }): Promise<BackupMetadata> {
    const timestamp = new Date();
    const filename = `rythm-backup-${timestamp.toISOString().replace(/[:.]/g, '-')}.sql`;
    const tempFilePath = path.join(this.tempDir, filename);
    const startTime = Date.now();
    let historyId: string | null = null;

    try {
      // Log backup start to history
      const historyResult = await db.query(
        `INSERT INTO backup_history (backup_filename, backup_type, status, initiated_by_user_id, started_at)
         VALUES ($1, $2, 'started', $3, NOW())
         RETURNING history_id`,
        [filename, options?.type || 'manual', options?.userId || null]
      );
      historyId = historyResult.rows[0].history_id;

      // Get database connection details
      const dbConfig = this.getDatabaseConfig();

      // Create pg_dump command
      const dumpCommand = this.buildPgDumpCommand(dbConfig, tempFilePath);

      console.log('Starting database backup...');
      
      // Execute pg_dump
      await execAsync(dumpCommand);

      // Get file size
      const stats = fs.statSync(tempFilePath);
      const fileSizeInBytes = stats.size;

      console.log(`Backup created: ${filename} (${this.formatBytes(fileSizeInBytes)})`);

      // Upload to Azure Blob Storage
      await this.uploadToBlob(tempFilePath, filename);

      // Clean up temp file
      fs.unlinkSync(tempFilePath);

      // Clean up old backups
      await this.cleanupOldBackups();

      const duration = Math.round((Date.now() - startTime) / 1000);

      // Update history with success
      if (historyId) {
        await db.query(
          `UPDATE backup_history 
           SET status = 'completed', file_size_bytes = $1, duration_seconds = $2, completed_at = NOW()
           WHERE history_id = $3`,
          [fileSizeInBytes, duration, historyId]
        );
      }

      return {
        filename,
        timestamp,
        size: fileSizeInBytes,
        databaseName: dbConfig.database,
        status: 'completed',
      };
    } catch (error) {
      console.error('Backup failed:', error);
      
      // Clean up temp file if it exists
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      const duration = Math.round((Date.now() - startTime) / 1000);

      // Update history with failure
      if (historyId) {
        await db.query(
          `UPDATE backup_history 
           SET status = 'failed', duration_seconds = $1, error_message = $2, completed_at = NOW()
           WHERE history_id = $3`,
          [duration, error instanceof Error ? error.message : 'Unknown error', historyId]
        );
      }

      throw new Error(`Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all available backups
   */
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      // Ensure container exists
      await this.containerClient.createIfNotExists();

      const backups: BackupMetadata[] = [];

      // List all blobs in container
      for await (const blob of this.containerClient.listBlobsFlat()) {
        if (blob.name.endsWith('.sql')) {
          backups.push({
            filename: blob.name,
            timestamp: blob.properties.createdOn || new Date(),
            size: blob.properties.contentLength || 0,
            databaseName: 'rythm',
            status: 'completed',
          });
        }
      }

      // Sort by timestamp descending (newest first)
      backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return backups;
    } catch (error) {
      console.error('Failed to list backups:', error);
      throw new Error(`Failed to list backups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Restore database from a backup
   */
  async restoreBackup(filename: string): Promise<void> {
    const tempFilePath = path.join(this.tempDir, filename);

    try {
      console.log(`Starting restore from backup: ${filename}`);

      // Download backup from blob storage
      await this.downloadFromBlob(filename, tempFilePath);

      // Get database connection details
      const dbConfig = this.getDatabaseConfig();

      // Create psql restore command
      const restoreCommand = this.buildPsqlCommand(dbConfig, tempFilePath);

      // Execute restore
      await execAsync(restoreCommand);

      console.log('Database restored successfully');

      // Clean up temp file
      fs.unlinkSync(tempFilePath);
    } catch (error) {
      console.error('Restore failed:', error);
      
      // Clean up temp file if it exists
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      throw new Error(`Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a backup
   */
  async deleteBackup(filename: string): Promise<void> {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(filename);
      await blockBlobClient.delete();
      console.log(`Deleted backup: ${filename}`);
    } catch (error) {
      console.error('Failed to delete backup:', error);
      throw new Error(`Failed to delete backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download a backup file (for user download)
   */
  async downloadBackup(filename: string): Promise<Buffer> {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(filename);
      const downloadResponse = await blockBlobClient.download();
      
      if (!downloadResponse.readableStreamBody) {
        throw new Error('No data in backup file');
      }

      const chunks: Buffer[] = [];
      for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(Buffer.from(chunk));
      }

      return Buffer.concat(chunks);
    } catch (error) {
      console.error('Failed to download backup:', error);
      throw new Error(`Failed to download backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up backups older than retention period
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);

      for (const backup of backups) {
        if (backup.timestamp < cutoffDate) {
          console.log(`Deleting old backup: ${backup.filename}`);
          await this.deleteBackup(backup.filename);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
      // Don't throw - cleanup failure shouldn't fail the backup
    }
  }

  /**
   * Upload file to Azure Blob Storage
   */
  private async uploadToBlob(filePath: string, blobName: string): Promise<void> {
    try {
      // Ensure container exists
      await this.containerClient.createIfNotExists();

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.uploadFile(filePath);
      
      console.log(`Uploaded to blob storage: ${blobName}`);
    } catch (error) {
      console.error('Failed to upload to blob storage:', error);
      throw new Error(`Failed to upload backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download file from Azure Blob Storage
   */
  private async downloadFromBlob(blobName: string, filePath: string): Promise<void> {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.downloadToFile(filePath);
      
      console.log(`Downloaded from blob storage: ${blobName}`);
    } catch (error) {
      console.error('Failed to download from blob storage:', error);
      throw new Error(`Failed to download backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get database configuration from environment
   */
  private getDatabaseConfig() {
    if (process.env.DATABASE_URL) {
      const url = new URL(process.env.DATABASE_URL);
      return {
        host: url.hostname,
        port: url.port || '5432',
        database: url.pathname.substring(1),
        user: url.username,
        password: url.password,
      };
    }

    return {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      database: process.env.DB_NAME || 'rythm',
      user: process.env.DB_USER || 'rythm_api',
      password: process.env.DB_PASSWORD || 'password',
    };
  }

  /**
   * Build pg_dump command
   */
  private buildPgDumpCommand(config: any, outputPath: string): string {
    const pgPassword = `PGPASSWORD="${config.password}"`;
    const pgDump = `pg_dump -h ${config.host} -p ${config.port} -U ${config.user} -d ${config.database}`;
    const options = `-F p --no-owner --no-acl --clean --if-exists`;
    
    return `${pgPassword} ${pgDump} ${options} > "${outputPath}"`;
  }

  /**
   * Build psql restore command
   */
  private buildPsqlCommand(config: any, inputPath: string): string {
    const pgPassword = `PGPASSWORD="${config.password}"`;
    const psql = `psql -h ${config.host} -p ${config.port} -U ${config.user} -d ${config.database}`;
    
    return `${pgPassword} ${psql} < "${inputPath}"`;
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// Singleton instance
export const backupService = new BackupService();
