import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// This would typically come from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-development-secret-key'

// In production, this would query your database
const ADMIN_USERS = [
  {
    id: 1,
    email: 'admin@rythm.app',
    name: 'System Administrator',
    role: 'super_admin',
    passwordHash: '$2b$10$uPwgy7I1bDAShgosEUGZ/eoFlNwrmwAMob4u18TZfPi9SVRWg1gQe' // admin123
  },
  {
    id: 2,
    email: 'orchestrator@rythm.app',
    name: 'Orchestrator',
    role: 'admin',
    passwordHash: '$2b$10$uPwgy7I1bDAShgosEUGZ/eoFlNwrmwAMob4u18TZfPi9SVRWg1gQe' // Password123
  }
]

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find admin user
    const adminUser = ADMIN_USERS.find(user => user.email === email)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Validate password using bcrypt
    const isValidPassword = await bcrypt.compare(password, adminUser.passwordHash)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        type: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Return user data and token
    return NextResponse.json({
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      },
      token
    })

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}