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
import { db } from '@rythm/db';

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
    const userId = (req as any).user?.userId;
    backup = await backupService.createBackup({ userId, type: 'manual' });
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
 * List all available backups with history information
 */
router.get('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    // Fetch backups from blob storage
    const backups = await backupService.listBackups();
    
    // Fetch backup history
    const historyResult = await db.query(`
      SELECT 
        bh.backup_filename,
        bh.backup_type,
        bh.status,
        bh.file_size_bytes,
        bh.duration_seconds,
        bh.error_message,
        bh.started_at,
        bh.completed_at,
        u.email as initiated_by_email
      FROM backup_history bh
      LEFT JOIN users u ON bh.initiated_by_user_id = u.user_id
      ORDER BY bh.started_at DESC
    `);

    // Create a map of history by filename
    const historyMap = new Map();
    for (const row of historyResult.rows) {
      historyMap.set(row.backup_filename, {
        type: row.backup_type,
        status: row.status,
        duration_seconds: row.duration_seconds,
        error_message: row.error_message,
        started_at: row.started_at,
        completed_at: row.completed_at,
        initiated_by: row.initiated_by_email,
      });
    }
    
    // Map to frontend format with history information
    const formattedBackups = backups.map(backup => {
      const history = historyMap.get(backup.filename);
      return {
        name: backup.filename,
        size: backup.size,
        createdAt: backup.timestamp.toISOString(),
        url: `/api/backups/${backup.filename}/download`,
        type: history?.type || 'unknown',
        status: history?.status || 'completed',
        duration_seconds: history?.duration_seconds,
        initiated_by: history?.initiated_by,
      };
    });
    
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

/**
 * GET /api/backups/schedule
 * Get backup schedule configuration
 */
router.get('/schedule/config', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      'SELECT * FROM backup_schedule LIMIT 1'
    );

    if (result.rows.length === 0) {
      // Create default configuration if none exists
      const createResult = await db.query(
        `INSERT INTO backup_schedule (enabled, schedule_time, retention_days)
         VALUES (FALSE, '02:00:00', 30)
         RETURNING *`
      );
      return res.json({
        success: true,
        data: createResult.rows[0],
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get backup schedule error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get backup schedule',
    });
  }
});

/**
 * PUT /api/backups/schedule
 * Update backup schedule configuration
 */
router.put('/schedule/config', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { enabled, schedule_time, retention_days } = req.body;

    // Validate inputs
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'enabled must be a boolean',
      });
    }

    if (schedule_time && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(schedule_time)) {
      return res.status(400).json({
        success: false,
        error: 'schedule_time must be in HH:MM:SS format',
      });
    }

    if (retention_days && (retention_days < 1 || retention_days > 90)) {
      return res.status(400).json({
        success: false,
        error: 'retention_days must be between 1 and 90',
      });
    }

    // Update configuration
    const result = await db.query(
      `UPDATE backup_schedule 
       SET enabled = $1,
           schedule_time = COALESCE($2, schedule_time),
           retention_days = COALESCE($3, retention_days),
           updated_at = NOW()
       RETURNING *`,
      [enabled, schedule_time || null, retention_days || null]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Backup schedule not found',
      });
    }

    res.json({
      success: true,
      message: 'Backup schedule updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update backup schedule error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update backup schedule',
    });
  }
});

export default router;
