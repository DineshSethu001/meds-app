import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import Spinner from "../components/ui/Spinner"

const ProtectedRoute = ({ children, allowedRole }) => {
  const { isAuthenticated, role, loading } = useAuth()

  if (loading) return <Spinner label="Preparing dashboard" />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/" replace />
  }

  if (!role) {
    return <div>Role missing</div>
  }

  return children
}

export default ProtectedRoute
