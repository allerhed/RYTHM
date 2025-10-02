/**
 * Email Logs API Routes
 * 
 * Provides REST endpoints for viewing email audit logs:
 * - GET /api/email-logs - List all emails with pagination and filtering
 * - GET /api/email-logs/:id - Get full details of a specific email
 */

import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { db } from '@rythm/db';

const router = Router();

// Middleware: All email log routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * GET /api/email-logs
 * List all email logs with pagination and filtering
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '50',
      email_type,
      status,
      search,
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Build WHERE clause based on filters
    const conditions: string[] = ['1=1'];
    const values: any[] = [];
    let paramIndex = 1;

    if (email_type) {
      conditions.push(`email_type = $${paramIndex}`);
      values.push(email_type);
      paramIndex++;
    }

    if (status) {
      conditions.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(
        to_address ILIKE $${paramIndex} OR 
        subject ILIKE $${paramIndex} OR
        plain_text_body ILIKE $${paramIndex}
      )`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM email_logs WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const result = await db.query(
      `SELECT 
        email_log_id,
        tenant_id,
        user_id,
        email_type,
        status,
        to_address,
        from_address,
        subject,
        message_id,
        error_message,
        sent_at,
        created_at
       FROM email_logs
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, parseInt(limit as string), offset]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('List email logs error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch email logs',
    });
  }
});

/**
 * GET /api/email-logs/:id
 * Get full details of a specific email including HTML body
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT 
        email_log_id,
        tenant_id,
        user_id,
        email_type,
        status,
        to_address,
        from_address,
        reply_to_address,
        subject,
        plain_text_body,
        html_body,
        message_id,
        error_message,
        sent_at,
        delivered_at,
        metadata,
        created_at,
        updated_at
       FROM email_logs
       WHERE email_log_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Email log not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get email log error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch email log',
    });
  }
});

/**
 * GET /api/email-logs/stats/summary
 * Get email statistics summary
 */
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT 
        email_type,
        status,
        COUNT(*) as count,
        MAX(created_at) as last_sent
      FROM email_logs
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY email_type, status
      ORDER BY email_type, status
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get email stats error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch email stats',
    });
  }
});

export default router;
