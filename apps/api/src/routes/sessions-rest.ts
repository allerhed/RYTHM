import { Router } from 'express'
import { Pool } from 'pg'
import jwt from 'jsonwebtoken'
import { db } from '@rythm/db'

const router = Router()

// Helper function to convert HH:MM:SS duration to seconds
const parseDurationToSeconds = (duration: string): number => {
  const parts = duration.split(':').map(part => parseInt(part))
  return parts[0] * 3600 + parts[1] * 60 + parts[2]
}

// Helper function to convert seconds to HH:MM:SS format
const formatSecondsToHMS = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Authentication middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' })
    }
    req.user = user
    next()
  })
}

// GET sessions list with optional date filtering
router.get('/', authenticateToken, async (req, res) => {
  const pool: Pool = req.app.locals.pool
  console.log('Sessions list request with query:', req.query)
  
  try {
    const userId = req.user?.userId
    const tenantId = req.user?.tenantId
    const dateFilter = req.query.date

    if (!userId || !tenantId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    let query = `
      SELECT 
        s.session_id as id,
        s.session_id,
        s.name,
        s.category,
        s.notes,
        s.started_at,
        s.completed_at,
        s.training_load,
        s.perceived_exertion,
        s.duration_seconds,
        COUNT(DISTINCT st.exercise_id) as exercise_count,
        COUNT(st.set_id) as total_sets
      FROM sessions s
      LEFT JOIN sets st ON s.session_id = st.session_id
      WHERE s.user_id = $1 AND s.tenant_id = $2`
    
    const params = [userId, tenantId]

    // Add date filter if provided
    if (dateFilter) {
      query += ` AND DATE(s.started_at) = $3`
      params.push(dateFilter as string)
    }

    query += `
      GROUP BY s.session_id, s.name, s.category, s.notes, s.started_at, s.completed_at, s.training_load, s.perceived_exertion, s.duration_seconds
      ORDER BY s.started_at DESC`

    console.log('Executing query:', query)
    console.log('With params:', params)

    const sessionsResult = await pool.query(query, params)

    // Get exercises for each session, ordered by when first set was created
    const sessions = []
    for (const session of sessionsResult.rows) {
      const exercisesResult = await pool.query(
        `SELECT DISTINCT
          e.exercise_id,
          e.name,
          e.muscle_groups,
          COUNT(st.set_id) as set_count,
          MIN(st.created_at) as first_set_created
        FROM exercises e
        JOIN sets st ON st.exercise_id = e.exercise_id
        WHERE st.session_id = $1
        GROUP BY e.exercise_id, e.name, e.muscle_groups
        ORDER BY MIN(st.created_at)`,
        [session.session_id]
      )

      sessions.push({
        ...session,
        exercises: exercisesResult.rows
      })
    }

    console.log(`Found ${sessions.length} sessions for user`)
    res.json({ sessions })

  } catch (error) {
    console.error('Sessions list fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch sessions', details: (error as Error).message })
  }
})

// GET single session by ID with full details
router.get('/:id', authenticateToken, async (req, res) => {
  const pool: Pool = req.app.locals.pool
  console.log('Single session fetch request for session:', req.params.id)
  
  try {
    const { id } = req.params
    const userId = req.user?.userId
    const tenantId = req.user?.tenantId

    if (!userId || !tenantId) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    // Get session details
    const sessionResult = await pool.query(
      `SELECT 
        s.session_id as id,
        s.session_id,
        s.name,
        s.category,
        s.notes,
        s.started_at,
        s.completed_at,
        s.created_at,
        s.training_load,
        s.perceived_exertion,
        s.duration_seconds
      FROM sessions s
      WHERE s.session_id = $1 AND s.user_id = $2 AND s.tenant_id = $3`,
      [id, userId, tenantId]
    )

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' })
    }

    const session = sessionResult.rows[0]

    // Get exercises with sets for this session, ordered by when first set was created
    const exercisesResult = await pool.query(
      `SELECT DISTINCT
        e.exercise_id,
        e.name,
        e.muscle_groups,
        e.equipment,
        e.exercise_category,
        e.exercise_type,
        MIN(st.created_at) as first_set_created
      FROM exercises e
      JOIN sets st ON st.exercise_id = e.exercise_id
      WHERE st.session_id = $1
      GROUP BY e.exercise_id, e.name, e.muscle_groups, e.equipment, e.exercise_category, e.exercise_type
      ORDER BY MIN(st.created_at)`,
      [id]
    )

    // Get sets for each exercise
    for (let exercise of exercisesResult.rows) {
      const setsResult = await pool.query(
        `SELECT 
          st.set_id,
          st.set_index,
          st.value_1_type,
          st.value_1_numeric,
          st.value_2_type,
          st.value_2_numeric,
          st.notes,
          st.created_at
        FROM sets st
        WHERE st.session_id = $1 AND st.exercise_id = $2
        ORDER BY st.set_index`,
        [id, exercise.exercise_id]
      )
      exercise.sets = setsResult.rows
    }

    session.exercises = exercisesResult.rows

    console.log('Session found with exercises:', exercisesResult.rows.length)
    res.json({ session })

  } catch (error) {
    console.error('Single session fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch session', details: (error as Error).message })
  }
})

// PUT update session by ID
router.put('/:id', authenticateToken, async (req, res) => {
  const pool: Pool = req.app.locals.pool
  console.log('🔧 Session update request for session:', req.params.id)
  console.log('🔧 Request body keys:', Object.keys(req.body))
  console.log('🔧 Request started_at:', req.body.started_at)
  console.log('🔧 Request exercises count:', req.body.exercises?.length)
  
  try {
    const { id } = req.params
    const userId = req.user?.userId
    const tenantId = req.user?.tenantId

    console.log('🔧 Using user:', userId, 'tenant:', tenantId)

    if (!userId || !tenantId) {
      console.error('❌ Authentication failed - missing user or tenant')
      return res.status(401).json({ error: 'Authentication required' })
    }
    const { name, category, notes, exercises, training_load, perceived_exertion, started_at } = req.body

    // Verify session ownership
    const sessionCheck = await pool.query(
      'SELECT session_id FROM sessions WHERE session_id = $1 AND user_id = $2 AND tenant_id = $3',
      [id, userId, tenantId]
    )

    if (sessionCheck.rows.length === 0) {
      console.error('❌ Session not found or access denied for:', id)
      return res.status(404).json({ error: 'Session not found or access denied' })
    }

    console.log('✅ Session ownership verified')

    // Start transaction using db.transaction
    const result = await db.transaction(async (client: any) => {
      console.log('🔄 Starting transaction for session update')
      
      // Update session
      console.log('📝 Updating session with started_at:', started_at)
      const sessionResult = await client.query(
        `UPDATE sessions 
         SET name = $1,
             category = COALESCE($2, category),
             notes = COALESCE($3, notes),
             training_load = $4,
             perceived_exertion = $5,
             started_at = COALESCE($6, started_at),
             updated_at = NOW()
         WHERE session_id = $7 AND user_id = $8 AND tenant_id = $9
         RETURNING *`,
        [name, category, notes, training_load, perceived_exertion, started_at, id, userId, tenantId]
      )

      console.log('✅ Session updated, affected rows:', sessionResult.rowCount)

      // Delete existing sets for this session
      console.log('🗑️ Deleting existing sets for session')
      const deleteResult = await client.query('DELETE FROM sets WHERE session_id = $1 AND tenant_id = $2', [id, tenantId])
      console.log('✅ Deleted', deleteResult.rowCount, 'existing sets')

      // Process exercises and sets if provided
      if (exercises && exercises.length > 0) {
        console.log(`📝 Processing ${exercises.length} exercises in order:`)
        exercises.forEach((ex: any, idx: number) => {
          console.log(`  ${idx}: ${ex.name || 'Unnamed'} (ID: ${ex.exercise_id || 'none'})`)
        })
        
        // Get base timestamp for this update
        const baseTimestamp = new Date()
        
        for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
          const exercise = exercises[exerciseIndex]
          console.log(`🏋️ Processing exercise ${exerciseIndex}: ${exercise.name || 'Unnamed'}`)
          
          // Find or create exercise
          let exerciseId = exercise.exercise_id
          
          if (!exerciseId) {
            console.log('🔍 Exercise ID not provided, searching by name:', exercise.name)
            // Check if exercise exists globally first
            const existingResult = await client.query(
              'SELECT exercise_id FROM exercises WHERE LOWER(name) = LOWER($1)',
              [exercise.name || 'Custom Exercise']
            )
            
            if (existingResult.rows.length > 0) {
              exerciseId = existingResult.rows[0].exercise_id
              console.log('✅ Found existing exercise:', exerciseId)
            } else {
              console.log('➕ Creating new exercise')
              // Create new exercise in global library
              const exerciseResult = await client.query(
                `INSERT INTO exercises (name, notes)
                 VALUES ($1, $2) 
                 RETURNING exercise_id`,
                [exercise.name || 'Custom Exercise', exercise.notes || '']
              )
              exerciseId = exerciseResult.rows[0].exercise_id
              console.log('✅ Created new exercise:', exerciseId)
            }
          }

          // Add sets for this exercise with incremented timestamps
          if (exercise.sets && exercise.sets.length > 0) {
            console.log(`📊 Adding ${exercise.sets.length} sets for exercise`)
            for (let i = 0; i < exercise.sets.length; i++) {
              const set = exercise.sets[i]
              
              // Create timestamp that ensures ordering: base + (exerciseIndex * 1000) + (setIndex * 10) milliseconds
              const setTimestamp = new Date(baseTimestamp.getTime() + (exerciseIndex * 1000) + (i * 10))
              
              const value1 = set.value_1_numeric ? Number(set.value_1_numeric) : ((set as any).value1 ? Number((set as any).value1) : null)
              const value2 = set.value_2_numeric ? Number(set.value_2_numeric) : ((set as any).value2 ? Number((set as any).value2) : null)
              
              // Convert 0 values to null to satisfy database constraints
              // If value is 0 or null, set both type and numeric to null
              const finalValue1 = value1 === 0 ? null : value1
              const finalValue2 = value2 === 0 ? null : value2
              const finalType1 = finalValue1 === null ? null : (set.value_1_type || (set as any).value1Type || null)
              const finalType2 = finalValue2 === null ? null : (set.value_2_type || (set as any).value2Type || null)
              
              console.log(`  Set ${i + 1}: ${finalType1}=${finalValue1}, ${finalType2}=${finalValue2}`)
              
              try {
                await client.query(
                  `INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, 
                                     value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes, created_at)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                  [
                    tenantId,
                    id,
                    exerciseId,
                    set.set_index || i + 1,
                    finalType1,
                    finalValue1,
                    finalType2,
                    finalValue2,
                    set.notes || null,
                    setTimestamp
                  ]
                )
              } catch (setError) {
                console.error('❌ Error inserting set:', setError)
                console.error('Set data:', { 
                  set_index: set.set_index || i + 1,
                  value_1_type: set.value_1_type || (set as any).value1Type,
                  value_1_numeric: value1,
                  value_2_type: set.value_2_type || (set as any).value2Type,
                  value_2_numeric: value2
                })
                throw setError
              }
            }
          }
        }
        console.log('✅ All exercises and sets processed successfully')
      } else {
        console.log('ℹ️ No exercises provided in update')
      }

      return sessionResult.rows[0]
    })

    console.log('Session update completed successfully')

    res.json({
      message: 'Session updated successfully',
      session: result
    })

  } catch (error) {
    console.error('Session update error:', error)
    res.status(500).json({ error: 'Failed to update session', details: (error as Error).message })
  }
})

// POST create new session
router.post('/', authenticateToken, async (req, res) => {
  const pool: Pool = req.app.locals.pool
  console.log('Session creation request:', JSON.stringify(req.body, null, 2))
  
  try {
    const userId = req.user?.userId
    const tenantId = req.user?.tenantId

    if (!userId || !tenantId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { name, category, notes, exercises, training_load, perceived_exertion, duration, started_at } = req.body

    // Convert duration from HH:MM:SS to seconds
    const durationSeconds = duration ? parseDurationToSeconds(duration) : 3600 // Default 1 hour

    // Use provided started_at or default to current time
    const sessionStartTime = started_at ? new Date(started_at) : new Date()

    // Start transaction using db.transaction
    const result = await db.transaction(async (client: any) => {
      // Set RLS context variables for the session  
      await client.query('SELECT set_config($1, $2, false)', ['rythm.current_user_id', userId])
      await client.query('SELECT set_config($1, $2, false)', ['rythm.current_tenant_id', tenantId])
      await client.query('SELECT set_config($1, $2, false)', ['rythm.user_role', 'tenant_admin'])
      
      // Create session
      const sessionResult = await client.query(
        `INSERT INTO sessions (tenant_id, user_id, name, category, notes, training_load, perceived_exertion, duration_seconds, started_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING session_id`,
        [tenantId, userId, name, category, notes, training_load, perceived_exertion, durationSeconds, sessionStartTime]
      )

      const sessionId = sessionResult.rows[0].session_id

      // Process exercises and sets if provided
      if (exercises && exercises.length > 0) {
        // Get base timestamp for this session
        const baseTimestamp = new Date()
        
        for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
          const exercise = exercises[exerciseIndex]
          
          // Find or create exercise
          let exerciseId = exercise.exercise_id
          
          if (!exerciseId) {
            // First, try to find existing exercise by name
            const existingExerciseResult = await client.query(
              `SELECT exercise_id FROM exercises WHERE name = $1 LIMIT 1`,
              [exercise.name || 'Custom Exercise']
            )
            
            if (existingExerciseResult.rows.length > 0) {
              // Use existing exercise
              exerciseId = existingExerciseResult.rows[0].exercise_id
            } else {
              // Create new exercise if not found
              const exerciseResult = await client.query(
                `INSERT INTO exercises (name, muscle_groups, equipment, exercise_category, notes)
                 VALUES ($1, $2, $3, $4, $5) 
                 RETURNING exercise_id`,
                [
                  exercise.name || 'Custom Exercise', 
                  exercise.muscle_groups || [],
                  exercise.equipment || '',
                  exercise.exercise_category || 'strength',
                  exercise.notes || ''
                ]
              )
              exerciseId = exerciseResult.rows[0].exercise_id
            }
          }

          // Add sets for this exercise with incremented timestamps
          if (exercise.sets && exercise.sets.length > 0) {
            for (let i = 0; i < exercise.sets.length; i++) {
              const set = exercise.sets[i]
              
              // Create timestamp that ensures ordering: base + (exerciseIndex * 1000) + (setIndex * 10) milliseconds
              const setTimestamp = new Date(baseTimestamp.getTime() + (exerciseIndex * 1000) + (i * 10))
              
              // Convert 0 values to null to satisfy database constraints
              // If value is 0 or null, set both type and numeric to null
              const value1 = parseFloat(set.value_1_numeric || set.value1) || 0
              const value2 = parseFloat(set.value_2_numeric || set.value2) || 0
              const finalValue1 = value1 === 0 ? null : value1
              const finalValue2 = value2 === 0 ? null : value2
              const finalType1 = finalValue1 === null ? null : (set.value_1_type || set.value1Type || null)
              const finalType2 = finalValue2 === null ? null : (set.value_2_type || set.value2Type || null)
              
              await client.query(
                `INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, 
                 value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                  tenantId, sessionId, exerciseId, 
                  set.set_index || set.setNumber || i + 1,
                  finalType1,
                  finalValue1,
                  finalType2,
                  finalValue2,
                  set.notes || '',
                  setTimestamp
                ]
              )
            }
          }
        }
      }

      // Return final session data
      const finalSessionResult = await client.query(
        `SELECT session_id, tenant_id, user_id, name, category, notes, training_load, perceived_exertion, started_at
         FROM sessions
         WHERE session_id = $1`,
        [sessionId]
      )
      return finalSessionResult.rows[0]
    })

    console.log('Session created successfully:', result.session_id)

    res.status(201).json({
      message: 'Session created successfully',
      session: result
    })

  } catch (error) {
    console.error('Session creation error:', error)
    res.status(500).json({ error: 'Failed to create session', details: (error as Error).message })
  }
})

// DELETE session by ID
router.delete('/:id', authenticateToken, async (req, res) => {
  const pool: Pool = req.app.locals.pool
  console.log('Session deletion request for session:', req.params.id)
  
  try {
    const { id } = req.params
    const userId = req.user?.userId
    const tenantId = req.user?.tenantId

    if (!userId || !tenantId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // Verify session ownership before deletion
    const sessionCheck = await pool.query(
      'SELECT session_id, name FROM sessions WHERE session_id = $1 AND user_id = $2 AND tenant_id = $3',
      [id, userId, tenantId]
    )

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found or access denied' })
    }

    const sessionName = sessionCheck.rows[0].name

    // Start transaction using db.transaction
    await db.transaction(async (client: any) => {
      // Delete sets first (foreign key constraint)
      const setsResult = await client.query(
        'DELETE FROM sets WHERE session_id = $1 AND tenant_id = $2',
        [id, tenantId]
      )
      
      // Delete the session
      const sessionResult = await client.query(
        'DELETE FROM sessions WHERE session_id = $1 AND user_id = $2 AND tenant_id = $3',
        [id, userId, tenantId]
      )

      console.log(`Deleted ${setsResult.rowCount} sets and session ${id}`)
    })

    console.log('Session deletion completed successfully')

    res.json({
      message: 'Session deleted successfully',
      sessionId: id,
      sessionName: sessionName || 'Unnamed Session'
    })

  } catch (error) {
    console.error('Session deletion error:', error)
    res.status(500).json({ error: 'Failed to delete session', details: (error as Error).message })
  }
})

export default router