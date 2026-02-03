import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { authService, type User } from '@/api/services/auth'
import { apiClient } from '@/api/client'

interface AuthContextType {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (email: string, password: string) => Promise<boolean>
    logout: () => void
    signup: (name: string, email: string, password: string, otp: string) => Promise<boolean>
    sendVerificationOTP: (email: string) => Promise<boolean>
    updateUser: (updatedUser: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
    children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const isAuthenticated = !!user

    useEffect(() => {
        // Check for existing authentication on app load
        checkAuthStatus()
    }, [])

    const checkAuthStatus = async () => {
        try {
            const savedUser = localStorage.getItem('user')
            const accessToken = localStorage.getItem('accessToken')
            const refreshToken = localStorage.getItem('refreshToken')

            if (savedUser && accessToken) {
                setUser(JSON.parse(savedUser))
                apiClient.setAuthToken(accessToken)
                
                // Optionally verify token is still valid by fetching user
                try {
                    const currentUser = await authService.me()
                    setUser(currentUser)
                    localStorage.setItem('user', JSON.stringify(currentUser))
                } catch (error) {
                    // Token might be expired, try to refresh
                    if (refreshToken) {
                        try {
                            const { accessToken: newAccessToken } = await authService.refreshToken(refreshToken)
                            apiClient.setAuthToken(newAccessToken)
                            localStorage.setItem('accessToken', newAccessToken)
                            
                            const currentUser = await authService.me()
                            setUser(currentUser)
                            localStorage.setItem('user', JSON.stringify(currentUser))
                        } catch (refreshError) {
                            // Refresh failed, clear auth
                            clearAuth()
                        }
                    } else {
                        clearAuth()
                    }
                }
            }
        } catch (error) {
            console.error('Error checking auth status:', error)
            clearAuth()
        } finally {
            setIsLoading(false)
        }
    }

    const clearAuth = () => {
        setUser(null)
        apiClient.clearAuthToken()
        localStorage.removeItem('user')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
    }

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            setIsLoading(true)

            const response = await authService.login(email, password)
            
            setUser(response.user)
            apiClient.setAuthToken(response.tokens.accessToken)
            
            localStorage.setItem('user', JSON.stringify(response.user))
            localStorage.setItem('accessToken', response.tokens.accessToken)
            localStorage.setItem('refreshToken', response.tokens.refreshToken)

            return true
        } catch (error) {
            console.error('Login error:', error)
            return false
        } finally {
            setIsLoading(false)
        }
    }

    const sendVerificationOTP = async (email: string): Promise<boolean> => {
        try {
            await authService.sendVerificationOTP(email)
            return true
        } catch (error) {
            console.error('Send OTP error:', error)
            throw error // Re-throw to let the component display the actual error message
        }
    }

    const signup = async (name: string, email: string, password: string, otp: string): Promise<boolean> => {
        try {
            setIsLoading(true)

            const response = await authService.completeRegistration({
                name,
                email,
                password,
                otp,
                role: 'USER'
            })

            setUser(response.user)
            apiClient.setAuthToken(response.tokens.accessToken)
            
            localStorage.setItem('user', JSON.stringify(response.user))
            localStorage.setItem('accessToken', response.tokens.accessToken)
            localStorage.setItem('refreshToken', response.tokens.refreshToken)

            return true
        } catch (error) {
            console.error('Signup error:', error)
            return false
        } finally {
            setIsLoading(false)
        }
    }

    const logout = async () => {
        try {
            await authService.logout()
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            clearAuth()
        }
    }

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser)
        localStorage.setItem('user', JSON.stringify(updatedUser))
    }

    const value: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        signup,
        sendVerificationOTP,
        updateUser
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
