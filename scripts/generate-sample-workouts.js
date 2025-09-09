#!/usr/bin/env node

const { Pool } = require('pg')
const bcrypt = require('bcrypt')

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'rythm',
  user: process.env.DB_USER || 'rythm_user',
  password: process.env.DB_PASSWORD || 'rythm_password'
})

// Sample data arrays
const strengthExercises = [
  { name: 'Barbell Squat', muscle_groups: ['quadriceps', 'glutes', 'hamstrings'], equipment: 'barbell' },
  { name: 'Deadlift', muscle_groups: ['hamstrings', 'glutes', 'lower_back'], equipment: 'barbell' },
  { name: 'Bench Press', muscle_groups: ['chest', 'triceps', 'shoulders'], equipment: 'barbell' },
  { name: 'Pull-ups', muscle_groups: ['lats', 'biceps', 'rhomboids'], equipment: 'bodyweight' },
  { name: 'Overhead Press', muscle_groups: ['shoulders', 'triceps', 'core'], equipment: 'barbell' },
  { name: 'Barbell Rows', muscle_groups: ['lats', 'rhomboids', 'biceps'], equipment: 'barbell' },
  { name: 'Dumbbell Lunges', muscle_groups: ['quadriceps', 'glutes', 'hamstrings'], equipment: 'dumbbells' },
  { name: 'Dips', muscle_groups: ['triceps', 'chest', 'shoulders'], equipment: 'bodyweight' },
  { name: 'Bulgarian Split Squat', muscle_groups: ['quadriceps', 'glutes'], equipment: 'dumbbells' },
  { name: 'Romanian Deadlift', muscle_groups: ['hamstrings', 'glutes'], equipment: 'barbell' },
  { name: 'Incline Dumbbell Press', muscle_groups: ['chest', 'shoulders', 'triceps'], equipment: 'dumbbells' },
  { name: 'Lat Pulldown', muscle_groups: ['lats', 'biceps'], equipment: 'cable_machine' },
  { name: 'Leg Press', muscle_groups: ['quadriceps', 'glutes'], equipment: 'machine' },
  { name: 'Leg Curls', muscle_groups: ['hamstrings'], equipment: 'machine' },
  { name: 'Calf Raises', muscle_groups: ['calves'], equipment: 'machine' },
  { name: 'Face Pulls', muscle_groups: ['rear_delts', 'rhomboids'], equipment: 'cable_machine' },
  { name: 'Tricep Dips', muscle_groups: ['triceps'], equipment: 'bodyweight' },
  { name: 'Hammer Curls', muscle_groups: ['biceps', 'forearms'], equipment: 'dumbbells' },
  { name: 'Plank', muscle_groups: ['core', 'abs'], equipment: 'bodyweight' },
  { name: 'Russian Twists', muscle_groups: ['core', 'obliques'], equipment: 'bodyweight' }
]

const cardioExercises = [
  { name: 'Treadmill Running', muscle_groups: ['legs', 'cardiovascular'], equipment: 'treadmill' },
  { name: 'Cycling', muscle_groups: ['quadriceps', 'cardiovascular'], equipment: 'bike' },
  { name: 'Rowing Machine', muscle_groups: ['full_body', 'cardiovascular'], equipment: 'rowing_machine' },
  { name: 'Elliptical', muscle_groups: ['full_body', 'cardiovascular'], equipment: 'elliptical' },
  { name: 'Swimming', muscle_groups: ['full_body', 'cardiovascular'], equipment: 'pool' },
  { name: 'Stair Climber', muscle_groups: ['legs', 'glutes', 'cardiovascular'], equipment: 'machine' },
  { name: 'Jump Rope', muscle_groups: ['legs', 'cardiovascular'], equipment: 'rope' },
  { name: 'Burpees', muscle_groups: ['full_body', 'cardiovascular'], equipment: 'bodyweight' },
  { name: 'Mountain Climbers', muscle_groups: ['core', 'cardiovascular'], equipment: 'bodyweight' },
  { name: 'High Knees', muscle_groups: ['legs', 'cardiovascular'], equipment: 'bodyweight' }
]

const workoutNames = [
  // Strength names
  'Push Day', 'Pull Day', 'Leg Day', 'Upper Body', 'Lower Body', 
  'Chest & Triceps', 'Back & Biceps', 'Shoulders & Arms', 'Full Body Strength',
  'Power Training', 'Heavy Lifting', 'Compound Movements', 'Isolation Work',
  // Cardio names
  'Morning Cardio', 'HIIT Session', 'Steady State', 'Endurance Training',
  'Fat Burn', 'Recovery Cardio', 'Sprint Intervals', 'Long Run',
  // Hybrid names
  'Circuit Training', 'Functional Fitness', 'CrossFit Style', 'Athletic Training',
  'Metabolic Conditioning', 'Strength & Cardio', 'Total Body Workout',
  // General names
  'Morning Workout', 'Evening Session', 'Quick Training', 'Power Hour',
  'Beast Mode', 'Grind Session', 'Pump Day', 'Sweat Session'
]

const workoutNotes = [
  'Felt great today, really pushed hard on the heavy sets',
  'Good session, focused on form over weight',
  'Tired but managed to complete all sets',
  'PR on bench press today! 💪',
  'Quick workout due to time constraints',
  'Excellent mind-muscle connection',
  'Struggled with the last few reps but pushed through',
  'Perfect warm-up made all the difference',
  'Really focused on controlled negatives',
  'Great pump, feeling strong',
  'Supersetted everything for time efficiency',
  'Deload week - lighter weights, perfect form',
  'Back to full intensity after rest day',
  'Tried new exercise variations today',
  'Cardio felt easier than usual',
  'Hit all my target heart rate zones',
  'Perfect weather for outdoor cardio',
  'New personal best on distance',
  'Recovery session - kept it light',
  'Feeling energized after this workout'
]

// Utility functions
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min, max, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)]
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function generateWorkoutDate(index, totalWorkouts) {
  const now = new Date()
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(now.getMonth() - 6)
  
  // Yesterday
  const yesterday = new Date()
  yesterday.setDate(now.getDate() - 1)
  
  return randomDate(sixMonthsAgo, yesterday)
}

async function main() {
  const client = await pool.connect()
  
  try {
    console.log('🏋️  Starting workout data generation...')
    
    // Find or create user
    console.log('👤 Finding user lars-olof@allerhed.com...')
    
    let userResult = await client.query(
      'SELECT user_id, tenant_id FROM users WHERE email = $1',
      ['lars-olof@allerhed.com']
    )
    
    let userId, tenantId
    
    if (userResult.rows.length === 0) {
      console.log('👤 User not found, creating user and tenant...')
      
      // Create tenant first
      const tenantResult = await client.query(
        `INSERT INTO tenants (name, branding) 
         VALUES ($1, $2) 
         RETURNING tenant_id`,
        ['RYTHM Fitness', '{"theme": "default"}']
      )
      tenantId = tenantResult.rows[0].tenant_id
      
      // Hash password
      const passwordHash = await bcrypt.hash('password123', 10)
      
      // Create user
      const newUserResult = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, role, first_name, last_name) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING user_id`,
        [tenantId, 'lars-olof@allerhed.com', passwordHash, 'tenant_admin', 'Lars-Olof', 'Allerhed']
      )
      userId = newUserResult.rows[0].user_id
      
      console.log(`✅ Created user: ${userId} in tenant: ${tenantId}`)
    } else {
      userId = userResult.rows[0].user_id
      tenantId = userResult.rows[0].tenant_id
      console.log(`✅ Found existing user: ${userId} in tenant: ${tenantId}`)
    }
    
    // Create exercises if they don't exist
    console.log('🏃 Creating exercises...')
    const allExercises = [...strengthExercises, ...cardioExercises]
    const createdExercises = []
    
    for (const exercise of allExercises) {
      const existingExercise = await client.query(
        'SELECT exercise_id FROM exercises WHERE tenant_id = $1 AND name = $2',
        [tenantId, exercise.name]
      )
      
      if (existingExercise.rows.length === 0) {
        const result = await client.query(
          `INSERT INTO exercises (tenant_id, name, muscle_groups, equipment) 
           VALUES ($1, $2, $3, $4) 
           RETURNING exercise_id`,
          [tenantId, exercise.name, exercise.muscle_groups, exercise.equipment]
        )
        createdExercises.push({
          exercise_id: result.rows[0].exercise_id,
          ...exercise
        })
      } else {
        createdExercises.push({
          exercise_id: existingExercise.rows[0].exercise_id,
          ...exercise
        })
      }
    }
    
    console.log(`✅ ${createdExercises.length} exercises ready`)
    
    // Generate 60 workouts
    console.log('💪 Generating 60 random workouts...')
    
    for (let i = 0; i < 60; i++) {
      const workoutDate = generateWorkoutDate(i, 60)
      const category = randomChoice(['strength', 'cardio', 'hybrid'])
      const workoutName = randomChoice(workoutNames)
      const notes = Math.random() > 0.3 ? randomChoice(workoutNotes) : null // 70% chance of notes
      
      // Training metrics
      const trainingLoad = randomInt(10, 100)
      const perceivedExertion = randomFloat(3.0, 9.5, 1)
      const durationSeconds = randomInt(1800, 7200) // 30 minutes to 2 hours
      
      // Calculate completed time
      const completedAt = new Date(workoutDate.getTime() + durationSeconds * 1000)
      
      // Create session
      const sessionResult = await client.query(
        `INSERT INTO sessions (
          tenant_id, user_id, name, category, notes, training_load, 
          perceived_exertion, duration_seconds, started_at, completed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING session_id`,
        [
          tenantId, userId, workoutName, category, notes, 
          trainingLoad, perceivedExertion, durationSeconds, workoutDate, completedAt
        ]
      )
      
      const sessionId = sessionResult.rows[0].session_id
      
      // Select exercises based on category
      let availableExercises
      if (category === 'strength') {
        availableExercises = createdExercises.filter(e => strengthExercises.some(se => se.name === e.name))
      } else if (category === 'cardio') {
        availableExercises = createdExercises.filter(e => cardioExercises.some(ce => ce.name === e.name))
      } else { // hybrid
        availableExercises = createdExercises
      }
      
      // Generate 3-8 exercises per workout
      const numExercises = randomInt(3, 8)
      const selectedExercises = []
      
      for (let j = 0; j < numExercises; j++) {
        let exercise
        do {
          exercise = randomChoice(availableExercises)
        } while (selectedExercises.some(e => e.exercise_id === exercise.exercise_id))
        
        selectedExercises.push(exercise)
      }
      
      // Generate sets for each exercise
      for (const exercise of selectedExercises) {
        const numSets = randomInt(2, 6) // 2-6 sets per exercise
        
        for (let setIndex = 1; setIndex <= numSets; setIndex++) {
          let value1Type, value1Numeric, value2Type, value2Numeric
          
          // Determine set values based on exercise type
          if (cardioExercises.some(ce => ce.name === exercise.name)) {
            // Cardio exercise
            if (Math.random() > 0.5) {
              // Duration + Distance/Calories
              value1Type = 'duration_s'
              value1Numeric = randomInt(300, 3600) // 5 minutes to 1 hour
              value2Type = Math.random() > 0.5 ? 'distance_m' : 'calories'
              value2Numeric = value2Type === 'distance_m' ? randomInt(1000, 10000) : randomInt(100, 800)
            } else {
              // Just duration
              value1Type = 'duration_s'
              value1Numeric = randomInt(300, 3600)
              value2Type = null
              value2Numeric = null
            }
          } else {
            // Strength exercise
            value1Type = 'weight_kg'
            value1Numeric = randomFloat(20, 150, 1) // 20-150kg
            value2Type = 'reps'
            value2Numeric = randomInt(5, 20) // 5-20 reps
          }
          
          const setNotes = Math.random() > 0.8 ? randomChoice([
            'Easy', 'Hard', 'Perfect form', 'Struggled', 'Good tempo', 'Drop set', 'Rest-pause'
          ]) : null
          
          await client.query(
            `INSERT INTO sets (
              tenant_id, session_id, exercise_id, set_index,
              value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              tenantId, sessionId, exercise.exercise_id, setIndex,
              value1Type, value1Numeric, value2Type, value2Numeric, setNotes
            ]
          )
        }
      }
      
      if ((i + 1) % 10 === 0) {
        console.log(`✅ Generated ${i + 1}/60 workouts`)
      }
    }
    
    console.log('🎉 Successfully generated 60 random workouts!')
    console.log(`📊 Data summary:`)
    console.log(`   User: lars-olof@allerhed.com (${userId})`)
    console.log(`   Tenant: ${tenantId}`)
    console.log(`   Workouts: 60 (spread over last 6 months)`)
    console.log(`   Exercises: ${createdExercises.length}`)
    console.log(`   Categories: Strength, Cardio, Hybrid`)
    console.log(`   Training Load: 10-100`)
    console.log(`   Perceived Exertion: 3.0-9.5`)
    console.log(`   Duration: 30min-2hrs`)
    console.log(`   Sets per workout: 6-48 (2-6 sets × 3-8 exercises)`)
    
  } catch (error) {
    console.error('❌ Error generating workouts:', error)
    throw error
  } finally {
    client.release()
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('✨ Script completed successfully!')
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 Script failed:', error)
      process.exit(1)
    })
}

module.exports = { main }