import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import bcrypt from 'bcrypt';
import { TRPCError } from '@trpc/server';

const userSchema = z.object({
  first_name: z.string().min(1).max(255).optional(),
  last_name: z.string().min(1).max(255).optional(),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(['athlete', 'coach', 'tenant_admin', 'org_admin']).default('athlete'),
  organization_id: z.string().uuid().optional(),
});

const updateUserSchema = userSchema.partial().extend({
  id: z.string().uuid(),
});

const getUsersSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  role: z.enum(['athlete', 'coach', 'tenant_admin', 'org_admin']).optional(),
});

export const usersRouter = router({
  // Get all users with pagination and filtering
  getUsers: protectedProcedure
    .input(getUsersSchema)
    .query(async ({ input, ctx }) => {
      const { page, limit, search, role } = input;
      const offset = (page - 1) * limit;

      // For admin users, don't filter by tenant - allow them to see all users
      let whereClause = '';
      if (ctx.user!.tenantId !== 'admin') {
        whereClause = `WHERE tenant_id = '${ctx.user!.tenantId}'`;
      }

      const params: any[] = [];
      let paramIndex = 1;

      if (search) {
        const searchCondition = `(first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex + 1} OR email ILIKE $${paramIndex + 2})`;
        if (whereClause) {
          whereClause += ` AND ${searchCondition}`;
        } else {
          whereClause = `WHERE ${searchCondition}`;
        }
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        paramIndex += 3;
      }

      if (role) {
        const roleCondition = `role = $${paramIndex}`;
        if (whereClause) {
          whereClause += ` AND ${roleCondition}`;
        } else {
          whereClause = `WHERE ${roleCondition}`;
        }
        params.push(role);
        paramIndex++;
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
      const countResult = await ctx.db.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Get users with pagination
      const usersQuery = `
        SELECT 
          user_id as id,
          first_name, 
          last_name,
          email, 
          role, 
          created_at, 
          updated_at,
          tenant_id as organization_id
        FROM users 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      const usersResult = await ctx.db.query(usersQuery, [...params, limit, offset]);

      return {
        users: usersResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    }),

  // Get user by ID
  getUserById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const result = await ctx.db.query(
        `SELECT user_id as id, first_name, last_name, email, role, created_at, updated_at, tenant_id as organization_id 
         FROM users WHERE user_id = $1`,
        [input.id]
      );

      if (result.rows.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return result.rows[0];
    }),

  // Create new user
  createUser: protectedProcedure
    .input(userSchema)
    .mutation(async ({ input, ctx }) => {
      const { first_name, last_name, email, password, role, organization_id } = input;

      // Check if email already exists
      const existingUser = await ctx.db.query('SELECT user_id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Email already exists',
        });
      }

      if (!password) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Password is required for new users',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Determine tenant ID - use provided organization_id or get the first available tenant for admin users
      let tenantId = organization_id;
      if (!tenantId) {
        if (ctx.user!.tenantId === 'admin') {
          // For admin users, get the first available tenant if no organization_id is provided
          const tenantResult = await ctx.db.query('SELECT tenant_id FROM tenants LIMIT 1');
          if (tenantResult.rows.length === 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'No tenants available. Please specify an organization_id.',
            });
          }
          tenantId = tenantResult.rows[0].tenant_id;
        } else {
          tenantId = ctx.user!.tenantId;
        }
      }

      // Insert user
      const result = await ctx.db.query(
        `INSERT INTO users (first_name, last_name, email, password_hash, role, tenant_id, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
         RETURNING user_id as id, first_name, last_name, email, role, created_at, updated_at, tenant_id as organization_id`,
        [first_name, last_name, email, hashedPassword, role, tenantId]
      );

      return result.rows[0];
    }),

  // Update user
  updateUser: protectedProcedure
    .input(updateUserSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, first_name, last_name, email, role, organization_id, password } = input;

      // Check if user exists
      const existingUser = await ctx.db.query('SELECT user_id FROM users WHERE user_id = $1', [id]);
      if (existingUser.rows.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Check if email already exists for other users
      if (email) {
        const emailCheck = await ctx.db.query('SELECT user_id FROM users WHERE email = $1 AND user_id != $2', [email, id]);
        if (emailCheck.rows.length > 0) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email already exists',
          });
        }
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (first_name !== undefined) {
        updates.push(`first_name = $${paramIndex}`);
        values.push(first_name);
        paramIndex++;
      }

      if (last_name !== undefined) {
        updates.push(`last_name = $${paramIndex}`);
        values.push(last_name);
        paramIndex++;
      }

      if (email !== undefined) {
        updates.push(`email = $${paramIndex}`);
        values.push(email);
        paramIndex++;
      }

      if (role !== undefined) {
        updates.push(`role = $${paramIndex}`);
        values.push(role);
        paramIndex++;
      }

      if (organization_id !== undefined) {
        updates.push(`tenant_id = $${paramIndex}`);
        values.push(organization_id);
        paramIndex++;
      }

      if (password) {
        const hashedPassword = await bcrypt.hash(password, 12);
        updates.push(`password_hash = $${paramIndex}`);
        values.push(hashedPassword);
        paramIndex++;
      }

      updates.push(`updated_at = NOW()`);
      values.push(id);

      const query = `
        UPDATE users 
        SET ${updates.join(', ')} 
        WHERE user_id = $${paramIndex}
        RETURNING user_id as id, first_name, last_name, email, role, created_at, updated_at, tenant_id as organization_id
      `;

      const result = await ctx.db.query(query, values);
      return result.rows[0];
    }),

  // Delete user
  deleteUser: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Check if user exists
      const existingUser = await ctx.db.query('SELECT user_id FROM users WHERE user_id = $1', [input.id]);
      if (existingUser.rows.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Delete user
      await ctx.db.query('DELETE FROM users WHERE user_id = $1', [input.id]);
      
      return { success: true, message: 'User deleted successfully' };
    }),

  // Get user statistics
  getUserStats: protectedProcedure
    .query(async ({ ctx }) => {
      // For admin users, get stats for all users across all tenants
      let whereClause = '';
      if (ctx.user!.tenantId !== 'admin') {
        whereClause = `WHERE tenant_id = '${ctx.user!.tenantId}'`;
      }

      const stats = await ctx.db.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE role = 'athlete') as athletes,
          COUNT(*) FILTER (WHERE role = 'coach') as coaches,
          COUNT(*) FILTER (WHERE role = 'tenant_admin') as tenant_admins,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_this_week,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_this_month
        FROM users
        ${whereClause}
      `);

      return stats.rows[0];
    }),
});