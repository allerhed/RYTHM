import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-admin-secret-key'

// Mock data for demonstration - in production, this would query your database
const MOCK_STATS = {
  totalUsers: 2456,
  totalTenants: 23,
  totalWorkouts: 15847,
  totalExercises: 342,
  activeUsers24h: 189,
  systemHealth: 'good' as const
}

const MOCK_RECENT_ACTIVITY = [
  {
    id: 1,
    type: 'user_registration',
    message: 'New user registered',
    user: 'john.doe@example.com',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    severity: 'info' as const
  },
  {
    id: 2,
    type: 'tenant_created',
    message: 'New tenant created',
    user: 'admin@fitnessstudio.com',
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    severity: 'info' as const
  },
  {
    id: 3,
    type: 'system_error',
    message: 'Database connection timeout',
    user: 'system',
    timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    severity: 'warning' as const
  },
  {
    id: 4,
    type: 'workout_completed',
    message: 'Workout session completed',
    user: 'sarah.wilson@example.com',
    timestamp: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
    severity: 'info' as const
  }
]

function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization header')
  }

  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    if (decoded.type !== 'admin') {
      throw new Error('Invalid token type')
    }
    return decoded
  } catch (error) {
    throw new Error('Invalid token')
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = verifyAdminToken(request)
    
    // Return dashboard stats
    return NextResponse.json({
      stats: MOCK_STATS,
      recentActivity: MOCK_RECENT_ACTIVITY,
      adminUser: {
        id: admin.userId,
        email: admin.email,
        role: admin.role
      }
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
}