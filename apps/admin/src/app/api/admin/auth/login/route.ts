import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// This would typically come from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-development-secret-key'

// Admin tenant ID for system administrators
const ADMIN_TENANT_ID = '00000000-0000-0000-0000-000000000000'

// Helper function to query the database
async function queryDatabase(query: string, params: any[] = []) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://api.rythm.training'}/api/db-query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, params }),
  })
  
  if (!response.ok) {
    throw new Error('Database query failed')
  }
  
  return response.json()
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // First, try to authenticate against system admin users via direct API call
    const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://api.rythm.training'}/api/admin/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (apiResponse.ok) {
      const adminUser = await apiResponse.json()
      
      // Generate JWT token
      const token = jwt.sign(
        {
          userId: adminUser.user_id,
          email: adminUser.email,
          role: adminUser.role,
          type: 'admin',
          tenantId: ADMIN_TENANT_ID
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      )

      // Return user data and token
      return NextResponse.json({
        user: {
          id: adminUser.user_id,
          email: adminUser.email,
          name: `${adminUser.first_name} ${adminUser.last_name}`,
          role: adminUser.role
        },
        token
      })
    }

    // Fallback to hardcoded admin users for backward compatibility
    const FALLBACK_ADMIN_USERS = [
      {
        id: '00000000-0000-0000-0000-000000000001', // UUID format for admin-1
        email: 'admin@rythm.app',
        name: 'System Administrator',
        role: 'system_admin',
        passwordHash: '$2b$10$uPwgy7I1bDAShgosEUGZ/eoFlNwrmwAMob4u18TZfPi9SVRWg1gQe' // admin123
      },
      {
        id: '00000000-0000-0000-0000-000000000002', // UUID format for admin-2
        email: 'orchestrator@rythm.app',
        name: 'Orchestrator',
        role: 'system_admin',
        passwordHash: '$2b$10$uPwgy7I1bDAShgosEUGZ/eoFlNwrmwAMob4u18TZfPi9SVRWg1gQe' // Password123
      }
    ]

    const fallbackUser = FALLBACK_ADMIN_USERS.find(user => user.email === email)
    if (!fallbackUser) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Validate password using bcrypt
    const isValidPassword = await bcrypt.compare(password, fallbackUser.passwordHash)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate JWT token for fallback user
    const token = jwt.sign(
      {
        userId: fallbackUser.id,
        email: fallbackUser.email,
        role: fallbackUser.role,
        type: 'admin',
        tenantId: ADMIN_TENANT_ID
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Return user data and token
    return NextResponse.json({
      user: {
        id: fallbackUser.id,
        email: fallbackUser.email,
        name: fallbackUser.name,
        role: fallbackUser.role
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