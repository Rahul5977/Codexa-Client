import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

interface User {
    id: string
    email: string
    name: string
    role?: string
}

interface AuthContextType {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (email: string, password: string) => Promise<boolean>
    logout: () => void
    signup: (email: string, password: string, name: string) => Promise<boolean>
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

    const checkAuthStatus = () => {
        try {
            const savedUser = localStorage.getItem('user')
            const token = localStorage.getItem('token')

            if (savedUser && token) {
                setUser(JSON.parse(savedUser))
            }
        } catch (error) {
            console.error('Error checking auth status:', error)
            // Clear invalid data
            localStorage.removeItem('user')
            localStorage.removeItem('token')
        } finally {
            setIsLoading(false)
        }
    }

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            setIsLoading(true)

            // Simulate API call - replace with your actual authentication logic
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Mock authentication - replace with real API call
            if (email && password) {
                const mockUser: User = {
                    id: '1',
                    email,
                    name: email.split('@')[0],
                    role: 'user'
                }

                const mockToken = 'mock-jwt-token-' + Date.now()

                setUser(mockUser)
                localStorage.setItem('user', JSON.stringify(mockUser))
                localStorage.setItem('token', mockToken)

                return true
            }

            return false
        } catch (error) {
            console.error('Login error:', error)
            return false
        } finally {
            setIsLoading(false)
        }
    }

    const signup = async (email: string, password: string, name: string): Promise<boolean> => {
        try {
            setIsLoading(true)

            // Simulate API call - replace with your actual registration logic
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Mock registration - replace with real API call
            if (email && password && name) {
                const mockUser: User = {
                    id: '1',
                    email,
                    name,
                    role: 'user'
                }

                const mockToken = 'mock-jwt-token-' + Date.now()

                setUser(mockUser)
                localStorage.setItem('user', JSON.stringify(mockUser))
                localStorage.setItem('token', mockToken)

                return true
            }

            return false
        } catch (error) {
            console.error('Signup error:', error)
            return false
        } finally {
            setIsLoading(false)
        }
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('user')
        localStorage.removeItem('token')
    }

    const value: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        signup
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
