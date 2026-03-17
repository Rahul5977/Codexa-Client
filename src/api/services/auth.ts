import { apiClient } from "../client"
import { API_CONFIG, ENDPOINTS } from "../config"

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
  totalSolved?: number
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

export interface UsersListItem {
  id: string
  name: string
  email: string
  role: string
  image_url?: string
  totalSolved: number
  easySolved: number
  mediumSolved: number
  hardSolved: number
  streakCurrent: number
  streakMax: number
  currentRating: number
  isFriend: boolean
  isSelf: boolean
}

export interface UsersListFilters {
  search?: string
  role?: "USER" | "STUDENT" | "TEACHER" | "all"
  friend?: "all" | "true" | "false"
  minStreak?: number
}

export interface PublicUserProfile {
  id: string
  name: string
  email: string
  role: string
  image_url?: string
  bio?: string
  currentRating: number
  totalSolved: number
  easySolved: number
  mediumSolved: number
  hardSolved: number
  streakCurrent: number
  streakMax: number
  lastActive: string | null
  createdAt: string
  isFriend: boolean
  isSelf: boolean
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
    role?: "USER" | "STUDENT" | "TEACHER"
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
  refreshToken: async (
    refreshToken: string
  ): Promise<{ accessToken: string }> => {
    const response = await apiClient.post<
      ApiResponseWrapper<{ accessToken: string }>
    >(`${API_CONFIG.AUTH_SERVICE_URL}${ENDPOINTS.AUTH.REFRESH}`, {
      refreshToken,
    })
    return (response as any).data
  },

  /**
   * Request OTP for email verification or password reset
   */
  requestOTP: async (
    email: string,
    type: "VERIFY_EMAIL" | "RESET_PASSWORD" = "VERIFY_EMAIL"
  ): Promise<SendOTPResponse> => {
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
    const response = await apiClient.post<
      ApiResponseWrapper<VerifyOTPResponse>
    >(`${API_CONFIG.AUTH_SERVICE_URL}${ENDPOINTS.AUTH.VERIFY_OTP}`, {
      email,
      otp,
    })
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
  resetPassword: async (
    token: string,
    password: string,
    confirmPassword: string
  ): Promise<void> => {
    await apiClient.post(
      `${API_CONFIG.AUTH_SERVICE_URL}${ENDPOINTS.AUTH.RESET_PASSWORD(token)}`,
      { password, confirmPassword }
    )
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: {
    name: string
    bio?: string
  }): Promise<User> => {
    const response = await apiClient.put<ApiResponseWrapper<{ user: User }>>(
      `${API_CONFIG.AUTH_SERVICE_URL}${ENDPOINTS.AUTH.UPDATE_PROFILE}`,
      data
    )
    return (response as any).data.user
  },

  /**
   * Update profile picture
   */
  updateProfilePicture: async (file: File): Promise<User> => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await apiClient.put<ApiResponseWrapper<{ user: User }>>(
      `${API_CONFIG.AUTH_SERVICE_URL}${ENDPOINTS.AUTH.UPDATE_PROFILE_PICTURE}`,
      formData
    )
    return (response as any).data.user
  },

  /**
   * Get list of users for social discovery page
   */
  listUsers: async (filters?: UsersListFilters): Promise<UsersListItem[]> => {
    const params = new URLSearchParams()
    if (filters?.search?.trim()) params.append("search", filters.search.trim())
    if (filters?.role && filters.role !== "all") params.append("role", filters.role)
    if (filters?.friend && filters.friend !== "all") params.append("friend", filters.friend)
    if (typeof filters?.minStreak === "number" && filters.minStreak > 0) {
      params.append("minStreak", String(filters.minStreak))
    }

    const query = params.toString()
    const response = await apiClient.get<ApiResponseWrapper<UsersListItem[]>>(
      `${API_CONFIG.AUTH_SERVICE_URL}/users${query ? `?${query}` : ""}`
    )
    return (response as any).data
  },

  /**
   * Get public profile of a user (view-only)
   */
  getPublicUserProfile: async (userId: string): Promise<PublicUserProfile> => {
    const response = await apiClient.get<ApiResponseWrapper<PublicUserProfile>>(
      `${API_CONFIG.AUTH_SERVICE_URL}/users/${userId}`
    )
    return (response as any).data
  },

  /**
   * Toggle friend status with target user
   */
  toggleFriend: async (userId: string): Promise<{ userId: string; isFriend: boolean }> => {
    const response = await apiClient.post<ApiResponseWrapper<{ userId: string; isFriend: boolean }>>(
      `${API_CONFIG.AUTH_SERVICE_URL}/friends/${userId}/toggle`
    )
    return (response as any).data
  },
}
