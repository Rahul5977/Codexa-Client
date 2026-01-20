// Base API response structure
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  error?: string
  timestamp: string
}

// Paginated response
export interface PaginatedResponse<T> {
  items: T[]
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// Error response
export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
}

// Request options
export interface RequestOptions {
  headers?: Record<string, string>
  params?: Record<string, any>
  timeout?: number
}

// Filter and pagination params
export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ProblemFilters {
  category?: string
  difficulty?: 'Easy' | 'Medium' | 'Hard'
  status?: 'solved' | 'attempted' | 'unsolved'
  search?: string
  tags?: string[]
}
