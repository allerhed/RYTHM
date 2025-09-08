const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

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
      `SELECT user_id, tenant_id, email, password_hash, role, first_name, last_name 
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
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
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