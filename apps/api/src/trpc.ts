import { TRPCError, initTRPC } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '@rythm/db';

// Context type definition
export interface Context {
  user?: {
    userId: string;
    tenantId: string;
    role: string;
    email: string;
  };
  db: typeof db;
}

// Create context from Express request
export const createContext = async ({ req }: CreateExpressContextOptions): Promise<Context> => {
  const context: Context = { db };

  // Extract JWT token from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-development-secret-key') as any;
      
      // Handle admin tokens (from admin panel)
      if (decoded.type === 'admin') {
        // For admin users, use the system admin tenant ID
        context.user = {
          userId: decoded.userId.toString(),
          tenantId: decoded.tenantId || '00000000-0000-0000-0000-000000000000', // System admin tenant
          role: decoded.role,
          email: decoded.email,
        };
      } else {
        // Handle regular user tokens
        context.user = {
          userId: decoded.userId,
          tenantId: decoded.tenantId,
          role: decoded.role,
          email: decoded.email,
        };
      }
    } catch (error) {
      // Invalid token - context will not have user
    }
  }

  return context;
};

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof z.ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Create router
export const router = t.router;

// Public procedure (no auth required)
export const publicProcedure = t.procedure;

// Protected procedure (auth required)
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  
  // Set tenant context for RLS (skip for system admin users and org_admin users)
  if (ctx.user.tenantId !== '00000000-0000-0000-0000-000000000000' && 
      !['system_admin', 'org_admin'].includes(ctx.user.role)) {
    await db.setTenantContext(
      db, // This will be replaced with actual client in real implementation
      ctx.user.tenantId,
      ctx.user.userId,
      ctx.user.role,
      ctx.user.role === 'org_admin'
    );
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Admin procedure (admin role required)
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!['tenant_admin', 'org_admin', 'admin', 'super_admin', 'system_admin'].includes(ctx.user.role)) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  return next({ ctx });
});

// Coach procedure (coach or admin role required)
export const coachProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!['coach', 'tenant_admin', 'org_admin'].includes(ctx.user.role)) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  return next({ ctx });
});