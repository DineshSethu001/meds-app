import { Link } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"

export default function NotFound() {
  const { role, isAuthenticated } = useAuth()

  const homePath =
    role === "patient"
      ? "/patient"
      : role === "caretaker"
      ? "/caretaker"
      : "/login"

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4 text-center">
      <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <p className="text-lg text-gray-600 mb-6">
        Oops! The page you’re looking for doesn’t exist.
      </p>

      <Link
        to={isAuthenticated ? homePath : "/login"}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Go Home
      </Link>
    </div>
  )
}
