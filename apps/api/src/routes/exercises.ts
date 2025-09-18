import { Router } from 'express'
import { Pool } from 'pg'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// Get exercise templates by type (STRENGTH or CARDIO)
router.get('/templates/by-type/:type', async (req, res) => {
  const pool: Pool = req.app.locals.pool
  const { type } = req.params
  
  if (!['STRENGTH', 'CARDIO'].includes(type.toUpperCase())) {
    return res.status(400).json({ error: 'Invalid exercise type. Must be STRENGTH or CARDIO' })
  }
  
  try {
    const { search } = req.query
    
    let query = `
      SELECT 
        et.template_id,
        et.name,
        et.muscle_groups,
        COALESCE(e.name, et.equipment) as equipment,
        et.equipment_id,
        et.exercise_category,
        et.exercise_type,
        et.default_value_1_type,
        et.default_value_2_type,
        et.description,
        et.instructions
      FROM exercise_templates et
      LEFT JOIN equipment e ON et.equipment_id = e.equipment_id
      WHERE et.exercise_type = $1
    `
    const params: any[] = [type.toUpperCase()]
    
    if (search) {
      params.push(`%${search}%`)
      query += ` AND et.name ILIKE $${params.length}`
    }
    
    query += ` ORDER BY et.name ASC`
    
    const result = await pool.query(query, params)
    res.json({
      type: type.toUpperCase(),
      count: result.rows.length,
      exercises: result.rows
    })
  } catch (error) {
    console.error('Error fetching exercise templates by type:', error)
    res.status(500).json({ error: 'Failed to fetch exercise templates by type' })
  }
})

// Get exercise templates (available to all tenants)
router.get('/templates', async (req, res) => {
  const pool: Pool = req.app.locals.pool
  
  try {
    const { category, type, search } = req.query
    
    let query = `
      SELECT 
        et.template_id,
        et.name,
        et.muscle_groups,
        COALESCE(e.name, et.equipment) as equipment,
        et.equipment_id,
        et.exercise_category,
        et.exercise_type,
        et.default_value_1_type,
        et.default_value_2_type,
        et.description,
        et.instructions
      FROM exercise_templates et
      LEFT JOIN equipment e ON et.equipment_id = e.equipment_id
      WHERE 1=1
    `
    const params: any[] = []
    
    if (category) {
      params.push(category)
      query += ` AND et.exercise_category = $${params.length}`
    }
    
    if (type) {
      params.push(type)
      query += ` AND et.exercise_type = $${params.length}`
    }
    
    if (search) {
      params.push(`%${search}%`)
      query += ` AND et.name ILIKE $${params.length}`
    }
    
    query += ` ORDER BY et.exercise_type, et.name ASC`
    
    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching exercise templates:', error)
    res.status(500).json({ error: 'Failed to fetch exercise templates' })
  }
})

// Get all exercises (globally available)
router.get('/', authenticateToken, async (req, res) => {
  const pool: Pool = req.app.locals.pool
  
  try {
    const { category, type, search } = req.query
    
    let query = `
      SELECT 
        ex.exercise_id,
        ex.name,
        ex.muscle_groups,
        COALESCE(e.name, ex.equipment) as equipment,
        ex.equipment_id,
        ex.exercise_category,
        ex.exercise_type,
        ex.default_value_1_type,
        ex.default_value_2_type,
        ex.notes,
        ex.is_active,
        ex.created_at
      FROM exercises ex
      LEFT JOIN equipment e ON ex.equipment_id = e.equipment_id
      WHERE ex.is_active = true
    `
    const params: any[] = []
    
    if (category) {
      params.push(category)
      query += ` AND ex.exercise_category = $${params.length}`
    }
    
    if (type) {
      params.push(type)
      query += ` AND ex.exercise_type = $${params.length}`
    }
    
    if (search) {
      params.push(`%${search}%`)
      query += ` AND ex.name ILIKE $${params.length}`
    }
    
    query += ` ORDER BY ex.exercise_type, ex.name ASC`
    
    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching exercises:', error)
    res.status(500).json({ error: 'Failed to fetch exercises' })
  }
})

// Create exercise from template
router.post('/from-template/:templateId', authenticateToken, async (req, res) => {
  const pool: Pool = req.app.locals.pool
  const { templateId } = req.params
  const { customizations } = req.body
  
  try {
    // Get template with equipment info
    const templateResult = await pool.query(`
      SELECT et.*, e.name as equipment_name
      FROM exercise_templates et
      LEFT JOIN equipment e ON et.equipment_id = e.equipment_id
      WHERE et.template_id = $1
    `, [templateId])
    
    if (templateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exercise template not found' })
    }
    
    const template = templateResult.rows[0]
    
    // Create exercise with template defaults and customizations
    const exerciseData = {
      name: customizations?.name || template.name,
      muscle_groups: customizations?.muscle_groups || template.muscle_groups,
      equipment: customizations?.equipment || template.equipment_name || template.equipment,
      equipment_id: customizations?.equipment_id || template.equipment_id,
      exercise_category: customizations?.exercise_category || template.exercise_category,
      exercise_type: customizations?.exercise_type || template.exercise_type,
      default_value_1_type: customizations?.default_value_1_type || template.default_value_1_type,
      default_value_2_type: customizations?.default_value_2_type || template.default_value_2_type,
      notes: customizations?.notes || template.description
    }
    
    // Check if exercise already exists globally
    const existingResult = await pool.query(
      'SELECT exercise_id FROM exercises WHERE LOWER(name) = LOWER($1)',
      [exerciseData.name]
    )
    
    if (existingResult.rows.length > 0) {
      return res.status(409).json({ 
        error: 'An exercise with this name already exists',
        existing_exercise_id: existingResult.rows[0].exercise_id
      })
    }
    
    const result = await pool.query(`
      INSERT INTO exercises (
        name, muscle_groups, equipment, equipment_id, exercise_category, exercise_type,
        default_value_1_type, default_value_2_type, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      exerciseData.name,
      exerciseData.muscle_groups,
      exerciseData.equipment,
      exerciseData.equipment_id,
      exerciseData.exercise_category,
      exerciseData.exercise_type,
      exerciseData.default_value_1_type,
      exerciseData.default_value_2_type,
      exerciseData.notes
    ])
    
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating exercise from template:', error)
    res.status(500).json({ error: 'Failed to create exercise from template' })
  }
})

// Create custom exercise
router.post('/', authenticateToken, async (req, res) => {
  const pool: Pool = req.app.locals.pool
  
  try {
    const {
      name,
      muscle_groups = [],
      equipment,
      equipment_id,
      exercise_category = 'strength',
      exercise_type = 'STRENGTH',
      default_value_1_type = 'weight_kg',
      default_value_2_type = 'reps',
      notes
    } = req.body
    
    if (!name) {
      return res.status(400).json({ error: 'Exercise name is required' })
    }
    
    // Check if exercise already exists globally
    const existingResult = await pool.query(
      'SELECT exercise_id FROM exercises WHERE LOWER(name) = LOWER($1)',
      [name]
    )
    
    if (existingResult.rows.length > 0) {
      return res.status(409).json({ 
        error: 'An exercise with this name already exists',
        existing_exercise_id: existingResult.rows[0].exercise_id
      })
    }
    
    const result = await pool.query(`
      INSERT INTO exercises (
        name, muscle_groups, equipment, equipment_id, exercise_category, exercise_type,
        default_value_1_type, default_value_2_type, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      name,
      muscle_groups,
      equipment,
      equipment_id,
      exercise_category,
      exercise_type,
      default_value_1_type,
      default_value_2_type,
      notes
    ])
    
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating exercise:', error)
    res.status(500).json({ error: 'Failed to create exercise' })
  }
})

// Update exercise
router.put('/:exerciseId', authenticateToken, async (req, res) => {
  const pool: Pool = req.app.locals.pool
  const { exerciseId } = req.params
  
  try {
    const {
      name,
      muscle_groups,
      equipment,
      equipment_id,
      exercise_category,
      exercise_type,
      default_value_1_type,
      default_value_2_type,
      notes,
      is_active
    } = req.body
    
    // If name is being updated, check for conflicts
    if (name) {
      const existingResult = await pool.query(
        'SELECT exercise_id FROM exercises WHERE LOWER(name) = LOWER($1) AND exercise_id != $2',
        [name, exerciseId]
      )
      
      if (existingResult.rows.length > 0) {
        return res.status(409).json({ 
          error: 'An exercise with this name already exists',
          existing_exercise_id: existingResult.rows[0].exercise_id
        })
      }
    }
    
    const result = await pool.query(`
      UPDATE exercises 
      SET 
        name = COALESCE($2, name),
        muscle_groups = COALESCE($3, muscle_groups),
        equipment = COALESCE($4, equipment),
        equipment_id = COALESCE($5, equipment_id),
        exercise_category = COALESCE($6, exercise_category),
        exercise_type = COALESCE($7, exercise_type),
        default_value_1_type = COALESCE($8, default_value_1_type),
        default_value_2_type = COALESCE($9, default_value_2_type),
        notes = COALESCE($10, notes),
        is_active = COALESCE($11, is_active),
        updated_at = NOW()
      WHERE exercise_id = $1
      RETURNING *
    `, [
      exerciseId,
      name,
      muscle_groups,
      equipment,
      equipment_id,
      exercise_category,
      exercise_type,
      default_value_1_type,
      default_value_2_type,
      notes,
      is_active
    ])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exercise not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating exercise:', error)
    res.status(500).json({ error: 'Failed to update exercise' })
  }
})

// Get exercise by ID with default metrics
router.get('/:exerciseId', authenticateToken, async (req, res) => {
  const pool: Pool = req.app.locals.pool
  const { exerciseId } = req.params
  
  try {
    const result = await pool.query(`
      SELECT 
        ex.exercise_id,
        ex.name,
        ex.muscle_groups,
        COALESCE(e.name, ex.equipment) as equipment,
        ex.equipment_id,
        ex.exercise_category,
        ex.exercise_type,
        ex.default_value_1_type,
        ex.default_value_2_type,
        ex.notes,
        ex.is_active,
        ex.created_at
      FROM exercises ex
      LEFT JOIN equipment e ON ex.equipment_id = e.equipment_id
      WHERE ex.exercise_id = $1
    `, [exerciseId])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exercise not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching exercise:', error)
    res.status(500).json({ error: 'Failed to fetch exercise' })
  }
})

export default router