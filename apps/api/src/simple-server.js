const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads', 'avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'rythm',
  user: process.env.DB_USER || 'rythm_api',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const app = express();
const port = 3001;

app.use(express.json());

// Serve static files from public directory
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Simple test endpoint
app.get('/test', (req, res) => {
  console.log('Test endpoint requested');
  res.json({ message: 'API server is working' });
});

// Registration endpoint (with database)
app.post('/api/auth/register', async (req, res) => {
  console.log('Registration request received:', req.body);
  
  try {
    const { email, password, firstName, lastName, tenantName } = req.body;
    
    if (!email || !password || !firstName || !lastName || !tenantName) {
      console.log('Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['email', 'password', 'firstName', 'lastName', 'tenantName']
      });
    }

    console.log('Checking if user exists...');
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT user_id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('User already exists');
      return res.status(409).json({ error: 'User already exists' });
    }

    console.log('Hashing password...');
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    console.log('Creating tenant and user in transaction...');
    // Create tenant and user in transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      console.log('Creating tenant...');
      // Create tenant
      const tenantResult = await client.query(
        `INSERT INTO tenants (name) VALUES ($1) RETURNING tenant_id`,
        [tenantName]
      );
      const tenantId = tenantResult.rows[0].tenant_id;
      console.log('Tenant created with ID:', tenantId);

      console.log('Creating user...');
      // Create user as tenant admin
      const userResult = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, role, first_name, last_name) 
         VALUES ($1, $2, $3, 'tenant_admin', $4, $5) 
         RETURNING user_id, tenant_id, email, role, first_name, last_name`,
        [tenantId, email, passwordHash, firstName, lastName]
      );

      await client.query('COMMIT');
      const user = userResult.rows[0];
      console.log('User created:', user);

      console.log('Generating JWT...');
      // Generate JWT
      const token = jwt.sign(
        {
          userId: user.user_id,
          tenantId: user.tenant_id,
          role: user.role,
          email: user.email,
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      console.log('Registration successful');
      res.json({
        token,
        user: {
          id: user.user_id,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
          tenantId: user.tenant_id,
          about: user.about,
          avatarUrl: user.avatar_url,
        },
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  console.log('Login request received:', req.body);
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['email', 'password']
      });
    }

    // Find user
    const result = await pool.query(
      `SELECT user_id, tenant_id, email, password_hash, role, first_name, last_name, about, avatar_url 
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.user_id,
        tenantId: user.tenant_id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        tenantId: user.tenant_id,
        about: user.about,
        avatarUrl: user.avatar_url,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Profile update endpoint
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  console.log('Profile update request received:', req.body);
  
  try {
    const { firstName, lastName, email, about } = req.body;
    const userId = req.user.userId;
    
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['firstName', 'lastName', 'email']
      });
    }

    // Check if email is already taken by another user
    const existingUser = await pool.query(
      'SELECT user_id FROM users WHERE email = $1 AND user_id != $2',
      [email, userId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    // Update user profile
    const result = await pool.query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, email = $3, about = $4, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $5 
       RETURNING user_id, tenant_id, email, role, first_name, last_name, about, avatar_url`,
      [firstName, lastName, email, about || null, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    
    res.json({
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        tenantId: user.tenant_id,
        about: user.about,
        avatarUrl: user.avatar_url,
      },
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Profile update failed', details: error.message });
  }
});

// Password update endpoint
app.put('/api/auth/password', authenticateToken, async (req, res) => {
  console.log('Password update request received');
  
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['currentPassword', 'newPassword']
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    // Get current user data
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE user_id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [newPasswordHash, userId]
    );

    res.json({ message: 'Password updated successfully' });

  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Password update failed', details: error.message });
  }
});

// Get profile endpoint
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await pool.query(
      `SELECT user_id, tenant_id, email, role, first_name, last_name, about, avatar_url 
       FROM users WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    
    res.json({
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        tenantId: user.tenant_id,
        about: user.about,
        avatarUrl: user.avatar_url,
      },
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Avatar upload endpoint
app.put('/api/auth/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  console.log('Avatar upload request received');
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.userId;
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Get current avatar URL to delete old file
    const currentUser = await pool.query(
      'SELECT avatar_url FROM users WHERE user_id = $1',
      [userId]
    );

    // Update user avatar URL
    const result = await pool.query(
      `UPDATE users 
       SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 
       RETURNING user_id, tenant_id, email, role, first_name, last_name, about, avatar_url`,
      [avatarUrl, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete old avatar file if it exists
    if (currentUser.rows[0]?.avatar_url) {
      const oldFilePath = path.join(__dirname, '..', 'public', currentUser.rows[0].avatar_url);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    const user = result.rows[0];
    
    res.json({
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        tenantId: user.tenant_id,
        about: user.about,
        avatarUrl: user.avatar_url,
      },
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Avatar upload failed', details: error.message });
  }
});

// Session endpoints
app.post('/api/sessions', authenticateToken, async (req, res) => {
  console.log('Session creation request received:', req.body);
  
  try {
    const { name, category, planned_date, duration_seconds, notes, exercises } = req.body;
    const userId = req.user.userId;

    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required' });
    }

    console.log('Creating session for user:', userId);

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create session
      const sessionResult = await client.query(
        `INSERT INTO sessions (user_id, name, category, planned_date, duration_seconds, notes) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING session_id, name, category, planned_date, duration_seconds, notes, created_at`,
        [userId, name, category, planned_date, duration_seconds, notes]
      );

      const session = sessionResult.rows[0];
      console.log('Session created:', session.session_id);

      // If exercises are provided, create session_exercises and sets
      if (exercises && exercises.length > 0) {
        console.log('Processing exercises:', exercises.length);
        
        for (const exercise of exercises) {
          // Create or get exercise
          let exerciseResult = await client.query(
            'SELECT exercise_id FROM exercises WHERE LOWER(name) = LOWER($1)',
            [exercise.name]
          );

          let exerciseId;
          if (exerciseResult.rows.length === 0) {
            // Create new exercise
            console.log('Creating new exercise:', exercise.name);
            exerciseResult = await client.query(
              'INSERT INTO exercises (name, muscle_groups, equipment) VALUES ($1, $2, $3) RETURNING exercise_id',
              [exercise.name, [], '']
            );
            exerciseId = exerciseResult.rows[0].exercise_id;
          } else {
            exerciseId = exerciseResult.rows[0].exercise_id;
          }

          // Create session_exercise
          const sessionExerciseResult = await client.query(
            'INSERT INTO session_exercises (session_id, exercise_id, notes, sort_order) VALUES ($1, $2, $3, $4) RETURNING session_exercise_id',
            [session.session_id, exerciseId, exercise.notes || '', exercises.indexOf(exercise)]
          );

          const sessionExerciseId = sessionExerciseResult.rows[0].session_exercise_id;

          // Create sets for this exercise
          if (exercise.sets && exercise.sets.length > 0) {
            console.log('Creating sets for exercise:', exercise.name, exercise.sets.length);
            
            for (const set of exercise.sets) {
              await client.query(
                `INSERT INTO sets (session_exercise_id, set_number, value_1_type, value_1, value_2_type, value_2, reps, notes) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                  sessionExerciseId,
                  set.setNumber,
                  set.value1Type,
                  set.value1,
                  set.value2Type,
                  set.value2,
                  set.reps,
                  set.notes || ''
                ]
              );
            }
          }
        }
      }

      await client.query('COMMIT');
      console.log('Session creation completed successfully');

      res.json({
        message: 'Session created successfully',
        session: {
          id: session.session_id,
          name: session.name,
          category: session.category,
          planned_date: session.planned_date,
          duration_seconds: session.duration_seconds,
          notes: session.notes,
          created_at: session.created_at
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({ error: 'Failed to create session', details: error.message });
  }
});

// Get user sessions
app.get('/api/sessions', authenticateToken, async (req, res) => {
  console.log('Sessions fetch request for user:', req.user.userId);
  
  try {
    const userId = req.user.userId;

    const sessionsResult = await pool.query(
      `SELECT s.session_id, s.name, s.category, s.planned_date, s.duration_seconds, s.notes, s.created_at,
        COALESCE(
          JSON_AGG(
            CASE WHEN se.session_exercise_id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', se.session_exercise_id,
                'exercise_name', e.name,
                'notes', se.notes,
                'sort_order', se.sort_order,
                'sets', se.sets_data
              )
            END ORDER BY se.sort_order
          ) FILTER (WHERE se.session_exercise_id IS NOT NULL), 
          '[]'::json
        ) as exercises
      FROM sessions s
      LEFT JOIN (
        SELECT se.*, e.name as exercise_name,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', sets.set_id,
                'set_number', sets.set_number,
                'value_1_type', sets.value_1_type,
                'value_1', sets.value_1,
                'value_2_type', sets.value_2_type,
                'value_2', sets.value_2,
                'reps', sets.reps,
                'notes', sets.notes
              ) ORDER BY sets.set_number
            ) FILTER (WHERE sets.set_id IS NOT NULL),
            '[]'::json
          ) as sets_data
        FROM session_exercises se
        LEFT JOIN sets ON se.session_exercise_id = sets.session_exercise_id
        GROUP BY se.session_exercise_id, se.session_id, se.exercise_id, se.notes, se.sort_order
      ) se ON s.session_id = se.session_id
      LEFT JOIN exercises e ON se.exercise_id = e.exercise_id
      WHERE s.user_id = $1
      GROUP BY s.session_id, s.name, s.category, s.planned_date, s.duration_seconds, s.notes, s.created_at
      ORDER BY s.created_at DESC`,
      [userId]
    );

    console.log('Sessions found:', sessionsResult.rows.length);
    res.json(sessionsResult.rows);

  } catch (error) {
    console.error('Sessions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions', details: error.message });
  }
});

// Get exercise templates by type (STRENGTH or CARDIO)
app.get('/api/exercises/templates/by-type/:type', async (req, res) => {
  const { type } = req.params;
  console.log('Exercise templates by type fetch request:', type);
  
  if (!['STRENGTH', 'CARDIO'].includes(type.toUpperCase())) {
    return res.status(400).json({ error: 'Invalid exercise type. Must be STRENGTH or CARDIO' });
  }
  
  try {
    const { search } = req.query;
    
    let query = `
      SELECT 
        template_id,
        name,
        muscle_groups,
        equipment,
        exercise_category,
        exercise_type,
        default_value_1_type,
        default_value_2_type,
        description,
        instructions
      FROM exercise_templates 
      WHERE exercise_type = $1
    `;
    const params = [type.toUpperCase()];
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND name ILIKE $${params.length}`;
    }
    
    query += ` ORDER BY name ASC`;
    
    const result = await pool.query(query, params);
    console.log(`Exercise templates by type ${type} found:`, result.rows.length);
    
    res.json({
      type: type.toUpperCase(),
      count: result.rows.length,
      exercises: result.rows
    });
  } catch (error) {
    console.error('Error fetching exercise templates by type:', error);
    res.status(500).json({ error: 'Failed to fetch exercise templates by type' });
  }
});

// Get exercise templates (available to all tenants)
app.get('/api/exercises/templates', async (req, res) => {
  console.log('Exercise templates fetch request');
  
  try {
    const { category, type, search } = req.query;
    
    let query = `
      SELECT 
        template_id,
        name,
        muscle_groups,
        equipment,
        exercise_category,
        exercise_type,
        default_value_1_type,
        default_value_2_type,
        description,
        instructions
      FROM exercise_templates 
      WHERE 1=1
    `;
    const params = [];
    
    if (category) {
      params.push(category);
      query += ` AND exercise_category = $${params.length}`;
    }
    
    if (type) {
      params.push(type);
      query += ` AND exercise_type = $${params.length}`;
    }
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND name ILIKE $${params.length}`;
    }
    
    query += ` ORDER BY name ASC`;
    
    const result = await pool.query(query, params);
    console.log('Exercise templates found:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Exercise templates fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch exercise templates', details: error.message });
  }
});

// Get tenant-specific exercises
app.get('/api/exercises', authenticateToken, async (req, res) => {
  console.log('Exercises fetch request for tenant:', req.user?.tenant_id);
  
  const tenantId = req.user?.tenant_id;
  if (!tenantId) {
    return res.status(401).json({ error: 'Tenant ID required' });
  }
  
  try {
    const { category, search } = req.query;
    
    let query = `
      SELECT 
        exercise_id,
        name,
        muscle_groups,
        equipment,
        exercise_category,
        default_value_1_type,
        default_value_2_type,
        notes,
        is_active,
        created_at
      FROM exercises 
      WHERE tenant_id = $1 AND is_active = true
    `;
    const params = [tenantId];
    
    if (category) {
      params.push(category);
      query += ` AND exercise_category = $${params.length}`;
    }
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND name ILIKE $${params.length}`;
    }
    
    query += ` ORDER BY name ASC`;
    
    const result = await pool.query(query, params);
    console.log('Exercises found:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Exercises fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch exercises', details: error.message });
  }
});

// Create exercise from template
app.post('/api/exercises/from-template/:templateId', authenticateToken, async (req, res) => {
  console.log('Creating exercise from template:', req.params.templateId);
  
  const tenantId = req.user?.tenant_id;
  const { templateId } = req.params;
  const { customizations } = req.body;
  
  if (!tenantId) {
    return res.status(401).json({ error: 'Tenant ID required' });
  }
  
  try {
    // Get template
    const templateResult = await pool.query(
      'SELECT * FROM exercise_templates WHERE template_id = $1',
      [templateId]
    );
    
    if (templateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exercise template not found' });
    }
    
    const template = templateResult.rows[0];
    
    // Create exercise with template defaults and customizations
    const exerciseData = {
      name: customizations?.name || template.name,
      muscle_groups: customizations?.muscle_groups || template.muscle_groups,
      equipment: customizations?.equipment || template.equipment,
      exercise_category: customizations?.exercise_category || template.exercise_category,
      default_value_1_type: customizations?.default_value_1_type || template.default_value_1_type,
      default_value_2_type: customizations?.default_value_2_type || template.default_value_2_type,
      notes: customizations?.notes || template.description
    };
    
    const result = await pool.query(`
      INSERT INTO exercises (
        tenant_id, name, muscle_groups, equipment, exercise_category,
        default_value_1_type, default_value_2_type, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      tenantId,
      exerciseData.name,
      exerciseData.muscle_groups,
      exerciseData.equipment,
      exerciseData.exercise_category,
      exerciseData.default_value_1_type,
      exerciseData.default_value_2_type,
      exerciseData.notes
    ]);
    
    console.log('Exercise created from template:', result.rows[0].exercise_id);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating exercise from template:', error);
    res.status(500).json({ error: 'Failed to create exercise from template', details: error.message });
  }
});

// Create custom exercise
app.post('/api/exercises', authenticateToken, async (req, res) => {
  console.log('Creating custom exercise');
  
  const tenantId = req.user?.tenant_id;
  if (!tenantId) {
    return res.status(401).json({ error: 'Tenant ID required' });
  }
  
  try {
    const {
      name,
      muscle_groups = [],
      equipment,
      exercise_category = 'strength',
      default_value_1_type = 'weight_kg',
      default_value_2_type = 'reps',
      notes
    } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Exercise name is required' });
    }
    
    const result = await pool.query(`
      INSERT INTO exercises (
        tenant_id, name, muscle_groups, equipment, exercise_category,
        default_value_1_type, default_value_2_type, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      tenantId,
      name,
      muscle_groups,
      equipment,
      exercise_category,
      default_value_1_type,
      default_value_2_type,
      notes
    ]);
    
    console.log('Custom exercise created:', result.rows[0].exercise_id);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating exercise:', error);
    res.status(500).json({ error: 'Failed to create exercise', details: error.message });
  }
});

// Get exercise by ID with default metrics
app.get('/api/exercises/:exerciseId', authenticateToken, async (req, res) => {
  console.log('Fetching exercise:', req.params.exerciseId);
  
  const tenantId = req.user?.tenant_id;
  const { exerciseId } = req.params;
  
  if (!tenantId) {
    return res.status(401).json({ error: 'Tenant ID required' });
  }
  
  try {
    const result = await pool.query(`
      SELECT 
        exercise_id,
        name,
        muscle_groups,
        equipment,
        exercise_category,
        default_value_1_type,
        default_value_2_type,
        notes,
        is_active,
        created_at
      FROM exercises 
      WHERE exercise_id = $1 AND tenant_id = $2
    `, [exerciseId, tenantId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exercise not found' });
    }
    
    console.log('Exercise found:', result.rows[0].name);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching exercise:', error);
    res.status(500).json({ error: 'Failed to fetch exercise', details: error.message });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Test API server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${port}/test`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  server.close(() => {
    console.log('Server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received');
  server.close(() => {
    console.log('Server closed');
  });
});