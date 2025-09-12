interface User {
  id: string
  first_name?: string
  last_name?: string
  email: string
  role: 'athlete' | 'coach' | 'tenant_admin' | 'org_admin'
  created_at: string
  updated_at: string
  organization_id?: string
}

interface CreateUserData {
  first_name?: string
  last_name?: string
  email: string
  password: string
  role?: 'athlete' | 'coach' | 'tenant_admin' | 'org_admin'
  organization_id?: string
}

interface UpdateUserData {
  first_name?: string
  last_name?: string
  email?: string
  password?: string
  role?: 'athlete' | 'coach' | 'tenant_admin' | 'org_admin'
  organization_id?: string
}

interface GetUsersParams {
  page?: number
  limit?: number
  search?: string
  role?: 'athlete' | 'coach' | 'tenant_admin' | 'org_admin'
}

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface UserStats {
  total_users: string
  athletes: string
  coaches: string
  tenant_admins: string
  new_this_week: string
  new_this_month: string
}

interface ExerciseTemplate {
  template_id: string
  name: string
  muscle_groups: string[]
  equipment?: string
  exercise_category: string
  exercise_type: 'STRENGTH' | 'CARDIO'
  default_value_1_type: string
  default_value_2_type: string
  description?: string
  instructions?: string
  created_at: string
  updated_at?: string
}

interface CreateExerciseTemplateData {
  name: string
  muscle_groups: string[]
  equipment?: string
  exercise_category: string
  exercise_type: 'STRENGTH' | 'CARDIO'
  default_value_1_type: string
  default_value_2_type: string
  description?: string
  instructions?: string
}

interface UpdateExerciseTemplateData {
  template_id: string
  name?: string
  muscle_groups?: string[]
  equipment?: string
  exercise_category?: string
  exercise_type?: 'STRENGTH' | 'CARDIO'
  default_value_1_type?: string
  default_value_2_type?: string
  description?: string
  instructions?: string
}

interface GetExerciseTemplatesParams {
  page?: number
  limit?: number
  search?: string
  category?: string
  type?: string
}

interface ExerciseTemplatesResponse {
  exerciseTemplates: ExerciseTemplate[]
  totalCount: number
  totalPages: number
  currentPage: number
}

interface ExerciseTemplateStats {
  totalExerciseTemplates: number
  exerciseTemplatesByType: { exercise_type: string; count: string }[]
  topMuscleGroups: { muscle_group: string; count: string }[]
  recentExerciseTemplates: number
}

interface Organization {
  tenant_id: string
  name: string
  branding?: Record<string, any>
  created_at: string
  updated_at: string
  user_count?: number
  session_count?: number
  last_activity?: string
}

interface CreateOrganizationData {
  name: string
  branding?: Record<string, any>
}

interface UpdateOrganizationData {
  tenant_id: string
  name?: string
  branding?: Record<string, any>
}

interface GetOrganizationsParams {
  page?: number
  limit?: number
  search?: string
}

interface OrganizationsResponse {
  tenants: Organization[]
  totalCount: number
  totalPages: number
  currentPage: number
}

interface AnalyticsDashboard {
  activeUsers: {
    value: number
    change?: {
      value: string
      type: 'positive' | 'negative'
    } | null
  }
  totalSessions: {
    value: number
    change?: {
      value: string
      type: 'positive' | 'negative'
    } | null
  }
  avgSessionDuration: {
    value: number
    change?: {
      value: string
      type: 'positive' | 'negative'
    } | null
  }
  retentionRate: {
    value: number
    change?: {
      value: string
      type: 'positive' | 'negative'
    } | null
  }
  timeRange: string
}

interface UsageTrendData {
  period: string
  activeUsers: number
  totalSessions: number
  activeTenants: number
  avgDuration: number
}

interface ExerciseAnalytics {
  popularExercises: {
    name: string
    total_sets: string
    sessions_used: string
    unique_users: string
  }[]
  muscleGroupUsage: {
    muscle_group: string
    total_sets: string
    unique_users: string
  }[]
  categoryBreakdown: {
    category: string
    session_count: number
    unique_users: number
    avg_duration: number
  }[]
}

interface TenantAnalytics {
  tenantId: string
  tenantName: string
  activeUsers: number
  totalSessions: number
  avgSessionDuration: number
  lastActivity: string | null
  totalUsers: number
}

interface PerformanceMetrics {
  totalTenants: number
  totalUsers: number
  totalSessions: number
  totalExercises: number
  activeUsers24h: number
  sessions24h: number
  activeTenants24h: number
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('admin_token')
    }
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }
    
    return headers
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }
    return response.json()
  }

  // User management methods
  async getUsers(params: GetUsersParams = {}): Promise<UsersResponse> {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    const response = await fetch(`${this.baseUrl}/api/trpc/users.getUsers?input=${encodeURIComponent(JSON.stringify(params))}`, {
      headers: this.getHeaders(),
    })
    
    const result = await this.handleResponse(response)
    return result.result.data
  }

  async getUserById(id: string): Promise<User> {
    const response = await fetch(`${this.baseUrl}/api/trpc/users.getUserById?input=${encodeURIComponent(JSON.stringify({ id }))}`, {
      headers: this.getHeaders(),
    })
    
    const result = await this.handleResponse(response)
    return result.result.data
  }

  async createUser(userData: CreateUserData): Promise<User> {
    const response = await fetch(`${this.baseUrl}/api/trpc/users.createUser`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    })
    
    const result = await this.handleResponse(response)
    return result.result.data
  }

  async updateUser(id: string, userData: UpdateUserData): Promise<User> {
    const response = await fetch(`${this.baseUrl}/api/trpc/users.updateUser`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ id, ...userData }),
    })
    
    const result = await this.handleResponse(response)
    return result.result.data
  }

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/trpc/users.deleteUser`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ id }),
    })
    
    const result = await this.handleResponse(response)
    return result.result.data
  }

  async getUserStats(): Promise<UserStats> {
    const response = await fetch(`${this.baseUrl}/api/trpc/users.getUserStats`, {
      headers: this.getHeaders(),
    })
    
    const result = await this.handleResponse(response)
    return result.result.data
  }

  // Admin methods
  admin = {
    // Organization/Tenant management
    getOrganizations: async (params: GetOrganizationsParams = {}): Promise<OrganizationsResponse> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.getTenants?input=${encodeURIComponent(JSON.stringify(params))}`, {
        headers: this.getHeaders(),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    getOrganization: async (tenant_id: string): Promise<Organization> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.getTenant?input=${encodeURIComponent(JSON.stringify({ tenant_id }))}`, {
        headers: this.getHeaders(),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    createOrganization: async (organizationData: CreateOrganizationData): Promise<Organization> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.createTenant`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(organizationData),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    updateOrganization: async (organizationData: UpdateOrganizationData): Promise<Organization> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.updateTenant`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(organizationData),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    deleteOrganization: async (tenant_id: string): Promise<{ success: boolean }> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.deleteTenant`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ tenant_id }),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    getOrganizationUsers: async (tenant_id: string, params: { page?: number; limit?: number } = {}) => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.getTenantUsers?input=${encodeURIComponent(JSON.stringify({ tenant_id, ...params }))}`, {
        headers: this.getHeaders(),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    // Exercise template management
    getExerciseTemplates: async (params: GetExerciseTemplatesParams = {}): Promise<ExerciseTemplatesResponse> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.getExerciseTemplates?input=${encodeURIComponent(JSON.stringify(params))}`, {
        headers: this.getHeaders(),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    getExerciseTemplateStats: async (): Promise<ExerciseTemplateStats> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.getExerciseTemplateStats`, {
        headers: this.getHeaders(),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    createExerciseTemplate: async (exerciseTemplateData: CreateExerciseTemplateData): Promise<ExerciseTemplate> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.createExerciseTemplate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(exerciseTemplateData),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    updateExerciseTemplate: async (exerciseTemplateData: UpdateExerciseTemplateData): Promise<ExerciseTemplate> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.updateExerciseTemplate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(exerciseTemplateData),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    deleteExerciseTemplate: async (params: { template_id: string }): Promise<{ success: boolean }> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.deleteExerciseTemplate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(params),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    // Analytics methods
    getAnalyticsDashboard: async (params: {
      timeRange?: '7d' | '30d' | '90d' | '1y'
      compareToLast?: boolean
    } = {}): Promise<AnalyticsDashboard> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.getAnalyticsDashboard?input=${encodeURIComponent(JSON.stringify(params))}`, {
        headers: this.getHeaders(),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    getUsageTrends: async (params: {
      timeRange?: '7d' | '30d' | '90d'
      granularity?: 'hour' | 'day' | 'week'
    } = {}): Promise<UsageTrendData[]> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.getUsageTrends?input=${encodeURIComponent(JSON.stringify(params))}`, {
        headers: this.getHeaders(),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    getExerciseAnalytics: async (params: {
      timeRange?: '30d' | '90d' | '1y'
    } = {}): Promise<ExerciseAnalytics> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.getExerciseAnalytics?input=${encodeURIComponent(JSON.stringify(params))}`, {
        headers: this.getHeaders(),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    getTenantAnalytics: async (params: {
      timeRange?: '30d' | '90d' | '1y'
    } = {}): Promise<TenantAnalytics[]> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.getTenantAnalytics?input=${encodeURIComponent(JSON.stringify(params))}`, {
        headers: this.getHeaders(),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    getPerformanceMetrics: async (): Promise<PerformanceMetrics> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.getPerformanceMetrics`, {
        headers: this.getHeaders(),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    }
  }

  // Authentication methods
  async login(email: string, password: string) {
    const response = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    
    const result = await this.handleResponse(response)
    const { token, user } = result
    
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token)
      localStorage.setItem('admin_user', JSON.stringify(user))
    }
    
    return { token, user }
  }

  logout() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
    }
  }
}

export const apiClient = new ApiClient()
export type { 
  User, CreateUserData, UpdateUserData, GetUsersParams, UsersResponse, UserStats,
  ExerciseTemplate, CreateExerciseTemplateData, UpdateExerciseTemplateData, GetExerciseTemplatesParams, ExerciseTemplatesResponse, ExerciseTemplateStats,
  Organization, CreateOrganizationData, UpdateOrganizationData, GetOrganizationsParams, OrganizationsResponse,
  AnalyticsDashboard, UsageTrendData, ExerciseAnalytics, TenantAnalytics, PerformanceMetrics
}