/**
 * Hyrox Tracking tRPC Routes
 * 
 * Provides endpoints for tracking Hyrox race performance:
 * - list: Get all Hyrox records for the authenticated user
 * - getByExercise: Get detailed record with history for specific exercise
 * - upsertRecord: Create or update record for an exercise
 * - addHistory: Add a new historical record
 * - deleteHistory: Delete a specific historical record
 * - getStats: Get overall Hyrox statistics
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '@rythm/db';
import { TRPCError } from '@trpc/server';

// Hyrox exercise types enum
const hyroxExerciseTypeSchema = z.enum([
  '1KM_RUN',
  '1KM_SKI',
  '50M_SLED_PUSH',
  '50M_SLED_PULL',
  '80M_BURPEE_BROAD_JUMP',
  '1KM_ROW',
  '200M_FARMERS_CARRY',
  '100M_SANDBAG_LUNGES',
  '100_WALL_BALLS'
]);

// Validation schemas
const upsertRecordSchema = z.object({
  exerciseType: hyroxExerciseTypeSchema,
  timeSeconds: z.number().int().positive(),
  achievedDate: z.coerce.date(),
  notes: z.string().optional(),
  heartRate: z.number().int().positive().max(300).optional(),
});

const addHistorySchema = z.object({
  exerciseType: hyroxExerciseTypeSchema,
  timeSeconds: z.number().int().positive(),
  achievedDate: z.coerce.date(),
  notes: z.string().optional(),
  heartRate: z.number().int().positive().max(300).optional(),
});

const getByExerciseSchema = z.object({
  exerciseType: hyroxExerciseTypeSchema,
});

const deleteHistorySchema = z.object({
  historyId: z.string().uuid(),
});

// Helper: Get display name for exercise type
function getExerciseDisplayName(exerciseType: string): string {
  const names: Record<string, string> = {
    '1KM_RUN': '1km Run',
    '1KM_SKI': '1km Ski',
    '50M_SLED_PUSH': '50m Sled Push',
    '50M_SLED_PULL': '50m Sled Pull',
    '80M_BURPEE_BROAD_JUMP': '80m Burpee Broad Jump',
    '1KM_ROW': '1km Row',
    '200M_FARMERS_CARRY': '200m Farmers Carry',
    '100M_SANDBAG_LUNGES': '100m Sandbag Lunges',
    '100_WALL_BALLS': '100 Wall Balls'
  };
  return names[exerciseType] || exerciseType;
}

// Helper: Get distance/description for exercise
function getExerciseDistance(exerciseType: string): string {
  const distances: Record<string, string> = {
    '1KM_RUN': '1km',
    '1KM_SKI': '1km',
    '50M_SLED_PUSH': '50m',
    '50M_SLED_PULL': '50m',
    '80M_BURPEE_BROAD_JUMP': '80m',
    '1KM_ROW': '1km',
    '200M_FARMERS_CARRY': '200m',
    '100M_SANDBAG_LUNGES': '100m',
    '100_WALL_BALLS': '100 reps'
  };
  return distances[exerciseType] || '';
}

export const hyroxRouter = router({
  /**
   * List all Hyrox records for the authenticated user
   */
  list: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user.userId;
      const tenantId = ctx.user.tenantId;

      try {
        // Set RLS context
        await db.query('SELECT set_config($1, $2, TRUE)', ['app.current_user_id', userId]);
        await db.query('SELECT set_config($1, $2, TRUE)', ['app.current_tenant_id', tenantId]);

        const result = await db.query(`
          SELECT 
            hyrox_record_id,
            exercise_type,
            current_time_seconds,
            current_achieved_date,
            notes,
            (
              SELECT COUNT(*) 
              FROM hyrox_history hh 
              WHERE hh.hyrox_record_id = hr.hyrox_record_id
            ) as history_count
          FROM hyrox_records hr
          WHERE user_id = $1 AND tenant_id = $2
          ORDER BY 
            CASE exercise_type
              WHEN '1KM_RUN' THEN 1
              WHEN '1KM_SKI' THEN 2
              WHEN '50M_SLED_PUSH' THEN 3
              WHEN '50M_SLED_PULL' THEN 4
              WHEN '80M_BURPEE_BROAD_JUMP' THEN 5
              WHEN '1KM_ROW' THEN 6
              WHEN '200M_FARMERS_CARRY' THEN 7
              WHEN '100M_SANDBAG_LUNGES' THEN 8
              WHEN '100_WALL_BALLS' THEN 9
            END
        `, [userId, tenantId]);

        return result.rows.map(row => ({
          hyroxRecordId: row.hyrox_record_id,
          exerciseType: row.exercise_type,
          exerciseName: getExerciseDisplayName(row.exercise_type),
          distance: getExerciseDistance(row.exercise_type),
          currentTimeSeconds: row.current_time_seconds,
          currentAchievedDate: row.current_achieved_date,
          notes: row.notes,
          historyCount: parseInt(row.history_count),
          multiplier: row.exercise_type === '1KM_RUN' ? 8 : 1
        }));
      } catch (error: any) {
        console.error('Error listing Hyrox records:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch Hyrox records',
        });
      }
    }),

  /**
   * Get detailed record with full history for a specific exercise
   */
  getByExercise: protectedProcedure
    .input(getByExerciseSchema)
    .query(async ({ input, ctx }) => {
      const { exerciseType } = input;
      const userId = ctx.user.userId;
      const tenantId = ctx.user.tenantId;

      try {
        // Set RLS context
        await db.query('SELECT set_config($1, $2, TRUE)', ['app.current_user_id', userId]);
        await db.query('SELECT set_config($1, $2, TRUE)', ['app.current_tenant_id', tenantId]);

        // Get the record
        const recordResult = await db.query(`
          SELECT 
            hyrox_record_id,
            exercise_type,
            current_time_seconds,
            current_achieved_date,
            notes,
            created_at,
            updated_at
          FROM hyrox_records
          WHERE user_id = $1 AND tenant_id = $2 AND exercise_type = $3
        `, [userId, tenantId, exerciseType]);

        if (recordResult.rows.length === 0) {
          return null;
        }

        const record = recordResult.rows[0];

        // Get history
        const historyResult = await db.query(`
          SELECT 
            history_id,
            time_seconds,
            achieved_date,
            notes,
            heart_rate,
            created_at
          FROM hyrox_history
          WHERE hyrox_record_id = $1
          ORDER BY achieved_date DESC
        `, [record.hyrox_record_id]);

        return {
          hyroxRecordId: record.hyrox_record_id,
          exerciseType: record.exercise_type,
          exerciseName: getExerciseDisplayName(record.exercise_type),
          distance: getExerciseDistance(record.exercise_type),
          currentTimeSeconds: record.current_time_seconds,
          currentAchievedDate: record.current_achieved_date,
          notes: record.notes,
          createdAt: record.created_at,
          updatedAt: record.updated_at,
          multiplier: record.exercise_type === '1KM_RUN' ? 8 : 1,
          history: historyResult.rows.map(h => ({
            historyId: h.history_id,
            timeSeconds: h.time_seconds,
            achievedDate: h.achieved_date,
            notes: h.notes,
            heartRate: h.heart_rate,
            createdAt: h.created_at
          }))
        };
      } catch (error: any) {
        console.error('Error fetching Hyrox record:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch Hyrox record',
        });
      }
    }),

  /**
   * Create or update a Hyrox record
   */
  upsertRecord: protectedProcedure
    .input(upsertRecordSchema)
    .mutation(async ({ input, ctx }) => {
      const { exerciseType, timeSeconds, achievedDate, notes, heartRate } = input;
      const userId = ctx.user.userId;
      const tenantId = ctx.user.tenantId;

      try {
        // Set RLS context
        await db.query('SELECT set_config($1, $2, TRUE)', ['app.current_user_id', userId]);
        await db.query('SELECT set_config($1, $2, TRUE)', ['app.current_tenant_id', tenantId]);

        // Check if record exists
        const existingResult = await db.query(`
          SELECT hyrox_record_id, current_time_seconds
          FROM hyrox_records
          WHERE user_id = $1 AND tenant_id = $2 AND exercise_type = $3
        `, [userId, tenantId, exerciseType]);

        let hyroxRecordId: string;

        if (existingResult.rows.length === 0) {
          // Create new record
          const insertResult = await db.query(`
            INSERT INTO hyrox_records (
              user_id, tenant_id, exercise_type,
              current_time_seconds, current_achieved_date, notes
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING hyrox_record_id
          `, [userId, tenantId, exerciseType, timeSeconds, achievedDate, notes]);

          hyroxRecordId = insertResult.rows[0].hyrox_record_id;
        } else {
          hyroxRecordId = existingResult.rows[0].hyrox_record_id;
          const currentBest = existingResult.rows[0].current_time_seconds;

          // Update if new time is better (lower)
          if (timeSeconds < currentBest) {
            await db.query(`
              UPDATE hyrox_records
              SET current_time_seconds = $1,
                  current_achieved_date = $2,
                  notes = $3,
                  updated_at = NOW()
              WHERE hyrox_record_id = $4
            `, [timeSeconds, achievedDate, notes, hyroxRecordId]);
          }
        }

        // Add to history
        await db.query(`
          INSERT INTO hyrox_history (
            hyrox_record_id, time_seconds, achieved_date, notes, heart_rate
          )
          VALUES ($1, $2, $3, $4, $5)
        `, [hyroxRecordId, timeSeconds, achievedDate, notes, heartRate]);

        return {
          hyroxRecordId,
          exerciseType,
          exerciseName: getExerciseDisplayName(exerciseType)
        };
      } catch (error: any) {
        console.error('Error upserting Hyrox record:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save Hyrox record',
        });
      }
    }),

  /**
   * Delete a specific history entry
   */
  deleteHistory: protectedProcedure
    .input(deleteHistorySchema)
    .mutation(async ({ input, ctx }) => {
      const { historyId } = input;
      const userId = ctx.user.userId;
      const tenantId = ctx.user.tenantId;

      try {
        // Set RLS context
        await db.query('SELECT set_config($1, $2, TRUE)', ['app.current_user_id', userId]);
        await db.query('SELECT set_config($1, $2, TRUE)', ['app.current_tenant_id', tenantId]);

        // Delete the history entry (RLS will ensure user owns it)
        await db.query(`
          DELETE FROM hyrox_history
          WHERE history_id = $1
        `, [historyId]);

        return { success: true };
      } catch (error: any) {
        console.error('Error deleting Hyrox history:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete history entry',
        });
      }
    }),

  /**
   * Get overall Hyrox statistics (total time, best efforts, etc.)
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user.userId;
      const tenantId = ctx.user.tenantId;

      try {
        // Set RLS context
        await db.query('SELECT set_config($1, $2, TRUE)', ['app.current_user_id', userId]);
        await db.query('SELECT set_config($1, $2, TRUE)', ['app.current_tenant_id', tenantId]);

        const result = await db.query(`
          SELECT 
            exercise_type,
            current_time_seconds
          FROM hyrox_records
          WHERE user_id = $1 AND tenant_id = $2
        `, [userId, tenantId]);

        let totalTimeSeconds = 0;
        const exercises: any[] = [];

        result.rows.forEach(row => {
          const multiplier = row.exercise_type === '1KM_RUN' ? 8 : 1;
          const contributionTime = row.current_time_seconds * multiplier;
          
          totalTimeSeconds += contributionTime;
          
          exercises.push({
            exerciseType: row.exercise_type,
            exerciseName: getExerciseDisplayName(row.exercise_type),
            timeSeconds: row.current_time_seconds,
            multiplier,
            contributionTime
          });
        });

        return {
          totalTimeSeconds,
          exerciseCount: result.rows.length,
          exercises: exercises.sort((a, b) => a.timeSeconds - b.timeSeconds)
        };
      } catch (error: any) {
        console.error('Error fetching Hyrox stats:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch statistics',
        });
      }
    }),
});
