import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
    children: ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth()
    const location = useLocation()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        )
    }

    if (!isAuthenticated) {
        // Redirect to sign-in page with return url
        return <Navigate to="/auth/sign-in" state={{ from: location }} replace />
    }

    return <>{children}</>
}

interface PublicRouteProps {
    children: ReactNode
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        )
    }

    if (isAuthenticated) {
        // Redirect authenticated users away from auth pages
        return <Navigate to="/dashboard" replace />
    }

    return <>{children}</>
}
