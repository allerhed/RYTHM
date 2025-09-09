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

  // Simple test endpoint
  test: protectedProcedure
    .query(async ({ ctx }) => {
      return { message: 'Analytics tRPC is working!', userId: ctx.user.userId };
    }),

  trainingLoadChart: protectedProcedure
    .query(async ({ ctx }) => {
      // Helper function to get Monday of a week
      const getMondayOfWeek = (date: Date) => {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is Sunday
        return new Date(d.setDate(diff))
      }

      // Fetch all sessions with their sets data for the last 6 months
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const query = `
        SELECT 
          s.session_id,
          s.category,
          s.started_at,
          s.completed_at,
          s.training_load,
          s.duration_seconds,
          s.perceived_exertion,
          COUNT(DISTINCT sets.exercise_id) as exercise_count,
          COUNT(sets.set_id) as total_sets,
          SUM(
            CASE 
              WHEN sets.value_1_type = 'duration_s' THEN sets.value_1_numeric
              WHEN sets.value_2_type = 'duration_s' THEN sets.value_2_numeric
              ELSE 0
            END
          ) as sets_duration_s
        FROM sessions s
        LEFT JOIN sets ON sets.session_id = s.session_id
        WHERE s.user_id = $1 AND s.started_at >= $2
        GROUP BY s.session_id, s.category, s.started_at, s.completed_at, s.training_load, s.duration_seconds, s.perceived_exertion
        ORDER BY s.started_at DESC
      `

      const result = await ctx.db.query(query, [ctx.user.userId, sixMonthsAgo.toISOString()])
      const sessions = result.rows

      const now = new Date()
      const currentMonday = getMondayOfWeek(now)

      // Generate weekly data for the chart (last 12 weeks)
      const weeklyData = []
      
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(currentMonday)
        weekStart.setDate(weekStart.getDate() - (i * 7))
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        weekEnd.setHours(23, 59, 59, 999) // Include full last day

        const weekSessions = sessions.filter((s: any) => {
          const date = new Date(s.started_at)
          return date >= weekStart && date <= weekEnd
        })

        const cardioSessions = weekSessions.filter((s: any) => s.category === 'cardio')
        const strengthSessions = weekSessions.filter((s: any) => s.category === 'strength')

        // Use the actual training_load field from sessions
        const actualLoad = weekSessions.reduce((sum: number, s: any) => {
          const trainingLoad = parseInt(s.training_load) || 0
          return sum + trainingLoad
        }, 0)
        
        // Calculate activity time from session duration or sets duration
        const actualTime = weekSessions.reduce((sum: number, s: any) => {
          // First try session duration_seconds, then sets duration, then estimate
          const sessionDuration = parseInt(s.duration_seconds) || 0
          const setsDuration = parseFloat(s.sets_duration_s) || 0
          const estimatedDuration = sessionDuration || setsDuration || (parseInt(s.total_sets) || 0) * 180
          return sum + estimatedDuration
        }, 0) / 60 // convert to minutes

        const cardioLoad = cardioSessions.reduce((sum: number, s: any) => {
          const trainingLoad = parseInt(s.training_load) || 0
          return sum + trainingLoad
        }, 0)
        
        const strengthLoad = strengthSessions.reduce((sum: number, s: any) => {
          const trainingLoad = parseInt(s.training_load) || 0
          return sum + trainingLoad
        }, 0)

        // Debug logging for the current week
        if (i === 0) {
          console.log(`Current week (${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}):`)
          console.log(`- Sessions found: ${weekSessions.length}`)
          weekSessions.forEach((s: any) => {
            console.log(`  - ${s.started_at}: ${s.category}, training_load: ${s.training_load}, ${s.total_sets} sets`)
          })
          console.log(`- Total training load: ${actualLoad}`)
        }

        weeklyData.push({
          date: weekStart.toISOString().split('T')[0],
          trainingLoad: actualLoad,
          activityTime: actualTime,
          cardioLoad: cardioLoad,
          strengthLoad: strengthLoad
        })
      }

      return {
        weeklyData,
        totalSessions: sessions.length
      }
    }),

  analyticsSummary: protectedProcedure
    .query(async ({ ctx }) => {
      // Fetch all sessions with their sets data for the last 6 months
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const query = `
        SELECT 
          s.session_id,
          s.category,
          s.started_at,
          s.completed_at,
          s.training_load,
          s.duration_seconds,
          s.perceived_exertion,
          e.exercise_id,
          e.name as exercise_name,
          sets.set_id,
          sets.reps,
          sets.value_1_type,
          sets.value_1_numeric,
          sets.value_2_type,
          sets.value_2_numeric,
          sets.rpe,
          sets.notes
        FROM sessions s
        LEFT JOIN sets ON sets.session_id = s.session_id
        LEFT JOIN exercises e ON e.exercise_id = sets.exercise_id
        WHERE s.user_id = $1 AND s.started_at >= $2
        ORDER BY s.started_at DESC
      `

      const result = await ctx.db.query(query, [ctx.user.userId, sixMonthsAgo.toISOString()])
      const rows = result.rows

      // Group data by session
      const sessionsMap = new Map()
      rows.forEach((row: any) => {
        if (!sessionsMap.has(row.session_id)) {
          sessionsMap.set(row.session_id, {
            id: row.session_id,
            session_id: row.session_id,
            category: row.category,
            started_at: row.started_at,
            completed_at: row.completed_at,
            training_load: row.training_load,
            duration_seconds: row.duration_seconds,
            perceived_exertion: row.perceived_exertion,
            exercises: new Map()
          })
        }

        const session = sessionsMap.get(row.session_id)
        if (row.exercise_id && !session.exercises.has(row.exercise_id)) {
          session.exercises.set(row.exercise_id, {
            exercise_id: row.exercise_id,
            name: row.exercise_name,
            sets: []
          })
        }

        if (row.set_id && row.exercise_id) {
          const exercise = session.exercises.get(row.exercise_id)
          exercise.sets.push({
            set_id: row.set_id,
            reps: row.reps,
            value_1_type: row.value_1_type,
            value_1_numeric: row.value_1_numeric,
            value_2_type: row.value_2_type,
            value_2_numeric: row.value_2_numeric,
            rpe: row.rpe,
            notes: row.notes
          })
        }
      })

      // Convert maps to arrays
      const sessions = Array.from(sessionsMap.values()).map((session: any) => ({
        ...session,
        exercises: Array.from(session.exercises.values())
      }))

      const now = new Date()
      
      // Define periods: last 3 months vs previous 3 months
      const currentPeriodStart = new Date()
      currentPeriodStart.setMonth(currentPeriodStart.getMonth() - 3)
      
      const previousPeriodStart = new Date()
      previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 6)
      
      const previousPeriodEnd = new Date(currentPeriodStart)

      // Filter sessions by periods
      const currentSessions = sessions.filter((s: any) => {
        const date = new Date(s.started_at)
        return date >= currentPeriodStart && date <= now
      })

      const previousSessions = sessions.filter((s: any) => {
        const date = new Date(s.started_at)
        return date >= previousPeriodStart && date < previousPeriodEnd
      })

      // Calculate metrics for each period
      const calculatePeriodMetrics = (periodSessions: any[]) => {
        let totalDistance = 0
        let totalWeight = 0
        let totalDuration = 0
        let totalSets = 0

        // Process each session's exercises and sets
        periodSessions.forEach((session: any) => {
          session.exercises?.forEach((exercise: any) => {
            exercise.sets?.forEach((set: any) => {
              totalSets++
              
              // Extract distance (convert from meters to km)
              if (set.value_1_type === 'distance_m' && set.value_1_numeric) {
                totalDistance += parseFloat(set.value_1_numeric) / 1000
              }
              if (set.value_2_type === 'distance_m' && set.value_2_numeric) {
                totalDistance += parseFloat(set.value_2_numeric) / 1000
              }
              
              // Extract duration (convert from seconds to minutes)
              if (set.value_1_type === 'duration_s' && set.value_1_numeric) {
                totalDuration += parseFloat(set.value_1_numeric) / 60
              }
              if (set.value_2_type === 'duration_s' && set.value_2_numeric) {
                totalDuration += parseFloat(set.value_2_numeric) / 60
              }
              
              // Extract weight calculations (weight * reps)
              let weight = 0
              let reps = set.reps || 1
              
              if (set.value_1_type === 'weight_kg' && set.value_1_numeric) {
                weight = parseFloat(set.value_1_numeric)
              }
              if (set.value_2_type === 'weight_kg' && set.value_2_numeric) {
                weight = parseFloat(set.value_2_numeric)
              }
              
              // If we have weight, multiply by reps for total weight moved
              if (weight > 0) {
                totalWeight += weight * reps
              }
            })
          })
        })

        // Use actual training load from sessions instead of calculating it
        const actualTrainingLoad = periodSessions.reduce((sum: number, session: any) => {
          return sum + (parseInt(session.training_load) || 0)
        }, 0)
        
        // Use session duration or sets duration, then fallback to estimates
        const actualTime = periodSessions.reduce((sum: number, session: any) => {
          const sessionDuration = parseInt(session.duration_seconds) || 0
          const estimatedDuration = sessionDuration || totalDuration * 60 || 3600 // 1 hour default
          return sum + estimatedDuration
        }, 0) / 60 // convert to minutes
        
        // Use real data, fallback to estimates only if no data exists
        const finalDistance = totalDistance > 0 ? totalDistance : (periodSessions.filter(s => s.category === 'cardio').length * 5.2)
        const finalWeight = totalWeight > 0 ? totalWeight : (periodSessions.filter(s => s.category === 'strength').length * 2500)

        return {
          trainingLoad: actualTrainingLoad,
          activityTime: actualTime,
          totalDistance: finalDistance,
          totalWeight: finalWeight,
          workoutCount: periodSessions.length
        }
      }

      const currentPeriod = calculatePeriodMetrics(currentSessions)
      const previousPeriod = calculatePeriodMetrics(previousSessions)

      return {
        currentPeriod,
        previousPeriod,
        totalSessions: sessions.length
      }
    }),
});