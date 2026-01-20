// API Configuration
export { API_CONFIG, ENDPOINTS } from './config'

// API Client
export { apiClient } from './client'

// Types
export type * from './types/common'
export type * from './types/dashboard'

// Services
export { dashboardService } from './services/dashboard'

// Hooks
export * from '../hooks/api/use-dashboard'

// Mock data (useful for testing)
export { MockDashboardService } from './mock/dashboard-service'
export * from './mock/dashboard-data'
