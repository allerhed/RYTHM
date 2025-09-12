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

  // Analytics endpoints
  getAnalyticsDashboard: adminProcedure
    .input(z.object({
      timeRange: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
      compareToLast: z.boolean().default(true),
    }))
    .query(async ({ input }) => {
      const { timeRange, compareToLast } = input;
      
      // Calculate date ranges
      const now = new Date();
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const compareStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

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
      timeRange: z.enum(['30d', '90d', '1y']).default('30d'),
    }))
    .query(async ({ input }) => {
      const { timeRange } = input;
      
      const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

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
      timeRange: z.enum(['30d', '90d', '1y']).default('30d'),
    }))
    .query(async ({ input }) => {
      const { timeRange } = input;
      
      const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

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
    .query(async () => {
      // System performance metrics
      const [systemStats, recentActivity] = await Promise.all([
        // Basic system statistics
        db.query(`
          SELECT 
            (SELECT COUNT(*) FROM tenants WHERE tenant_id != $1) as total_tenants,
            (SELECT COUNT(*) FROM users WHERE tenant_id != $1) as total_users,
            (SELECT COUNT(*) FROM sessions WHERE tenant_id != $1) as total_sessions,
            (SELECT COUNT(*) FROM exercises) as total_exercises
        `, [ADMIN_TENANT_ID]),

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
});