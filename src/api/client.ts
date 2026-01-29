import { API_CONFIG, type HttpMethod } from './config'
import type { ApiResponse, RequestOptions } from './types/common'

class ApiClient {
  private baseURL: string
  private timeout: number
  private authToken: string | null = null

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
    this.timeout = API_CONFIG.TIMEOUT
    // Try to load token from localStorage on initialization
    this.authToken = localStorage.getItem('accessToken')
  }

  private async request<T>(
    endpoint: string,
    method: HttpMethod = 'GET',
    body?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`
    const { headers = {}, params, timeout = this.timeout } = options

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
        'Content-Type': 'application/json',
        ...headers,
      }

      // Add auth token if available
      if (this.authToken) {
        requestHeaders['Authorization'] = `Bearer ${this.authToken}`
      }

      const response = await fetch(finalUrl, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
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
