import { Navigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import Spinner from "../components/ui/Spinner"

export default function RoleRedirect() {
  const { isAuthenticated, role, loading } = useAuth()

  if (loading) {
    return <Spinner label="Preparing dashboard" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (role === "patient") {
    return <Navigate to="/patient" replace />
  }

  if (role === "caretaker") {
    return <Navigate to="/caretaker" replace />
  }
  console.log("AUTH STATE →", {
  isAuthenticated,
  role,
  loading,
})


  // ✅ IMPORTANT: do NOT redirect blindly
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-600">
      Assigning role… please wait
    </div>
  )
}
