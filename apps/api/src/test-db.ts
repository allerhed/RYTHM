import { db } from '@rythm/db';

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    const result = await db.query('SELECT 1 as test');
    console.log('Database connection successful:', result.rows);
    
    // Test if tables exist
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables found:', tables.rows.map(r => r.table_name));
    
    process.exit(0);
  } catch (error) {
    console.error('Database test failed:', error);
    process.exit(1);
  }
}

testDatabase();