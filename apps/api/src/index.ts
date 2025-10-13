import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './router';
import { createContext } from './trpc';
import { db } from '@rythm/db';
import exerciseRoutes from './routes/exercises';
import sessionsRoutes from './routes/sessions-rest';
import backupRoutes from './routes/backups';
import emailLogsRoutes from './routes/email-logs';
import { backupScheduler } from './services/BackupScheduler';

const app = express();
const port = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginResourcePolicy: false, // Allow cross-origin resources for static files
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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
        avatarUrl: result.user_id ? `/auth/avatar/${result.user_id}` : null, // Frontend proxy adds /api prefix
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
        avatarUrl: user.user_id ? `/auth/avatar/${user.user_id}` : null, // Frontend proxy adds /api prefix
      },
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// JWT middleware for protected routes
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Get user profile
app.get('/api/auth/profile', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await db.query(
      `SELECT user_id, tenant_id, email, role, first_name, last_name, avatar_url 
       FROM users WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.user_id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      tenantId: user.tenant_id,
      avatarUrl: user.user_id ? `/auth/avatar/${user.user_id}` : null, // Frontend proxy adds /api prefix
    });

  } catch (error: any) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile', details: error.message });
  }
});

// Update user profile
app.put('/api/auth/profile', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, email, about } = req.body;
    
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['firstName', 'lastName', 'email']
      });
    }

    const result = await db.query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, email = $3, about = $4
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
        avatarUrl: user.user_id ? `/auth/avatar/${user.user_id}` : null, // Frontend proxy adds /api prefix
      }
    });

  } catch (error: any) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile', details: error.message });
  }
});

// Update password
app.put('/api/auth/password', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['currentPassword', 'newPassword']
      });
    }

    // Get current password hash
    const userResult = await db.query(
      'SELECT password_hash FROM users WHERE user_id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await db.query(
      'UPDATE users SET password_hash = $1 WHERE user_id = $2',
      [newPasswordHash, userId]
    );

    res.json({ message: 'Password updated successfully' });

  } catch (error: any) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Failed to update password', details: error.message });
  }
});

// Configure multer for avatar uploads
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads/avatars');
    console.log('Avatar upload - destination directory:', uploadDir);
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      console.log('Creating upload directory:', uploadDir);
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Verify directory is writable
    try {
      fs.accessSync(uploadDir, fs.constants.W_OK);
      console.log('Upload directory is writable');
    } catch (error) {
      console.error('Upload directory is not writable:', error);
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'avatar-' + uniqueSuffix + path.extname(file.originalname);
    console.log('Avatar upload - generated filename:', filename);
    cb(null, filename);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Update user avatar
app.put('/api/auth/avatar', authenticateToken, avatarUpload.single('avatar'), async (req: any, res) => {
  console.log('Avatar upload endpoint called');
  try {
    const userId = req.user.userId;
    
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ error: 'No avatar file provided' });
    }

    console.log('File uploaded successfully:', {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Read file buffer and convert to base64 for database storage
    const fileBuffer = fs.readFileSync(req.file.path);
    const base64Data = fileBuffer.toString('base64');
    const contentType = req.file.mimetype;

    // Clean up temporary file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.log('Converted to base64, size:', base64Data.length, 'content type:', contentType);

    // Update user's avatar data in database (persistent across deployments)
    const result = await db.query(
      `UPDATE users 
       SET avatar_data = $1,
           avatar_content_type = $2
       WHERE user_id = $3 
       RETURNING user_id, tenant_id, email, role, first_name, last_name`,
      [base64Data, contentType, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    console.log('Avatar upload completed successfully for user:', user.email);
    
    res.json({
      message: 'Avatar updated successfully',
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        tenantId: user.tenant_id,
        avatarUrl: `/auth/avatar/${user.user_id}`, // Frontend proxy adds /api prefix
      },
    });

  } catch (error: any) {
    console.error('Avatar update error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('Cleaned up uploaded file after error');
      } catch (cleanupError) {
        console.error('Failed to clean up uploaded file:', cleanupError);
      }
    }
    
    res.status(500).json({ error: 'Failed to update avatar', details: error.message });
  }
});

// GET endpoint to serve avatars from database (persistent across deployments)
app.get('/api/auth/avatar/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await db.query(
      'SELECT avatar_data, avatar_content_type FROM users WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].avatar_data) {
      return res.status(404).json({ error: 'Avatar not found' });
    }

    const { avatar_data, avatar_content_type } = result.rows[0];

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(avatar_data, 'base64');

    // Set appropriate headers
    res.setHeader('Content-Type', avatar_content_type || 'image/jpeg');
    res.setHeader('Content-Length', imageBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.send(imageBuffer);
  } catch (error: any) {
    console.error('Avatar retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve avatar' });
  }
});

// Serve static files (avatars) with proper headers - DEPRECATED: Use database storage instead
app.use('/uploads', (req, res, next) => {
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, '../public/uploads')));

// Exercise API routes
app.use('/api/exercises', exerciseRoutes);

// Session API routes
app.use('/api/sessions', sessionsRoutes);

// Backup API routes (admin only)
app.use('/api/backups', backupRoutes);

// Email logs API routes (admin only)
app.use('/api/email-logs', emailLogsRoutes);

// tRPC API routes
app.use('/api/trpc', createExpressMiddleware({
  router: appRouter,
  createContext,
  onError: ({ error, path }) => {
    console.error(`❌ tRPC failed on ${path}:`, error);
  },
}));

// Note: Catch-all route removed to prevent interfering with REST endpoints
// 404 handling is done by Express automatically for unmatched routes

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
  
  // Initialize backup scheduler
  backupScheduler.start();
});

export default app;