// API Configuration
export { API_CONFIG, ENDPOINTS } from './config'

// API Client
export { apiClient } from './client'

// Types
export type * from './types/common'
export type * from './types/dashboard'

// Services
export { dashboardService } from './services/dashboard'
export * from './services/auth'
export * from './services/problem'
export * from './services/submission'

// Mock data (useful for testing)
export { MockDashboardService } from './mock/dashboard-service'
export * from './mock/dashboard-data'
