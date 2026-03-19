import { API_CONFIG, ENDPOINTS, type HttpMethod } from './config'
import type { ApiResponse, RequestOptions } from './types/common'

const rawAuthBase = API_CONFIG.AUTH_SERVICE_URL.replace(/\/$/, '')
const authApiBase = rawAuthBase.endsWith('/auth') ? rawAuthBase : `${rawAuthBase}/auth`

class ApiClient {
  private baseURL: string
  private timeout: number
  private authToken: string | null = null
  private isRefreshing: boolean = false
  private failedQueue: Array<{
    resolve: (value?: unknown) => void
    reject: (reason?: any) => void
  }> = []

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
    this.timeout = API_CONFIG.TIMEOUT
    // Try to load token from localStorage on initialization
    this.authToken = localStorage.getItem('accessToken')
  }

  private processQueue(error: Error | null, token: string | null = null) {
    this.failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error)
      } else {
        prom.resolve(token)
      }
    })
    this.failedQueue = []
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken')
    
    if (!refreshToken) {
      this.authToken = null
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      window.location.href = '/auth/sign-in'
      throw new Error('No refresh token available')
    }

    try {
      // Make refresh token request WITHOUT using this.request to avoid infinite loop
      const response = await fetch(`${authApiBase}${ENDPOINTS.AUTH.REFRESH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        await response.json().catch(() => ({}))
        
        // Only clear auth if refresh token is invalid (401/403)
        if (response.status === 401 || response.status === 403) {
          this.authToken = null
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          window.location.href = '/auth/sign-in'
        }
        
        throw new Error(`Token refresh failed: ${response.status}`)
      }

      const data = await response.json()
      const newAccessToken = data.data.accessToken

      // Update tokens
      this.authToken = newAccessToken
      localStorage.setItem('accessToken', newAccessToken)
      
      return newAccessToken
    } catch (error) {
      throw error
    }
  }

  private async request<T>(
    endpoint: string,
    method: HttpMethod = 'GET',
    body?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`
    const { headers = {}, params, timeout = this.timeout } = options

    // Always get the latest token from localStorage
    this.authToken = localStorage.getItem('accessToken')

    // Build query string from params
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }
    const queryString = searchParams.toString()
    const finalUrl = queryString ? `${url}?${queryString}` : url

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const requestHeaders: Record<string, string> = {
        ...headers,
      }

      // Only set Content-Type for non-FormData requests
      if (!(body instanceof FormData)) {
        requestHeaders['Content-Type'] = 'application/json'
      }

      // Add auth token if available
      if (this.authToken) {
        requestHeaders['Authorization'] = `Bearer ${this.authToken}`
      }

      const response = await fetch(finalUrl, {
        method,
        headers: requestHeaders,
        body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Handle 403 Forbidden - don't try to refresh, just throw error
        if (response.status === 403) {
          const errorMessage = errorData.message || errorData.error || 'Access forbidden'
          throw new Error(errorMessage)
        }
        
        // Handle 401 Unauthorized - try to refresh token
        if (response.status === 401 && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/sign-in')) {
          if (this.isRefreshing) {
            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject })
            }).then(() => {
              // Retry with new token
              return this.request<T>(endpoint, method, body, options)
            })
          }

          this.isRefreshing = true

          try {
            const newToken = await this.refreshAccessToken()
            this.processQueue(null, newToken)
            this.isRefreshing = false
            
            // Retry original request with new token
            return this.request<T>(endpoint, method, body, options)
          } catch (refreshError) {
            this.processQueue(refreshError as Error, null)
            this.isRefreshing = false
            throw refreshError
          }
        }

        const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }

      const data = await response.json()
      return data
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout')
        }
        throw error
      }
      
      throw new Error('An unknown error occurred')
    }
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'GET', undefined, options)
  }

  async post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'POST', body, options)
  }

  async put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'PUT', body, options)
  }

  async patch<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'PATCH', body, options)
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'DELETE', undefined, options)
  }

  // Utility method to set auth token
  setAuthToken(token: string) {
    this.authToken = token
    localStorage.setItem('accessToken', token)
  }

  // Utility method to clear auth token
  clearAuthToken() {
    this.authToken = null
    localStorage.removeItem('accessToken')
  }

  // Get current auth token
  getAuthToken(): string | null {
    return this.authToken
  }
}

export const apiClient = new ApiClient()