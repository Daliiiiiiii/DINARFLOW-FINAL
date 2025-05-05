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

export default PrivateRoute 