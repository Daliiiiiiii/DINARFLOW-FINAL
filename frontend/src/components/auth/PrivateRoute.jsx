import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const PrivateRoute = ({ children }) => {
    const { currentUser, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return <div>Loading...</div>
    }

    if (!currentUser) {
        // Redirect to login page but save the attempted url
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return children
}

export const AdminRoute = ({ children }) => {
    const { currentUser, loading, visualRole } = useAuth()
    const location = useLocation()

    if (loading) {
        return <div>Loading...</div>
    }

    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // Check if user is an admin/superadmin and is in admin view
    if ((currentUser.role !== 'admin' && currentUser.role !== 'superadmin') || visualRole !== 'admin') {
        return <Navigate to="/dashboard" replace />
    }

    return children
}

export const SuperAdminRoute = ({ children }) => {
    const { currentUser, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return <div>Loading...</div>
    }

    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (currentUser.role !== 'superadmin') {
        return <Navigate to="/dashboard" replace />
    }

    return children
}

export default PrivateRoute 