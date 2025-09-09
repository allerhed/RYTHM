import { Router } from 'express'
import { Pool } from 'pg'
import jwt from 'jsonwebtoken'
import { db } from '@rythm/db'

const router = Router()

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
      GROUP BY s.session_id, s.name, s.category, s.notes, s.started_at, s.completed_at, s.training_load, s.perceived_exertion
      ORDER BY s.started_at DESC`

    console.log('Executing query:', query)
    console.log('With params:', params)

    const sessionsResult = await pool.query(query, params)

    // Get exercises for each session
    const sessions = []
    for (const session of sessionsResult.rows) {
      const exercisesResult = await pool.query(
        `SELECT DISTINCT
          e.exercise_id,
          e.name,
          e.muscle_groups,
          COUNT(st.set_id) as set_count
        FROM exercises e
        JOIN sets st ON st.exercise_id = e.exercise_id
        WHERE st.session_id = $1 AND e.tenant_id = $2
        GROUP BY e.exercise_id, e.name, e.muscle_groups
        ORDER BY e.name`,
        [session.session_id, tenantId]
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
        s.perceived_exertion
      FROM sessions s
      WHERE s.session_id = $1 AND s.user_id = $2 AND s.tenant_id = $3`,
      [id, userId, tenantId]
    )

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' })
    }

    const session = sessionResult.rows[0]

    // Get exercises with sets for this session
    const exercisesResult = await pool.query(
      `SELECT DISTINCT
        e.exercise_id,
        e.name,
        e.muscle_groups,
        e.equipment,
        e.exercise_category,
        e.exercise_type
      FROM exercises e
      JOIN sets st ON st.exercise_id = e.exercise_id
      WHERE st.session_id = $1 AND e.tenant_id = $2
      ORDER BY e.name`,
      [id, tenantId]
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
  console.log('Session update request for session:', req.params.id)
  console.log('Request body:', JSON.stringify(req.body, null, 2))
  
  try {
    const { id } = req.params
    const userId = req.user?.userId
    const tenantId = req.user?.tenantId

    console.log('Using user:', userId, 'tenant:', tenantId)

    if (!userId || !tenantId) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    const { name, category, notes, exercises, training_load, perceived_exertion } = req.body

    // Verify session ownership
    const sessionCheck = await pool.query(
      'SELECT session_id FROM sessions WHERE session_id = $1 AND user_id = $2 AND tenant_id = $3',
      [id, userId, tenantId]
    )

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found or access denied' })
    }

    // Start transaction using db.transaction
    const result = await db.transaction(async (client: any) => {
      // Update session
      const sessionResult = await client.query(
        `UPDATE sessions 
         SET name = $1,
             category = COALESCE($2, category),
             notes = COALESCE($3, notes),
             training_load = $4,
             perceived_exertion = $5,
             updated_at = NOW()
         WHERE session_id = $6 AND user_id = $7 AND tenant_id = $8
         RETURNING *`,
        [name, category, notes, training_load, perceived_exertion, id, userId, tenantId]
      )

      // Delete existing sets for this session
      await client.query('DELETE FROM sets WHERE session_id = $1 AND tenant_id = $2', [id, tenantId])

      // Process exercises and sets if provided
      if (exercises && exercises.length > 0) {
        for (const exercise of exercises) {
          // Find or create exercise
          let exerciseId = exercise.exercise_id
          
          if (!exerciseId) {
            // Create new exercise if not found
            const exerciseResult = await client.query(
              `INSERT INTO exercises (tenant_id, name, notes)
               VALUES ($1, $2, $3) 
               RETURNING exercise_id`,
              [tenantId, exercise.name || 'Custom Exercise', exercise.notes || '']
            )
            exerciseId = exerciseResult.rows[0].exercise_id
          }

          // Add sets for this exercise
          if (exercise.sets && exercise.sets.length > 0) {
            for (let i = 0; i < exercise.sets.length; i++) {
              const set = exercise.sets[i]
              await client.query(
                `INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, 
                                   value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                  tenantId,
                  id,
                  exerciseId,
                  set.set_index || i + 1,
                  set.value_1_type || (set as any).value1Type || null,
                  parseFloat(set.value_1_numeric || (set as any).value1) || 0,
                  set.value_2_type || (set as any).value2Type || null,
                  parseFloat(set.value_2_numeric || (set as any).value2) || 0,
                  set.notes || null
                ]
              )
            }
          }
        }
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

    const { name, category, notes, exercises, training_load, perceived_exertion } = req.body

    // Start transaction using db.transaction
    const result = await db.transaction(async (client: any) => {
      // Set RLS context variables for the session  
      await client.query('SELECT set_config($1, $2, false)', ['rythm.current_user_id', userId])
      await client.query('SELECT set_config($1, $2, false)', ['rythm.current_tenant_id', tenantId])
      await client.query('SELECT set_config($1, $2, false)', ['rythm.user_role', 'tenant_admin'])
      
      // Create session
      const sessionResult = await client.query(
        `INSERT INTO sessions (tenant_id, user_id, name, category, notes, training_load, perceived_exertion, started_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING session_id`,
        [tenantId, userId, name, category, notes, training_load, perceived_exertion]
      )

      const sessionId = sessionResult.rows[0].session_id

      // Process exercises and sets if provided
      if (exercises && exercises.length > 0) {
        for (const exercise of exercises) {
          // Find or create exercise
          let exerciseId = exercise.exercise_id
          
          if (!exerciseId) {
            // Create new exercise if not found
            const exerciseResult = await client.query(
              `INSERT INTO exercises (tenant_id, name, muscle_groups, equipment, exercise_category, notes)
               VALUES ($1, $2, $3, $4, $5, $6) 
               RETURNING exercise_id`,
              [
                tenantId, 
                exercise.name || 'Custom Exercise', 
                exercise.muscle_groups || [],
                exercise.equipment || '',
                exercise.exercise_category || 'strength',
                exercise.notes || ''
              ]
            )
            exerciseId = exerciseResult.rows[0].exercise_id
          }

          // Add sets for this exercise
          if (exercise.sets && exercise.sets.length > 0) {
            for (let i = 0; i < exercise.sets.length; i++) {
              const set = exercise.sets[i]
              await client.query(
                `INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, 
                 value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                  tenantId, sessionId, exerciseId, 
                  set.set_index || set.setNumber || i + 1,
                  set.value_1_type || set.value1Type || null,
                  parseFloat(set.value_1_numeric || set.value1) || 0,
                  set.value_2_type || set.value2Type || null,
                  parseFloat(set.value_2_numeric || set.value2) || 0,
                  set.notes || ''
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

export default router