// Base API configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  AUTH_SERVICE_URL: import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8000/api',
  TIMEOUT: 10000,
  MOCK_ENABLED: import.meta.env.VITE_USE_MOCK_DATA !== 'false', // Default to true for development
} as const

// API endpoints
export const ENDPOINTS = {
  // Authentication
  AUTH: {
    SEND_VERIFICATION_OTP: '/auth/send-verification-otp',
    COMPLETE_REGISTRATION: '/auth/complete-registration',
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    REQUEST_OTP: '/auth/request-otp',
    VERIFY_OTP: '/auth/verify-otp',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: (token: string) => `/auth/reset-password/${token}`,
  },
  // Dashboard
  DASHBOARD: {
    STATS: '/dashboard/stats',
    PROBLEMS: '/dashboard/problems',
    PERFORMANCE: '/dashboard/performance',
    STREAK: '/dashboard/streak',
    RECENT_SUBMISSIONS: '/dashboard/recent-submissions',
  },
  // Problems
  PROBLEMS: {
    LIST: '/problems',
    DETAIL: (id: number) => `/problems/${id}`,
    SUBMIT: (id: number) => `/problems/${id}/submit`,
    SOLUTIONS: (id: number) => `/problems/${id}/solutions`,
  },
  // User
  USER: {
    PROFILE: '/user/profile',
    STATS: '/user/stats',
    SUBMISSIONS: '/user/submissions',
  },
} as const

// HTTP methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
} as const

export type HttpMethod = typeof HTTP_METHODS[keyof typeof HTTP_METHODS]
