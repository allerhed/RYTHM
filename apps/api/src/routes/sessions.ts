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

      const result = await ctx.db.query(
        `INSERT INTO sessions (session_id, tenant_id, user_id, program_id, category, notes, started_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING session_id, tenant_id, user_id, program_id, category, notes, started_at, created_at`,
        [sessionId, ctx.user.tenantId, ctx.user.userId, program_id || null, category, notes || null]
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
      const { category, limit, offset, userId } = input;
      
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

      const result = await ctx.db.query(query, params);
      return result.rows;
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
});