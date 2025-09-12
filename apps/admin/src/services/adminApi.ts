export interface AdminUser {
  id: number
  email: string
  name: string
  role: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  user: AdminUser
  token: string
}

export interface DashboardStats {
  totalUsers: number
  totalTenants: number
  totalWorkouts: number
  totalExercises: number
  activeUsers24h: number
  systemHealth: 'good' | 'warning' | 'error'
}

export interface ActivityItem {
  id: number
  type: string
  message: string
  user: string
  timestamp: Date
  severity: 'info' | 'warning' | 'error'
}

export interface DashboardData {
  stats: DashboardStats
  recentActivity: ActivityItem[]
  adminUser: AdminUser
}

class AdminApiService {
  private baseURL = '/api/admin'
  private token: string | null = null

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token)
    }
  }

  getToken(): string | null {
    if (this.token) return this.token
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('admin_token')
    }
    return this.token
  }

  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token')
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await this.makeRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    
    this.setToken(response.token)
    return response
  }

  async logout(): Promise<void> {
    try {
      await this.makeRequest('/auth/logout', {
        method: 'POST',
      })
    } finally {
      this.clearToken()
    }
  }

  async getDashboardData(): Promise<DashboardData> {
    const data = await this.makeRequest<DashboardData>('/dashboard')
    
    // Convert timestamp strings back to Date objects
    data.recentActivity = data.recentActivity.map(item => ({
      ...item,
      timestamp: new Date(item.timestamp)
    }))
    
    return data
  }

  isAuthenticated(): boolean {
    return !!this.getToken()
  }
}

export const adminApi = new AdminApiService()