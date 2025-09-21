#!/usr/bin/env node

/**
 * Verification Script for RYTHM Test Data
 * 
 * This script verifies that test data was generated correctly
 * and provides a summary of the created data.
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'rythm',
  user: process.env.DB_USER || 'rythm_api',
  password: process.env.DB_PASSWORD || 'password',
});

async function verifyTestData() {
  try {
    console.log('🔍 RYTHM Test Data Verification');
    console.log('==============================');

    // Check users
    const usersResult = await pool.query(`
      SELECT email, first_name, last_name, role, created_at 
      FROM users 
      ORDER BY email
    `);
    
    console.log(`\n👥 Users (${usersResult.rows.length}):`);
    usersResult.rows.forEach(user => {
      console.log(`  📧 ${user.email} (${user.first_name} ${user.last_name}) - ${user.role}`);
    });

    // Check sessions summary
    const sessionsResult = await pool.query(`
      SELECT 
        u.email,
        COUNT(s.session_id) as workout_count,
        MIN(s.started_at) as first_workout,
        MAX(s.started_at) as last_workout,
        ROUND(AVG(s.duration_seconds / 60.0)) as avg_duration_min,
        ROUND(AVG(s.training_load)) as avg_training_load
      FROM users u 
      LEFT JOIN sessions s ON u.user_id = s.user_id 
      GROUP BY u.email, u.user_id
      ORDER BY u.email
    `);

    console.log(`\n🏋️  Workout Sessions:`);
    sessionsResult.rows.forEach(row => {
      console.log(`  ${row.email}: ${row.workout_count} workouts`);
      if (row.workout_count > 0) {
        console.log(`    📅 ${row.first_workout?.toDateString()} → ${row.last_workout?.toDateString()}`);
        console.log(`    ⏱️  Avg duration: ${row.avg_duration_min} min, Avg load: ${row.avg_training_load}`);
      }
    });

    // Check workout categories
    const categoriesResult = await pool.query(`
      SELECT category, COUNT(*) as count, 
             ROUND(AVG(duration_seconds / 60.0)) as avg_duration_min,
             ROUND(AVG(training_load)) as avg_training_load
      FROM sessions 
      GROUP BY category
      ORDER BY category
    `);

    console.log(`\n📊 Workout Categories:`);
    categoriesResult.rows.forEach(cat => {
      console.log(`  ${cat.category}: ${cat.count} sessions (${cat.avg_duration_min} min avg, load ${cat.avg_training_load})`);
    });

    // Check exercises
    const exercisesResult = await pool.query(`
      SELECT exercise_category, COUNT(*) as count
      FROM exercises 
      GROUP BY exercise_category
      ORDER BY exercise_category
    `);

    console.log(`\n💪 Exercises:`);
    exercisesResult.rows.forEach(ex => {
      console.log(`  ${ex.exercise_category}: ${ex.count} exercises`);
    });

    // Check top exercises by usage
    const topExercisesResult = await pool.query(`
      SELECT e.name, e.exercise_category, COUNT(st.set_id) as total_sets
      FROM exercises e 
      JOIN sets st ON e.exercise_id = st.exercise_id 
      GROUP BY e.exercise_id, e.name, e.exercise_category
      ORDER BY total_sets DESC 
      LIMIT 5
    `);

    console.log(`\n🔥 Most Used Exercises:`);
    topExercisesResult.rows.forEach((ex, i) => {
      console.log(`  ${i + 1}. ${ex.name} (${ex.exercise_category}): ${ex.total_sets} sets`);
    });

    // Check sets data
    const setsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_sets,
        COUNT(CASE WHEN value_1_type = 'weight_kg' THEN 1 END) as weight_sets,
        COUNT(CASE WHEN value_1_type = 'duration_m' THEN 1 END) as duration_sets,
        COUNT(CASE WHEN value_1_type = 'distance_m' THEN 1 END) as distance_sets,
        COUNT(CASE WHEN value_2_type = 'calories' THEN 1 END) as calorie_sets
      FROM sets
    `);

    const sets = setsResult.rows[0];
    console.log(`\n📈 Set Data:`);
    console.log(`  Total sets: ${sets.total_sets}`);
    console.log(`  Weight sets: ${sets.weight_sets}`);
    console.log(`  Duration sets: ${sets.duration_sets}`);
    console.log(`  Distance sets: ${sets.distance_sets}`);
    console.log(`  Calorie sets: ${sets.calorie_sets}`);

    // Check data quality
    const qualityResult = await pool.query(`
      SELECT 
        COUNT(CASE WHEN s.completed_at IS NULL THEN 1 END) as incomplete_sessions,
        COUNT(CASE WHEN s.training_load IS NULL THEN 1 END) as sessions_without_load,
        COUNT(CASE WHEN st.rpe IS NULL THEN 1 END) as sets_without_rpe,
        COUNT(CASE WHEN s.duration_seconds < 60 THEN 1 END) as very_short_sessions
      FROM sessions s
      LEFT JOIN sets st ON s.session_id = st.session_id
    `);

    const quality = qualityResult.rows[0];
    console.log(`\n✅ Data Quality Check:`);
    console.log(`  Incomplete sessions: ${quality.incomplete_sessions}`);
    console.log(`  Sessions without training load: ${quality.sessions_without_load}`);
    console.log(`  Sets without RPE: ${quality.sets_without_rpe}`);
    console.log(`  Very short sessions (<1 min): ${quality.very_short_sessions}`);

    console.log('\n🎉 Verification complete!');
    
    if (usersResult.rows.length >= 2 && sessionsResult.rows.some(r => r.workout_count >= 100)) {
      console.log('✅ Test data appears to be generated correctly.');
    } else {
      console.log('⚠️  Test data may be incomplete. Consider re-running the generator.');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run verification if called directly
if (require.main === module) {
  verifyTestData().catch(error => {
    console.error('Verification script failed:', error);
    process.exit(1);
  });
}

module.exports = { verifyTestData };