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
});