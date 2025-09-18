import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { db } from '@rythm/db';

export const equipmentRouter = router({
  // Get all equipment
  list: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      search: z.string().optional(),
      active_only: z.boolean().default(true),
      limit: z.number().default(100),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const { category, search, active_only, limit, offset } = input;

      let whereConditions = [];
      const params: any[] = [];

      if (active_only) {
        whereConditions.push('is_active = true');
      }

      if (category) {
        params.push(category);
        whereConditions.push(`category = $${params.length}`);
      }

      if (search) {
        params.push(`%${search}%`);
        whereConditions.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      params.push(limit, offset);
      const result = await db.query(`
        SELECT 
          equipment_id,
          name,
          category,
          description,
          is_active,
          created_at,
          updated_at
        FROM equipment
        ${whereClause}
        ORDER BY 
          CASE WHEN name = 'None' THEN 0 ELSE 1 END,
          category,
          name
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `, params);

      return result.rows;
    }),

  // Get equipment by ID
  getById: publicProcedure
    .input(z.object({
      equipment_id: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const result = await db.query(`
        SELECT 
          equipment_id,
          name,
          category,
          description,
          is_active,
          created_at,
          updated_at
        FROM equipment
        WHERE equipment_id = $1
      `, [input.equipment_id]);

      if (result.rows.length === 0) {
        throw new Error('Equipment not found');
      }

      return result.rows[0];
    }),

  // Get equipment categories
  getCategories: publicProcedure
    .query(async () => {
      const result = await db.query(`
        SELECT 
          category,
          COUNT(*) as count
        FROM equipment
        WHERE is_active = true
        GROUP BY category
        ORDER BY category
      `);

      return result.rows;
    }),

  // Get equipment usage statistics
  getUsageStats: publicProcedure
    .input(z.object({
      equipment_id: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const [exerciseCount, templateCount] = await Promise.all([
        // Count exercises using this equipment
        db.query(`
          SELECT COUNT(*) as count
          FROM exercises
          WHERE equipment_id = $1 AND is_active = true
        `, [input.equipment_id]),
        
        // Count exercise templates using this equipment
        db.query(`
          SELECT COUNT(*) as count
          FROM exercise_templates
          WHERE equipment_id = $1
        `, [input.equipment_id]),
      ]);

      return {
        exercise_count: parseInt(exerciseCount.rows[0].count),
        template_count: parseInt(templateCount.rows[0].count),
      };
    }),
});