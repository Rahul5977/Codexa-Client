import { apiClient } from '../client'
import { API_CONFIG, ENDPOINTS } from '../config'

// Types for authentication
export interface User {
  id: string
  email: string
  name: string
  role: string
  emailVerified: boolean
  image_url?: string
  bio?: string
  currentRating?: number
  createdAt?: string
  updatedAt?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginResponse {
  user: User
  tokens: AuthTokens
}

export interface RegisterResponse {
  user: User
  tokens: AuthTokens
}

export interface SendOTPResponse {
  expiresAt: string
}

export interface VerifyOTPResponse {
  verified: boolean
  type: string
  resetToken?: string
}

// Backend API response wrapper
interface ApiResponseWrapper<T> {
  statusCode: number
  data: T
  message: string
  success: boolean
}

// Auth API Service
export const authService = {
  /**
   * Send verification OTP to email (Step 1 of registration)
   */
  sendVerificationOTP: async (email: string): Promise<SendOTPResponse> => {
    const response = await apiClient.post<ApiResponseWrapper<SendOTPResponse>>(
      `${API_CONFIG.AUTH_SERVICE_URL}${ENDPOINTS.AUTH.SEND_VERIFICATION_OTP}`,
      { email }
    )
    return (response as any).data
  },

  /**
   * Complete registration after OTP verification (Step 2 of registration)
   */
  completeRegistration: async (data: {
    name: string
    email: string
    password: string
    otp: string
    role?: 'USER' | 'STUDENT' | 'TEACHER'
  }): Promise<RegisterResponse> => {
    const response = await apiClient.post<ApiResponseWrapper<RegisterResponse>>(
      `${API_CONFIG.AUTH_SERVICE_URL}${ENDPOINTS.AUTH.COMPLETE_REGISTRATION}`,
      data
    )
    return (response as any).data
  },

  /**
   * Login user
   */
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponseWrapper<LoginResponse>>(
      `${API_CONFIG.AUTH_SERVICE_URL}${ENDPOINTS.AUTH.LOGIN}`,
      { email, password }
    )
    return (response as any).data
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    await apiClient.post(
      `${API_CONFIG.AUTH_SERVICE_URL}${ENDPOINTS.AUTH.LOGOUT}`
    )
  },

  /**
   * Get current user profile
   */
  me: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponseWrapper<{ user: User }>>(
      `${API_CONFIG.AUTH_SERVICE_URL}${ENDPOINTS.AUTH.ME}`
    )
    return (response as any).data.user
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const response = await apiClient.post<ApiResponseWrapper<{ accessToken: string }>>(
      `${API_CONFIG.AUTH_SERVICE_URL}${ENDPOINTS.AUTH.REFRESH}`,
      { refreshToken }
    )
    return (response as any).data
  },

  /**
   * Request OTP for email verification or password reset
   */
  requestOTP: async (email: string, type: 'VERIFY_EMAIL' | 'RESET_PASSWORD' = 'VERIFY_EMAIL'): Promise<SendOTPResponse> => {
    const response = await apiClient.post<ApiResponseWrapper<SendOTPResponse>>(
      `${API_CONFIG.AUTH_SERVICE_URL}${ENDPOINTS.AUTH.REQUEST_OTP}`,
      { email, type }
    )
    return (response as any).data
  },

  /**
   * Verify OTP
   */
  verifyOTP: async (email: string, otp: string): Promise<VerifyOTPResponse> => {
    const response = await apiClient.post<ApiResponseWrapper<VerifyOTPResponse>>(
      `${API_CONFIG.AUTH_SERVICE_URL}${ENDPOINTS.AUTH.VERIFY_OTP}`,
      { email, otp }
    )
    return (response as any).data
  },

  /**
   * Forgot password - send reset OTP
   */
  forgotPassword: async (email: string): Promise<SendOTPResponse> => {
    const response = await apiClient.post<ApiResponseWrapper<SendOTPResponse>>(
      `${API_CONFIG.AUTH_SERVICE_URL}${ENDPOINTS.AUTH.FORGOT_PASSWORD}`,
      { email }
    )
    return (response as any).data
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token: string, password: string, confirmPassword: string): Promise<void> => {
    await apiClient.post(
      `${API_CONFIG.AUTH_SERVICE_URL}${ENDPOINTS.AUTH.RESET_PASSWORD(token)}`,
      { password, confirmPassword }
    )
  },
}
