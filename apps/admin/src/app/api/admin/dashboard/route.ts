import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@rythm/db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-admin-secret-key'
const ADMIN_TENANT_ID = '00000000-0000-0000-0000-000000000000'

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
    
    // Get real dashboard statistics from database
    const statsQueries = await Promise.all([
      // Total users (excluding admin tenant)
      db.query('SELECT COUNT(*) as count FROM users WHERE tenant_id != $1', [ADMIN_TENANT_ID]),
      // Total tenants (excluding admin tenant)
      db.query('SELECT COUNT(*) as count FROM tenants WHERE tenant_id != $1', [ADMIN_TENANT_ID]),
      // Total sessions/workouts
      db.query('SELECT COUNT(*) as count FROM sessions WHERE tenant_id != $1', [ADMIN_TENANT_ID]),
      // Total exercises
      db.query('SELECT COUNT(*) as count FROM exercises'),
      // Active users in last 24 hours
      db.query(`SELECT COUNT(DISTINCT user_id) as count FROM sessions 
                WHERE created_at >= NOW() - INTERVAL '24 hours' 
                AND tenant_id != $1`, [ADMIN_TENANT_ID])
    ]);

    const stats = {
      totalUsers: parseInt(statsQueries[0].rows[0].count),
      totalTenants: parseInt(statsQueries[1].rows[0].count),
      totalWorkouts: parseInt(statsQueries[2].rows[0].count),
      totalExercises: parseInt(statsQueries[3].rows[0].count),
      activeUsers24h: parseInt(statsQueries[4].rows[0].count),
      systemHealth: 'good' as const
    };

    // Get recent activity from database
    const recentActivityResult = await db.query(`
      SELECT 
        'user_registration' as type,
        'New user registered: ' || email as message,
        'System' as user,
        created_at as timestamp,
        'info' as severity
      FROM users 
      WHERE tenant_id != $1 
      AND created_at >= NOW() - INTERVAL '24 hours'
      
      UNION ALL
      
      SELECT 
        'tenant_created' as type,
        'New organization created: ' || name as message,
        'Admin' as user,
        created_at as timestamp,
        'info' as severity
      FROM tenants 
      WHERE tenant_id != $1
      AND created_at >= NOW() - INTERVAL '7 days'
      
      UNION ALL
      
      SELECT 
        'workout_completed' as type,
        'Workout session completed' as message,
        u.email as user,
        s.created_at as timestamp,
        'info' as severity
      FROM sessions s
      JOIN users u ON u.user_id = s.user_id
      WHERE s.tenant_id != $1
      AND s.created_at >= NOW() - INTERVAL '24 hours'
      
      ORDER BY timestamp DESC
      LIMIT 10
    `, [ADMIN_TENANT_ID]);

    const recentActivity = recentActivityResult.rows.map((row, index) => ({
      id: index + 1,
      type: row.type,
      message: row.message,
      user: row.user,
      timestamp: row.timestamp,
      severity: row.severity
    }));
    
    // Return real dashboard stats
    return NextResponse.json({
      stats,
      recentActivity,
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