const bcrypt = require('bcryptjs');
const { Client } = require('pg');

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'rythm',
  user: process.env.DB_USER || 'rythm_api',
  password: process.env.DB_PASSWORD || 'password'
};

// Helper function to generate UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to generate random date within a range
function randomDateBetween(start, end) {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
}

// Helper function to generate random integer between min and max (inclusive)
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to generate random decimal between min and max
function randomDecimal(min, max, decimals = 2) {
  const num = Math.random() * (max - min) + min;
  return parseFloat(num.toFixed(decimals));
}

async function populateTestData() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('🔌 Connected to database');

    // Verify exercise templates are loaded
    console.log('🏋️ Verifying exercise templates...');
    const exerciseCount = await client.query('SELECT COUNT(*) FROM exercise_templates');
    console.log(`Found ${exerciseCount.rows[0].count} exercise templates`);
    
    if (exerciseCount.rows[0].count < 98) {
      console.log('⚠️  Warning: Expected 98 exercise templates, but found fewer. Consider running exercise_templates_master.sql first.');
    }

    // Create system administrator
    console.log('👤 Creating system administrator...');
    const adminId = generateUUID();
    const adminTenantId = generateUUID();
    const hashedAdminPassword = await bcrypt.hash('Password123', 10);

    // Create admin tenant
    await client.query(`
      INSERT INTO tenants (tenant_id, name, created_at, updated_at)
      VALUES ($1, 'System Administration', NOW(), NOW())
      ON CONFLICT (tenant_id) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW()
    `, [adminTenantId]);

    // Create admin user
    await client.query(`
      INSERT INTO users (user_id, email, password_hash, first_name, last_name, role, tenant_id, created_at, updated_at)
      VALUES ($1, 'orchestrator@rythm.training', $2, 'System', 'Administrator', 'system_admin', $3, NOW(), NOW())
      ON CONFLICT (tenant_id, email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role,
        updated_at = NOW()
    `, [adminId, hashedAdminPassword, adminTenantId]);

    // Create test user tenant
    console.log('🏢 Creating test user tenant...');
    const userTenantId = generateUUID();
    await client.query(`
      INSERT INTO tenants (tenant_id, name, created_at, updated_at)
      VALUES ($1, 'Allerhed Organization', NOW(), NOW())
      ON CONFLICT (tenant_id) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW()
    `, [userTenantId]);

    // Create test user
    console.log('👤 Creating test user...');
    const userId = generateUUID();
    const hashedPassword = await bcrypt.hash('Password123', 10);

    await client.query(`
      INSERT INTO users (user_id, email, password_hash, first_name, last_name, role, tenant_id, created_at, updated_at)
      VALUES ($1, 'lars-olof@allerhed.com', $2, 'Lars-Olof', 'Allerhed', 'athlete', $3, NOW(), NOW())
      ON CONFLICT (tenant_id, email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role,
        updated_at = NOW()
    `, [userId, hashedPassword, userTenantId]);

    // Get existing exercise templates to use in workout templates
    console.log('🏋️ Fetching exercise templates...');
    const exerciseTemplatesResult = await client.query(`
      SELECT template_id, name, exercise_category FROM exercise_templates ORDER BY name
    `);
    const exerciseTemplates = exerciseTemplatesResult.rows;
    console.log(`Found ${exerciseTemplates.length} exercise templates`);

    // Create workout templates
    console.log('📋 Creating workout templates...');
    
    // Delete existing workout templates first to avoid conflicts
    await client.query(`DELETE FROM workout_templates WHERE scope = 'system' AND name IN ('Hybrid Strength Lower Body', 'Hybrid Strength Upper Body', 'Run', 'Echo Bike', 'Hyrox Simulation')`);
    
    // Template 1: Hybrid Strength Lower Body
    const template1Id = generateUUID();
    const template1Exercises = [
      { name: 'Row', reps: '', sets: 1, notes: '4 minutes', order: 0, category: 'cardio', exercise_id: null, muscle_groups: ['full-body'] },
      { name: 'Ski-erg', reps: '', sets: 1, notes: '4 minutes', order: 1, category: 'cardio', exercise_id: null, muscle_groups: ['full-body'] },
      { name: 'Box jump', reps: '5', sets: 3, notes: '', order: 2, category: 'strength', exercise_id: null, muscle_groups: ['legs'] },
      { name: 'Back squat', reps: '10', sets: 5, notes: '', order: 3, category: 'strength', exercise_id: null, muscle_groups: ['legs'] },
      { name: 'Deadlift', reps: '10', sets: 4, notes: '', order: 4, category: 'strength', exercise_id: null, muscle_groups: ['legs', 'back'] },
      { name: 'Bulgarian split squat', reps: '10', sets: 3, notes: '', order: 5, category: 'strength', exercise_id: null, muscle_groups: ['legs'] },
      { name: 'Leg Extensions', reps: '10', sets: 3, notes: '', order: 6, category: 'strength', exercise_id: null, muscle_groups: ['legs'] },
      { name: 'Leg Curl', reps: '10', sets: 3, notes: '', order: 7, category: 'strength', exercise_id: null, muscle_groups: ['legs'] },
      { name: 'GHD Back', reps: '15', sets: 3, notes: '', order: 8, category: 'strength', exercise_id: null, muscle_groups: ['back'] },
      { name: 'Pallof press', reps: '15', sets: 3, notes: '', order: 9, category: 'strength', exercise_id: null, muscle_groups: ['core'] },
      { name: 'GHD Situps', reps: '15', sets: 3, notes: '', order: 10, category: 'strength', exercise_id: null, muscle_groups: ['core'] },
      { name: 'Sled Push', reps: '', sets: 4, notes: '20 meters', order: 11, category: 'strength', exercise_id: null, muscle_groups: ['legs'] },
      { name: 'Sled Pull', reps: '', sets: 4, notes: '30 meters', order: 12, category: 'strength', exercise_id: null, muscle_groups: ['legs', 'back'] }
    ];

    await client.query(`
      INSERT INTO workout_templates (template_id, tenant_id, name, scope, exercises, created_at, updated_at)
      VALUES ($1, $2, 'Hybrid Strength Lower Body', 'system', $3, NOW(), NOW())
    `, [template1Id, adminTenantId, JSON.stringify(template1Exercises)]);

    // Template 2: Hybrid Strength Upper Body
    const template2Id = generateUUID();
    const template2Exercises = [
      { name: 'Ski-erg', reps: '', sets: 1, notes: '4 minutes', order: 0, category: 'cardio', exercise_id: null, muscle_groups: ['full-body'] },
      { name: 'Row', reps: '', sets: 1, notes: '4 minutes', order: 1, category: 'cardio', exercise_id: null, muscle_groups: ['full-body'] },
      { name: 'Med-ball chest pass (to wall)', reps: '5', sets: 3, notes: '', order: 2, category: 'strength', exercise_id: null, muscle_groups: ['chest'] },
      { name: '1000m Row', reps: '', sets: 1, notes: '', order: 3, category: 'cardio', exercise_id: null, muscle_groups: ['full-body'] },
      { name: 'Banded Y,T,W', reps: '10', sets: 3, notes: '', order: 4, category: 'strength', exercise_id: null, muscle_groups: ['shoulders'] },
      { name: 'Incline Dumbbell Press', reps: '15', sets: 3, notes: '', order: 5, category: 'strength', exercise_id: null, muscle_groups: ['chest'] },
      { name: 'Bench press', reps: '15', sets: 4, notes: '', order: 6, category: 'strength', exercise_id: null, muscle_groups: ['chest'] },
      { name: 'Push-ups', reps: '15', sets: 3, notes: '', order: 7, category: 'strength', exercise_id: null, muscle_groups: ['chest'] },
      { name: 'Standing overhead press', reps: '15', sets: 3, notes: '', order: 8, category: 'strength', exercise_id: null, muscle_groups: ['shoulders'] },
      { name: 'Seated Trap Pull', reps: '10', sets: 3, notes: '', order: 9, category: 'strength', exercise_id: null, muscle_groups: ['back'] },
      { name: 'Ring Rows', reps: '10', sets: 3, notes: '', order: 10, category: 'strength', exercise_id: null, muscle_groups: ['back'] },
      { name: 'Lat Pull Down Wide', reps: '10', sets: 3, notes: '', order: 11, category: 'strength', exercise_id: null, muscle_groups: ['back'] },
      { name: 'Lat Pull Down Narrow', reps: '10', sets: 3, notes: '', order: 12, category: 'strength', exercise_id: null, muscle_groups: ['back'] },
      { name: 'Seated row', reps: '10', sets: 3, notes: '', order: 13, category: 'strength', exercise_id: null, muscle_groups: ['back'] },
      { name: 'Dumbbell Biceps Curl', reps: '10', sets: 3, notes: '', order: 14, category: 'strength', exercise_id: null, muscle_groups: ['biceps'] },
      { name: 'Cable Triceps Push', reps: '10', sets: 3, notes: '', order: 15, category: 'strength', exercise_id: null, muscle_groups: ['triceps'] },
      { name: 'Farmers carry', reps: '', sets: 4, notes: '40 meters', order: 16, category: 'strength', exercise_id: null, muscle_groups: ['full-body'] },
      { name: 'Wall-balls', reps: '15', sets: 3, notes: '', order: 17, category: 'strength', exercise_id: null, muscle_groups: ['full-body'] }
    ];

    await client.query(`
      INSERT INTO workout_templates (template_id, tenant_id, name, scope, exercises, created_at, updated_at)
      VALUES ($1, $2, 'Hybrid Strength Upper Body', 'system', $3, NOW(), NOW())
    `, [template2Id, adminTenantId, JSON.stringify(template2Exercises)]);

    // Template 3: Run
    const template3Id = generateUUID();
    const template3Exercises = [
      { name: 'Run', reps: '', sets: 1, notes: '', order: 0, category: 'cardio', exercise_id: null, muscle_groups: ['legs'] }
    ];

    await client.query(`
      INSERT INTO workout_templates (template_id, tenant_id, name, scope, exercises, created_at, updated_at)
      VALUES ($1, $2, 'Run', 'system', $3, NOW(), NOW())
    `, [template3Id, adminTenantId, JSON.stringify(template3Exercises)]);

    // Template 4: Echo Bike
    const template4Id = generateUUID();
    const template4Exercises = [
      { name: 'Echobike', reps: '', sets: 1, notes: '', order: 0, category: 'cardio', exercise_id: null, muscle_groups: ['full-body'] }
    ];

    await client.query(`
      INSERT INTO workout_templates (template_id, tenant_id, name, scope, exercises, created_at, updated_at)
      VALUES ($1, $2, 'Echo Bike', 'system', $3, NOW(), NOW())
    `, [template4Id, adminTenantId, JSON.stringify(template4Exercises)]);

    // Template 5: Hyrox Simulation
    const template5Id = generateUUID();
    const template5Exercises = [
      { name: 'Run 200M', reps: '', sets: 1, notes: '', order: 0, category: 'cardio', exercise_id: null, muscle_groups: ['legs'] },
      { name: 'Skierg', reps: '', sets: 1, notes: '2 min', order: 1, category: 'cardio', exercise_id: null, muscle_groups: ['full-body'] },
      { name: 'Run 200M', reps: '', sets: 1, notes: '', order: 2, category: 'cardio', exercise_id: null, muscle_groups: ['legs'] },
      { name: 'Sled Push', reps: '', sets: 1, notes: '2min', order: 3, category: 'strength', exercise_id: null, muscle_groups: ['legs'] },
      { name: 'Run 200M', reps: '', sets: 1, notes: '', order: 4, category: 'cardio', exercise_id: null, muscle_groups: ['legs'] },
      { name: 'Sled Pull', reps: '', sets: 1, notes: '2 min', order: 5, category: 'strength', exercise_id: null, muscle_groups: ['legs', 'back'] },
      { name: 'Run 200M', reps: '', sets: 1, notes: '', order: 6, category: 'cardio', exercise_id: null, muscle_groups: ['legs'] },
      { name: 'Burpee Broadjumps', reps: '', sets: 1, notes: '2min', order: 7, category: 'strength', exercise_id: null, muscle_groups: ['full-body'] },
      { name: 'Run 200M', reps: '', sets: 1, notes: '', order: 8, category: 'cardio', exercise_id: null, muscle_groups: ['legs'] },
      { name: 'Rowing', reps: '', sets: 1, notes: '2 min', order: 9, category: 'cardio', exercise_id: null, muscle_groups: ['full-body'] },
      { name: 'Run 200M', reps: '', sets: 1, notes: '', order: 10, category: 'cardio', exercise_id: null, muscle_groups: ['legs'] },
      { name: 'Farmers Carry', reps: '', sets: 1, notes: '2 min', order: 11, category: 'strength', exercise_id: null, muscle_groups: ['full-body'] },
      { name: 'Run 200M', reps: '', sets: 1, notes: '', order: 12, category: 'cardio', exercise_id: null, muscle_groups: ['legs'] },
      { name: 'Sandbag Lunges', reps: '', sets: 1, notes: '', order: 13, category: 'strength', exercise_id: null, muscle_groups: ['legs'] },
      { name: 'Run 200M', reps: '', sets: 1, notes: '', order: 14, category: 'cardio', exercise_id: null, muscle_groups: ['legs'] },
      { name: 'Wallballs', reps: '', sets: 1, notes: '2 min', order: 15, category: 'strength', exercise_id: null, muscle_groups: ['full-body'] }
    ];

    await client.query(`
      INSERT INTO workout_templates (template_id, tenant_id, name, scope, exercises, created_at, updated_at)
      VALUES ($1, $2, 'Hyrox Simulation', 'system', $3, NOW(), NOW())
    `, [template5Id, adminTenantId, JSON.stringify(template5Exercises)]);

    // Generate 100 workouts for the test user
    console.log('🏋️‍♂️ Generating 100 workouts for test user...');
    
    const workoutTemplateIds = [template1Id, template2Id, template3Id, template4Id, template5Id];
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const today = new Date();

    // Get exercises from the exercises table instead of exercise_templates
    const exercisesResult = await client.query(`
      SELECT exercise_id, name, exercise_category FROM exercises ORDER BY name
    `);
    const exercises = exercisesResult.rows;
    console.log(`Found ${exercises.length} exercises`);

    // Helper function to find exercise by name
    function findExerciseByName(name) {
      const normalized = name.toLowerCase().trim();
      return exercises.find(ex => {
        const exName = ex.name.toLowerCase();
        return exName.includes(normalized) || normalized.includes(exName) || 
               exName.replace(/[^a-z0-9]/g, '') === normalized.replace(/[^a-z0-9]/g, '');
      });
    }

    let totalSetsGenerated = 0;

    for (let i = 0; i < 100; i++) {
      const sessionId = generateUUID();
      const randomTemplateId = workoutTemplateIds[Math.floor(Math.random() * workoutTemplateIds.length)];
      const sessionDate = randomDateBetween(sixMonthsAgo, today);
      
      // Get the template info
      const templateResult = await client.query(`
        SELECT * FROM workout_templates WHERE template_id = $1
      `, [randomTemplateId]);
      const template = templateResult.rows[0];
      
      const trainingLoad = randomInt(35, 145); // Random training load
      const perceivedExertion = randomDecimal(3, 9, 1); // Random RPE
      const durationSeconds = randomInt(30, 120) * 60; // 30-120 minutes in seconds

      // Determine category based on template name
      let category = 'strength';
      if (template.name.includes('Run') || template.name.includes('Echo Bike')) {
        category = 'cardio';
      } else if (template.name.includes('Hyrox')) {
        category = 'hybrid';
      }

      // Create session
      await client.query(`
        INSERT INTO sessions (session_id, user_id, category, started_at, completed_at, notes, training_load, perceived_exertion, tenant_id, duration_seconds, name, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      `, [
        sessionId,
        userId,
        category,
        sessionDate,
        new Date(sessionDate.getTime() + durationSeconds * 1000),
        `Workout ${i + 1} based on ${template.name}`,
        trainingLoad,
        perceivedExertion,
        userTenantId,
        durationSeconds,
        template.name
      ]);

      // Parse exercises from the template (already a JavaScript object from PostgreSQL)
      const templateExercises = template.exercises;

      // Generate sets for each exercise in the template
      for (const templateEx of templateExercises) {
        const exercise = findExerciseByName(templateEx.name);
        if (!exercise) {
          console.log(`⚠️  Exercise not found: ${templateEx.name}`);
          continue;
        }

        const setsToGenerate = parseInt(templateEx.sets) || 1;
        
        for (let setIndex = 0; setIndex < setsToGenerate; setIndex++) {
          const setId = generateUUID();
          
          let reps = null;
          let value1Type = null;
          let value1Numeric = null;
          let value2Type = null;
          let value2Numeric = null;
          let rpe = randomDecimal(6, 9, 1);

          // Generate appropriate values based on exercise type and template data
          if (templateEx.reps && templateEx.reps !== '') {
            const baseReps = parseInt(templateEx.reps);
            if (!isNaN(baseReps)) {
              reps = Math.max(1, baseReps + randomInt(-2, 3)); // Slight variation
            }
          }

          // Handle time-based exercises
          if (templateEx.notes && templateEx.notes.includes('min')) {
            value1Type = 'duration_m';
            const minutes = parseFloat(templateEx.notes.replace(/[^0-9.]/g, ''));
            if (!isNaN(minutes)) {
              value1Numeric = Math.max(0.1, minutes + randomDecimal(-0.5, 1.0, 2));
            } else {
              value1Numeric = randomDecimal(10, 60, 2);
            }
          }

          // Handle distance-based exercises
          if (templateEx.notes && (templateEx.notes.includes('meter') || templateEx.notes.includes('M'))) {
            const distance = parseInt(templateEx.notes.replace(/[^0-9]/g, ''));
            if (!isNaN(distance)) {
              if (value1Type) {
                value2Type = 'distance_m';
                value2Numeric = Math.max(1, distance + randomInt(-10, 20));
              } else {
                value1Type = 'distance_m';
                value1Numeric = Math.max(1, distance + randomInt(-10, 20));
              }
            }
          }

          // For strength exercises, add weight if we have reps
          if (exercise.exercise_category === 'strength' && reps && !value1Type) {
            value1Type = 'weight_kg';
            value1Numeric = randomDecimal(20, 150, 2.5); // Random weight between 20-150kg
          } else if (exercise.exercise_category === 'strength' && reps && value1Type && !value2Type) {
            value2Type = 'weight_kg';
            value2Numeric = randomDecimal(20, 150, 2.5);
          }

          // For cardio exercises without duration, add some time
          if (exercise.exercise_category === 'cardio' && !value1Type && !value2Type) {
            value1Type = 'duration_m';
            value1Numeric = randomDecimal(10, 60, 2); // 10-60 minutes
          }

          // Ensure we have at least one value for the set
          if (!value1Type && !value2Type && !reps) {
            if (exercise.exercise_category === 'cardio') {
              value1Type = 'duration_m';
              value1Numeric = randomDecimal(5, 30, 2);
            } else {
              reps = randomInt(8, 15);
              value1Type = 'weight_kg';
              value1Numeric = randomDecimal(20, 100, 2.5);
            }
          }

          await client.query(`
            INSERT INTO sets (
              set_id, session_id, exercise_id, set_index, reps, 
              value_1_type, value_1_numeric, value_2_type, value_2_numeric, 
              rpe, tenant_id, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
          `, [
            setId,
            sessionId,
            exercise.exercise_id,
            setIndex + 1,
            reps,
            value1Type,
            value1Numeric,
            value2Type,
            value2Numeric,
            rpe,
            userTenantId
          ]);

          totalSetsGenerated++;
        }
      }

      if ((i + 1) % 10 === 0) {
        console.log(`✅ Generated ${i + 1}/100 workouts...`);
      }
    }

    // Final verification
    console.log('\n📊 Final verification:');
    
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    console.log(`👥 Total users: ${userCount.rows[0].count}`);
    
    const tenantCount = await client.query('SELECT COUNT(*) FROM tenants');
    console.log(`🏢 Total tenants: ${tenantCount.rows[0].count}`);
    
    const templateCount = await client.query('SELECT COUNT(*) FROM workout_templates WHERE scope = \'system\'');
    console.log(`📋 System workout templates: ${templateCount.rows[0].count}`);
    
    const exerciseCountFinal = await client.query('SELECT COUNT(*) FROM exercise_templates');
    console.log(`🏋️ Exercise templates: ${exerciseCountFinal.rows[0].count}`);
    
    const exerciseCountActive = await client.query('SELECT COUNT(*) FROM exercises WHERE is_active = true');
    console.log(`🏋️ Active exercises: ${exerciseCountActive.rows[0].count}`);
    
    const sessionCount = await client.query('SELECT COUNT(*) FROM sessions WHERE user_id = $1', [userId]);
    console.log(`💪 Workouts for test user: ${sessionCount.rows[0].count}`);
    
    const setCount = await client.query(`
      SELECT COUNT(*) FROM sets s 
      JOIN sessions sess ON s.session_id = sess.session_id 
      WHERE sess.user_id = $1
    `, [userId]);
    console.log(`🎯 Total sets generated: ${setCount.rows[0].count}`);

    console.log('\n✅ Test data population completed successfully!');
    console.log('\n🔐 Login credentials:');
    console.log('System Admin: orchestrator@rythm.training / Password123');
    console.log('Test User: lars-olof@allerhed.com / Password123');

  } catch (error) {
    console.error('❌ Error populating test data:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  populateTestData()
    .then(() => {
      console.log('🎉 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { populateTestData };