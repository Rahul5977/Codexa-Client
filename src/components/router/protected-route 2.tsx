import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { ReactNode } from 'react'

type UserRole = 'USER' | 'ADMIN' | 'STUDENT' | 'TEACHER'

interface ProtectedRouteProps {
    children: ReactNode
    allowedRoles?: UserRole[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { isAuthenticated, isLoading, user } = useAuth()
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

    // Check role-based access
    if (allowedRoles && allowedRoles.length > 0) {
        if (!user || !allowedRoles.includes(user.role as UserRole)) {
            // Redirect to forbidden page if user doesn't have required role
            return <Navigate to="/errors/forbidden" replace />
        }
    }

    return <>{children}</>
}

interface PublicRouteProps {
    children: ReactNode
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading, user } = useAuth()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        )
    }

    if (isAuthenticated) {
        // Redirect authenticated users to their role-based dashboard
        const dashboardPath = user?.role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard'
        return <Navigate to={dashboardPath} replace />
    }

    return <>{children}</>
}
