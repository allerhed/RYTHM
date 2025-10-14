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
  equipment_id?: string
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
  equipment_id?: string
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
  equipment_id?: string
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
  topMuscleGroups: { muscle_group: string; template_count: string }[]
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

interface EquipmentStats {
  totalEquipment: number
  activeEquipment: number
  equipmentByCategory: Array<{
    category: string
    count: string
  }>
  mostUsedEquipment: Array<{
    name: string
    category: string
    exercise_count: number
    template_count: number
    session_usage?: number
  }>
}

interface ExerciseTemplateStats {
  totalExerciseTemplates: number
  exerciseTemplatesByType: Array<{
    exercise_type: string
    count: string
  }>
  topMuscleGroups: Array<{
    muscle_group: string
    template_count: string
  }>
  recentExerciseTemplates: number
}

// Workout Template Interfaces
interface WorkoutTemplate {
  template_id: string
  name: string
  description?: string
  scope: 'user' | 'tenant' | 'system'
  exercises: TemplateExercise[]
  exercise_count: number
  created_at: string
  updated_at: string
  created_by_name?: string
  created_by_lastname?: string
  user_id?: string
}

interface TemplateExercise {
  exercise_id?: string
  name: string
  category: 'strength' | 'cardio' | 'hybrid'
  muscle_groups: string[]
  sets: number
  value_1_type?: string
  value_1_default?: string
  value_2_type?: string
  value_2_default?: string
  notes?: string
  rest_time?: string
  order: number
}

interface CreateWorkoutTemplateData {
  name: string
  description?: string
  scope: 'tenant' | 'system'
  exercises: TemplateExercise[]
}

interface UpdateWorkoutTemplateData {
  template_id: string
  name?: string
  description?: string
  exercises?: TemplateExercise[]
}

interface GetWorkoutTemplatesParams {
  search?: string
  scope?: 'all' | 'user' | 'tenant' | 'system'
  limit?: number
  offset?: number
}

interface WorkoutTemplatesResponse {
  templates: WorkoutTemplate[]
  totalCount: number
}

// Workout Session Interfaces
interface WorkoutSession {
  id: string
  name: string
  type: string
  duration: number
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  instructor: string
  participants: number
  createdAt: string
  status: 'completed' | 'in-progress'
  tenantId: string
  tenantName: string
  exerciseCount: number
  totalSets: number
  trainingLoad?: number
  notes?: string
}

interface GetWorkoutSessionsParams {
  page?: number
  limit?: number
  search?: string
  category?: 'strength' | 'cardio' | 'hybrid'
  tenant_id?: string
  completed_only?: boolean
  status?: 'all' | 'completed' | 'in-progress'
}

interface WorkoutSessionsResponse {
  sessions: WorkoutSession[]
  totalCount: number
  totalPages: number
  currentPage: number
}

interface WorkoutSessionStats {
  totalWorkouts: number
  activeWorkouts: number
  totalParticipants: number
  avgDuration: number
}

// Equipment Interfaces
interface Equipment {
  equipment_id: string
  name: string
  category: 'free_weights' | 'machines' | 'cardio' | 'bodyweight' | 'resistance' | 'other'
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
  exercise_count?: number
  template_count?: number
}

interface CreateEquipmentData {
  name: string
  category: 'free_weights' | 'machines' | 'cardio' | 'bodyweight' | 'resistance' | 'other'
  description?: string
  is_active?: boolean
}

interface UpdateEquipmentData {
  equipment_id: string
  name?: string
  category?: 'free_weights' | 'machines' | 'cardio' | 'bodyweight' | 'resistance' | 'other'
  description?: string
  is_active?: boolean
}

interface GetEquipmentParams {
  page?: number
  limit?: number
  search?: string
  category?: string
  active_only?: boolean
}

interface EquipmentResponse {
  equipment: Equipment[]
  totalCount: number
  totalPages: number
  currentPage: number
}

interface EquipmentStats {
  totalEquipment: number
  activeEquipment: number
  equipmentByCategory: { category: string; count: string }[]
  mostUsedEquipment: { name: string; category: string; exercise_count: number; template_count: number; session_usage?: number }[]
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl?: string) {
    // Use environment variable or provided baseUrl, fallback to production API for reliability
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || 'https://api.rythm.training'
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('admin_token')
    }
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    // Always get fresh token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    
    return headers
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }))
      
      // Extract tRPC error details including Zod validation errors
      let errorMessage = `HTTP ${response.status}`
      
      if (error.error?.message) {
        errorMessage = error.error.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      // Include Zod validation errors if present
      if (error.error?.data?.zodError) {
        const zodError = error.error.data.zodError
        console.error('Zod validation error:', zodError)
        
        // Format field errors for display
        if (zodError.fieldErrors) {
          const fieldErrors = Object.entries(zodError.fieldErrors)
            .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
            .join('; ')
          errorMessage += ` - Validation errors: ${fieldErrors}`
        }
      }
      
      console.error('API Error Response:', error)
      throw new Error(errorMessage)
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
      body: JSON.stringify({ json: userData }),
    })
    
    const result = await this.handleResponse(response)
    return result.result.data
  }

  async updateUser(id: string, userData: UpdateUserData): Promise<User> {
    const response = await fetch(`${this.baseUrl}/api/trpc/users.updateUser`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ json: { id, ...userData } }),
    })
    
    const result = await this.handleResponse(response)
    return result.result.data
  }

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/trpc/users.deleteUser`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ json: { id } }),
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
        body: JSON.stringify({ json: organizationData }),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    updateOrganization: async (organizationData: UpdateOrganizationData): Promise<Organization> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.updateTenant`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ json: organizationData }),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    deleteOrganization: async (tenant_id: string): Promise<{ success: boolean }> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.deleteTenant`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ json: { tenant_id } }),
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

    getExerciseTemplateStats: async (params: {
      timeRange?: '7d' | '30d' | '90d' | '1y' | 'all'
    } = {}): Promise<ExerciseTemplateStats> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.getExerciseTemplateStats?input=${encodeURIComponent(JSON.stringify(params))}`, {
        headers: this.getHeaders(),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    createExerciseTemplate: async (exerciseTemplateData: CreateExerciseTemplateData): Promise<ExerciseTemplate> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.createExerciseTemplate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ json: exerciseTemplateData }),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    updateExerciseTemplate: async (exerciseTemplateData: UpdateExerciseTemplateData): Promise<ExerciseTemplate> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.updateExerciseTemplate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ json: exerciseTemplateData }),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    deleteExerciseTemplate: async (params: { template_id: string }): Promise<{ success: boolean }> => {
      console.log('🗑️ deleteExerciseTemplate called with params:', params);
      
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.deleteExerciseTemplate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ json: params }),
      })
      
      console.log('📤 Request sent to:', `${this.baseUrl}/api/trpc/admin.deleteExerciseTemplate`);
      console.log('📦 Request body:', JSON.stringify({ json: params }));
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    // Analytics methods
    getAnalyticsDashboard: async (params: {
      timeRange?: '7d' | '30d' | '90d' | '1y' | 'all'
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
      timeRange?: '30d' | '90d' | '1y' | 'all'
    } = {}): Promise<ExerciseAnalytics> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.getExerciseAnalytics?input=${encodeURIComponent(JSON.stringify(params))}`, {
        headers: this.getHeaders(),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    getTenantAnalytics: async (params: {
      timeRange?: '30d' | '90d' | '1y' | 'all'
    } = {}): Promise<TenantAnalytics[]> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.getTenantAnalytics?input=${encodeURIComponent(JSON.stringify(params))}`, {
        headers: this.getHeaders(),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    // Workout template management
    getWorkoutTemplates: async (params: GetWorkoutTemplatesParams = {}): Promise<WorkoutTemplate[]> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/workoutTemplates.list?input=${encodeURIComponent(JSON.stringify(params))}`, {
        headers: this.getHeaders(),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    getWorkoutTemplateCount: async (params: Omit<GetWorkoutTemplatesParams, 'limit' | 'offset'> = {}): Promise<number> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/workoutTemplates.count?input=${encodeURIComponent(JSON.stringify(params))}`, {
        headers: this.getHeaders(),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    getWorkoutTemplateById: async (templateId: string): Promise<WorkoutTemplate> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/workoutTemplates.getById?input=${encodeURIComponent(JSON.stringify({ templateId }))}`, {
        headers: this.getHeaders(),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    createWorkoutTemplate: async (data: CreateWorkoutTemplateData): Promise<any> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/workoutTemplates.create`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ json: data }),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    updateWorkoutTemplate: async (data: UpdateWorkoutTemplateData): Promise<any> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/workoutTemplates.update`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ json: data }),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    deleteWorkoutTemplate: async (templateId: string): Promise<any> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/workoutTemplates.delete`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ json: { templateId } }),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    getPerformanceMetrics: async (params: {
      timeRange?: '7d' | '30d' | '90d' | '1y' | 'all'
    } = {}): Promise<PerformanceMetrics> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.getPerformanceMetrics?input=${encodeURIComponent(JSON.stringify(params))}`, {
        headers: this.getHeaders(),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    // Workout session management
    getWorkoutSessions: async (params: GetWorkoutSessionsParams = {}): Promise<WorkoutSessionsResponse> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.getWorkoutSessions?input=${encodeURIComponent(JSON.stringify(params))}`, {
        headers: this.getHeaders(),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    getWorkoutSessionStats: async (): Promise<WorkoutSessionStats> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.getWorkoutSessionStats`, {
        headers: this.getHeaders(),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    // Equipment management
    getEquipment: async (params: GetEquipmentParams = {}): Promise<EquipmentResponse> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.getEquipment?input=${encodeURIComponent(JSON.stringify(params))}`, {
        headers: this.getHeaders(),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    getEquipmentStats: async (params: {
      timeRange?: '7d' | '30d' | '90d' | '1y' | 'all'
    } = {}): Promise<EquipmentStats> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.getEquipmentStats?input=${encodeURIComponent(JSON.stringify(params))}`, {
        headers: this.getHeaders(),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    createEquipment: async (equipmentData: CreateEquipmentData): Promise<Equipment> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.createEquipment`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ json: equipmentData }),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    updateEquipment: async (equipmentData: UpdateEquipmentData): Promise<Equipment> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.updateEquipment`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ json: equipmentData }),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    deleteEquipment: async (equipment_id: string): Promise<{ success: boolean }> => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.deleteEquipment`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ json: { equipment_id } }),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    // Export/Import API methods
    exportTenant: async (params: {
      tenantId: string;
      includeUsers?: boolean;
      includeWorkoutData?: boolean;
      format?: 'json' | 'sql' | 'csv';
      dateRange?: {
        start?: string;
        end?: string;
      };
    }) => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.exportTenant`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ json: params }),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    exportGlobalData: async (params: {
      format?: 'json' | 'sql' | 'csv';
    } = {}) => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.exportGlobalData`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ json: params }),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    exportAll: async (params: {
      format?: 'json' | 'sql' | 'csv';
      includeUsers?: boolean;
      includeWorkoutData?: boolean;
    } = {}) => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.exportAll`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ json: params }),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    importTenant: async (params: {
      data: any;
      mergeStrategy?: 'replace' | 'merge' | 'skip-existing';
      validateReferences?: boolean;
      createBackup?: boolean;
      dryRun?: boolean;
    }) => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.importTenant`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ json: params }),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    importGlobalData: async (params: {
      data: any;
      mergeStrategy?: 'replace' | 'merge' | 'skip-existing';
      validateReferences?: boolean;
      createBackup?: boolean;
      dryRun?: boolean;
    }) => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.importGlobalData`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ json: params }),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    getExportableTenants: async () => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.getExportableTenants`, {
        method: 'GET',
        headers: this.getHeaders(),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    // Backup Management
    listBackups: async () => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.listBackups`, {
        method: 'GET',
        headers: this.getHeaders(),
      })
      
      const result = await this.handleResponse(response)
      return result.result.data
    },

    restoreFromBackup: async (params: {
      backupId: string;
      confirmRestore: boolean;
    }) => {
      const response = await fetch(`${this.baseUrl}/api/trpc/admin.restoreFromBackup`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ json: params }),
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
  AnalyticsDashboard, UsageTrendData, ExerciseAnalytics, TenantAnalytics, PerformanceMetrics,
  WorkoutTemplate, TemplateExercise, CreateWorkoutTemplateData, UpdateWorkoutTemplateData, GetWorkoutTemplatesParams, WorkoutTemplatesResponse,
  WorkoutSession, GetWorkoutSessionsParams, WorkoutSessionsResponse, WorkoutSessionStats,
  Equipment, CreateEquipmentData, UpdateEquipmentData, GetEquipmentParams, EquipmentResponse, EquipmentStats
}