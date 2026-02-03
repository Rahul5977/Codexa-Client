// Base API configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  AUTH_SERVICE_URL: import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:3000/api/auth',
  TIMEOUT: 10000,
  MOCK_ENABLED: import.meta.env.VITE_USE_MOCK_DATA !== 'false', // Default to true for development
} as const

// API endpoints
export const ENDPOINTS = {
  // Authentication
  AUTH: {
    SEND_VERIFICATION_OTP: '/send-verification-otp',
    COMPLETE_REGISTRATION: '/complete-registration',
    REGISTER: '/register',
    LOGIN: '/login',
    LOGOUT: '/logout',
    REFRESH: '/refresh',
    ME: '/me',
    REQUEST_OTP: '/request-otp',
    VERIFY_OTP: '/verify-otp',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: (token: string) => `/reset-password/${token}`,
    UPDATE_PROFILE: '/profile',
    UPDATE_PROFILE_PICTURE: '/profile-picture',
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
