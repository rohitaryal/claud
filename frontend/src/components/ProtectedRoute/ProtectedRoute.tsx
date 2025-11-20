import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { apiGetCurrentUser } from '../../utils/api'

interface ProtectedRouteProps {
    children: React.ReactNode
    requireAuth?: boolean // If true, redirect to login if not authenticated. If false, redirect to home if authenticated.
}

const ProtectedRoute = function ({ children, requireAuth = true }: ProtectedRouteProps) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await apiGetCurrentUser()
                setIsAuthenticated(response.success && !!response.user)
            } catch (error) {
                setIsAuthenticated(false)
            } finally {
                setLoading(false)
            }
        }
        checkAuth()
    }, [])

    if (loading) {
        return <div>Loading...</div>
    }

    if (requireAuth && !isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    if (!requireAuth && isAuthenticated) {
        return <Navigate to="/home" replace />
    }

    return <>{children}</>
}

export default ProtectedRoute

