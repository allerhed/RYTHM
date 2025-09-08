// populate-hybrid-exercises.js
// Node.js script to populate the database with hybrid training exercises

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: 'rythm_api',
  host: 'localhost',
  database: 'rythm',
  password: 'password',
  port: 5432,
});

async function populateHybridExercises() {
  console.log('🏃‍♂️ Populating RYTHM database with hybrid training exercises...');
  
  try {
    // Test connection
    console.log('📡 Checking PostgreSQL connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL is running');

    // Read and execute migration file
    console.log('🔄 Running exercise type and hybrid training migration...');
    const migrationPath = path.join(__dirname, '..', 'packages', 'db', 'migrations', '005_exercise_type_hybrid_training.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(migrationSQL);
    console.log('✅ Migration completed successfully!');

    // Verify the data
    console.log('📊 Verifying exercise data...');
    const totalResult = await pool.query('SELECT COUNT(*) FROM exercise_templates');
    const strengthResult = await pool.query("SELECT COUNT(*) FROM exercise_templates WHERE exercise_type = 'STRENGTH'");
    const cardioResult = await pool.query("SELECT COUNT(*) FROM exercise_templates WHERE exercise_type = 'CARDIO'");

    const totalCount = parseInt(totalResult.rows[0].count);
    const strengthCount = parseInt(strengthResult.rows[0].count);
    const cardioCount = parseInt(cardioResult.rows[0].count);

    console.log('📈 Database Statistics:');
    console.log(`   Total exercises: ${totalCount}`);
    console.log(`   Strength exercises: ${strengthCount}`);
    console.log(`   Cardio exercises: ${cardioCount}`);

    // Show sample exercises
    console.log('\n💪 Sample STRENGTH exercises:');
    const strengthSamples = await pool.query(`
      SELECT name, muscle_groups[1] as primary_muscle, equipment, default_value_1_type, default_value_2_type 
      FROM exercise_templates 
      WHERE exercise_type = 'STRENGTH' 
      ORDER BY name 
      LIMIT 10
    `);
    console.table(strengthSamples.rows);

    console.log('\n🏃 Sample CARDIO exercises:');
    const cardioSamples = await pool.query(`
      SELECT name, muscle_groups[1] as primary_muscle, equipment, default_value_1_type, default_value_2_type 
      FROM exercise_templates 
      WHERE exercise_type = 'CARDIO' 
      ORDER BY name 
      LIMIT 10
    `);
    console.table(cardioSamples.rows);

    console.log('\n🎉 Hybrid training exercise database populated successfully!');
    console.log(`🔥 Your RYTHM app now has ${totalCount} exercises optimized for hybrid training!`);
    console.log('\n💡 Next steps:');
    console.log('   1. Restart your API server to pick up the changes');
    console.log('   2. Test the exercise selection in your workout creation interface');
    console.log('   3. Start building hybrid training workouts!');

  } catch (error) {
    console.error('❌ Error populating database:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Check if this script is being run directly
if (require.main === module) {
  populateHybridExercises();
}

module.exports = { populateHybridExercises };