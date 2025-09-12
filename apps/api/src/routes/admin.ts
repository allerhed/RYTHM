import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { adminProcedure, publicProcedure, router } from '../trpc';
import { db } from '@rythm/db';

// Admin tenant ID
const ADMIN_TENANT_ID = '00000000-0000-0000-0000-000000000000';

export const adminRouter = router({
  // Validate admin credentials endpoint
  validate: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { email, password } = input;

      try {
        // Query admin user from database
        const query = `
          SELECT user_id, email, password_hash, role, first_name, last_name
          FROM users 
          WHERE email = $1 
            AND tenant_id = $2 
            AND role = 'system_admin'
        `;
        
        const result = await db.query(query, [email, ADMIN_TENANT_ID]);
        
        if (result.rows.length === 0) {
          throw new Error('Invalid credentials');
        }

        const adminUser = result.rows[0];

        // Validate password using bcrypt
        const isValidPassword = await bcrypt.compare(password, adminUser.password_hash);

        if (!isValidPassword) {
          throw new Error('Invalid credentials');
        }

        return {
          user_id: adminUser.user_id,
          email: adminUser.email,
          role: adminUser.role,
          first_name: adminUser.first_name,
          last_name: adminUser.last_name,
        };
      } catch (error) {
        console.error('Admin validation error:', error);
        throw new Error('Invalid credentials');
      }
    }),

  // Get admin dashboard stats
  getDashboardStats: adminProcedure
    .query(async () => {
      const stats = await Promise.all([
        // Total users across all tenants
        db.query('SELECT COUNT(*) as count FROM users WHERE role != \'system_admin\''),
        // Total tenants (excluding admin tenant)
        db.query('SELECT COUNT(*) as count FROM tenants WHERE tenant_id != $1', [ADMIN_TENANT_ID]),
        // Total sessions across all tenants
        db.query('SELECT COUNT(*) as count FROM sessions'),
        // Recent activity (last 24 hours)
        db.query(`
          SELECT COUNT(*) as count 
          FROM sessions 
          WHERE created_at >= NOW() - INTERVAL '24 hours'
        `),
      ]);

      return {
        totalUsers: parseInt(stats[0].rows[0].count),
        totalTenants: parseInt(stats[1].rows[0].count),
        totalSessions: parseInt(stats[2].rows[0].count),
        recentActivity: parseInt(stats[3].rows[0].count),
      };
    }),

  // Get all tenants
  getTenants: adminProcedure
    .query(async () => {
      const result = await db.query(`
        SELECT 
          t.tenant_id,
          t.name,
          t.branding,
          t.created_at,
          COUNT(u.user_id) as user_count
        FROM tenants t
        LEFT JOIN users u ON t.tenant_id = u.tenant_id AND u.role != 'system_admin'
        WHERE t.tenant_id != $1
        GROUP BY t.tenant_id, t.name, t.branding, t.created_at
        ORDER BY t.created_at DESC
      `, [ADMIN_TENANT_ID]);

      return result.rows;
    }),

  // Exercise Template Management
  getExerciseTemplates: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
      search: z.string().optional(),
      category: z.string().optional(),
      type: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { page, limit, search, category, type } = input;
      const offset = (page - 1) * limit;

      let whereConditions = ['1=1'];
      const params: any[] = [];

      if (search) {
        params.push(`%${search}%`);
        whereConditions.push(`name ILIKE $${params.length}`);
      }

      if (category) {
        params.push(category);
        whereConditions.push(`exercise_category = $${params.length}`);
      }

      if (type) {
        params.push(type);
        whereConditions.push(`exercise_type = $${params.length}`);
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countResult = await db.query(
        `SELECT COUNT(*) as count FROM exercise_templates WHERE ${whereClause}`,
        params
      );

      // Get exercise templates with pagination
      params.push(limit, offset);
      const result = await db.query(`
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
          created_at,
          updated_at
        FROM exercise_templates 
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `, params);

      return {
        exerciseTemplates: result.rows,
        totalCount: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
        currentPage: page,
      };
    }),

  getExerciseTemplateStats: adminProcedure
    .query(async () => {
      const stats = await Promise.all([
        // Total exercise templates
        db.query('SELECT COUNT(*) as count FROM exercise_templates'),
        // Exercise templates by type
        db.query(`
          SELECT 
            exercise_type, 
            COUNT(*) as count 
          FROM exercise_templates 
          GROUP BY exercise_type
        `),
        // Most used muscle groups
        db.query(`
          SELECT 
            UNNEST(muscle_groups) as muscle_group, 
            COUNT(*) as count 
          FROM exercise_templates 
          GROUP BY muscle_group 
          ORDER BY count DESC 
          LIMIT 5
        `),
        // Recent exercise templates (last 7 days)
        db.query(`
          SELECT COUNT(*) as count 
          FROM exercise_templates 
          WHERE created_at >= NOW() - INTERVAL '7 days'
        `),
      ]);

      return {
        totalExerciseTemplates: parseInt(stats[0].rows[0].count),
        exerciseTemplatesByType: stats[1].rows,
        topMuscleGroups: stats[2].rows,
        recentExerciseTemplates: parseInt(stats[3].rows[0].count),
      };
    }),

  createExerciseTemplate: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      muscle_groups: z.array(z.string()).default([]),
      equipment: z.string().optional(),
      exercise_category: z.string().default('strength'),
      exercise_type: z.enum(['STRENGTH', 'CARDIO']).default('STRENGTH'),
      default_value_1_type: z.string().default('weight_kg'),
      default_value_2_type: z.string().default('reps'),
      description: z.string().optional(),
      instructions: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Check if exercise template already exists
      const existingResult = await db.query(
        'SELECT template_id FROM exercise_templates WHERE LOWER(name) = LOWER($1)',
        [input.name]
      );

      if (existingResult.rows.length > 0) {
        throw new Error('An exercise template with this name already exists');
      }

      const result = await db.query(`
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

  updateExerciseTemplate: adminProcedure
    .input(z.object({
      template_id: z.string(),
      name: z.string().optional(),
      muscle_groups: z.array(z.string()).optional(),
      equipment: z.string().optional(),
      exercise_category: z.string().optional(),
      exercise_type: z.enum(['STRENGTH', 'CARDIO']).optional(),
      default_value_1_type: z.string().optional(),
      default_value_2_type: z.string().optional(),
      description: z.string().optional(),
      instructions: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { template_id, ...updateData } = input;

      // If name is being updated, check for conflicts
      if (updateData.name) {
        const existingResult = await db.query(
          'SELECT template_id FROM exercise_templates WHERE LOWER(name) = LOWER($1) AND template_id != $2',
          [updateData.name, template_id]
        );

        if (existingResult.rows.length > 0) {
          throw new Error('An exercise template with this name already exists');
        }
      }

      const setClauses: string[] = [];
      const params: any[] = [template_id];

      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          params.push(value);
          setClauses.push(`${key} = $${params.length}`);
        }
      });

      if (setClauses.length === 0) {
        throw new Error('No fields to update');
      }

      params.push(new Date()); // updated_at
      setClauses.push(`updated_at = $${params.length}`);

      const result = await db.query(`
        UPDATE exercise_templates 
        SET ${setClauses.join(', ')}
        WHERE template_id = $1
        RETURNING *
      `, params);

      if (result.rows.length === 0) {
        throw new Error('Exercise template not found');
      }

      return result.rows[0];
    }),

  deleteExerciseTemplate: adminProcedure
    .input(z.object({
      template_id: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Hard delete for exercise templates since they don't have is_active field
      const result = await db.query(`
        DELETE FROM exercise_templates 
        WHERE template_id = $1
        RETURNING *
      `, [input.template_id]);

      if (result.rows.length === 0) {
        throw new Error('Exercise template not found');
      }

      return { success: true };
    }),
});