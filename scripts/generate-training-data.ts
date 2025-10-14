#!/usr/bin/env ts-node
/**
 * Training Data Generator Script
 * 
 * Generates realistic training session data based on Lars' typical training week.
 * Creates historical data with randomized training loads, RPE values, and performance metrics.
 * 
 * Usage:
 *   npm run generate-training-data
 *   or
 *   ts-node scripts/generate-training-data.ts
 */

import { Pool } from 'pg';
import * as readline from 'readline';

// Database connection (defaults configured for Docker containers)
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'rythm',
  user: process.env.DB_USER || 'rythm_api',
  password: process.env.DB_PASSWORD || 'password',
});

// Readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper to prompt user
const question = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

// Random number generator helpers
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomFloat = (min: number, max: number, decimals: number = 1): number => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
};

const randomBool = (probability: number = 0.5): boolean => {
  return Math.random() < probability;
};

// Training week template based on Lars' routine
interface ExerciseSet {
  exerciseName: string;
  sets: number;
  reps: number | string; // Can be "5" or "8-10" range
  value1Type?: 'weight_kg' | 'distance_m' | 'duration_m' | 'calories';
  value1Range?: [number, number]; // Min, Max
  value2Type?: 'weight_kg' | 'distance_m' | 'duration_m' | 'calories';
  value2Range?: [number, number];
  rpeRange?: [number, number];
  category: 'strength' | 'cardio' | 'hybrid';
}

interface WorkoutDay {
  dayName: string;
  sessionName: string;
  category: 'strength' | 'cardio' | 'hybrid';
  exercises: ExerciseSet[];
  trainingLoadRange: [number, number];
  perceivedExertionRange: [number, number];
  durationRange: [number, number]; // in minutes
  skipProbability?: number; // Probability of skipping this workout (0-1)
}

// Define Lars' training week
const TRAINING_WEEK: WorkoutDay[] = [
  {
    dayName: 'Monday',
    sessionName: 'Leg Day',
    category: 'strength',
    trainingLoadRange: [100, 155],
    perceivedExertionRange: [7.0, 9.5],
    durationRange: [90, 120],
    skipProbability: 0.05,
    exercises: [
      { exerciseName: 'Rowing', sets: 1, reps: '240', category: 'cardio', value1Type: 'duration_m', value1Range: [4, 4], value2Type: 'distance_m', value2Range: [800, 1000] },
      { exerciseName: 'Ski Erg', sets: 1, reps: '240', category: 'cardio', value1Type: 'duration_m', value1Range: [4, 4], value2Type: 'distance_m', value2Range: [800, 1000] },
      { exerciseName: 'Box Jump', sets: 3, reps: '5', category: 'strength', rpeRange: [6, 8] },
      { exerciseName: 'Back Squat', sets: 5, reps: '5', category: 'strength', value1Type: 'weight_kg', value1Range: [100, 140], rpeRange: [7.5, 9.5] },
      { exerciseName: 'Deadlift', sets: 4, reps: '6', category: 'strength', value1Type: 'weight_kg', value1Range: [120, 160], rpeRange: [7.5, 9.5] },
      { exerciseName: 'Bulgarian Split Squat', sets: 3, reps: '10', category: 'strength', value1Type: 'weight_kg', value1Range: [20, 35], rpeRange: [7, 8.5] },
      { exerciseName: 'Leg Extension', sets: 3, reps: '10', category: 'strength', value1Type: 'weight_kg', value1Range: [40, 60], rpeRange: [6.5, 8] },
      { exerciseName: 'Leg Curl', sets: 3, reps: '10', category: 'strength', value1Type: 'weight_kg', value1Range: [30, 50], rpeRange: [6.5, 8] },
      { exerciseName: 'Strict Toes to Bar', sets: 3, reps: '10', category: 'strength', rpeRange: [7, 9] },
      { exerciseName: 'Sled Push', sets: 4, reps: '20', category: 'strength', value1Type: 'weight_kg', value1Range: [60, 100], value2Type: 'distance_m', value2Range: [20, 20], rpeRange: [8, 9.5] },
      { exerciseName: 'Sled Pull', sets: 4, reps: '30', category: 'strength', value1Type: 'weight_kg', value1Range: [40, 80], value2Type: 'distance_m', value2Range: [30, 30], rpeRange: [7.5, 9] },
    ],
  },
  {
    dayName: 'Tuesday',
    sessionName: 'Easy Run - Zone 2',
    category: 'cardio',
    trainingLoadRange: [35, 65],
    perceivedExertionRange: [5.0, 6.5],
    durationRange: [35, 45],
    skipProbability: 0.1,
    exercises: [
      { exerciseName: 'Running', sets: 1, reps: '1', category: 'cardio', value1Type: 'distance_m', value1Range: [6500, 7500], value2Type: 'duration_m', value2Range: [35, 45], rpeRange: [5, 6.5] },
    ],
  },
  {
    dayName: 'Wednesday',
    sessionName: 'Push Day',
    category: 'strength',
    trainingLoadRange: [90, 145],
    perceivedExertionRange: [7.0, 9.0],
    durationRange: [90, 120],
    skipProbability: 0.05,
    exercises: [
      { exerciseName: 'Ski Erg', sets: 1, reps: '240', category: 'cardio', value1Type: 'duration_m', value1Range: [4, 4], value2Type: 'distance_m', value2Range: [800, 1000] },
      { exerciseName: 'Rowing', sets: 1, reps: '240', category: 'cardio', value1Type: 'duration_m', value1Range: [4, 4], value2Type: 'distance_m', value2Range: [800, 1000] },
      { exerciseName: 'Medicine Ball Chest Pass', sets: 3, reps: '5', category: 'strength', rpeRange: [5, 7] },
      { exerciseName: 'Banded Y-T-W', sets: 3, reps: '10', category: 'strength', rpeRange: [5, 7] },
      { exerciseName: 'Incline Dumbbell Press', sets: 3, reps: '10', category: 'strength', value1Type: 'weight_kg', value1Range: [25, 40], rpeRange: [7, 8.5] },
      { exerciseName: 'Bench Press', sets: 4, reps: '6', category: 'strength', value1Type: 'weight_kg', value1Range: [80, 110], rpeRange: [7.5, 9] },
      { exerciseName: 'Push-up', sets: 3, reps: '15', category: 'strength', rpeRange: [6, 8] },
      { exerciseName: 'Overhead Press', sets: 3, reps: '10', category: 'strength', value1Type: 'weight_kg', value1Range: [45, 65], rpeRange: [7, 8.5] },
      { exerciseName: 'Seated Trap Pull', sets: 3, reps: '10', category: 'strength', value1Type: 'weight_kg', value1Range: [30, 50], rpeRange: [6.5, 8] },
      { exerciseName: 'Landmine Press', sets: 3, reps: '10', category: 'strength', value1Type: 'weight_kg', value1Range: [20, 35], rpeRange: [6.5, 8] },
      { exerciseName: 'Leaning Flyes', sets: 3, reps: '10', category: 'strength', value1Type: 'weight_kg', value1Range: [8, 15], rpeRange: [6, 7.5] },
      { exerciseName: 'Cross Body Rear Delt Cable', sets: 3, reps: '10', category: 'strength', value1Type: 'weight_kg', value1Range: [5, 12], rpeRange: [6, 7.5] },
      { exerciseName: 'Cable Triceps Push', sets: 3, reps: '10', category: 'strength', value1Type: 'weight_kg', value1Range: [20, 35], rpeRange: [6.5, 8] },
      { exerciseName: 'Ski Erg', sets: 2, reps: '180', category: 'cardio', value1Type: 'duration_m', value1Range: [3, 3], value2Type: 'distance_m', value2Range: [600, 800] },
      { exerciseName: 'Wall Ball', sets: 2, reps: '20', category: 'strength', value1Type: 'weight_kg', value1Range: [9, 14], rpeRange: [7, 9] },
    ],
  },
  {
    dayName: 'Thursday',
    sessionName: 'Interval Run',
    category: 'cardio',
    trainingLoadRange: [80, 120],
    perceivedExertionRange: [7.5, 9.5],
    durationRange: [50, 65],
    skipProbability: 0.1,
    exercises: [
      { exerciseName: 'Running', sets: 1, reps: '1', category: 'cardio', value1Type: 'distance_m', value1Range: [1500, 2000], value2Type: 'duration_m', value2Range: [10, 12], rpeRange: [4, 5] }, // Warm-up
      { exerciseName: 'Running', sets: 4, reps: '1', category: 'cardio', value1Type: 'distance_m', value1Range: [800, 1000], value2Type: 'duration_m', value2Range: [4, 4.5], rpeRange: [8.5, 9.5] }, // Intervals
      { exerciseName: 'Running', sets: 1, reps: '1', category: 'cardio', value1Type: 'distance_m', value1Range: [1500, 2000], value2Type: 'duration_m', value2Range: [10, 12], rpeRange: [3, 4] }, // Cool-down
    ],
  },
  {
    dayName: 'Friday',
    sessionName: 'Pull Day',
    category: 'strength',
    trainingLoadRange: [85, 140],
    perceivedExertionRange: [7.0, 9.0],
    durationRange: [90, 120],
    skipProbability: 0.05,
    exercises: [
      { exerciseName: 'Ski Erg', sets: 1, reps: '240', category: 'cardio', value1Type: 'duration_m', value1Range: [4, 4], value2Type: 'distance_m', value2Range: [800, 1000] },
      { exerciseName: 'Rowing', sets: 1, reps: '240', category: 'cardio', value1Type: 'duration_m', value1Range: [4, 4], value2Type: 'distance_m', value2Range: [800, 1000] },
      { exerciseName: 'Banded Y-T-W', sets: 3, reps: '10', category: 'strength', rpeRange: [5, 7] },
      { exerciseName: 'Pull-up', sets: 5, reps: '5', category: 'strength', value1Type: 'weight_kg', value1Range: [0, 20], rpeRange: [7, 9] },
      { exerciseName: 'Lat Pulldown', sets: 3, reps: '10', category: 'strength', value1Type: 'weight_kg', value1Range: [50, 75], rpeRange: [6.5, 8] },
      { exerciseName: 'Lat Pulldown', sets: 3, reps: '10', category: 'strength', value1Type: 'weight_kg', value1Range: [55, 80], rpeRange: [6.5, 8] }, // Narrow grip
      { exerciseName: 'Seated Row', sets: 3, reps: '10', category: 'strength', value1Type: 'weight_kg', value1Range: [60, 85], rpeRange: [6.5, 8] },
      { exerciseName: 'Dumbbell Curl', sets: 3, reps: '10', category: 'strength', value1Type: 'weight_kg', value1Range: [12, 20], rpeRange: [6, 7.5] },
      { exerciseName: 'GHD Back Extension', sets: 3, reps: '15', category: 'strength', rpeRange: [6, 7.5] },
      { exerciseName: 'Pallof Press', sets: 3, reps: '15', category: 'strength', value1Type: 'weight_kg', value1Range: [10, 20], rpeRange: [6, 7.5] },
      { exerciseName: 'GHD Sit-up', sets: 3, reps: '15', category: 'strength', rpeRange: [6.5, 8] },
      { exerciseName: 'Farmer Carry', sets: 4, reps: '40', category: 'strength', value1Type: 'weight_kg', value1Range: [30, 50], value2Type: 'distance_m', value2Range: [40, 40], rpeRange: [7, 8.5] },
      { exerciseName: 'Burpee Broad Jump', sets: 4, reps: '1', category: 'strength', value1Type: 'duration_m', value1Range: [1, 1], rpeRange: [7.5, 9] },
    ],
  },
  {
    dayName: 'Saturday',
    sessionName: 'Long Run - Zone 2',
    category: 'cardio',
    trainingLoadRange: [50, 85],
    perceivedExertionRange: [5.5, 7.0],
    durationRange: [50, 65],
    skipProbability: 0.1,
    exercises: [
      { exerciseName: 'Running', sets: 1, reps: '1', category: 'cardio', value1Type: 'distance_m', value1Range: [9500, 10500], value2Type: 'duration_m', value2Range: [50, 65], rpeRange: [5.5, 7] },
    ],
  },
  {
    dayName: 'Sunday',
    sessionName: 'Rest Day',
    category: 'cardio',
    trainingLoadRange: [0, 0],
    perceivedExertionRange: [1.0, 1.0],
    durationRange: [0, 0],
    skipProbability: 0, // Never skip rest day (it's already rest)
    exercises: [],
  },
];

// Main generation function
async function generateTrainingData(
  userId: string,
  tenantId: string,
  weeksCount: number,
  includeVariance: boolean = true,
  skipProbability: number = 0.08,
  progressionRate: number = 0.02
) {
  console.log('\n🏋️  Starting training data generation...\n');
  console.log(`Parameters:
  - User ID: ${userId}
  - Tenant ID: ${tenantId}
  - Weeks to generate: ${weeksCount}
  - Include variance: ${includeVariance}
  - Skip probability: ${skipProbability * 100}%
  - Progression rate: ${progressionRate * 100}% per week
  `);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify user exists
    const userCheck = await client.query(
      'SELECT user_id, tenant_id FROM users WHERE user_id = $1 AND tenant_id = $2',
      [userId, tenantId]
    );

    if (userCheck.rows.length === 0) {
      throw new Error(`User ${userId} not found in tenant ${tenantId}`);
    }

    console.log('✅ User verified\n');

    let totalSessions = 0;
    let totalExercises = 0;
    let totalSets = 0;
    let skippedWorkouts = 0;

    // Start from today and go backwards
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate data for each week
    for (let week = 0; week < weeksCount; week++) {
      console.log(`📅 Generating week ${week + 1}/${weeksCount}...`);

      // Calculate progression multiplier (earlier weeks have lower weights)
      const weekProgress = 1 - (week / weeksCount) * progressionRate * weeksCount;

      // Generate each day of the week
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const workoutDay = TRAINING_WEEK[dayOfWeek];
        
        // Calculate the date for this workout
        const workoutDate = new Date(today);
        workoutDate.setDate(today.getDate() - (week * 7 + (6 - dayOfWeek)));

        // Skip rest days
        if (workoutDay.exercises.length === 0) {
          continue;
        }

        // Random skip based on probability
        const shouldSkip = includeVariance && randomBool(skipProbability + (workoutDay.skipProbability || 0));
        if (shouldSkip) {
          skippedWorkouts++;
          console.log(`  ⏭️  Skipped ${workoutDay.dayName} - ${workoutDay.sessionName}`);
          continue;
        }

        // Generate session
        const trainingLoad = includeVariance
          ? randomInt(
              Math.round(workoutDay.trainingLoadRange[0] * weekProgress),
              Math.round(workoutDay.trainingLoadRange[1] * weekProgress)
            )
          : Math.round((workoutDay.trainingLoadRange[0] + workoutDay.trainingLoadRange[1]) / 2 * weekProgress);

        const perceivedExertion = includeVariance
          ? randomFloat(workoutDay.perceivedExertionRange[0], workoutDay.perceivedExertionRange[1])
          : (workoutDay.perceivedExertionRange[0] + workoutDay.perceivedExertionRange[1]) / 2;

        const durationMinutes = includeVariance
          ? randomInt(workoutDay.durationRange[0], workoutDay.durationRange[1])
          : (workoutDay.durationRange[0] + workoutDay.durationRange[1]) / 2;

        // Set workout time (morning for strength, evening for cardio)
        if (workoutDay.category === 'strength') {
          workoutDate.setHours(randomInt(6, 10), randomInt(0, 59), 0, 0);
        } else {
          workoutDate.setHours(randomInt(16, 19), randomInt(0, 59), 0, 0);
        }

        const completedAt = new Date(workoutDate);
        completedAt.setMinutes(completedAt.getMinutes() + durationMinutes);

        // Insert session
        const sessionResult = await client.query(
          `INSERT INTO sessions (
            tenant_id, user_id, started_at, completed_at, category, 
            name, training_load, perceived_exertion, duration_seconds
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING session_id`,
          [
            tenantId,
            userId,
            workoutDate,
            completedAt,
            workoutDay.category,
            workoutDay.sessionName,
            trainingLoad,
            perceivedExertion,
            durationMinutes * 60,
          ]
        );

        const sessionId = sessionResult.rows[0].session_id;
        totalSessions++;

        console.log(`  ✅ ${workoutDay.dayName} - ${workoutDay.sessionName} (Load: ${trainingLoad}, RPE: ${perceivedExertion})`);

        // Generate exercises and sets for this session
        for (const exercise of workoutDay.exercises) {
          // Find or create exercise
          let exerciseId: string;
          
          const exerciseCheck = await client.query(
            'SELECT exercise_id FROM exercises WHERE name = $1',
            [exercise.exerciseName]
          );

          if (exerciseCheck.rows.length > 0) {
            exerciseId = exerciseCheck.rows[0].exercise_id;
          } else {
            // Create exercise from template if it doesn't exist
            // Map category to exercise_type enum: 'strength'/'cardio' -> 'STRENGTH'/'CARDIO'
            const exerciseType = exercise.category === 'strength' ? 'STRENGTH' : 'CARDIO';
            const exerciseInsert = await client.query(
              `INSERT INTO exercises (
                name, exercise_category, exercise_type, 
                muscle_groups, default_value_1_type, default_value_2_type
              ) 
              VALUES ($1, $2, $3, ARRAY['full_body'], $4, $5)
              RETURNING exercise_id`,
              [
                exercise.exerciseName,
                exercise.category,
                exerciseType,
                exercise.value1Type || null,
                exercise.value2Type || null,
              ]
            );
            exerciseId = exerciseInsert.rows[0].exercise_id;
          }

          totalExercises++;

          // Generate sets for this exercise
          const numSets = exercise.sets;
          const baseReps = typeof exercise.reps === 'string' && exercise.reps.includes('-')
            ? parseInt(exercise.reps.split('-')[0])
            : typeof exercise.reps === 'string' ? parseInt(exercise.reps) : exercise.reps;

          for (let setIndex = 1; setIndex <= numSets; setIndex++) {
            // Calculate reps with variation
            let reps = baseReps;
            if (typeof exercise.reps === 'string' && exercise.reps.includes('-')) {
              const [min, max] = exercise.reps.split('-').map(Number);
              reps = includeVariance ? randomInt(min, max) : Math.round((min + max) / 2);
            }

            // Calculate values with progression
            let value1: number | null = null;
            if (exercise.value1Range) {
              const [min, max] = exercise.value1Range;
              value1 = includeVariance
                ? randomFloat(min * weekProgress, max * weekProgress, 2)
                : (min + max) / 2 * weekProgress;
            }

            let value2: number | null = null;
            if (exercise.value2Range) {
              const [min, max] = exercise.value2Range;
              value2 = includeVariance
                ? randomFloat(min * weekProgress, max * weekProgress, 2)
                : (min + max) / 2 * weekProgress;
            }

            // Calculate RPE with fatigue (later sets slightly harder)
            let rpe: number | null = null;
            if (exercise.rpeRange) {
              const [min, max] = exercise.rpeRange;
              const fatigueFactor = setIndex / numSets * 0.5; // Up to +0.5 RPE for last set
              rpe = includeVariance
                ? Math.min(10, randomFloat(min, max) + fatigueFactor)
                : Math.min(10, (min + max) / 2 + fatigueFactor);
            }

            // Insert set
            await client.query(
              `INSERT INTO sets (
                tenant_id, session_id, exercise_id, set_index, reps,
                value_1_type, value_1_numeric, value_2_type, value_2_numeric, rpe
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
              [
                tenantId,
                sessionId,
                exerciseId,
                setIndex,
                reps,
                exercise.value1Type || null,
                value1,
                exercise.value2Type || null,
                value2,
                rpe,
              ]
            );

            totalSets++;
          }
        }
      }
    }

    await client.query('COMMIT');

    console.log('\n✅ Training data generation complete!\n');
    console.log(`📊 Statistics:
  - Total sessions created: ${totalSessions}
  - Total unique exercises: ${totalExercises}
  - Total sets logged: ${totalSets}
  - Workouts skipped: ${skippedWorkouts}
  - Date range: ${new Date(today.getTime() - weeksCount * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()} to ${today.toLocaleDateString()}
    `);

    return {
      sessions: totalSessions,
      exercises: totalExercises,
      sets: totalSets,
      skipped: skippedWorkouts,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error generating training data:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Interactive CLI
async function main() {
  try {
    console.log('🏋️  RYTHM Training Data Generator\n');
    console.log('This script generates realistic training session data based on Lars\' training week.\n');

    // Get user email
    const userEmail = await question('Enter user email: ');
    
    // Look up user
    const userResult = await pool.query(
      'SELECT user_id, tenant_id, first_name, last_name FROM users WHERE email = $1',
      [userEmail]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User not found with that email.');
      rl.close();
      return;
    }

    const user = userResult.rows[0];
    console.log(`✅ Found user: ${user.first_name} ${user.last_name} (${user.user_id})\n`);

    // Get number of weeks
    const weeksInput = await question('How many weeks of history to generate? (default: 12): ');
    const weeksCount = parseInt(weeksInput) || 12;

    // Get variance option
    const varianceInput = await question('Include random variance in loads/reps? (y/n, default: y): ');
    const includeVariance = varianceInput.toLowerCase() !== 'n';

    // Get skip probability
    const skipInput = await question('Probability of skipping workouts? (0-1, default: 0.08): ');
    const skipProbability = parseFloat(skipInput) || 0.08;

    // Get progression rate
    const progressionInput = await question('Weekly progression rate? (0-1, default: 0.02 = 2% per week): ');
    const progressionRate = parseFloat(progressionInput) || 0.02;

    // Confirm
    console.log('\n📋 Configuration:');
    console.log(`  User: ${user.first_name} ${user.last_name} (${userEmail})`);
    console.log(`  Weeks: ${weeksCount}`);
    console.log(`  Include variance: ${includeVariance ? 'Yes' : 'No'}`);
    console.log(`  Skip probability: ${(skipProbability * 100).toFixed(1)}%`);
    console.log(`  Progression rate: ${(progressionRate * 100).toFixed(1)}% per week`);
    console.log(`  Estimated sessions: ~${Math.round(weeksCount * 6 * (1 - skipProbability))}`);
    console.log(`  Estimated sets: ~${Math.round(weeksCount * 6 * 30 * (1 - skipProbability))}\n`);

    const confirm = await question('Generate this data? (y/n): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('❌ Cancelled');
      rl.close();
      return;
    }

    // Generate data
    await generateTrainingData(
      user.user_id,
      user.tenant_id,
      weeksCount,
      includeVariance,
      skipProbability,
      progressionRate
    );

    rl.close();
  } catch (error) {
    console.error('❌ Error:', error);
    rl.close();
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
main();
