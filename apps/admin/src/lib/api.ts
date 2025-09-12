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
export type { User, CreateUserData, UpdateUserData, GetUsersParams, UsersResponse, UserStats }