import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './router';
import { createContext } from './trpc';
import { db } from '@rythm/db';
import exerciseRoutes from './routes/exercises';
import sessionsRoutes from './routes/sessions-rest';

const app = express();
const port = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Store database pool in app.locals for route access
app.locals.pool = db;

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

// Direct auth endpoints (bypass tRPC for now)
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    
    const { email, password, firstName, lastName, tenantName } = req.body;
    
    if (!email || !password || !firstName || !lastName || !tenantName) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['email', 'password', 'firstName', 'lastName', 'tenantName']
      });
    }

    console.log('Testing database connection...');
    
    // Test database connection first
    try {
      await db.query('SELECT 1 as test');
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    // Check if user already exists
    console.log('Checking if user exists...');
    const existingUser = await db.query(
      'SELECT user_id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    console.log('Hashing password...');
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    console.log('Creating tenant and user...');
    // Create tenant and user in transaction
    const result = await db.transaction(async (client: any) => {
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

      console.log('User created:', userResult.rows[0]);
      return userResult.rows[0];
    });

    console.log('Generating JWT...');
    // Generate JWT
    const token = jwt.sign(
      {
        userId: result.user_id,
        tenantId: result.tenant_id,
        role: result.role,
        email: result.email,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('Registration successful');
    res.json({
      token,
      user: {
        id: result.user_id,
        email: result.email,
        role: result.role,
        firstName: result.first_name,
        lastName: result.last_name,
        tenantId: result.tenant_id,
      },
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['email', 'password']
      });
    }

    // Find user
    const result = await db.query(
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

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Exercise API routes
app.use('/api/exercises', exerciseRoutes);

// Session API routes
app.use('/api/sessions', sessionsRoutes);

// tRPC API routes
app.use('/api/trpc', createExpressMiddleware({
  router: appRouter,
  createContext,
  onError: ({ error, path }) => {
    console.error(`❌ tRPC failed on ${path}:`, error);
  },
}));

// Catch-all route for API versioning
app.all('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API route not found',
    availableRoutes: ['/api/trpc']
  });
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 RYTHM API server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔌 tRPC endpoint: http://localhost:${port}/api/trpc`);
});

export default app;