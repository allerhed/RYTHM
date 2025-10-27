import { z } from 'zod';
import { router, protectedProcedure, coachProcedure } from '../trpc';
import { AnalyticsFilters } from '@rythm/shared';

export const analyticsRouter = router({
  getTrainingVolume: protectedProcedure
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

  getMuscleGroupSplit: protectedProcedure
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

  getPersonalRecords: protectedProcedure
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

  getSessionSummary: protectedProcedure
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
              WHEN st.value_1_type = 'duration_m' THEN st.value_1_numeric
              WHEN st.value_2_type = 'duration_m' THEN st.value_2_numeric
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
  getTest: protectedProcedure
    .query(async ({ ctx }) => {
      return { message: 'Analytics tRPC is working!', userId: ctx.user.userId };
    }),

  // Training Score endpoint
  getTrainingScore: protectedProcedure
    .input(z.object({
      weekStart: z.string().optional(), // ISO date string for the Monday of the week
    }).optional())
    .query(async ({ input, ctx }) => {
      // Helper function to get Monday of a week
      const getMondayOfWeek = (date: Date) => {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1)
        return new Date(d.setDate(diff))
      }

      // Use provided week or default to current week
      const targetWeekStart = input?.weekStart ? new Date(input.weekStart) : getMondayOfWeek(new Date())
      const currentMonday = getMondayOfWeek(new Date())
      
      // Target week (selected week)
      const selectedWeekStart = new Date(targetWeekStart)
      const selectedWeekEnd = new Date(selectedWeekStart)
      selectedWeekEnd.setDate(selectedWeekEnd.getDate() + 6)
      selectedWeekEnd.setHours(23, 59, 59, 999)

      // Previous week (week before the selected week)
      const previousWeekStart = new Date(targetWeekStart)
      previousWeekStart.setDate(previousWeekStart.getDate() - 7)
      const previousWeekEnd = new Date(previousWeekStart)
      previousWeekEnd.setDate(previousWeekEnd.getDate() + 6)
      previousWeekEnd.setHours(23, 59, 59, 999)

      // Query for selected week sessions
      const selectedWeekQuery = `
        SELECT 
          s.training_load
        FROM sessions s
        WHERE s.user_id = $1 
          AND s.started_at >= $2 
          AND s.started_at <= $3
          AND s.training_load IS NOT NULL
      `

      // Query for previous week sessions
      const previousWeekQuery = `
        SELECT 
          s.training_load
        FROM sessions s
        WHERE s.user_id = $1 
          AND s.started_at >= $2 
          AND s.started_at <= $3
          AND s.training_load IS NOT NULL
      `

      const [selectedWeekResult, previousWeekResult] = await Promise.all([
        ctx.db.query(selectedWeekQuery, [ctx.user.userId, selectedWeekStart.toISOString(), selectedWeekEnd.toISOString()]),
        ctx.db.query(previousWeekQuery, [ctx.user.userId, previousWeekStart.toISOString(), previousWeekEnd.toISOString()])
      ])

      // Calculate total training loads
      const selectedWeekLoad = selectedWeekResult.rows.reduce((sum: number, row: any) => {
        return sum + (parseInt(row.training_load) || 0)
      }, 0)

      const previousWeekLoad = previousWeekResult.rows.reduce((sum: number, row: any) => {
        return sum + (parseInt(row.training_load) || 0)
      }, 0)

      // Determine training score category
      const getTrainingScoreCategory = (load: number) => {
        if (load >= 601) return { category: 'Maniacal', min: 601, max: null, color: '#8B5CF6' }
        if (load >= 501) return { category: 'Locked In', min: 501, max: 600, color: '#3B82F6' }
        if (load >= 401) return { category: 'Grinding', min: 401, max: 500, color: '#10B981' }
        if (load >= 301) return { category: 'Consistent', min: 301, max: 400, color: '#F59E0B' }
        if (load >= 201) return { category: 'Active', min: 201, max: 300, color: '#EF4444' }
        return { category: 'Aspiring', min: 0, max: 200, color: '#6B7280' }
      }

      const selectedScore = getTrainingScoreCategory(selectedWeekLoad)
      const previousScore = getTrainingScoreCategory(previousWeekLoad)

      // Calculate percentage change
      const percentageChange = previousWeekLoad > 0 
        ? ((selectedWeekLoad - previousWeekLoad) / previousWeekLoad) * 100 
        : selectedWeekLoad > 0 ? 100 : 0

      return {
        selectedWeek: {
          load: selectedWeekLoad,
          score: selectedScore,
          sessions: selectedWeekResult.rows.length,
          weekStart: selectedWeekStart.toISOString()
        },
        previousWeek: {
          load: previousWeekLoad,
          score: previousScore,
          sessions: previousWeekResult.rows.length,
          weekStart: previousWeekStart.toISOString()
        },
        change: {
          absolute: selectedWeekLoad - previousWeekLoad,
          percentage: Math.round(percentageChange)
        }
      }
    }),

  getTrainingLoadChart: protectedProcedure
    .query(async ({ ctx }) => {
      // Helper function to get Monday of a week
      const getMondayOfWeek = (date: Date) => {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is Sunday
        return new Date(d.setDate(diff))
      }

      // Fetch all sessions with their sets data for the last 6 months (to get both current and previous periods)
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
              WHEN sets.value_1_type = 'duration_m' THEN sets.value_1_numeric
              WHEN sets.value_2_type = 'duration_m' THEN sets.value_2_numeric
              ELSE 0
            END
          ) as sets_duration_m
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

      // Define periods for comparison
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      
      // Filter sessions for current period (last 3 months) and previous period (3-6 months ago)
      const currentPeriodSessions = sessions.filter((s: any) => {
        const date = new Date(s.started_at)
        return date >= threeMonthsAgo
      })
      
      const previousPeriodSessions = sessions.filter((s: any) => {
        const date = new Date(s.started_at)
        return date >= sixMonthsAgo && date < threeMonthsAgo
      })

      // Generate weekly data for the chart (past 3 months only - approximately 13 weeks)
      const weeklyData = []
      
      for (let i = 12; i >= 0; i--) {
        const weekStart = new Date(currentMonday)
        weekStart.setDate(weekStart.getDate() - (i * 7))
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        weekEnd.setHours(23, 59, 59, 999) // Include full last day

        // Only include weeks from the current period (past 3 months)
        if (weekStart < threeMonthsAgo) {
          continue
        }

        const weekSessions = currentPeriodSessions.filter((s: any) => {
          const date = new Date(s.started_at)
          return date >= weekStart && date <= weekEnd
        })

        const cardioSessions = weekSessions.filter((s: any) => s.category === 'cardio')
        const strengthSessions = weekSessions.filter((s: any) => s.category === 'strength')
        const hybridSessions = weekSessions.filter((s: any) => s.category === 'hybrid')

        // Use the actual training_load field from sessions
        const actualLoad = weekSessions.reduce((sum: number, s: any) => {
          const trainingLoad = parseInt(s.training_load) || 0
          return sum + trainingLoad
        }, 0)
        
        // Calculate activity time from session duration_seconds field (convert to minutes)
        const actualTime = weekSessions.reduce((sum: number, s: any) => {
          const sessionDurationMinutes = (parseInt(s.duration_seconds) || 0) / 60
          return sum + sessionDurationMinutes
        }, 0)
        


        const cardioLoad = cardioSessions.reduce((sum: number, s: any) => {
          const trainingLoad = parseInt(s.training_load) || 0
          return sum + trainingLoad
        }, 0)
        
        const strengthLoad = strengthSessions.reduce((sum: number, s: any) => {
          const trainingLoad = parseInt(s.training_load) || 0
          return sum + trainingLoad
        }, 0)
        
        const hybridLoad = hybridSessions.reduce((sum: number, s: any) => {
          const trainingLoad = parseInt(s.training_load) || 0
          return sum + trainingLoad
        }, 0)



        weeklyData.push({
          date: weekStart.toISOString().split('T')[0],
          trainingLoad: actualLoad,
          activityTime: actualTime,
          cardioLoad: cardioLoad,
          strengthLoad: strengthLoad,
          hybridLoad: hybridLoad
        })


      }

      // Calculate summary stats for comparison
      const currentPeriodStats = {
        totalSessions: currentPeriodSessions.length,
        totalTrainingLoad: currentPeriodSessions.reduce((sum: number, s: any) => sum + (parseInt(s.training_load) || 0), 0),
        totalActivityTime: currentPeriodSessions.reduce((sum: number, s: any) => sum + ((parseInt(s.duration_seconds) || 0) / 60), 0)
      }

      const previousPeriodStats = {
        totalSessions: previousPeriodSessions.length,
        totalTrainingLoad: previousPeriodSessions.reduce((sum: number, s: any) => sum + (parseInt(s.training_load) || 0), 0),
        totalActivityTime: previousPeriodSessions.reduce((sum: number, s: any) => sum + ((parseInt(s.duration_seconds) || 0) / 60), 0)
      }

      // Debug: Log activity time data to verify real values
      console.log('� Activity Time Debug:', {
        totalWeeks: weeklyData.length,
        last3Weeks: weeklyData.slice(-3).map(w => ({
          date: w.date,
          activityTime: w.activityTime,
          trainingLoad: w.trainingLoad
        }))
      })

      return {
        weeklyData,
        currentPeriod: currentPeriodStats,
        previousPeriod: previousPeriodStats,
        totalSessions: sessions.length
      }
    }),

  getAnalyticsSummary: protectedProcedure
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
      
      // Define periods: last 3 months vs previous 6 months (for activity time comparison)
      const currentPeriodStart = new Date()
      currentPeriodStart.setMonth(currentPeriodStart.getMonth() - 3)
      
      const previousPeriodStart = new Date()
      previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 9) // 9 months ago to get 6 months of data
      
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

        // Process each session's exercises and sets
        periodSessions.forEach((session: any) => {
          session.exercises?.forEach((exercise: any) => {
            exercise.sets?.forEach((set: any) => {
              // Extract distance (convert from meters to km)
              if (set.value_1_type === 'distance_m' && set.value_1_numeric) {
                totalDistance += parseFloat(set.value_1_numeric) / 1000
              }
              if (set.value_2_type === 'distance_m' && set.value_2_numeric) {
                totalDistance += parseFloat(set.value_2_numeric) / 1000
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
        
        // Calculate activity time from session duration_seconds field (convert to minutes)
        const actualTime = periodSessions.reduce((sum: number, session: any) => {
          const sessionDurationMinutes = (parseInt(session.duration_seconds) || 0) / 60
          return sum + sessionDurationMinutes
        }, 0)
        
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

  getCategoryBreakdown: protectedProcedure
    .query(async ({ ctx }) => {
      // Fetch all sessions for the last 6 months to get both current and previous periods
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const query = `
        SELECT 
          s.session_id,
          s.category,
          s.started_at,
          s.training_load
        FROM sessions s
        WHERE s.user_id = $1 AND s.started_at >= $2 AND s.training_load IS NOT NULL
        ORDER BY s.started_at DESC
      `

      const result = await ctx.db.query(query, [ctx.user.userId, sixMonthsAgo.toISOString()])
      const sessions = result.rows

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

      // Calculate totals by category for each period
      const calculateCategoryTotals = (periodSessions: any[]) => {
        const totals = {
          strength: 0,
          cardio: 0,
          hybrid: 0
        }

        periodSessions.forEach((session: any) => {
          const load = parseInt(session.training_load) || 0
          if (session.category === 'strength') {
            totals.strength += load
          } else if (session.category === 'cardio') {
            totals.cardio += load
          } else if (session.category === 'hybrid') {
            totals.hybrid += load
          }
        })

        return totals
      }

      const currentPeriodTotals = calculateCategoryTotals(currentSessions)
      const previousPeriodTotals = calculateCategoryTotals(previousSessions)

      // Calculate total loads for percentage calculations
      const currentTotal = currentPeriodTotals.strength + currentPeriodTotals.cardio + currentPeriodTotals.hybrid
      const previousTotal = previousPeriodTotals.strength + previousPeriodTotals.cardio + previousPeriodTotals.hybrid

      return {
        currentPeriod: {
          strength: currentPeriodTotals.strength,
          cardio: currentPeriodTotals.cardio,
          hybrid: currentPeriodTotals.hybrid,
          total: currentTotal
        },
        previousPeriod: {
          strength: previousPeriodTotals.strength,
          cardio: previousPeriodTotals.cardio,
          hybrid: previousPeriodTotals.hybrid,
          total: previousTotal
        }
      }
    }),

  // Weekly KG (total weight lifted) endpoint
  getWeeklyKg: protectedProcedure
    .input(z.object({
      weekStart: z.string().optional(), // ISO date string for the Monday of the week
    }).optional())
    .query(async ({ input, ctx }) => {
      // Helper function to get Monday of a week
      const getMondayOfWeek = (date: Date) => {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1)
        return new Date(d.setDate(diff))
      }

      // Use provided week or default to current week
      const targetWeekStart = input?.weekStart ? new Date(input.weekStart) : getMondayOfWeek(new Date())
      
      // Selected week
      const selectedWeekStart = new Date(targetWeekStart)
      const selectedWeekEnd = new Date(selectedWeekStart)
      selectedWeekEnd.setDate(selectedWeekEnd.getDate() + 6)
      selectedWeekEnd.setHours(23, 59, 59, 999)

      // Previous week
      const previousWeekStart = new Date(targetWeekStart)
      previousWeekStart.setDate(previousWeekStart.getDate() - 7)
      const previousWeekEnd = new Date(previousWeekStart)
      previousWeekEnd.setDate(previousWeekEnd.getDate() + 6)
      previousWeekEnd.setHours(23, 59, 59, 999)

      // Query for selected week total weight (in kg, multiplied by reps)
      const selectedWeekQuery = `
        SELECT 
          COALESCE(SUM(
            CASE 
              WHEN st.value_1_type = 'weight_kg' THEN st.value_1_numeric * COALESCE(st.reps, 1)
              WHEN st.value_2_type = 'weight_kg' THEN st.value_2_numeric * COALESCE(st.reps, 1)
              ELSE 0
            END
          ), 0) as total_weight
        FROM sets st
        JOIN sessions s ON s.session_id = st.session_id
        WHERE s.user_id = $1 
          AND s.started_at >= $2 
          AND s.started_at <= $3
      `

      // Query for previous week total weight
      const previousWeekQuery = `
        SELECT 
          COALESCE(SUM(
            CASE 
              WHEN st.value_1_type = 'weight_kg' THEN st.value_1_numeric * COALESCE(st.reps, 1)
              WHEN st.value_2_type = 'weight_kg' THEN st.value_2_numeric * COALESCE(st.reps, 1)
              ELSE 0
            END
          ), 0) as total_weight
        FROM sets st
        JOIN sessions s ON s.session_id = st.session_id
        WHERE s.user_id = $1 
          AND s.started_at >= $2 
          AND s.started_at <= $3
      `

      const [selectedWeekResult, previousWeekResult] = await Promise.all([
        ctx.db.query(selectedWeekQuery, [ctx.user.userId, selectedWeekStart.toISOString(), selectedWeekEnd.toISOString()]),
        ctx.db.query(previousWeekQuery, [ctx.user.userId, previousWeekStart.toISOString(), previousWeekEnd.toISOString()])
      ])

      const selectedWeekWeight = parseFloat(selectedWeekResult.rows[0]?.total_weight || 0)
      const previousWeekWeight = parseFloat(previousWeekResult.rows[0]?.total_weight || 0)

      return {
        selectedWeek: selectedWeekWeight,
        previousWeek: previousWeekWeight,
        weekStart: selectedWeekStart.toISOString()
      }
    }),

  // Weekly KM (total distance) endpoint
  getWeeklyKm: protectedProcedure
    .input(z.object({
      weekStart: z.string().optional(), // ISO date string for the Monday of the week
    }).optional())
    .query(async ({ input, ctx }) => {
      // Helper function to get Monday of a week
      const getMondayOfWeek = (date: Date) => {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1)
        return new Date(d.setDate(diff))
      }

      // Use provided week or default to current week
      const targetWeekStart = input?.weekStart ? new Date(input.weekStart) : getMondayOfWeek(new Date())
      
      // Selected week
      const selectedWeekStart = new Date(targetWeekStart)
      const selectedWeekEnd = new Date(selectedWeekStart)
      selectedWeekEnd.setDate(selectedWeekEnd.getDate() + 6)
      selectedWeekEnd.setHours(23, 59, 59, 999)

      // Previous week
      const previousWeekStart = new Date(targetWeekStart)
      previousWeekStart.setDate(previousWeekStart.getDate() - 7)
      const previousWeekEnd = new Date(previousWeekStart)
      previousWeekEnd.setDate(previousWeekEnd.getDate() + 6)
      previousWeekEnd.setHours(23, 59, 59, 999)

      // Query for selected week total distance in meters
      const selectedWeekQuery = `
        SELECT 
          COALESCE(SUM(
            CASE 
              WHEN st.value_1_type = 'distance_m' THEN st.value_1_numeric
              WHEN st.value_2_type = 'distance_m' THEN st.value_2_numeric
              ELSE 0
            END
          ), 0) as total_distance
        FROM sets st
        JOIN sessions s ON s.session_id = st.session_id
        WHERE s.user_id = $1 
          AND s.started_at >= $2 
          AND s.started_at <= $3
      `

      // Query for previous week total distance
      const previousWeekQuery = `
        SELECT 
          COALESCE(SUM(
            CASE 
              WHEN st.value_1_type = 'distance_m' THEN st.value_1_numeric
              WHEN st.value_2_type = 'distance_m' THEN st.value_2_numeric
              ELSE 0
            END
          ), 0) as total_distance
        FROM sets st
        JOIN sessions s ON s.session_id = st.session_id
        WHERE s.user_id = $1 
          AND s.started_at >= $2 
          AND s.started_at <= $3
      `

      const [selectedWeekResult, previousWeekResult] = await Promise.all([
        ctx.db.query(selectedWeekQuery, [ctx.user.userId, selectedWeekStart.toISOString(), selectedWeekEnd.toISOString()]),
        ctx.db.query(previousWeekQuery, [ctx.user.userId, previousWeekStart.toISOString(), previousWeekEnd.toISOString()])
      ])

      const selectedWeekDistance = parseFloat(selectedWeekResult.rows[0]?.total_distance || 0)
      const previousWeekDistance = parseFloat(previousWeekResult.rows[0]?.total_distance || 0)

      return {
        selectedWeek: selectedWeekDistance, // in meters
        previousWeek: previousWeekDistance, // in meters
        weekStart: selectedWeekStart.toISOString()
      }
    }),

  // Exercise history endpoint - get last 10 workouts with this exercise
  getExerciseHistory: protectedProcedure
    .input(z.object({
      exerciseTemplateId: z.string().uuid(),
      exerciseName: z.string().optional(), // Optional: client can pass the name directly
    }))
    .query(async ({ input, ctx }) => {
      const { exerciseTemplateId, exerciseName: providedName } = input;

      console.log('🔍 getExerciseHistory called:', { 
        exerciseTemplateId, 
        providedName,
        userId: ctx.user.userId, 
        tenantId: ctx.user.tenantId 
      });

      // Use provided name or look up the template name
      let exerciseName = providedName;
      
      if (!exerciseName) {
        const templateResult = await ctx.db.query(
          'SELECT name FROM exercise_templates WHERE template_id = $1',
          [exerciseTemplateId]
        );

        if (templateResult.rows.length === 0) {
          console.log('❌ Template not found:', exerciseTemplateId);
          return [];
        }

        exerciseName = templateResult.rows[0].name;
      }
      
      console.log('✅ Searching for exercise:', exerciseName);

      // Debug: Check what exercises exist in the database
      const exercisesCheck = await ctx.db.query(
        'SELECT DISTINCT e.name FROM exercises e JOIN sets st ON e.exercise_id = st.exercise_id JOIN sessions s ON st.session_id = s.session_id WHERE s.user_id = $1 AND s.tenant_id = $2 LIMIT 20',
        [ctx.user.userId, ctx.user.tenantId]
      );
      console.log('📋 User exercises in DB:', exercisesCheck.rows.map(r => r.name));

      // Get last 10 completed sessions that have this exercise (matching by name)
      const query = `
        SELECT
          s.session_id,
          s.started_at,
          s.category,
          e.name as exercise_name,
          json_agg(
            json_build_object(
              'set_id', st.set_id,
              'reps', st.reps,
              'value_1_type', st.value_1_type,
              'value_1_numeric', st.value_1_numeric,
              'value_2_type', st.value_2_type,
              'value_2_numeric', st.value_2_numeric,
              'set_index', st.set_index
            ) ORDER BY st.set_index
          ) as sets
        FROM sessions s
        JOIN sets st ON st.session_id = s.session_id
        JOIN exercises e ON e.exercise_id = st.exercise_id
        WHERE s.user_id = $1
          AND s.tenant_id = $2
          AND LOWER(e.name) = LOWER($3)
          AND s.completed_at IS NOT NULL
        GROUP BY s.session_id, s.started_at, s.category, e.name
        ORDER BY s.started_at DESC
        LIMIT 10
      `;

      console.log('🔎 Searching for exercise name:', exerciseName);
      console.log('🔎 Query parameters:', { userId: ctx.user.userId, tenantId: ctx.user.tenantId, exerciseName });
      
      // Debug: Check if ANY sessions have this exercise (without completed_at filter)
      const allSessionsCheck = await ctx.db.query(
        `SELECT s.session_id, s.completed_at, e.name 
         FROM sessions s 
         JOIN sets st ON st.session_id = s.session_id 
         JOIN exercises e ON e.exercise_id = st.exercise_id 
         WHERE s.user_id = $1 AND s.tenant_id = $2 AND LOWER(e.name) = LOWER($3)
         LIMIT 5`,
        [ctx.user.userId, ctx.user.tenantId, exerciseName]
      );
      console.log('📊 Sessions with this exercise (any status):', allSessionsCheck.rows.length);
      if (allSessionsCheck.rows.length > 0) {
        console.log('  First session:', allSessionsCheck.rows[0]);
      }
      
      const result = await ctx.db.query(query, [ctx.user.userId, ctx.user.tenantId, exerciseName]);
      console.log('📊 Query result count (completed only):', result.rows.length);

      return result.rows.map(row => ({
        sessionId: row.session_id,
        startedAt: row.started_at,
        category: row.category,
        exerciseName: row.exercise_name,
        sets: row.sets
      }));
    }),
});