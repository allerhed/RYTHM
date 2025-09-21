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

  async isDatabaseEmpty(): Promise<boolean> {
    try {
      // Check if any user tables exist (excluding the migrations table)
      const result = await db.query(`
        SELECT COUNT(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name != 'migrations'
        AND table_type = 'BASE TABLE'
      `);
      
      const tableCount = parseInt(result.rows[0].table_count);
      return tableCount === 0;
    } catch (error) {
      // If there's an error, assume database might be empty
      return true;
    }
  }

  async runMigrations() {
    await this.init();
    
    const isDatabaseEmpty = await this.isDatabaseEmpty();
    const executedMigrations = await this.getExecutedMigrations();
    
    // If database is empty and no migrations have been run, use consolidated schema
    if (isDatabaseEmpty && executedMigrations.length === 0) {
      console.log('Fresh database detected. Using consolidated schema...');
      
      const consolidatedSchemaPath = path.join(this.migrationsPath, '000_consolidated_schema.sql');
      if (fs.existsSync(consolidatedSchemaPath)) {
        try {
          const consolidatedSql = fs.readFileSync(consolidatedSchemaPath, 'utf8');
          
          await db.transaction(async (client) => {
            await client.query(consolidatedSql);
            // Mark all individual migrations as executed since consolidated schema includes them
            const allMigrations = await this.getMigrationFiles();
            for (const migration of allMigrations) {
              if (migration.filename !== '000_consolidated_schema.sql') {
                await client.query(
                  'INSERT INTO migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING',
                  [migration.filename]
                );
              }
            }
            // Mark the consolidated schema as executed
            await client.query(
              'INSERT INTO migrations (filename) VALUES ($1)',
              ['000_consolidated_schema.sql']
            );
          });
          
          console.log('✓ Consolidated schema applied successfully');
          console.log('Database is ready for use!');
          return;
        } catch (error) {
          console.error('✗ Failed to apply consolidated schema:', error);
          console.log('Falling back to individual migrations...');
        }
      }
    }
    
    // Standard migration approach for existing databases or if consolidated schema failed
    const allMigrations = await this.getMigrationFiles()
      .then(migrations => migrations.filter(m => m.filename !== '000_consolidated_schema.sql'));
    
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