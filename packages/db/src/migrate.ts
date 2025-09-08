import * as fs from 'fs';
import * as path from 'path';
import { db } from './database';

interface Migration {
  filename: string;
  sql: string;
}

export class MigrationRunner {
  private migrationsPath: string;

  constructor(migrationsPath: string = path.join(__dirname, '../migrations')) {
    this.migrationsPath = migrationsPath;
  }

  async init() {
    // Create migrations table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  async getExecutedMigrations(): Promise<string[]> {
    const result = await db.query('SELECT filename FROM migrations ORDER BY filename');
    return result.rows.map(row => row.filename);
  }

  async getMigrationFiles(): Promise<Migration[]> {
    const files = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();

    return files.map(filename => ({
      filename,
      sql: fs.readFileSync(path.join(this.migrationsPath, filename), 'utf8')
    }));
  }

  async runMigrations() {
    await this.init();
    
    const executedMigrations = await this.getExecutedMigrations();
    const allMigrations = await this.getMigrationFiles();
    
    const pendingMigrations = allMigrations.filter(
      migration => !executedMigrations.includes(migration.filename)
    );

    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
      return;
    }

    console.log(`Running ${pendingMigrations.length} pending migrations...`);

    for (const migration of pendingMigrations) {
      try {
        console.log(`Running migration: ${migration.filename}`);
        
        await db.transaction(async (client) => {
          await client.query(migration.sql);
          await client.query(
            'INSERT INTO migrations (filename) VALUES ($1)',
            [migration.filename]
          );
        });
        
        console.log(`✓ Migration ${migration.filename} completed`);
      } catch (error) {
        console.error(`✗ Migration ${migration.filename} failed:`, error);
        throw error;
      }
    }

    console.log('All migrations completed successfully');
  }
}

// CLI runner
if (require.main === module) {
  const runner = new MigrationRunner();
  runner.runMigrations()
    .then(() => {
      console.log('Migrations completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}