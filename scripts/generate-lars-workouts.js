#!/usr/bin/env node

const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: 'rythm_api',
  host: 'localhost',
  database: 'rythm',
  password: 'password',
  port: 5432,
});

// User and tenant info
const USER_EMAIL = 'lars-olof@allerhed.com';
const USER_ID = '64943272-e4ea-4e0d-a76f-766c98495825';
const TENANT_ID = '68fc007f-de35-42c6-a399-72ab4870dd50';

// Workout templates and notes
const WORKOUT_NOTES = [
  "Great session today, felt strong and focused throughout",
  "Challenging workout but pushed through - feeling accomplished",
  "Solid training day, maintained good form on all exercises", 
  "High energy session, really felt the burn on the final sets",
  "Tough workout but great progress on personal records",
  "Focused on technique today, quality over quantity",
  "Intense training session, definitely earned the rest day",
  "Consistent effort throughout, building strength steadily",
  "Cardio was challenging but felt great afterwards",
  "Mixed strength and cardio session - perfect balance",
  "Really pushed the limits today, feeling strong",
  "Steady progress, adding more weight gradually",
  "Endurance workout - went the distance today",
  "Power session focused on explosive movements",
  "Recovery-focused training with lighter loads",
  "High-intensity interval session - heart rate maxed",
  "Strength building day with compound movements",
  "Full body workout hitting all major muscle groups",
  "Lower body focused session - legs are burning",
  "Upper body power day - arms and shoulders targeted"
];

const WORKOUT_CATEGORIES = ['strength', 'cardio', 'hybrid'];

// Helper functions
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDateInPast6Months() {
  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 6);
  
  const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
  return new Date(randomTime);
}

function generateRandomSets(exercise, numSets) {
  const sets = [];
  const { exercise_category, default_value_1_type, default_value_2_type } = exercise;
  
  for (let i = 1; i <= numSets; i++) {
    let value_1_type = default_value_1_type;
    let value_2_type = default_value_2_type;
    let value_1_numeric = 0;
    let value_2_numeric = 0;
    
    if (exercise_category === 'strength') {
      // Strength exercises
      if (exercise.name.includes('Deadlift') || exercise.name.includes('Squat')) {
        // Heavy compound movements
        value_1_type = 'weight_kg';
        value_2_type = 'reps';
        value_1_numeric = randomFloat(60, 200);
        value_2_numeric = randomInt(3, 8);
      } else if (exercise.name.includes('Press') || exercise.name.includes('Bench')) {
        // Upper body pressing
        value_1_type = 'weight_kg';
        value_2_type = 'reps';
        value_1_numeric = randomFloat(40, 120);
        value_2_numeric = randomInt(5, 12);
      } else if (exercise.name.includes('Pull') || exercise.name.includes('Row')) {
        // Pulling movements
        value_1_type = 'weight_kg';
        value_2_type = 'reps';
        value_1_numeric = randomFloat(30, 100);
        value_2_numeric = randomInt(6, 15);
      } else if (exercise.name.includes('Curl') || exercise.name.includes('Extension')) {
        // Isolation exercises
        value_1_type = 'weight_kg';
        value_2_type = 'reps';
        value_1_numeric = randomFloat(10, 40);
        value_2_numeric = randomInt(8, 20);
      } else {
        // General strength
        value_1_type = 'weight_kg';
        value_2_type = 'reps';
        value_1_numeric = randomFloat(20, 80);
        value_2_numeric = randomInt(5, 15);
      }
    } else if (exercise_category === 'cardio') {
      // Cardio exercises
      if (exercise.name.includes('Row')) {
        value_1_type = 'distance_m';
        value_2_type = 'duration_m';
        value_1_numeric = randomInt(250, 2000);
        value_2_numeric = randomInt(1, 8); // Convert seconds to minutes
      } else if (exercise.name.includes('Bike') || exercise.name.includes('Echo')) {
        value_1_type = 'calories';
        value_2_type = 'duration_m';
        value_1_numeric = randomInt(15, 50);
        value_2_numeric = randomInt(5, 30); // Convert seconds to minutes
      } else if (exercise.name.includes('Run')) {
        value_1_type = 'distance_m';
        value_2_type = 'duration_m';
        value_1_numeric = randomInt(400, 5000);
        value_2_numeric = randomInt(2, 30); // Convert seconds to minutes
      } else {
        // General cardio
        value_1_type = 'duration_m';
        value_2_type = null;
        value_1_numeric = randomInt(300, 1800);
        value_2_numeric = 0;
      }
    }
    
    sets.push({
      set_index: i,
      value_1_type,
      value_1_numeric,
      value_2_type,
      value_2_numeric,
      notes: Math.random() > 0.8 ? `Set ${i} - good form` : null
    });
  }
  
  return sets;
}

async function main() {
  const client = await pool.connect();
  
  try {
    console.log('🏋️  Starting workout generation for Lars-Olof...\n');
    
    // Get available exercises
    const exercisesResult = await client.query(`
      SELECT exercise_id, name, exercise_category, exercise_type, 
             default_value_1_type, default_value_2_type, muscle_groups
      FROM exercises 
      WHERE is_active = true
      ORDER BY name
    `);
    
    const allExercises = exercisesResult.rows;
    const strengthExercises = allExercises.filter(e => e.exercise_category === 'strength');
    const cardioExercises = allExercises.filter(e => e.exercise_category === 'cardio');
    
    console.log(`📊 Available exercises: ${allExercises.length} total (${strengthExercises.length} strength, ${cardioExercises.length} cardio)\n`);
    
    const generatedWorkouts = [];
    
    // Generate 100 workouts
    for (let workoutNum = 1; workoutNum <= 100; workoutNum++) {
      console.log(`💪 Generating workout ${workoutNum}/100...`);
      
      // Random workout parameters
      const workoutDate = getRandomDateInPast6Months();
      const workoutCategory = randomChoice(WORKOUT_CATEGORIES);
      const numExercises = randomInt(1, 3);
      const trainingLoad = randomInt(50, 450);
      const perceivedExertion = randomInt(4, 10);
      const durationMinutes = randomInt(20, 90);
      const durationSeconds = durationMinutes * 60;
      const workoutNote = randomChoice(WORKOUT_NOTES);
      
      // Determine workout name based on category
      let workoutName;
      if (workoutCategory === 'strength') {
        workoutName = `Strength Training ${workoutNum}`;
      } else if (workoutCategory === 'cardio') {
        workoutName = `Cardio Session ${workoutNum}`;
      } else {
        workoutName = `Hybrid Training ${workoutNum}`;
      }
      
      // Select exercises based on category
      let selectedExercises = [];
      if (workoutCategory === 'strength') {
        // All strength exercises
        for (let i = 0; i < numExercises; i++) {
          selectedExercises.push(randomChoice(strengthExercises));
        }
      } else if (workoutCategory === 'cardio') {
        // All cardio exercises
        for (let i = 0; i < numExercises; i++) {
          selectedExercises.push(randomChoice(cardioExercises));
        }
      } else {
        // Hybrid - combination of strength and cardio
        const numStrength = randomInt(1, numExercises);
        const numCardio = numExercises - numStrength;
        
        for (let i = 0; i < numStrength; i++) {
          selectedExercises.push(randomChoice(strengthExercises));
        }
        for (let i = 0; i < numCardio; i++) {
          selectedExercises.push(randomChoice(cardioExercises));
        }
      }
      
      // Remove duplicates and ensure we have unique exercises
      selectedExercises = selectedExercises.filter((exercise, index, self) => 
        index === self.findIndex(e => e.exercise_id === exercise.exercise_id)
      );
      
      // If we lost exercises due to duplicates, add more
      while (selectedExercises.length < numExercises) {
        const availablePool = workoutCategory === 'strength' ? strengthExercises : 
                            workoutCategory === 'cardio' ? cardioExercises : allExercises;
        const newExercise = randomChoice(availablePool);
        if (!selectedExercises.find(e => e.exercise_id === newExercise.exercise_id)) {
          selectedExercises.push(newExercise);
        }
      }
      
      await client.query('BEGIN');
      
      try {
        // Create session
        const sessionResult = await client.query(`
          INSERT INTO sessions (
            tenant_id, user_id, name, category, notes, training_load, 
            perceived_exertion, started_at, completed_at, duration_seconds
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING session_id
        `, [
          TENANT_ID,
          USER_ID,
          workoutName,
          workoutCategory,
          workoutNote,
          trainingLoad,
          perceivedExertion,
          workoutDate,
          new Date(workoutDate.getTime() + durationSeconds * 1000), // completed_at
          durationSeconds
        ]);
        
        const sessionId = sessionResult.rows[0].session_id;
        
        // Create sets for each exercise
        for (const exercise of selectedExercises) {
          const numSets = randomInt(2, 5);
          const sets = generateRandomSets(exercise, numSets);
          
          for (const set of sets) {
            await client.query(`
              INSERT INTO sets (
                tenant_id, session_id, exercise_id, set_index,
                value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
              TENANT_ID,
              sessionId,
              exercise.exercise_id,
              set.set_index,
              set.value_1_type,
              set.value_1_numeric,
              set.value_2_type,
              set.value_2_numeric,
              set.notes
            ]);
          }
        }
        
        await client.query('COMMIT');
        
        generatedWorkouts.push({
          session_id: sessionId,
          name: workoutName,
          date: workoutDate.toISOString().split('T')[0],
          category: workoutCategory,
          exercises: selectedExercises.length,
          training_load: trainingLoad,
          duration_minutes: durationMinutes
        });
        
        // Progress indicator
        if (workoutNum % 10 === 0) {
          console.log(`✅ Completed ${workoutNum} workouts`);
        }
        
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Error creating workout ${workoutNum}:`, error.message);
        throw error;
      }
    }
    
    console.log('\n🎉 Workout generation completed successfully!\n');
    
    // Summary statistics
    const totalWorkouts = generatedWorkouts.length;
    const strengthWorkouts = generatedWorkouts.filter(w => w.category === 'strength').length;
    const cardioWorkouts = generatedWorkouts.filter(w => w.category === 'cardio').length;
    const hybridWorkouts = generatedWorkouts.filter(w => w.category === 'hybrid').length;
    const avgTrainingLoad = Math.round(generatedWorkouts.reduce((sum, w) => sum + w.training_load, 0) / totalWorkouts);
    const avgDuration = Math.round(generatedWorkouts.reduce((sum, w) => sum + w.duration_minutes, 0) / totalWorkouts);
    
    console.log('📈 Generation Summary:');
    console.log(`   Total Workouts: ${totalWorkouts}`);
    console.log(`   Strength: ${strengthWorkouts} (${Math.round(strengthWorkouts/totalWorkouts*100)}%)`);
    console.log(`   Cardio: ${cardioWorkouts} (${Math.round(cardioWorkouts/totalWorkouts*100)}%)`);
    console.log(`   Hybrid: ${hybridWorkouts} (${Math.round(hybridWorkouts/totalWorkouts*100)}%)`);
    console.log(`   Average Training Load: ${avgTrainingLoad}`);
    console.log(`   Average Duration: ${avgDuration} minutes`);
    console.log(`   Date Range: ${generatedWorkouts[0]?.date} to ${generatedWorkouts[generatedWorkouts.length-1]?.date}`);
    
    // Verify data in database
    const verificationResult = await client.query(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(DISTINCT DATE(started_at)) as unique_days,
        AVG(training_load)::integer as avg_load,
        AVG(duration_seconds/60)::integer as avg_duration_min
      FROM sessions 
      WHERE user_id = $1 AND started_at >= NOW() - INTERVAL '6 months'
    `, [USER_ID]);
    
    const verification = verificationResult.rows[0];
    console.log('\n✅ Database Verification:');
    console.log(`   Sessions in DB: ${verification.total_sessions}`);
    console.log(`   Unique training days: ${verification.unique_days}`);
    console.log(`   DB Average load: ${verification.avg_load}`);
    console.log(`   DB Average duration: ${verification.avg_duration_min} min`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
main().catch(console.error);