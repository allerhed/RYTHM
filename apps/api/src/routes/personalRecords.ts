/**
 * Personal Records (PR) tRPC Routes
 * 
 * Provides endpoints for tracking and managing personal records:
 * - list: Get all PRs for the authenticated user (with filtering)
 * - getById: Get detailed PR with full history
 * - create: Create a new PR with initial record
 * - addRecord: Add a new record to existing PR (updates current if better/different)
 * - update: Update PR metadata (metric name, notes)
 * - deleteRecord: Delete a specific historical record
 * - delete: Delete entire PR and all its history
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '@rythm/db';
import { TRPCError } from '@trpc/server';

// Validation schemas
const prCategorySchema = z.enum(['strength', 'cardio']);

const createPRSchema = z.object({
  exerciseTemplateId: z.string().uuid(),
  metricName: z.string().min(1).max(100),
  category: prCategorySchema,
  valueNumeric: z.number().positive(),
  valueUnit: z.string().min(1).max(20),
  achievedDate: z.coerce.date(),
  notes: z.string().optional(),
});

const addRecordSchema = z.object({
  prId: z.string().uuid(),
  valueNumeric: z.number().positive(),
  valueUnit: z.string().min(1).max(20),
  achievedDate: z.coerce.date(),
  notes: z.string().optional(),
});

const updatePRSchema = z.object({
  prId: z.string().uuid(),
  metricName: z.string().min(1).max(100).optional(),
  notes: z.string().optional(),
});

const listPRsSchema = z.object({
  category: prCategorySchema.optional(),
  offset: z.number().min(0).default(0),
  limit: z.number().min(1).max(100).default(50),
});

export const personalRecordsRouter = router({
  /**
   * List all personal records for the authenticated user
   */
  list: protectedProcedure
    .input(listPRsSchema)
    .query(async ({ input, ctx }) => {
      const { category, offset, limit } = input;
      const userId = ctx.user.userId;
      const tenantId = ctx.user.tenantId;

      try {
        // Set RLS context
        await db.query('SELECT set_config($1, $2, TRUE)', ['app.current_user_id', userId]);
        await db.query('SELECT set_config($1, $2, TRUE)', ['app.current_tenant_id', tenantId]);

        let query = `
          SELECT 
            pr.pr_id,
            pr.exercise_template_id,
            et.name as exercise_name,
            pr.metric_name,
            pr.category,
            pr.current_value_numeric,
            pr.current_value_unit,
            pr.current_achieved_date,
            pr.notes,
            pr.created_at,
            pr.updated_at,
            COUNT(ph.history_id) as record_count
          FROM personal_records pr
          JOIN exercise_templates et ON pr.exercise_template_id = et.exercise_template_id
          LEFT JOIN pr_history ph ON pr.pr_id = ph.pr_id
          WHERE pr.user_id = $1 AND pr.tenant_id = $2
        `;

        const queryParams: any[] = [userId, tenantId];
        let paramCount = 2;

        if (category) {
          paramCount++;
          query += ` AND pr.category = $${paramCount}`;
          queryParams.push(category);
        }

        query += `
          GROUP BY pr.pr_id, et.name
          ORDER BY pr.current_achieved_date DESC
          LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `;

        queryParams.push(limit, offset);

        const result = await db.query(query, queryParams);

        return result.rows.map(row => ({
          prId: row.pr_id,
          exerciseTemplateId: row.exercise_template_id,
          exerciseName: row.exercise_name,
          metricName: row.metric_name,
          category: row.category,
          currentValue: row.current_value_numeric,
          currentUnit: row.current_value_unit,
          currentDate: row.current_achieved_date,
          notes: row.notes,
          recordCount: parseInt(row.record_count),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
      } catch (error) {
        console.error('List PRs error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch personal records',
        });
      }
    }),

  /**
   * Get detailed PR with full history
   */
  getById: protectedProcedure
    .input(z.object({ prId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const { prId } = input;
      const userId = ctx.user.userId;
      const tenantId = ctx.user.tenantId;

      try {
        // Set RLS context
        await db.query('SELECT set_config($1, $2, TRUE)', ['app.current_user_id', userId]);
        await db.query('SELECT set_config($1, $2, TRUE)', ['app.current_tenant_id', tenantId]);

        // Get PR details
        const prResult = await db.query(
          `SELECT 
            pr.pr_id,
            pr.exercise_template_id,
            et.name as exercise_name,
            pr.metric_name,
            pr.category,
            pr.current_value_numeric,
            pr.current_value_unit,
            pr.current_achieved_date,
            pr.notes,
            pr.created_at,
            pr.updated_at
          FROM personal_records pr
          JOIN exercise_templates et ON pr.exercise_template_id = et.exercise_template_id
          WHERE pr.pr_id = $1 AND pr.user_id = $2 AND pr.tenant_id = $3`,
          [prId, userId, tenantId]
        );

        if (prResult.rows.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Personal record not found',
          });
        }

        // Get history
        const historyResult = await db.query(
          `SELECT 
            history_id,
            value_numeric,
            value_unit,
            achieved_date,
            notes,
            session_id,
            created_at
          FROM pr_history
          WHERE pr_id = $1
          ORDER BY achieved_date DESC`,
          [prId]
        );

        const pr = prResult.rows[0];

        return {
          prId: pr.pr_id,
          exerciseTemplateId: pr.exercise_template_id,
          exerciseName: pr.exercise_name,
          metricName: pr.metric_name,
          category: pr.category,
          currentValue: pr.current_value_numeric,
          currentUnit: pr.current_value_unit,
          currentDate: pr.current_achieved_date,
          notes: pr.notes,
          createdAt: pr.created_at,
          updatedAt: pr.updated_at,
          history: historyResult.rows.map(h => ({
            historyId: h.history_id,
            value: h.value_numeric,
            unit: h.value_unit,
            achievedDate: h.achieved_date,
            notes: h.notes,
            sessionId: h.session_id,
            createdAt: h.created_at,
          })),
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Get PR by ID error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch personal record',
        });
      }
    }),

  /**
   * Create new PR with initial record
   */
  create: protectedProcedure
    .input(createPRSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.userId;
      const tenantId = ctx.user.tenantId;

      try {
        // Set RLS context
        await db.query('SELECT set_config($1, $2, TRUE)', ['app.current_user_id', userId]);
        await db.query('SELECT set_config($1, $2, TRUE)', ['app.current_tenant_id', tenantId]);

        const result = await db.transaction(async (client: any) => {
          // Create PR
          const prResult = await client.query(
            `INSERT INTO personal_records (
              user_id, tenant_id, exercise_template_id, metric_name, category,
              current_value_numeric, current_value_unit, current_achieved_date, notes
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING pr_id`,
            [
              userId,
              tenantId,
              input.exerciseTemplateId,
              input.metricName,
              input.category,
              input.valueNumeric,
              input.valueUnit,
              input.achievedDate,
              input.notes || null,
            ]
          );

          const prId = prResult.rows[0].pr_id;

          // Create initial history record
          await client.query(
            `INSERT INTO pr_history (
              pr_id, value_numeric, value_unit, achieved_date, notes
            )
            VALUES ($1, $2, $3, $4, $5)`,
            [prId, input.valueNumeric, input.valueUnit, input.achievedDate, input.notes || null]
          );

          return { prId };
        });

        return result;
      } catch (error) {
        console.error('Create PR error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create personal record',
        });
      }
    }),

  /**
   * Add new record to existing PR
   */
  addRecord: protectedProcedure
    .input(addRecordSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.userId;
      const tenantId = ctx.user.tenantId;

      try {
        // Set RLS context
        await db.query('SELECT set_config($1, $2, TRUE)', ['app.current_user_id', userId]);
        await db.query('SELECT set_config($1, $2, TRUE)', ['app.current_tenant_id', tenantId]);

        await db.transaction(async (client: any) => {
          // Verify PR exists and belongs to user
          const prCheck = await client.query(
            `SELECT current_value_numeric, current_achieved_date
             FROM personal_records
             WHERE pr_id = $1 AND user_id = $2 AND tenant_id = $3`,
            [input.prId, userId, tenantId]
          );

          if (prCheck.rows.length === 0) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Personal record not found',
            });
          }

          // Add history record
          await client.query(
            `INSERT INTO pr_history (
              pr_id, value_numeric, value_unit, achieved_date, notes
            )
            VALUES ($1, $2, $3, $4, $5)`,
            [input.prId, input.valueNumeric, input.valueUnit, input.achievedDate, input.notes || null]
          );

          // Update current PR if this is the most recent date
          const currentDate = new Date(prCheck.rows[0].current_achieved_date);
          const newDate = new Date(input.achievedDate);

          if (newDate >= currentDate) {
            await client.query(
              `UPDATE personal_records
               SET current_value_numeric = $1,
                   current_value_unit = $2,
                   current_achieved_date = $3
               WHERE pr_id = $4`,
              [input.valueNumeric, input.valueUnit, input.achievedDate, input.prId]
            );
          }
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Add record error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add record',
        });
      }
    }),

  /**
   * Update PR metadata
   */
  update: protectedProcedure
    .input(updatePRSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.userId;
      const tenantId = ctx.user.tenantId;

      try {
        // Set RLS context
        await db.query('SELECT set_config($1, $2, TRUE)', ['app.current_user_id', userId]);
        await db.query('SELECT set_config($1, $2, TRUE)', ['app.current_tenant_id', tenantId]);

        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 0;

        if (input.metricName !== undefined) {
          paramCount++;
          updates.push(`metric_name = $${paramCount}`);
          values.push(input.metricName);
        }

        if (input.notes !== undefined) {
          paramCount++;
          updates.push(`notes = $${paramCount}`);
          values.push(input.notes);
        }

        if (updates.length === 0) {
          return { success: true };
        }

        paramCount++;
        values.push(input.prId);
        paramCount++;
        values.push(userId);
        paramCount++;
        values.push(tenantId);

        const result = await db.query(
          `UPDATE personal_records
           SET ${updates.join(', ')}
           WHERE pr_id = $${paramCount - 2}
             AND user_id = $${paramCount - 1}
             AND tenant_id = $${paramCount}
           RETURNING pr_id`,
          values
        );

        if (result.rows.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Personal record not found',
          });
        }

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Update PR error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update personal record',
        });
      }
    }),

  /**
   * Delete specific historical record
   */
  deleteRecord: protectedProcedure
    .input(z.object({ historyId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.userId;
      const tenantId = ctx.user.tenantId;

      try {
        // Set RLS context
        await db.query('SELECT set_config($1, $2, TRUE)', ['app.current_user_id', userId]);
        await db.query('SELECT set_config($1, $2, TRUE)', ['app.current_tenant_id', tenantId]);

        await db.transaction(async (client: any) => {
          // Get the history record and associated PR
          const historyResult = await client.query(
            `SELECT ph.pr_id, ph.achieved_date
             FROM pr_history ph
             JOIN personal_records pr ON ph.pr_id = pr.pr_id
             WHERE ph.history_id = $1 AND pr.user_id = $2 AND pr.tenant_id = $3`,
            [input.historyId, userId, tenantId]
          );

          if (historyResult.rows.length === 0) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Record not found',
            });
          }

          const { pr_id, achieved_date } = historyResult.rows[0];

          // Check if there are other records
          const countResult = await client.query(
            `SELECT COUNT(*) as count FROM pr_history WHERE pr_id = $1`,
            [pr_id]
          );

          if (parseInt(countResult.rows[0].count) === 1) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Cannot delete the only record. Delete the entire PR instead.',
            });
          }

          // Delete the record
          await client.query(
            `DELETE FROM pr_history WHERE history_id = $1`,
            [input.historyId]
          );

          // If this was the current record, update PR with the latest remaining record
          const prResult = await client.query(
            `SELECT current_achieved_date FROM personal_records WHERE pr_id = $1`,
            [pr_id]
          );

          if (new Date(prResult.rows[0].current_achieved_date).getTime() === new Date(achieved_date).getTime()) {
            const latestResult = await client.query(
              `SELECT value_numeric, value_unit, achieved_date
               FROM pr_history
               WHERE pr_id = $1
               ORDER BY achieved_date DESC
               LIMIT 1`,
              [pr_id]
            );

            if (latestResult.rows.length > 0) {
              const latest = latestResult.rows[0];
              await client.query(
                `UPDATE personal_records
                 SET current_value_numeric = $1,
                     current_value_unit = $2,
                     current_achieved_date = $3
                 WHERE pr_id = $4`,
                [latest.value_numeric, latest.value_unit, latest.achieved_date, pr_id]
              );
            }
          }
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Delete record error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete record',
        });
      }
    }),

  /**
   * Delete entire PR and all history
   */
  delete: protectedProcedure
    .input(z.object({ prId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.userId;
      const tenantId = ctx.user.tenantId;

      try {
        // Set RLS context
        await db.query('SELECT set_config($1, $2, TRUE)', ['app.current_user_id', userId]);
        await db.query('SELECT set_config($1, $2, TRUE)', ['app.current_tenant_id', tenantId]);

        const result = await db.query(
          `DELETE FROM personal_records
           WHERE pr_id = $1 AND user_id = $2 AND tenant_id = $3
           RETURNING pr_id`,
          [input.prId, userId, tenantId]
        );

        if (result.rows.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Personal record not found',
          });
        }

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Delete PR error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete personal record',
        });
      }
    }),
});
