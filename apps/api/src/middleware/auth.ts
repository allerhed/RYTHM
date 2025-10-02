import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthUser {
  userId: string
  tenantId: string
  tenant_id: string
  role: string
  email: string
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' })
    }
    
    // Ensure tenant_id is available for backward compatibility
    const authUser = user as any
    authUser.tenant_id = authUser.tenantId
    
    req.user = authUser
    next()
  })
}

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as AuthUser | undefined

  if (!user) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  // Allow system_admin for now, can be restricted further if needed
  const adminRoles = ['system_admin', 'org_admin']
  if (!adminRoles.includes(user.role)) {
    return res.status(403).json({ error: 'Admin access required' })
  }

  next()
}