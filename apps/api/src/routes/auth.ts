import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { TRPCError } from '@trpc/server';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  tenantName: z.string().min(1).max(255),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const authRouter = router({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input, ctx }) => {
      const { email, password, firstName, lastName, tenantName } = input;

      // Check if user already exists
      const existingUser = await ctx.db.query(
        'SELECT user_id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User already exists',
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create tenant and user in transaction
      const result = await ctx.db.transaction(async (client) => {
        // Create tenant
        const tenantResult = await client.query(
          `INSERT INTO tenants (name) VALUES ($1) RETURNING tenant_id`,
          [tenantName]
        );
        const tenantId = tenantResult.rows[0].tenant_id;

        // Create user as tenant admin
        const userResult = await client.query(
          `INSERT INTO users (tenant_id, email, password_hash, role, first_name, last_name) 
           VALUES ($1, $2, $3, 'tenant_admin', $4, $5) 
           RETURNING user_id, tenant_id, email, role, first_name, last_name`,
          [tenantId, email, passwordHash, firstName, lastName]
        );

        return userResult.rows[0];
      });

      // Generate JWT
      const token = jwt.sign(
        {
          userId: result.user_id,
          tenantId: result.tenant_id,
          role: result.role,
          email: result.email,
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      return {
        token,
        user: {
          id: result.user_id,
          email: result.email,
          role: result.role,
          firstName: result.first_name,
          lastName: result.last_name,
          tenantId: result.tenant_id,
        },
      };
    }),

  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      const { email, password } = input;

      // Find user
      const result = await ctx.db.query(
        `SELECT user_id, tenant_id, email, password_hash, role, first_name, last_name 
         FROM users WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      const user = result.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      // Generate JWT
      const token = jwt.sign(
        {
          userId: user.user_id,
          tenantId: user.tenant_id,
          role: user.role,
          email: user.email,
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      return {
        token,
        user: {
          id: user.user_id,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
          tenantId: user.tenant_id,
        },
      };
    }),

  refresh: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const decoded = jwt.verify(input.token, process.env.JWT_SECRET || 'your-secret-key') as any;
        
        // Generate new token
        const newToken = jwt.sign(
          {
            userId: decoded.userId,
            tenantId: decoded.tenantId,
            role: decoded.role,
            email: decoded.email,
          },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '7d' }
        );

        return { token: newToken };
      } catch (error) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid token',
        });
      }
    }),
});