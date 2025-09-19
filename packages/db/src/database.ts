import { Pool, PoolConfig } from 'pg';

export class Database {
  private pool: Pool;

  constructor(config: PoolConfig) {
    this.pool = new Pool({
      ...config,
      ssl: process.env.NODE_ENV === 'production' ? { 
        rejectUnauthorized: false,
        requestCert: false 
      } : false,
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
export const db = new Database(getDatabaseConfig());

function getDatabaseConfig(): PoolConfig {
  // If DATABASE_URL is provided (Azure), parse it
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port || '5432'),
      database: url.pathname.substring(1), // Remove leading slash
      user: url.username,
      password: url.password,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
  }
  
  // Fallback to individual environment variables (local development)
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'rythm',
    user: process.env.DB_USER || 'rythm_api',
    password: process.env.DB_PASSWORD || 'password',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased timeout for Azure
  };
}