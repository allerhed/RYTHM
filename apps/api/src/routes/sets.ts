import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { CreateSetRequest, SetValueType } from '@rythm/shared';
import { v4 as uuidv4 } from 'uuid';

export const setsRouter = router({
  create: protectedProcedure
    .input(CreateSetRequest.extend({
      sessionId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { sessionId, exercise_id, reps, value_1_type, value_1_numeric, 
              value_2_type, value_2_numeric, rpe, notes } = input;

      // Verify session belongs to user and get set index
      const sessionResult = await ctx.db.query(
        `SELECT session_id, user_id FROM sessions 
         WHERE session_id = $1 AND tenant_id = $2`,
        [sessionId, ctx.user.tenantId]
      );

      if (sessionResult.rows.length === 0) {
        throw new Error('Session not found');
      }

      if (sessionResult.rows[0].user_id !== ctx.user.userId && 
          !['coach', 'tenant_admin', 'org_admin'].includes(ctx.user.role)) {
        throw new Error('Access denied');
      }

      // Get next set index for this exercise in this session
      const indexResult = await ctx.db.query(
        `SELECT COALESCE(MAX(set_index), 0) + 1 as next_index
         FROM sets WHERE session_id = $1 AND exercise_id = $2`,
        [sessionId, exercise_id]
      );

      const setIndex = indexResult.rows[0].next_index;
      const setId = uuidv4();

      const result = await ctx.db.query(
        `INSERT INTO sets (
          set_id, tenant_id, session_id, exercise_id, set_index,
          reps, value_1_type, value_1_numeric, value_2_type, value_2_numeric,
          rpe, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          setId, ctx.user.tenantId, sessionId, exercise_id, setIndex,
          reps || null, value_1_type || null, value_1_numeric || null,
          value_2_type || null, value_2_numeric || null, rpe || null, notes || null
        ]
      );

      return result.rows[0];
    }),

  update: protectedProcedure
    .input(CreateSetRequest.extend({
      setId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { setId, reps, value_1_type, value_1_numeric, 
              value_2_type, value_2_numeric, rpe, notes } = input;

      // Verify access to set
      const setResult = await ctx.db.query(
        `SELECT s.session_id, ses.user_id 
         FROM sets s
         JOIN sessions ses ON s.session_id = ses.session_id
         WHERE s.set_id = $1 AND s.tenant_id = $2`,
        [setId, ctx.user.tenantId]
      );

      if (setResult.rows.length === 0) {
        throw new Error('Set not found');
      }

      if (setResult.rows[0].user_id !== ctx.user.userId && 
          !['coach', 'tenant_admin', 'org_admin'].includes(ctx.user.role)) {
        throw new Error('Access denied');
      }

      const result = await ctx.db.query(
        `UPDATE sets SET 
          reps = $2, value_1_type = $3, value_1_numeric = $4,
          value_2_type = $5, value_2_numeric = $6, rpe = $7, notes = $8,
          updated_at = NOW()
         WHERE set_id = $1 AND tenant_id = $9
         RETURNING *`,
        [
          setId, reps || null, value_1_type || null, value_1_numeric || null,
          value_2_type || null, value_2_numeric || null, rpe || null, 
          notes || null, ctx.user.tenantId
        ]
      );

      return result.rows[0];
    }),

  listBySession: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const { sessionId } = input;

      // Verify access to session
      const sessionResult = await ctx.db.query(
        `SELECT user_id FROM sessions 
         WHERE session_id = $1 AND tenant_id = $2`,
        [sessionId, ctx.user.tenantId]
      );

      if (sessionResult.rows.length === 0) {
        throw new Error('Session not found');
      }

      if (sessionResult.rows[0].user_id !== ctx.user.userId && 
          !['coach', 'tenant_admin', 'org_admin'].includes(ctx.user.role)) {
        throw new Error('Access denied');
      }

      const result = await ctx.db.query(
        `SELECT s.*, e.name as exercise_name, e.muscle_groups
         FROM sets s
         JOIN exercises e ON s.exercise_id = e.exercise_id
         WHERE s.session_id = $1 AND s.tenant_id = $2
         ORDER BY e.name, s.set_index`,
        [sessionId, ctx.user.tenantId]
      );

      return result.rows;
    }),

  delete: protectedProcedure
    .input(z.object({ setId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { setId } = input;

      // Verify access to set
      const setResult = await ctx.db.query(
        `SELECT s.session_id, ses.user_id 
         FROM sets s
         JOIN sessions ses ON s.session_id = ses.session_id
         WHERE s.set_id = $1 AND s.tenant_id = $2`,
        [setId, ctx.user.tenantId]
      );

      if (setResult.rows.length === 0) {
        throw new Error('Set not found');
      }

      if (setResult.rows[0].user_id !== ctx.user.userId && 
          !['coach', 'tenant_admin', 'org_admin'].includes(ctx.user.role)) {
        throw new Error('Access denied');
      }

      const result = await ctx.db.query(
        `DELETE FROM sets 
         WHERE set_id = $1 AND tenant_id = $2
         RETURNING set_id`,
        [setId, ctx.user.tenantId]
      );

      return { success: true };
    }),
});