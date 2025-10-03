/**
 * Backup API Routes
 * 
 * Provides REST endpoints for database backup management:
 * - POST /api/backups - Create a new backup
 * - GET /api/backups - List all backups
 * - POST /api/backups/:filename/restore - Restore from a backup
 * - DELETE /api/backups/:filename - Delete a backup
 * - GET /api/backups/:filename/download - Download a backup file
 */

import { Router, Request, Response } from 'express';
import { backupService } from '../services/backup.service';
import { emailService } from '../services/EmailService';
import { authenticateToken, authenticateTokenFlexible, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * POST /api/backups
 * Create a new database backup
 */
router.post('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const startTime = Date.now();
  let backup: any = null;
  
  try {
    console.log('Creating database backup...');
    backup = await backupService.createBackup();
    const duration = Date.now() - startTime;
    
    // Send success notification email (don't block response)
    if (emailService.isReady() && (req as any).user?.email) {
      emailService.sendBackupNotification({
        adminEmail: (req as any).user.email,
        backupId: backup.filename,
        status: 'success',
        size: backup.size,
        duration,
      }).catch(err => console.error('Failed to send backup notification:', err));
    }
    
    res.status(201).json({
      success: true,
      message: 'Backup created successfully',
      data: backup,
    });
  } catch (error) {
    console.error('Backup creation error:', error);
    const duration = Date.now() - startTime;
    
    // Send failure notification email (don't block response)
    if (emailService.isReady() && (req as any).user?.email) {
      emailService.sendBackupNotification({
        adminEmail: (req as any).user.email,
        backupId: backup?.filename || `failed-${Date.now()}`,
        status: 'failure',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      }).catch(err => console.error('Failed to send backup notification:', err));
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create backup',
    });
  }
});

/**
 * GET /api/backups
 * List all available backups
 */
router.get('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const backups = await backupService.listBackups();
    
    // Map to frontend format (name instead of filename for consistency)
    const formattedBackups = backups.map(backup => ({
      name: backup.filename,
      size: backup.size,
      createdAt: backup.timestamp.toISOString(),
      url: `/api/backups/${backup.filename}/download`,
    }));
    
    res.json({
      success: true,
      data: formattedBackups,
      count: formattedBackups.length,
    });
  } catch (error) {
    console.error('List backups error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list backups',
    });
  }
});

/**
 * POST /api/backups/:filename/restore
 * Restore database from a backup
 */
router.post('/:filename/restore', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    if (!filename || !filename.endsWith('.sql')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid backup filename',
      });
    }

    console.log(`Restoring from backup: ${filename}`);
    
    // WARNING: This will overwrite the current database
    await backupService.restoreBackup(filename);
    
    res.json({
      success: true,
      message: 'Database restored successfully',
      filename,
    });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore backup',
    });
  }
});

/**
 * DELETE /api/backups/:filename
 * Delete a backup
 */
router.delete('/:filename', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    if (!filename || !filename.endsWith('.sql')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid backup filename',
      });
    }

    await backupService.deleteBackup(filename);
    
    res.json({
      success: true,
      message: 'Backup deleted successfully',
      filename,
    });
  } catch (error) {
    console.error('Delete backup error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete backup',
    });
  }
});

/**
 * GET /api/backups/:filename/download
 * Download a backup file
 * Note: Uses authenticateTokenFlexible to support token in query parameter for browser downloads
 */
router.get('/:filename/download', authenticateTokenFlexible, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    if (!filename || !filename.endsWith('.sql')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid backup filename',
      });
    }

    const buffer = await backupService.downloadBackup(filename);
    
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Download backup error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to download backup',
    });
  }
});

export default router;
