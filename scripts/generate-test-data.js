#!/usr/bin/env node

/**
 * Test Data Generation Script for RYTHM Workout App
 * 
 * This script creates test users and generates realistic workout data
 * spread over the past 6 months with randomized exercises, sets, and metrics.
 * 
 * Usage: node scripts/generate-test-data.js
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'rythm',
  user: process.env.DB_USER || 'rythm_api',
  password: process.env.DB_PASSWORD || 'password',
});

// Test data configuration
const TEST_USERS = [
  {
    email: 'lars-olof@allerhed.com',
    password: 'Password123',
    firstName: 'Lars-Olof',
    lastName: 'Allerhed',
    role: 'athlete'
  },
  {
    email: 'caroline@allerhed.com',
    password: 'Password123',
    firstName: 'Caroline',
    lastName: 'Allerhed',
    role: 'athlete'
  }
];

// Exercise database with muscle groups and equipment
const EXERCISES = {
  strength: [
    { name: 'Barbell Squat', muscle_groups: ['quadriceps', 'glutes', 'hamstrings'], equipment: 'barbell' },
    { name: 'Deadlift', muscle_groups: ['hamstrings', 'glutes', 'erector_spinae', 'traps'], equipment: 'barbell' },
    { name: 'Bench Press', muscle_groups: ['chest', 'triceps', 'anterior_deltoids'], equipment: 'barbell' },
    { name: 'Pull-ups', muscle_groups: ['lats', 'rhomboids', 'biceps'], equipment: 'pull_up_bar' },
    { name: 'Overhead Press', muscle_groups: ['shoulders', 'triceps', 'core'], equipment: 'barbell' },
    { name: 'Barbell Row', muscle_groups: ['lats', 'rhomboids', 'middle_traps', 'biceps'], equipment: 'barbell' },
    { name: 'Dumbbell Chest Press', muscle_groups: ['chest', 'triceps', 'anterior_deltoids'], equipment: 'dumbbells' },
    { name: 'Bulgarian Split Squat', muscle_groups: ['quadriceps', 'glutes', 'hamstrings'], equipment: 'dumbbells' },
    { name: 'Dumbbell Row', muscle_groups: ['lats', 'rhomboids', 'biceps'], equipment: 'dumbbells' },
    { name: 'Leg Press', muscle_groups: ['quadriceps', 'glutes', 'hamstrings'], equipment: 'machine' },
    { name: 'Lat Pulldown', muscle_groups: ['lats', 'rhomboids', 'biceps'], equipment: 'machine' },
    { name: 'Leg Curl', muscle_groups: ['hamstrings'], equipment: 'machine' },
    { name: 'Leg Extension', muscle_groups: ['quadriceps'], equipment: 'machine' },
    { name: 'Cable Chest Fly', muscle_groups: ['chest'], equipment: 'cable_machine' },
    { name: 'Face Pulls', muscle_groups: ['rear_deltoids', 'rhomboids'], equipment: 'cable_machine' },
    { name: 'Tricep Dips', muscle_groups: ['triceps', 'chest'], equipment: 'bodyweight' },
    { name: 'Push-ups', muscle_groups: ['chest', 'triceps', 'core'], equipment: 'bodyweight' },
    { name: 'Planks', muscle_groups: ['core', 'shoulders'], equipment: 'bodyweight' },
    { name: 'Lunges', muscle_groups: ['quadriceps', 'glutes', 'hamstrings'], equipment: 'bodyweight' },
    { name: 'Hip Thrusts', muscle_groups: ['glutes', 'hamstrings'], equipment: 'barbell' },
  ],
  cardio: [
    { name: 'Treadmill Running', muscle_groups: ['cardiovascular'], equipment: 'treadmill' },
    { name: 'Stationary Bike', muscle_groups: ['cardiovascular', 'quadriceps'], equipment: 'bike' },
    { name: 'Elliptical', muscle_groups: ['cardiovascular'], equipment: 'elliptical' },
    { name: 'Rowing Machine', muscle_groups: ['cardiovascular', 'lats', 'legs'], equipment: 'rowing_machine' },
    { name: 'Stair Climber', muscle_groups: ['cardiovascular', 'glutes', 'calves'], equipment: 'stair_climber' },
    { name: 'Jump Rope', muscle_groups: ['cardiovascular', 'calves'], equipment: 'jump_rope' },
    { name: 'Mountain Climbers', muscle_groups: ['cardiovascular', 'core'], equipment: 'bodyweight' },
    { name: 'Burpees', muscle_groups: ['cardiovascular', 'full_body'], equipment: 'bodyweight' },
    { name: 'High Knees', muscle_groups: ['cardiovascular', 'hip_flexors'], equipment: 'bodyweight' },
    { name: 'Swimming', muscle_groups: ['cardiovascular', 'full_body'], equipment: 'pool' },
  ]
};

// Workout notes templates
const WORKOUT_NOTES = [
  "Great session! Felt strong throughout.",
  "Challenging workout but pushed through.",
  "Energy was a bit low today, but completed all sets.",
  "New personal record on main lift!",
  "Focused on form and technique today.",
  "High intensity session, excellent pump.",
  "Recovery workout, lighter weights.",
  "Perfect training session, everything clicked.",
  "Tough day but stayed consistent.",
  "Feeling the gains from last week's training.",
  "Excellent mind-muscle connection today.",
  "Cardio was intense, great sweat session.",
  "Strength felt incredible today.",
  "Good volume day, hit all target reps.",
  "Recovery run, easy pace throughout."
];

// Utility functions
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDateInRange(startDate, endDate) {
  const start = startDate.getTime();
  const end = endDate.getTime();
  return new Date(start + Math.random() * (end - start));
}

// Generate realistic training load based on session category and duration
function generateTrainingLoad(category, durationMinutes) {
  const baseLoad = category === 'strength' ? 80 : 60;
  const durationFactor = durationMinutes / 60; // Convert to hours
  const variance = randomFloat(0.8, 1.2); // ±20% variance
  
  return Math.round(baseLoad * durationFactor * variance);
}

async function createTenant() {
  const query = `
    INSERT INTO tenants (tenant_id, name, branding)
    VALUES ($1, $2, $3)
    ON CONFLICT DO NOTHING
    RETURNING tenant_id
  `;
  
  const tenantId = randomUUID();
  const result = await pool.query(query, [
    tenantId,
    'Test Gym - Allerhed Family',
    { theme: 'blue', logo: 'test-logo.png' }
  ]);
  
  return result.rows[0]?.tenant_id || tenantId;
}

async function createExercises(tenantId) {
  const exerciseIds = {};
  
  console.log('Creating exercises...');
  
  for (const [category, exercises] of Object.entries(EXERCISES)) {
    exerciseIds[category] = [];
    
    for (const exercise of exercises) {
      const exerciseId = randomUUID();
      
      const query = `
        INSERT INTO exercises (exercise_id, name, muscle_groups, equipment, notes, exercise_category)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (name) DO NOTHING
        RETURNING exercise_id
      `;
      
      const result = await pool.query(query, [
        exerciseId,
        exercise.name,
        exercise.muscle_groups,
        exercise.equipment,
        `${category.charAt(0).toUpperCase() + category.slice(1)} exercise targeting ${exercise.muscle_groups.join(', ')}`,
        category
      ]);
      
      // Use the returned ID or the generated one if it's a new exercise
      const finalExerciseId = result.rows[0]?.exercise_id || exerciseId;
      exerciseIds[category].push({ id: finalExerciseId, ...exercise });
    }
  }
  
  console.log(`Created ${Object.values(exerciseIds).flat().length} exercises`);
  return exerciseIds;
}

async function createUser(tenantId, userData) {
  const userId = randomUUID();
  const hashedPassword = await bcrypt.hash(userData.password, 12);
  
  const query = `
    INSERT INTO users (user_id, tenant_id, email, password_hash, role, first_name, last_name)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (tenant_id, email) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name
    RETURNING user_id
  `;
  
  const result = await pool.query(query, [
    userId,
    tenantId,
    userData.email,
    hashedPassword,
    userData.role,
    userData.firstName,
    userData.lastName
  ]);
  
  return result.rows[0]?.user_id || userId;
}

async function generateWorkoutSession(tenantId, userId, exercises, sessionDate) {
  const category = randomChoice(['strength', 'cardio']);
  const sessionId = randomUUID();
  
  // Generate session duration (20-90 minutes)
  const durationMinutes = randomInt(20, 90);
  const startedAt = sessionDate;
  const completedAt = new Date(startedAt.getTime() + durationMinutes * 60000);
  
  // Calculate training load based on category and duration
  const trainingLoad = generateTrainingLoad(category, durationMinutes);
  
  const sessionNote = randomChoice(WORKOUT_NOTES);
  
  // Create session
  const sessionQuery = `
    INSERT INTO sessions (
      session_id, tenant_id, user_id, started_at, completed_at, category, notes,
      training_load, duration_seconds, name
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  `;
  
  await pool.query(sessionQuery, [
    sessionId,
    tenantId,
    userId,
    startedAt,
    completedAt,
    category,
    `${sessionNote} Training load: ${trainingLoad}.`,
    trainingLoad,
    durationMinutes * 60, // Convert to seconds
    `${category.charAt(0).toUpperCase() + category.slice(1)} Session`
  ]);
  
  // Add exercises to the session
  const exerciseList = exercises[category];
  const numExercises = randomInt(1, 3);
  const selectedExercises = [];
  
  // Randomly select exercises without replacement
  for (let i = 0; i < numExercises; i++) {
    let exercise;
    do {
      exercise = randomChoice(exerciseList);
    } while (selectedExercises.find(e => e.id === exercise.id));
    selectedExercises.push(exercise);
  }
  
  // Generate sets for each exercise
  for (const exercise of selectedExercises) {
    const numSets = randomInt(2, 5);
    
    for (let setIndex = 1; setIndex <= numSets; setIndex++) {
      const setId = randomUUID();
      
      let setData = {
        reps: null,
        value1Type: null,
        value1Numeric: null,
        value2Type: null,
        value2Numeric: null,
        rpe: randomFloat(6, 9.5, 1)
      };
      
      if (category === 'strength') {
        // Strength training: weight + reps
        setData.reps = randomInt(6, 15);
        setData.value1Type = 'weight_kg';
        setData.value1Numeric = randomFloat(20, 150, 1);
      } else {
        // Cardio: duration and/or distance and/or calories
        const cardioType = randomChoice(['duration', 'distance', 'duration_distance', 'duration_calories']);
        
        switch (cardioType) {
          case 'duration':
            setData.value1Type = 'duration_s';
            setData.value1Numeric = randomInt(300, 1800); // 5-30 minutes
            break;
          case 'distance':
            setData.value1Type = 'distance_m';
            setData.value1Numeric = randomInt(1000, 10000); // 1-10km
            break;
          case 'duration_distance':
            setData.value1Type = 'duration_s';
            setData.value1Numeric = randomInt(300, 1800);
            setData.value2Type = 'distance_m';
            setData.value2Numeric = randomInt(1000, 8000);
            break;
          case 'duration_calories':
            setData.value1Type = 'duration_s';
            setData.value1Numeric = randomInt(300, 1800);
            setData.value2Type = 'calories';
            setData.value2Numeric = randomInt(50, 400);
            break;
        }
      }
      
      const setQuery = `
        INSERT INTO sets (
          set_id, tenant_id, session_id, exercise_id, set_index, reps,
          value_1_type, value_1_numeric, value_2_type, value_2_numeric, rpe
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;
      
      await pool.query(setQuery, [
        setId,
        tenantId,
        sessionId,
        exercise.id,
        setIndex,
        setData.reps,
        setData.value1Type,
        setData.value1Numeric,
        setData.value2Type,
        setData.value2Numeric,
        setData.rpe
      ]);
    }
  }
  
  return {
    sessionId,
    category,
    exerciseCount: selectedExercises.length,
    duration: durationMinutes,
    trainingLoad
  };
}

async function generateWorkoutsForUser(tenantId, userId, exercises, userEmail) {
  console.log(`Generating 100 workouts for ${userEmail}...`);
  
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const workoutSessions = [];
  
  for (let i = 0; i < 100; i++) {
    const sessionDate = randomDateInRange(sixMonthsAgo, new Date());
    const session = await generateWorkoutSession(tenantId, userId, exercises, sessionDate);
    workoutSessions.push(session);
    
    if ((i + 1) % 20 === 0) {
      console.log(`  Generated ${i + 1}/100 workouts...`);
    }
  }
  
  // Calculate some stats
  const strengthSessions = workoutSessions.filter(s => s.category === 'strength').length;
  const cardioSessions = workoutSessions.filter(s => s.category === 'cardio').length;
  const avgDuration = Math.round(workoutSessions.reduce((sum, s) => sum + s.duration, 0) / workoutSessions.length);
  const avgTrainingLoad = Math.round(workoutSessions.reduce((sum, s) => sum + s.trainingLoad, 0) / workoutSessions.length);
  
  console.log(`  ✅ ${userEmail}: ${strengthSessions} strength + ${cardioSessions} cardio sessions`);
  console.log(`     Average duration: ${avgDuration} min, Average training load: ${avgTrainingLoad}`);
  
  return workoutSessions;
}

async function refreshAnalytics() {
  console.log('Refreshing analytics views...');
  try {
    await pool.query('SELECT refresh_analytics_views()');
    console.log('✅ Analytics views refreshed');
  } catch (error) {
    console.log('⚠️  Analytics refresh failed (views might not exist yet):', error.message);
  }
}

async function main() {
  try {
    console.log('🏋️  RYTHM Test Data Generator');
    console.log('============================');
    
    // Create tenant
    console.log('Creating tenant...');
    const tenantId = await createTenant();
    console.log(`✅ Tenant created: ${tenantId}`);
    
    // Create exercises
    const exercises = await createExercises(tenantId);
    
    // Create users and generate their workout data
    for (const userData of TEST_USERS) {
      console.log(`\nCreating user: ${userData.email}`);
      const userId = await createUser(tenantId, userData);
      console.log(`✅ User created: ${userId}`);
      
      await generateWorkoutsForUser(tenantId, userId, exercises, userData.email);
    }
    
    // Refresh analytics
    await refreshAnalytics();
    
    console.log('\n🎉 Test data generation completed successfully!');
    console.log('\nTest Users Created:');
    TEST_USERS.forEach(user => {
      console.log(`  📧 ${user.email} / ${user.password}`);
    });
    
    console.log('\nData Summary:');
    console.log(`  🏢 1 tenant created`);
    console.log(`  👥 ${TEST_USERS.length} users created`);
    console.log(`  💪 ${Object.values(exercises).flat().length} exercises created`);
    console.log(`  🏋️  ${TEST_USERS.length * 100} workout sessions generated`);
    console.log(`  📊 Analytics views refreshed`);
    
  } catch (error) {
    console.error('❌ Error generating test data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = {
  main,
  createTenant,
  createUser,
  createExercises,
  generateWorkoutSession,
  generateWorkoutsForUser
};