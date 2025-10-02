import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { CreateSessionRequest, SessionCategory } from '@rythm/shared';
import { v4 as uuidv4 } from 'uuid';

export const sessionsRouter = router({
  create: protectedProcedure
    .input(CreateSessionRequest)
    .mutation(async ({ input, ctx }) => {
      const sessionId = uuidv4();
      const { category, program_id, notes } = input;
      const started_at = (input as any).started_at; // Temporary cast until packages rebuild

      // Use provided started_at or default to NOW()
      const result = await ctx.db.query(
        `INSERT INTO sessions (session_id, tenant_id, user_id, program_id, category, notes, started_at)
         VALUES ($1, $2, $3, $4, $5, $6, ${started_at ? '$7' : 'NOW()'})
         RETURNING session_id, tenant_id, user_id, program_id, category, notes, started_at, created_at`,
        started_at 
          ? [sessionId, ctx.user.tenantId, ctx.user.userId, program_id || null, category, notes || null, new Date(started_at).toISOString()]
          : [sessionId, ctx.user.tenantId, ctx.user.userId, program_id || null, category, notes || null]
      );

      return result.rows[0];
    }),

  complete: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { sessionId } = input;

      const result = await ctx.db.query(
        `UPDATE sessions 
         SET completed_at = NOW()
         WHERE session_id = $1 AND tenant_id = $2 AND user_id = $3
         RETURNING session_id, completed_at`,
        [sessionId, ctx.user.tenantId, ctx.user.userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Session not found or access denied');
      }

      return result.rows[0];
    }),

  list: protectedProcedure
    .input(z.object({
      category: SessionCategory.optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      userId: z.string().uuid().optional(), // For coaches to view athlete sessions
    }))
    .query(async ({ input, ctx }) => {
      try {
        const { category, limit, offset, userId } = input;
        
        console.log('📋 Sessions list query:', { category, limit, offset, userId, tenantId: ctx.user.tenantId, requestUserId: ctx.user.userId });
        
        // Determine target user (own sessions or athlete sessions for coaches)
        const targetUserId = userId && ['coach', 'tenant_admin', 'org_admin'].includes(ctx.user.role) 
          ? userId 
          : ctx.user.userId;

        let query = `
          SELECT s.session_id, s.user_id, s.program_id, s.category, s.notes, 
                 s.started_at, s.completed_at, s.created_at,
                 u.first_name, u.last_name, u.email,
                 p.name as program_name
          FROM sessions s
          JOIN users u ON s.user_id = u.user_id
          LEFT JOIN programs p ON s.program_id = p.program_id
          WHERE s.tenant_id = $1 AND s.user_id = $2
        `;
        
        const params = [ctx.user.tenantId, targetUserId];
        let paramIndex = 3;

        if (category) {
          query += ` AND s.category = $${paramIndex}`;
          params.push(category);
          paramIndex++;
        }

        query += ` ORDER BY s.started_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit.toString(), offset.toString());

        console.log('📋 Executing query with params:', params);
        const result = await ctx.db.query(query, params);
        console.log('📋 Query returned', result.rows.length, 'rows');
        return result.rows;
      } catch (error) {
        console.error('❌ Error in sessions.list:', error);
        throw error;
      }
    }),

  count: protectedProcedure
    .input(z.object({
      category: SessionCategory.optional(),
      userId: z.string().uuid().optional(), // For coaches to view athlete sessions
    }))
    .query(async ({ input, ctx }) => {
      const { category, userId } = input;
      
      // Determine target user (own sessions or athlete sessions for coaches)
      const targetUserId = userId && ['coach', 'tenant_admin', 'org_admin'].includes(ctx.user.role) 
        ? userId 
        : ctx.user.userId;

      let query = `
        SELECT COUNT(*) as total
        FROM sessions s
        WHERE s.tenant_id = $1 AND s.user_id = $2
      `;
      
      const params = [ctx.user.tenantId, targetUserId];
      let paramIndex = 3;

      if (category) {
        query += ` AND s.category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      const result = await ctx.db.query(query, params);
      return parseInt(result.rows[0].total);
    }),

  getById: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const { sessionId } = input;

      const result = await ctx.db.query(
        `SELECT s.*, u.first_name, u.last_name, p.name as program_name,
                COUNT(st.set_id) as total_sets
         FROM sessions s
         JOIN users u ON s.user_id = u.user_id
         LEFT JOIN programs p ON s.program_id = p.program_id
         LEFT JOIN sets st ON s.session_id = st.session_id
         WHERE s.session_id = $1 AND s.tenant_id = $2
         GROUP BY s.session_id, u.user_id, u.first_name, u.last_name, p.name`,
        [sessionId, ctx.user.tenantId]
      );

      if (result.rows.length === 0) {
        throw new Error('Session not found');
      }

      const session = result.rows[0];

      // Check access permissions
      if (session.user_id !== ctx.user.userId && 
          !['coach', 'tenant_admin', 'org_admin'].includes(ctx.user.role)) {
        throw new Error('Access denied');
      }

      return session;
    }),

  delete: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { sessionId } = input;

      const result = await ctx.db.query(
        `DELETE FROM sessions 
         WHERE session_id = $1 AND tenant_id = $2 AND user_id = $3
         RETURNING session_id`,
        [sessionId, ctx.user.tenantId, ctx.user.userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Session not found or access denied');
      }

      return { success: true };
    }),

  // Get recent activity for user dashboard
  recentActivity: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ input, ctx }) => {
      const { limit } = input;
      
      // Get recent sessions with completion status and details
      const result = await ctx.db.query(
        `SELECT 
           s.session_id,
           s.category,
           s.name,
           s.started_at,
           s.completed_at,
           s.created_at,
           s.training_load,
           s.perceived_exertion,
           s.notes,
           COUNT(sets.set_id) as total_sets,
           COUNT(DISTINCT sets.exercise_id) as total_exercises
         FROM sessions s
         LEFT JOIN sets ON s.session_id = sets.session_id
         WHERE s.tenant_id = $1 AND s.user_id = $2
         GROUP BY s.session_id, s.category, s.name, s.started_at, s.completed_at, 
                  s.created_at, s.training_load, s.perceived_exertion, s.notes
         ORDER BY s.started_at DESC 
         LIMIT $3`,
        [ctx.user.tenantId, ctx.user.userId, limit]
      );

      // Transform the data into activity items
      const activities = result.rows.map(row => {
        const isCompleted = !!row.completed_at;
        const sessionName = row.name || `${row.category.charAt(0).toUpperCase() + row.category.slice(1)} session`;
        
        // Check if the activity is from today
        const activityDate = new Date(isCompleted ? row.completed_at : row.started_at);
        const today = new Date();
        const isToday = activityDate.toDateString() === today.toDateString();
        
        return {
          id: row.session_id,
          type: isCompleted ? 'session_completed' : 'session_started',
          action: isCompleted 
            ? `Completed ${sessionName}${row.total_exercises > 0 ? ` (${row.total_exercises} exercises, ${row.total_sets} sets)` : ''}`
            : `${sessionName}${row.total_exercises > 0 ? ` (${row.total_exercises} exercises, ${row.total_sets} sets)` : ''}`,
          timestamp: isCompleted ? row.completed_at : row.started_at,
          metadata: {
            category: row.category,
            training_load: row.training_load,
            perceived_exertion: row.perceived_exertion,
            total_sets: parseInt(row.total_sets) || 0,
            total_exercises: parseInt(row.total_exercises) || 0,
          }
        };
      });

      return activities;
    }),
});