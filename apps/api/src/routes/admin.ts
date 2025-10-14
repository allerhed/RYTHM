import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { adminProcedure, publicProcedure, router } from '../trpc';
import { db, dataExporter, dataImporter } from '@rythm/db';

// Admin tenant ID
const ADMIN_TENANT_ID = '00000000-0000-0000-0000-000000000000';

const updateExerciseTemplateInputSchema = z.object({
  template_id: z.string(),
  name: z.string().optional(),
  muscle_groups: z.array(z.string()).optional(),
  equipment: z.string().optional().nullable(),
  equipment_id: z.string().nullable().optional(),
  exercise_category: z.string().optional(),
  exercise_type: z.enum(['STRENGTH', 'CARDIO']).optional(),
  default_value_1_type: z.string().optional(),
  default_value_2_type: z.string().nullable().optional(),
  description: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
});

const deleteEquipmentInputSchema = z.object({
  equipment_id: z.string().uuid(),
});

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

  // Get all tenants with enhanced data
  getTenants: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { page, limit, search } = input;
      const offset = (page - 1) * limit;

      let whereConditions = [`t.tenant_id != $1`];
      const params: any[] = [ADMIN_TENANT_ID];

      if (search) {
        params.push(`%${search}%`);
        whereConditions.push(`t.name ILIKE $${params.length}`);
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countResult = await db.query(
        `SELECT COUNT(*) as count 
         FROM tenants t 
         WHERE ${whereClause}`,
        params
      );

      // Get tenants with pagination and statistics
      params.push(limit, offset);
      const result = await db.query(`
        SELECT 
          t.tenant_id,
          t.name,
          t.branding,
          t.created_at,
          t.updated_at,
          COUNT(DISTINCT u.user_id) as user_count,
          COUNT(DISTINCT s.session_id) as session_count,
          MAX(s.created_at) as last_activity
        FROM tenants t
        LEFT JOIN users u ON t.tenant_id = u.tenant_id AND u.role != 'system_admin'
        LEFT JOIN sessions s ON t.tenant_id = s.tenant_id
        WHERE ${whereClause}
        GROUP BY t.tenant_id, t.name, t.branding, t.created_at, t.updated_at
        ORDER BY t.created_at DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `, params);

      return {
        tenants: result.rows,
        totalCount: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
        currentPage: page,
      };
    }),

  // Get single tenant details
  getTenant: adminProcedure
    .input(z.object({
      tenant_id: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const { tenant_id } = input;

      const result = await db.query(`
        SELECT 
          t.tenant_id,
          t.name,
          t.branding,
          t.created_at,
          t.updated_at,
          COUNT(DISTINCT u.user_id) as user_count,
          COUNT(DISTINCT s.session_id) as session_count,
          COUNT(DISTINCT e.exercise_id) as exercise_count,
          MAX(s.created_at) as last_activity
        FROM tenants t
        LEFT JOIN users u ON t.tenant_id = u.tenant_id AND u.role != 'system_admin'
        LEFT JOIN sessions s ON t.tenant_id = s.tenant_id
        LEFT JOIN exercises e ON t.tenant_id = e.tenant_id
        WHERE t.tenant_id = $1
        GROUP BY t.tenant_id, t.name, t.branding, t.created_at, t.updated_at
      `, [tenant_id]);

      if (result.rows.length === 0) {
        throw new Error('Tenant not found');
      }

      return result.rows[0];
    }),

  // Create new tenant
  createTenant: adminProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      branding: z.record(z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      const { name, branding } = input;

      // Check if tenant name already exists
      const existingResult = await db.query(
        'SELECT tenant_id FROM tenants WHERE LOWER(name) = LOWER($1)',
        [name]
      );

      if (existingResult.rows.length > 0) {
        throw new Error('A tenant with this name already exists');
      }

      const result = await db.query(`
        INSERT INTO tenants (name, branding)
        VALUES ($1, $2)
        RETURNING *
      `, [name, branding || {}]);

      return result.rows[0];
    }),

  // Update tenant
  updateTenant: adminProcedure
    .input(z.object({
      tenant_id: z.string().uuid(),
      name: z.string().min(1).max(255).optional(),
      branding: z.record(z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      const { tenant_id, ...updateData } = input;

      // Prevent updating admin tenant
      if (tenant_id === ADMIN_TENANT_ID) {
        throw new Error('Cannot update admin tenant');
      }

      // If name is being updated, check for conflicts
      if (updateData.name) {
        const existingResult = await db.query(
          'SELECT tenant_id FROM tenants WHERE LOWER(name) = LOWER($1) AND tenant_id != $2',
          [updateData.name, tenant_id]
        );

        if (existingResult.rows.length > 0) {
          throw new Error('A tenant with this name already exists');
        }
      }

      const setClauses: string[] = [];
      const params: any[] = [tenant_id];

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
        UPDATE tenants 
        SET ${setClauses.join(', ')}
        WHERE tenant_id = $1
        RETURNING *
      `, params);

      if (result.rows.length === 0) {
        throw new Error('Tenant not found');
      }

      return result.rows[0];
    }),

  // Delete tenant (with cascade protection)
  deleteTenant: adminProcedure
    .input(z.object({
      tenant_id: z.string().uuid(),
    }))
    .mutation(async ({ input }) => {
      const { tenant_id } = input;

      // Prevent deleting admin tenant
      if (tenant_id === ADMIN_TENANT_ID) {
        throw new Error('Cannot delete admin tenant');
      }

      // Check for existing users or data
      const dataCheckResult = await db.query(`
        SELECT 
          COUNT(DISTINCT u.user_id) as user_count,
          COUNT(DISTINCT s.session_id) as session_count
        FROM tenants t
        LEFT JOIN users u ON t.tenant_id = u.tenant_id
        LEFT JOIN sessions s ON t.tenant_id = s.tenant_id
        WHERE t.tenant_id = $1
      `, [tenant_id]);

      const { user_count, session_count } = dataCheckResult.rows[0];

      if (parseInt(user_count) > 0 || parseInt(session_count) > 0) {
        throw new Error('Cannot delete tenant with existing users or data. Please transfer or remove data first.');
      }

      const result = await db.query(`
        DELETE FROM tenants 
        WHERE tenant_id = $1
        RETURNING *
      `, [tenant_id]);

      if (result.rows.length === 0) {
        throw new Error('Tenant not found');
      }

      return { success: true };
    }),

  // Get tenant users
  getTenantUsers: adminProcedure
    .input(z.object({
      tenant_id: z.string().uuid(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const { tenant_id, page, limit } = input;
      const offset = (page - 1) * limit;

      // Get total count
      const countResult = await db.query(
        'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1 AND role != \'system_admin\'',
        [tenant_id]
      );

      // Get users
      const result = await db.query(`
        SELECT 
          user_id,
          email,
          role,
          first_name,
          last_name,
          created_at,
          updated_at
        FROM users 
        WHERE tenant_id = $1 AND role != 'system_admin'
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `, [tenant_id, limit, offset]);

      return {
        users: result.rows,
        totalCount: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
        currentPage: page,
      };
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
    .input(z.object({
      timeRange: z.enum(['7d', '30d', '90d', '1y', 'all']).default('90d'),
    }).optional())
    .query(async ({ input }) => {
      const { timeRange = '90d' } = input || {};
      
      // Calculate date range
      const now = new Date();
      let startDate: Date;
      
      if (timeRange === 'all') {
        startDate = new Date('2015-01-01'); // Very early date for all-time data
      } else {
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
        startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      }

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
        // Most used muscle groups in templates (weighted by actual usage in the time range)
        db.query(`
          SELECT 
            muscle_group,
            COUNT(DISTINCT et.template_id) as template_count
          FROM exercise_templates et
          CROSS JOIN UNNEST(et.muscle_groups) as muscle_group
          GROUP BY muscle_group 
          ORDER BY COUNT(DISTINCT et.template_id) DESC
          LIMIT 5
        `),
        // Recent exercise templates (based on time range)
        db.query(`
          SELECT COUNT(*) as count 
          FROM exercise_templates 
          WHERE created_at >= $1
        `, [startDate]),
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
      equipment_id: z.string().optional(),
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
          name, muscle_groups, equipment, equipment_id, exercise_category, exercise_type,
          default_value_1_type, default_value_2_type, description, instructions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        input.name,
        input.muscle_groups,
        input.equipment,
        input.equipment_id || null,
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
    .input(
      z.union([
        updateExerciseTemplateInputSchema,
        z.object({ json: updateExerciseTemplateInputSchema }),
      ])
        .transform((payload) => ('json' in payload ? payload.json : payload))
        .transform((payload) => {
          const sanitized = { ...payload } as z.infer<typeof updateExerciseTemplateInputSchema>;

          if (sanitized.equipment_id === '') {
            sanitized.equipment_id = null;
          }

          if (sanitized.default_value_2_type === '') {
            sanitized.default_value_2_type = null;
          }

          return sanitized;
        })
    )
    .mutation(async ({ input }) => {
      console.log('🔧 updateExerciseTemplate called with input:', JSON.stringify(input, null, 2));
      const { template_id, ...updateData } = input;
      console.log('📝 Update data:', JSON.stringify(updateData, null, 2));

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
        // Skip undefined values and empty strings for optional fields
        if (value !== undefined && value !== '') {
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
      .input(
        z.union([
          z.object({ template_id: z.string() }),
          z.object({ json: z.object({ template_id: z.string() }) }),
        ]).transform((payload) => ({
          template_id: 'json' in payload ? payload.json.template_id : payload.template_id,
        }))
      )
      .mutation(async ({ input, ctx }) => {
        console.log('🗑️ deleteExerciseTemplate called');
        console.log('📥 Full input object:', input);
        console.log('📥 template_id value:', input.template_id);
        console.log('📥 Context user:', ctx.user);

        // Hard delete for exercise templates since they don't have is_active field
        const result = await db.query(`
          DELETE FROM exercise_templates 
          WHERE template_id = $1
          RETURNING *
        `, [input.template_id]);

        if (result.rows.length === 0) {
          throw new Error('Exercise template not found');
        }

        console.log('✅ Exercise template deleted successfully:', result.rows[0]);
        return { success: true };
      }),

  // Analytics endpoints
  getAnalyticsDashboard: adminProcedure
    .input(z.object({
      timeRange: z.enum(['7d', '30d', '90d', '1y', 'all']).default('90d'),
      compareToLast: z.boolean().default(true),
    }))
    .query(async ({ input }) => {
      const { timeRange, compareToLast } = input;
      
      // Calculate date ranges
      const now = new Date();
      let startDate: Date;
      let compareStartDate: Date;
      
      if (timeRange === 'all') {
        // For 'all', use a very early date (e.g., 10 years ago)
        startDate = new Date('2015-01-01');
        compareStartDate = new Date('2015-01-01');
      } else {
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
        startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        compareStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);
      }

      // Get current period metrics
      const currentMetrics = await Promise.all([
        // Total active users (users with sessions in period)
        db.query(`
          SELECT COUNT(DISTINCT s.user_id) as count
          FROM sessions s
          JOIN users u ON s.user_id = u.user_id
          WHERE s.started_at >= $1 
            AND s.started_at <= $2
            AND s.tenant_id != $3
        `, [startDate, now, ADMIN_TENANT_ID]),

        // Total sessions
        db.query(`
          SELECT COUNT(*) as count
          FROM sessions
          WHERE started_at >= $1 
            AND started_at <= $2
            AND tenant_id != $3
        `, [startDate, now, ADMIN_TENANT_ID]),

        // Average session duration (completed sessions only)
        db.query(`
          SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60) as avg_duration
          FROM sessions
          WHERE started_at >= $1 
            AND started_at <= $2
            AND completed_at IS NOT NULL
            AND tenant_id != $3
        `, [startDate, now, ADMIN_TENANT_ID]),

        // User retention (users active in both periods)
        db.query(`
          WITH current_users AS (
            SELECT DISTINCT user_id
            FROM sessions
            WHERE started_at >= $1 AND started_at <= $2 AND tenant_id != $4
          ),
          previous_users AS (
            SELECT DISTINCT user_id
            FROM sessions
            WHERE started_at >= $3 AND started_at < $1 AND tenant_id != $4
          )
          SELECT 
            (COUNT(CASE WHEN cu.user_id IS NOT NULL AND pu.user_id IS NOT NULL THEN 1 END)::FLOAT / 
             NULLIF(COUNT(pu.user_id), 0) * 100) as retention_rate
          FROM previous_users pu
          FULL OUTER JOIN current_users cu ON pu.user_id = cu.user_id
        `, [startDate, now, compareStartDate, ADMIN_TENANT_ID]),
      ]);

      // Get comparison metrics if requested
      let comparisonMetrics = null;
      if (compareToLast) {
        comparisonMetrics = await Promise.all([
          // Previous period active users
          db.query(`
            SELECT COUNT(DISTINCT s.user_id) as count
            FROM sessions s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.started_at >= $1 
              AND s.started_at < $2
              AND s.tenant_id != $3
          `, [compareStartDate, startDate, ADMIN_TENANT_ID]),

          // Previous period sessions
          db.query(`
            SELECT COUNT(*) as count
            FROM sessions
            WHERE started_at >= $1 
              AND started_at < $2
              AND tenant_id != $3
          `, [compareStartDate, startDate, ADMIN_TENANT_ID]),

          // Previous period average session duration
          db.query(`
            SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60) as avg_duration
            FROM sessions
            WHERE started_at >= $1 
              AND started_at < $2
              AND completed_at IS NOT NULL
              AND tenant_id != $3
          `, [compareStartDate, startDate, ADMIN_TENANT_ID]),
        ]);
      }

      const formatChange = (current: number, previous: number | null) => {
        if (!previous || previous === 0) return null;
        const change = ((current - previous) / previous) * 100;
        return {
          value: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
          type: change >= 0 ? 'positive' : 'negative' as const,
        };
      };

      const activeUsers = parseInt(currentMetrics[0].rows[0].count) || 0;
      const totalSessions = parseInt(currentMetrics[1].rows[0].count) || 0;
      const avgDuration = parseFloat(currentMetrics[2].rows[0].avg_duration) || 0;
      const retentionRate = parseFloat(currentMetrics[3].rows[0].retention_rate) || 0;

      const prevActiveUsers = comparisonMetrics ? parseInt(comparisonMetrics[0].rows[0].count) || 0 : null;
      const prevTotalSessions = comparisonMetrics ? parseInt(comparisonMetrics[1].rows[0].count) || 0 : null;
      const prevAvgDuration = comparisonMetrics ? parseFloat(comparisonMetrics[2].rows[0].avg_duration) || 0 : null;

      return {
        activeUsers: {
          value: activeUsers,
          change: formatChange(activeUsers, prevActiveUsers),
        },
        totalSessions: {
          value: totalSessions,
          change: formatChange(totalSessions, prevTotalSessions),
        },
        avgSessionDuration: {
          value: Math.round(avgDuration),
          change: formatChange(avgDuration, prevAvgDuration),
        },
        retentionRate: {
          value: retentionRate,
          change: null, // Retention is calculated differently
        },
        timeRange,
      };
    }),

  getUsageTrends: adminProcedure
    .input(z.object({
      timeRange: z.enum(['7d', '30d', '90d']).default('30d'),
      granularity: z.enum(['hour', 'day', 'week']).default('day'),
    }))
    .query(async ({ input }) => {
      const { timeRange, granularity } = input;
      
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      let truncFunction = 'day';
      if (granularity === 'hour') truncFunction = 'hour';
      else if (granularity === 'week') truncFunction = 'week';

      const result = await db.query(`
        SELECT 
          DATE_TRUNC($1, s.started_at) as period,
          COUNT(DISTINCT s.user_id) as active_users,
          COUNT(s.session_id) as total_sessions,
          COUNT(DISTINCT s.tenant_id) as active_tenants,
          AVG(EXTRACT(EPOCH FROM (s.completed_at - s.started_at))/60) as avg_duration
        FROM sessions s
        WHERE s.started_at >= $2
          AND s.tenant_id != $3
        GROUP BY DATE_TRUNC($1, s.started_at)
        ORDER BY period ASC
      `, [truncFunction, startDate, ADMIN_TENANT_ID]);

      return result.rows.map(row => ({
        period: row.period,
        activeUsers: parseInt(row.active_users) || 0,
        totalSessions: parseInt(row.total_sessions) || 0,
        activeTenants: parseInt(row.active_tenants) || 0,
        avgDuration: parseFloat(row.avg_duration) || 0,
      }));
    }),

  getExerciseAnalytics: adminProcedure
    .input(z.object({
      timeRange: z.enum(['30d', '90d', '1y', 'all']).default('30d'),
    }))
    .query(async ({ input }) => {
      const { timeRange } = input;
      
      let startDate: Date;
      if (timeRange === 'all') {
        startDate = new Date('2015-01-01'); // Very early date for all-time data
      } else {
        const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
        startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      }

      const [popularExercises, muscleGroupUsage, categoryBreakdown] = await Promise.all([
        // Most popular exercises
        db.query(`
          SELECT 
            e.name,
            COUNT(st.set_id) as total_sets,
            COUNT(DISTINCT s.session_id) as sessions_used,
            COUNT(DISTINCT s.user_id) as unique_users
          FROM sessions s
          JOIN sets st ON s.session_id = st.session_id
          JOIN exercises e ON st.exercise_id = e.exercise_id
          WHERE s.started_at >= $1
            AND s.tenant_id != $2
          GROUP BY e.exercise_id, e.name
          ORDER BY total_sets DESC
          LIMIT 10
        `, [startDate, ADMIN_TENANT_ID]),

        // Muscle group usage
        db.query(`
          SELECT 
            UNNEST(e.muscle_groups) as muscle_group,
            COUNT(st.set_id) as total_sets,
            COUNT(DISTINCT s.user_id) as unique_users
          FROM sessions s
          JOIN sets st ON s.session_id = st.session_id
          JOIN exercises e ON st.exercise_id = e.exercise_id
          WHERE s.started_at >= $1
            AND s.tenant_id != $2
          GROUP BY muscle_group
          ORDER BY total_sets DESC
          LIMIT 15
        `, [startDate, ADMIN_TENANT_ID]),

        // Session category breakdown
        db.query(`
          SELECT 
            s.category,
            COUNT(s.session_id) as session_count,
            COUNT(DISTINCT s.user_id) as unique_users,
            AVG(EXTRACT(EPOCH FROM (s.completed_at - s.started_at))/60) as avg_duration
          FROM sessions s
          WHERE s.started_at >= $1
            AND s.tenant_id != $2
            AND s.completed_at IS NOT NULL
          GROUP BY s.category
          ORDER BY session_count DESC
        `, [startDate, ADMIN_TENANT_ID]),
      ]);

      return {
        popularExercises: popularExercises.rows,
        muscleGroupUsage: muscleGroupUsage.rows,
        categoryBreakdown: categoryBreakdown.rows.map(row => ({
          ...row,
          session_count: parseInt(row.session_count),
          unique_users: parseInt(row.unique_users),
          avg_duration: parseFloat(row.avg_duration) || 0,
        })),
      };
    }),

  getTenantAnalytics: adminProcedure
    .input(z.object({
      timeRange: z.enum(['30d', '90d', '1y', 'all']).default('30d'),
    }))
    .query(async ({ input }) => {
      const { timeRange } = input;
      
      let startDate: Date;
      if (timeRange === 'all') {
        startDate = new Date('2015-01-01'); // Very early date for all-time data
      } else {
        const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
        startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      }

      const result = await db.query(`
        SELECT 
          t.tenant_id,
          t.name as tenant_name,
          COUNT(DISTINCT s.user_id) as active_users,
          COUNT(s.session_id) as total_sessions,
          AVG(EXTRACT(EPOCH FROM (s.completed_at - s.started_at))/60) as avg_session_duration,
          MAX(s.started_at) as last_activity,
          COUNT(DISTINCT u.user_id) as total_users
        FROM tenants t
        LEFT JOIN sessions s ON t.tenant_id = s.tenant_id AND s.started_at >= $1
        LEFT JOIN users u ON t.tenant_id = u.tenant_id AND u.role != 'system_admin'
        WHERE t.tenant_id != $2
        GROUP BY t.tenant_id, t.name
        ORDER BY total_sessions DESC NULLS LAST
        LIMIT 20
      `, [startDate, ADMIN_TENANT_ID]);

      return result.rows.map(row => ({
        tenantId: row.tenant_id,
        tenantName: row.tenant_name,
        activeUsers: parseInt(row.active_users) || 0,
        totalSessions: parseInt(row.total_sessions) || 0,
        avgSessionDuration: parseFloat(row.avg_session_duration) || 0,
        lastActivity: row.last_activity,
        totalUsers: parseInt(row.total_users) || 0,
      }));
    }),

  getPerformanceMetrics: adminProcedure
    .input(z.object({
      timeRange: z.enum(['7d', '30d', '90d', '1y', 'all']).default('90d'),
    }).optional())
    .query(async ({ input }) => {
      const { timeRange = '90d' } = input || {};
      
      // Calculate date range
      const now = new Date();
      let startDate: Date;
      
      if (timeRange === 'all') {
        startDate = new Date('2015-01-01'); // Very early date for all-time data
      } else {
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
        startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      }

      // System performance metrics for the time range
      const [systemStats, recentActivity] = await Promise.all([
        // Basic system statistics for the time range
        db.query(`
          SELECT 
            (SELECT COUNT(DISTINCT t.tenant_id) FROM tenants t WHERE t.tenant_id != $3) as total_tenants,
            (SELECT COUNT(DISTINCT s.user_id) FROM sessions s WHERE s.started_at >= $1 AND s.started_at <= $2 AND s.tenant_id != $3) as total_users,
            (SELECT COUNT(*) FROM sessions WHERE started_at >= $1 AND started_at <= $2 AND tenant_id != $3) as total_sessions,
            (SELECT COUNT(DISTINCT e.exercise_id) FROM sessions s JOIN sets st ON s.session_id = st.session_id JOIN exercises e ON st.exercise_id = e.exercise_id WHERE s.started_at >= $1 AND s.started_at <= $2 AND s.tenant_id != $3) as total_exercises
        `, [startDate, now, ADMIN_TENANT_ID]),

        // Recent activity (last 24 hours)
        db.query(`
          SELECT 
            COUNT(DISTINCT user_id) as active_users_24h,
            COUNT(*) as sessions_24h,
            COUNT(DISTINCT tenant_id) as active_tenants_24h
          FROM sessions
          WHERE started_at >= NOW() - INTERVAL '24 hours'
            AND tenant_id != $1
        `, [ADMIN_TENANT_ID]),
      ]);

      const stats = systemStats.rows[0];
      const activity = recentActivity.rows[0];

      return {
        totalTenants: parseInt(stats.total_tenants) || 0,
        totalUsers: parseInt(stats.total_users) || 0,
        totalSessions: parseInt(stats.total_sessions) || 0,
        totalExercises: parseInt(stats.total_exercises) || 0,
        activeUsers24h: parseInt(activity.active_users_24h) || 0,
        sessions24h: parseInt(activity.sessions_24h) || 0,
        activeTenants24h: parseInt(activity.active_tenants_24h) || 0,
      };
    }),

  // Get all workout sessions across all tenants (system admin only)
  getWorkoutSessions: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      search: z.string().optional(),
      category: z.enum(['strength', 'cardio', 'hybrid']).optional(),
      tenant_id: z.string().uuid().optional(),
      completed_only: z.boolean().default(false),
      status: z.enum(['all', 'completed', 'in-progress']).default('all'),
    }))
    .query(async ({ input }) => {
      const { page, limit, search, category, tenant_id, completed_only, status } = input;
      const offset = (page - 1) * limit;

      let whereConditions = [`s.tenant_id != $1`];
      const params: any[] = [ADMIN_TENANT_ID];

      if (search) {
        params.push(`%${search}%`);
        whereConditions.push(`(s.name ILIKE $${params.length} OR u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length})`);
      }

      if (category) {
        params.push(category);
        whereConditions.push(`s.category = $${params.length}`);
      }

      if (tenant_id) {
        params.push(tenant_id);
        whereConditions.push(`s.tenant_id = $${params.length}`);
      }

      if (completed_only) {
        whereConditions.push(`s.completed_at IS NOT NULL`);
      }

      // Add status filtering
      if (status === 'completed') {
        whereConditions.push(`s.completed_at IS NOT NULL`);
      } else if (status === 'in-progress') {
        whereConditions.push(`s.completed_at IS NULL`);
      }
      // 'all' requires no additional filtering

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countResult = await db.query(
        `SELECT COUNT(*) as count 
         FROM sessions s 
         LEFT JOIN users u ON s.user_id = u.user_id
         WHERE ${whereClause}`,
        params
      );

      // Get sessions with user and tenant info
      params.push(limit, offset);
      const result = await db.query(`
        SELECT 
          s.session_id,
          s.name,
          s.category,
          s.started_at,
          s.completed_at,
          s.duration_seconds,
          s.training_load,
          s.perceived_exertion,
          s.notes,
          u.user_id,
          u.first_name,
          u.last_name,
          u.email,
          t.tenant_id,
          t.name as tenant_name,
          COUNT(DISTINCT st.exercise_id) as exercise_count,
          COUNT(st.set_id) as total_sets
        FROM sessions s
        LEFT JOIN users u ON s.user_id = u.user_id
        LEFT JOIN tenants t ON s.tenant_id = t.tenant_id
        LEFT JOIN sets st ON s.session_id = st.session_id
        WHERE ${whereClause}
        GROUP BY s.session_id, s.name, s.category, s.started_at, s.completed_at, 
                 s.duration_seconds, s.training_load, s.perceived_exertion, s.notes,
                 u.user_id, u.first_name, u.last_name, u.email, 
                 t.tenant_id, t.name
        ORDER BY s.started_at DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `, params);

      return {
        sessions: result.rows.map(row => ({
          id: row.session_id,
          name: row.name || 'Unnamed Workout',
          type: row.category,
          duration: Math.round((row.duration_seconds || 3600) / 60), // Convert to minutes
          difficulty: row.perceived_exertion ? 
            (row.perceived_exertion <= 3 ? 'Beginner' : 
             row.perceived_exertion <= 7 ? 'Intermediate' : 'Advanced') : 'Beginner',
          instructor: row.first_name && row.last_name ? 
            `${row.first_name} ${row.last_name}` : (row.email || 'Unknown'),
          participants: 1, // Individual sessions
          createdAt: row.started_at,
          status: row.completed_at ? 'completed' : 'in-progress',
          tenantId: row.tenant_id,
          tenantName: row.tenant_name,
          exerciseCount: parseInt(row.exercise_count) || 0,
          totalSets: parseInt(row.total_sets) || 0,
          trainingLoad: row.training_load,
          notes: row.notes,
        })),
        totalCount: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
        currentPage: page,
      };
    }),

  // Get workout session statistics
  getWorkoutSessionStats: adminProcedure
    .query(async () => {
      const stats = await Promise.all([
        // Total sessions across all tenants
        db.query('SELECT COUNT(*) as count FROM sessions WHERE tenant_id != $1', [ADMIN_TENANT_ID]),
        // Active sessions (completed)
        db.query('SELECT COUNT(*) as count FROM sessions WHERE completed_at IS NOT NULL AND tenant_id != $1', [ADMIN_TENANT_ID]),
        // Total unique participants
        db.query('SELECT COUNT(DISTINCT user_id) as count FROM sessions WHERE tenant_id != $1', [ADMIN_TENANT_ID]),
        // Average session duration (in minutes)
        db.query(`
          SELECT AVG(
            CASE 
              WHEN completed_at IS NOT NULL THEN EXTRACT(EPOCH FROM (completed_at - started_at))/60
              ELSE duration_seconds/60
            END
          ) as avg_duration
          FROM sessions 
          WHERE tenant_id != $1
        `, [ADMIN_TENANT_ID]),
      ]);

      return {
        totalWorkouts: parseInt(stats[0].rows[0].count),
        activeWorkouts: parseInt(stats[1].rows[0].count),
        totalParticipants: parseInt(stats[2].rows[0].count),
        avgDuration: Math.round(parseFloat(stats[3].rows[0].avg_duration) || 42),
      };
    }),

  // Get all workout templates across all tenants (system admin only)
  getAllWorkoutTemplates: adminProcedure
    .input(z.object({
      search: z.string().optional(),
      scope: z.enum(['user', 'tenant', 'system']).optional(),
      limit: z.number().int().positive().max(100).default(50),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const { search, scope, limit, offset } = input;

      let query = `
        SELECT 
          wt.template_id,
          wt.tenant_id,
          wt.user_id,
          wt.name,
          wt.description,
          wt.scope,
          wt.exercises,
          wt.is_active,
          wt.created_at,
          wt.updated_at,
          u.first_name as created_by_name,
          u.last_name as created_by_lastname,
          u.email as created_by_email,
          t.name as tenant_name,
          CASE 
            WHEN wt.exercises IS NOT NULL THEN jsonb_array_length(wt.exercises)
            ELSE 0
          END as exercise_count
        FROM workout_templates wt
        LEFT JOIN users u ON wt.created_by = u.user_id
        LEFT JOIN tenants t ON wt.tenant_id = t.tenant_id
        WHERE wt.is_active = true
      `;

      const params: any[] = [];
      let paramIndex = 1;

      // Filter by scope if specified
      if (scope) {
        query += ` AND wt.scope = $${paramIndex}`;
        params.push(scope);
        paramIndex++;
      }

      // Filter by search term
      if (search) {
        query += ` AND (wt.name ILIKE $${paramIndex} OR wt.description ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Order by scope priority and creation date
      query += ` 
        ORDER BY 
          CASE wt.scope 
            WHEN 'system' THEN 1 
            WHEN 'tenant' THEN 2 
            WHEN 'user' THEN 3 
          END,
          wt.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit, offset);

      const result = await db.query(query, params);
      
      // Exercises are already parsed from JSONB, no need to JSON.parse()
      return result.rows.map(row => ({
        ...row,
        exercises: row.exercises || [],
        exercise_count: parseInt(row.exercise_count) || 0,
      }));
    }),

  // Get count of all workout templates for pagination
  getAllWorkoutTemplatesCount: adminProcedure
    .input(z.object({
      search: z.string().optional(),
      scope: z.enum(['user', 'tenant', 'system']).optional(),
    }))
    .query(async ({ input }) => {
      const { search, scope } = input;

      let query = `
        SELECT COUNT(*) as total
        FROM workout_templates wt
        WHERE wt.is_active = true
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (scope) {
        query += ` AND wt.scope = $${paramIndex}`;
        params.push(scope);
        paramIndex++;
      }

      if (search) {
        query += ` AND (wt.name ILIKE $${paramIndex} OR wt.description ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      const result = await db.query(query, params);
      return parseInt(result.rows[0].total);
    }),

  // Equipment Management
  getEquipment: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      search: z.string().optional(),
      category: z.string().optional(),
      active_only: z.boolean().default(false),
    }))
    .query(async ({ input }) => {
      const { page, limit, search, category, active_only } = input;
      const offset = (page - 1) * limit;

      let whereConditions = [];
      const params: any[] = [];

      if (active_only) {
        whereConditions.push('e.is_active = true');
      }

      if (category) {
        params.push(category);
        whereConditions.push(`e.category = $${params.length}`);
      }

      if (search) {
        params.push(`%${search}%`);
        whereConditions.push(`(e.name ILIKE $${params.length} OR e.description ILIKE $${params.length})`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total count
      const countResult = await db.query(`
        SELECT COUNT(*) as count
        FROM equipment e
        ${whereClause}
      `, params);

      // Get equipment with usage stats
      params.push(limit, offset);
      const result = await db.query(`
        SELECT 
          e.equipment_id,
          e.name,
          e.category,
          e.description,
          e.is_active,
          e.created_at,
          e.updated_at,
          COUNT(DISTINCT ex.exercise_id) as exercise_count,
          COUNT(DISTINCT et.template_id) as template_count
        FROM equipment e
        LEFT JOIN exercises ex ON e.equipment_id = ex.equipment_id AND ex.is_active = true
        LEFT JOIN exercise_templates et ON e.equipment_id = et.equipment_id
        ${whereClause}
        GROUP BY e.equipment_id, e.name, e.category, e.description, e.is_active, e.created_at, e.updated_at
        ORDER BY 
          CASE WHEN e.name = 'None' THEN 0 ELSE 1 END,
          e.category,
          e.name
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `, params);

      return {
        equipment: result.rows.map(row => ({
          ...row,
          exercise_count: parseInt(row.exercise_count) || 0,
          template_count: parseInt(row.template_count) || 0,
        })),
        totalCount: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
        currentPage: page,
      };
    }),

  createEquipment: adminProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      category: z.enum(['free_weights', 'machines', 'cardio', 'bodyweight', 'resistance', 'other']).default('other'),
      description: z.string().optional(),
      is_active: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      // Check if equipment with same name already exists
      const existingResult = await db.query(
        'SELECT equipment_id FROM equipment WHERE LOWER(name) = LOWER($1)',
        [input.name]
      );

      if (existingResult.rows.length > 0) {
        throw new Error('Equipment with this name already exists');
      }

      const result = await db.query(`
        INSERT INTO equipment (name, category, description, is_active)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [input.name, input.category, input.description, input.is_active]);

      return result.rows[0];
    }),

  updateEquipment: adminProcedure
    .input(z.object({
      equipment_id: z.string().uuid(),
      name: z.string().min(1).max(255).optional(),
      category: z.enum(['free_weights', 'machines', 'cardio', 'bodyweight', 'resistance', 'other']).optional(),
      description: z.string().optional(),
      is_active: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { equipment_id, ...updateData } = input;

      // If name is being updated, check for conflicts
      if (updateData.name) {
        const existingResult = await db.query(
          'SELECT equipment_id FROM equipment WHERE LOWER(name) = LOWER($1) AND equipment_id != $2',
          [updateData.name, equipment_id]
        );

        if (existingResult.rows.length > 0) {
          throw new Error('Equipment with this name already exists');
        }
      }

      const setClauses: string[] = [];
      const params: any[] = [equipment_id];

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
        UPDATE equipment 
        SET ${setClauses.join(', ')}
        WHERE equipment_id = $1
        RETURNING *
      `, params);

      if (result.rows.length === 0) {
        throw new Error('Equipment not found');
      }

      return result.rows[0];
    }),

  deleteEquipment: adminProcedure
    .input(
      z.union([
        deleteEquipmentInputSchema,
        z.object({ json: deleteEquipmentInputSchema }),
      ]).transform((payload) => (
        'json' in payload ? payload.json : payload
      ))
    )
    .mutation(async ({ input }) => {
      // Check if equipment is being used
      const [exerciseUsage, templateUsage] = await Promise.all([
        db.query('SELECT COUNT(*) as count FROM exercises WHERE equipment_id = $1 AND is_active = true', [input.equipment_id]),
        db.query('SELECT COUNT(*) as count FROM exercise_templates WHERE equipment_id = $1', [input.equipment_id]),
      ]);

      const exerciseCount = parseInt(exerciseUsage.rows[0].count);
      const templateCount = parseInt(templateUsage.rows[0].count);

      if (exerciseCount > 0 || templateCount > 0) {
        throw new Error(`Cannot delete equipment. It is being used by ${exerciseCount} exercises and ${templateCount} templates. Consider deactivating instead.`);
      }

      const result = await db.query(`
        DELETE FROM equipment 
        WHERE equipment_id = $1
        RETURNING *
      `, [input.equipment_id]);

      if (result.rows.length === 0) {
        throw new Error('Equipment not found');
      }

      return { success: true };
    }),

  getEquipmentStats: adminProcedure
    .input(z.object({
      timeRange: z.enum(['7d', '30d', '90d', '1y', 'all']).default('90d'),
    }).optional())
    .query(async ({ input }) => {
      const { timeRange = '90d' } = input || {};
      
      // Calculate date range
      const now = new Date();
      let startDate: Date;
      
      if (timeRange === 'all') {
        startDate = new Date('2015-01-01'); // Very early date for all-time data
      } else {
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
        startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      }

      const stats = await Promise.all([
        // Total equipment
        db.query('SELECT COUNT(*) as count FROM equipment'),
        // Active equipment
        db.query('SELECT COUNT(*) as count FROM equipment WHERE is_active = true'),
        // Equipment by category
        db.query(`
          SELECT 
            category,
            COUNT(*) as count
          FROM equipment
          WHERE is_active = true
          GROUP BY category
          ORDER BY count DESC
        `),
        // Most used equipment in the time range
        db.query(`
          SELECT 
            e.name,
            e.category,
            COUNT(DISTINCT ex.exercise_id) as exercise_count,
            COUNT(DISTINCT et.template_id) as template_count,
            COUNT(DISTINCT s.session_id) as session_usage
          FROM equipment e
          LEFT JOIN exercises ex ON e.equipment_id = ex.equipment_id AND ex.is_active = true
          LEFT JOIN exercise_templates et ON e.equipment_id = et.equipment_id
          LEFT JOIN sets st ON ex.exercise_id = st.exercise_id
          LEFT JOIN sessions s ON st.session_id = s.session_id AND s.started_at >= $1 AND s.started_at <= $2
          WHERE e.is_active = true
          GROUP BY e.equipment_id, e.name, e.category
          HAVING COUNT(DISTINCT ex.exercise_id) > 0 OR COUNT(DISTINCT et.template_id) > 0
          ORDER BY 
            COALESCE(COUNT(DISTINCT s.session_id), 0) DESC,
            (COUNT(DISTINCT ex.exercise_id) + COUNT(DISTINCT et.template_id)) DESC
          LIMIT 10
        `, [startDate, now]),
      ]);

      return {
        totalEquipment: parseInt(stats[0].rows[0].count),
        activeEquipment: parseInt(stats[1].rows[0].count),
        equipmentByCategory: stats[2].rows,
        mostUsedEquipment: stats[3].rows.map(row => ({
          ...row,
          exercise_count: parseInt(row.exercise_count),
          template_count: parseInt(row.template_count),
          session_usage: parseInt(row.session_usage) || 0,
        })),
      };
    }),

  // Data Export/Import Endpoints

  // Export tenant data
  exportTenant: adminProcedure
    .input(z.object({
      tenantId: z.string().uuid(),
      includeUsers: z.boolean().default(true),
      includeWorkoutData: z.boolean().default(true),
      format: z.enum(['json', 'sql', 'csv']).default('json'),
      dateRange: z.object({
        start: z.string().optional(),
        end: z.string().optional()
      }).optional()
    }))
    .mutation(async ({ input }) => {
      const options = {
        format: input.format,
        includeUsers: input.includeUsers,
        includeWorkoutData: input.includeWorkoutData,
        dateRange: input.dateRange?.start && input.dateRange?.end ? {
          start: new Date(input.dateRange.start),
          end: new Date(input.dateRange.end)
        } : undefined
      };

      return await dataExporter.exportTenant(input.tenantId, options);
    }),

  // Export global data
  exportGlobalData: adminProcedure
    .input(z.object({
      format: z.enum(['json', 'sql', 'csv']).default('json')
    }))
    .mutation(async ({ input }) => {
      return await dataExporter.exportGlobalData({ format: input.format });
    }),

  // Export all system data
  exportAll: adminProcedure
    .input(z.object({
      format: z.enum(['json', 'sql', 'csv']).default('json'),
      includeUsers: z.boolean().default(true),
      includeWorkoutData: z.boolean().default(true)
    }))
    .mutation(async ({ input }) => {
      const options = {
        format: input.format,
        includeUsers: input.includeUsers,
        includeWorkoutData: input.includeWorkoutData
      };

      return await dataExporter.exportAll(options);
    }),

  // Import tenant data
  importTenant: adminProcedure
    .input(z.object({
      data: z.any(), // TenantExportData - using any for flexibility
      mergeStrategy: z.enum(['replace', 'merge', 'skip-existing']).default('merge'),
      validateReferences: z.boolean().default(true),
      createBackup: z.boolean().default(true),
      dryRun: z.boolean().default(false)
    }))
    .mutation(async ({ input }) => {
      const options = {
        mergeStrategy: input.mergeStrategy,
        validateReferences: input.validateReferences,
        createBackup: input.createBackup,
        dryRun: input.dryRun,
        includeWorkoutData: true
      };

      return await dataImporter.importTenant(input.data, options);
    }),

  // Import global data
  importGlobalData: adminProcedure
    .input(z.object({
      data: z.any(), // GlobalExportData - using any for flexibility
      mergeStrategy: z.enum(['replace', 'merge', 'skip-existing']).default('merge'),
      validateReferences: z.boolean().default(true),
      createBackup: z.boolean().default(true),
      dryRun: z.boolean().default(false)
    }))
    .mutation(async ({ input }) => {
      const options = {
        mergeStrategy: input.mergeStrategy,
        validateReferences: input.validateReferences,
        createBackup: input.createBackup,
        dryRun: input.dryRun
      };

      return await dataImporter.importGlobalData(input.data, options);
    }),

  // Get list of available tenants for export
  getExportableTenants: adminProcedure
    .query(async () => {
      const result = await db.query(`
        SELECT t.tenant_id, t.name, t.created_at,
               COUNT(DISTINCT u.user_id) as user_count,
               COUNT(DISTINCT s.session_id) as session_count
        FROM tenants t
        LEFT JOIN users u ON u.tenant_id = t.tenant_id
        LEFT JOIN sessions s ON s.tenant_id = t.tenant_id
        WHERE t.tenant_id != $1
        GROUP BY t.tenant_id, t.name, t.created_at
        ORDER BY t.name
      `, [ADMIN_TENANT_ID]);

      return result.rows.map(row => ({
        ...row,
        user_count: parseInt(row.user_count),
        session_count: parseInt(row.session_count)
      }));
    }),

  // Backup management endpoints
  listBackups: adminProcedure
    .query(async () => {
      const result = await db.query(`
        SELECT backup_id, tenant_id, backup_type, file_size, created_at, metadata
        FROM backups 
        ORDER BY created_at DESC 
        LIMIT 50
      `);
      
      return result.rows;
    }),

  restoreFromBackup: adminProcedure
    .input(z.object({
      backupId: z.string(),
      confirmRestore: z.boolean().default(false)
    }))
    .mutation(async ({ input }) => {
      if (!input.confirmRestore) {
        throw new Error('Restore confirmation required');
      }
      
      // In a real implementation, this would restore from backup
      // For now, return a placeholder response
      return {
        success: true,
        message: 'Backup restore initiated',
        backupId: input.backupId
      };
    }),
});