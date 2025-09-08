import { Pool, PoolConfig } from 'pg';

export class Database {
  private pool: Pool;

  constructor(config: PoolConfig) {
    this.pool = new Pool({
      ...config,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }

  async query(text: string, params?: any[]) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Set tenant context for RLS policies
   */
  async setTenantContext(client: any, tenantId: string, userId?: string, userRole?: string, isOrgAdmin?: boolean) {
    await client.query('SELECT set_config($1, $2, true)', ['rythm.current_tenant_id', tenantId]);
    
    if (userId) {
      await client.query('SELECT set_config($1, $2, true)', ['rythm.current_user_id', userId]);
    }
    
    if (userRole) {
      await client.query('SELECT set_config($1, $2, true)', ['rythm.user_role', userRole]);
    }
    
    if (isOrgAdmin !== undefined) {
      await client.query('SELECT set_config($1, $2, true)', ['rythm.is_org_admin', isOrgAdmin.toString()]);
    }
  }

  async close() {
    await this.pool.end();
  }
}

// Export singleton instance
export const db = new Database({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'rythm',
  user: process.env.DB_USER || 'rythm_api',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});