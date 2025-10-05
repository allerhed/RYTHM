/**
 * BackupScheduler Service
 * 
 * Automated database backup scheduler that runs as a cron job in the API container.
 * Checks the backup_schedule table every minute and executes backups when:
 * - enabled = true
 * - current UTC time matches schedule_time
 * 
 * Updates last_run_at and next_run_at timestamps after each backup.
 * Sends email notifications to admins about backup status.
 */

import cron from 'node-cron';
import { db } from '@rythm/db';
import { backupService } from './backup.service';
import { EmailService } from './EmailService';

interface BackupScheduleConfig {
  schedule_id: string;
  enabled: boolean;
  schedule_time: string; // HH:MM:SS format
  retention_days: number;
  last_run_at: Date | null;
  next_run_at: Date | null;
}

class BackupScheduler {
  private cronJob: cron.ScheduledTask | null = null;
  private emailService: EmailService;
  private isRunning = false;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Initialize and start the backup scheduler
   * Runs every minute to check if a backup should be executed
   */
  public start(): void {
    if (this.cronJob) {
      console.log('⚠️  Backup scheduler already running');
      return;
    }

    console.log('🔄 Starting backup scheduler...');

    // Run every minute: '* * * * *'
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.checkAndExecuteBackup();
    });

    console.log('✅ Backup scheduler initialized - checking every minute');
  }

  /**
   * Stop the backup scheduler
   */
  public stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('⏹️  Backup scheduler stopped');
    }
  }

  /**
   * Check if backup should run and execute if conditions are met
   */
  private async checkAndExecuteBackup(): Promise<void> {
    // Prevent concurrent executions
    if (this.isRunning) {
      console.log('⏭️  Skipping backup check - previous backup still running');
      return;
    }

    try {
      // Get schedule configuration
      const result = await db.query(
        'SELECT * FROM backup_schedule LIMIT 1'
      );

      if (result.rows.length === 0) {
        console.log('⚠️  No backup schedule configuration found');
        return;
      }

      const config = result.rows[0] as BackupScheduleConfig;

      // Check if backups are enabled
      if (!config.enabled) {
        // Only log every hour to avoid spam
        const now = new Date();
        if (now.getMinutes() === 0) {
          console.log('ℹ️  Automated backups are disabled');
        }
        return;
      }

      // Get current time in HH:MM format
      const now = new Date();
      const currentTimeUTC = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;
      
      // Get scheduled time in HH:MM format (remove seconds)
      const scheduledTime = config.schedule_time.substring(0, 5);

      // Check if current time matches scheduled time
      if (currentTimeUTC === scheduledTime) {
        // Check if we already ran in the last 2 minutes to prevent duplicates
        if (config.last_run_at) {
          const lastRunMinutesAgo = (Date.now() - new Date(config.last_run_at).getTime()) / 1000 / 60;
          if (lastRunMinutesAgo < 2) {
            console.log('⏭️  Backup already executed recently, skipping');
            return;
          }
        }

        console.log(`🎯 Scheduled time matched: ${scheduledTime} UTC - executing backup...`);
        await this.executeScheduledBackup(config);
      }
    } catch (error) {
      console.error('❌ Error in backup scheduler:', error);
    }
  }

  /**
   * Execute the scheduled backup
   */
  private async executeScheduledBackup(config: BackupScheduleConfig): Promise<void> {
    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('📦 Creating scheduled database backup...');

      // Create the backup
      const backup = await backupService.createBackup({ type: 'scheduled' });

      // Calculate next run time (24 hours from now)
      const nextRun = new Date();
      nextRun.setUTCDate(nextRun.getUTCDate() + 1);
      // Set to the scheduled time
      const [hours, minutes] = config.schedule_time.split(':');
      nextRun.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Update schedule table
      await db.query(
        `UPDATE backup_schedule 
         SET last_run_at = NOW(), 
             next_run_at = $1 
         WHERE schedule_id = $2`,
        [nextRun, config.schedule_id]
      );

      const duration = Math.round((Date.now() - startTime) / 1000);
      console.log(`✅ Scheduled backup completed successfully in ${duration}s`);
      console.log(`   Backup: ${backup.filename}`);
      console.log(`   Size: ${this.formatBytes(backup.size)}`);
      console.log(`   Next run: ${nextRun.toISOString()}`);

      // Send success notification to system admins
      await this.sendBackupNotification(
        'success',
        backup.filename,
        backup.size,
        duration
      );

      // Note: Cleanup of old backups happens automatically in backupService.createBackup()

    } catch (error) {
      console.error('❌ Scheduled backup failed:', error);

      // Send failure notification to system admins
      await this.sendBackupNotification(
        'failure',
        'backup-failed',
        0,
        Math.round((Date.now() - startTime) / 1000),
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Send backup notification email to system admins
   */
  private async sendBackupNotification(
    status: 'success' | 'failure',
    backupId: string,
    size: number,
    duration: number,
    error?: string
  ): Promise<void> {
    try {
      // Get all system admins
      const adminsResult = await db.query(
        `SELECT email FROM users WHERE role = 'system_admin' AND email IS NOT NULL`
      );

      if (adminsResult.rows.length === 0) {
        console.log('⚠️  No system admin emails found for backup notification');
        return;
      }

      const adminEmails = adminsResult.rows.map((row: { email: string }) => row.email);

      for (const email of adminEmails) {
        await this.emailService.sendBackupNotification({
          adminEmail: email,
          backupId,
          status,
          size,
          duration: duration * 1000, // Convert to milliseconds for email service
          error,
          tenantName: 'RYTHM System',
        });
      }

      console.log(`📧 Backup notification sent to ${adminEmails.length} admin(s)`);
    } catch (error) {
      console.error('❌ Failed to send backup notification:', error);
      // Don't throw - notification failure shouldn't fail the backup
    }
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// Export singleton instance
export const backupScheduler = new BackupScheduler();
