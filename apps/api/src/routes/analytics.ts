import { z } from 'zod';
import { router, protectedProcedure, coachProcedure } from '../trpc';
import { AnalyticsFilters } from '@rythm/shared';

export const analyticsRouter = router({
  trainingVolume: protectedProcedure
    .input(AnalyticsFilters.extend({
      userId: z.string().uuid().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const { from, to, category, userId } = input;
      
      // Determine target user (own analytics or athlete analytics for coaches)
      const targetUserId = userId && ['coach', 'tenant_admin', 'org_admin'].includes(ctx.user.role) 
        ? userId 
        : ctx.user.userId;

      let query = `
        SELECT 
          week_start,
          category,
          session_count,
          total_sets,
          strength_volume,
          total_distance,
          total_duration,
          total_calories
        FROM training_volume_weekly
        WHERE tenant_id = $1 AND user_id = $2
      `;
      
      const params = [ctx.user.tenantId, targetUserId];
      let paramIndex = 3;

      if (from) {
        query += ` AND week_start >= $${paramIndex}`;
        params.push(from.toISOString());
        paramIndex++;
      }

      if (to) {
        query += ` AND week_start <= $${paramIndex}`;
        params.push(to.toISOString());
        paramIndex++;
      }

      if (category) {
        query += ` AND category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      query += ` ORDER BY week_start DESC, category`;

      const result = await ctx.db.query(query, params);
      return result.rows;
    }),

  muscleGroupSplit: protectedProcedure
    .input(AnalyticsFilters.extend({
      userId: z.string().uuid().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const { from, to, category, userId } = input;
      
      const targetUserId = userId && ['coach', 'tenant_admin', 'org_admin'].includes(ctx.user.role) 
        ? userId 
        : ctx.user.userId;

      let query = `
        SELECT 
          muscle_group,
          month_start,
          category,
          sets_count,
          volume
        FROM muscle_group_volume
        WHERE tenant_id = $1 AND user_id = $2
      `;
      
      const params = [ctx.user.tenantId, targetUserId];
      let paramIndex = 3;

      if (from) {
        query += ` AND month_start >= DATE_TRUNC('month', $${paramIndex}::date)`;
        params.push(from.toISOString());
        paramIndex++;
      }

      if (to) {
        query += ` AND month_start <= DATE_TRUNC('month', $${paramIndex}::date)`;
        params.push(to.toISOString());
        paramIndex++;
      }

      if (category) {
        query += ` AND category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      query += ` ORDER BY month_start DESC, muscle_group`;

      const result = await ctx.db.query(query, params);
      return result.rows;
    }),

  personalRecords: protectedProcedure
    .input(z.object({
      userId: z.string().uuid().optional(),
      exerciseId: z.string().uuid().optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input, ctx }) => {
      const { userId, exerciseId, limit } = input;
      
      const targetUserId = userId && ['coach', 'tenant_admin', 'org_admin'].includes(ctx.user.role) 
        ? userId 
        : ctx.user.userId;

      let query = `
        SELECT 
          exercise_id,
          exercise_name,
          pr_type,
          value,
          achieved_at
        FROM personal_records
        WHERE tenant_id = $1 AND user_id = $2
      `;
      
      const params = [ctx.user.tenantId, targetUserId];
      let paramIndex = 3;

      if (exerciseId) {
        query += ` AND exercise_id = $${paramIndex}`;
        params.push(exerciseId);
        paramIndex++;
      }

      query += ` ORDER BY achieved_at DESC LIMIT $${paramIndex}`;
      params.push(limit.toString());

      const result = await ctx.db.query(query, params);
      return result.rows;
    }),

  sessionSummary: protectedProcedure
    .input(AnalyticsFilters.extend({
      userId: z.string().uuid().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const { from, to, category, userId } = input;
      
      const targetUserId = userId && ['coach', 'tenant_admin', 'org_admin'].includes(ctx.user.role) 
        ? userId 
        : ctx.user.userId;

      let query = `
        SELECT 
          s.category,
          COUNT(DISTINCT s.session_id) as total_sessions,
          COUNT(st.set_id) as total_sets,
          AVG(
            CASE 
              WHEN st.value_1_type = 'duration_s' THEN st.value_1_numeric
              WHEN st.value_2_type = 'duration_s' THEN st.value_2_numeric
              ELSE NULL
            END
          ) as avg_session_duration,
          SUM(
            CASE 
              WHEN st.value_1_type = 'weight_kg' AND st.reps IS NOT NULL 
              THEN st.value_1_numeric * st.reps
              WHEN st.value_2_type = 'weight_kg' AND st.reps IS NOT NULL 
              THEN st.value_2_numeric * st.reps
              ELSE 0
            END
          ) as total_volume
        FROM sessions s
        LEFT JOIN sets st ON s.session_id = st.session_id
        WHERE s.tenant_id = $1 AND s.user_id = $2 AND s.completed_at IS NOT NULL
      `;
      
      const params = [ctx.user.tenantId, targetUserId];
      let paramIndex = 3;

      if (from) {
        query += ` AND s.started_at >= $${paramIndex}`;
        params.push(from.toISOString());
        paramIndex++;
      }

      if (to) {
        query += ` AND s.started_at <= $${paramIndex}`;
        params.push(to.toISOString());
        paramIndex++;
      }

      if (category) {
        query += ` AND s.category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      query += ` GROUP BY s.category ORDER BY s.category`;

      const result = await ctx.db.query(query, params);
      return result.rows;
    }),

  refreshViews: coachProcedure
    .mutation(async ({ ctx }) => {
      await ctx.db.query('SELECT refresh_analytics_views()');
      return { success: true };
    }),
});