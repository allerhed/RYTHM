import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const exerciseTemplatesRouter = router({
  // Get all exercise templates (for selection)
  list: protectedProcedure
    .input(z.object({
      category: z.string().optional(),
      type: z.enum(['STRENGTH', 'CARDIO']).optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(200).default(100),
    }))
    .query(async ({ input, ctx }) => {
      const { category, type, search, limit } = input;
      
      let query = `
        SELECT 
          template_id,
          name,
          muscle_groups,
          equipment,
          exercise_category,
          exercise_type,
          default_value_1_type,
          default_value_2_type,
          description,
          instructions,
          created_at
        FROM exercise_templates 
        WHERE 1=1
      `;
      
      const params: any[] = [];
      let paramIndex = 1;

      if (category) {
        query += ` AND exercise_category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      if (type) {
        query += ` AND exercise_type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      if (search) {
        query += ` AND name ILIKE $${paramIndex}`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      query += ` ORDER BY name ASC LIMIT $${paramIndex}`;
      params.push(limit);

      const result = await ctx.db.query(query, params);
      return result.rows;
    }),

  // Create a new exercise template (available to all users)
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      muscle_groups: z.array(z.string()).default([]),
      equipment: z.string().optional(),
      exercise_category: z.string().default('strength'),
      exercise_type: z.enum(['STRENGTH', 'CARDIO']).default('STRENGTH'),
      default_value_1_type: z.string().default('weight_kg'),
      default_value_2_type: z.string().default('reps'),
      description: z.string().optional(),
      instructions: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check if exercise template already exists
      const existingResult = await ctx.db.query(
        'SELECT template_id FROM exercise_templates WHERE LOWER(name) = LOWER($1)',
        [input.name]
      );

      if (existingResult.rows.length > 0) {
        throw new Error('An exercise template with this name already exists');
      }

      const result = await ctx.db.query(`
        INSERT INTO exercise_templates (
          name, muscle_groups, equipment, exercise_category, exercise_type,
          default_value_1_type, default_value_2_type, description, instructions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        input.name,
        input.muscle_groups,
        input.equipment,
        input.exercise_category,
        input.exercise_type,
        input.default_value_1_type,
        input.default_value_2_type,
        input.description,
        input.instructions,
      ]);

      return result.rows[0];
    }),
});