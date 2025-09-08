import { Request } from 'express'

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userId: string
      tenantId: string
      tenant_id: string
      role: string
      email: string
    }
  }
}