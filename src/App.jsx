import { Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import ProtectedRoute from "./routes/ProtectedRoute"

import Auth from "./components/auth/Auth"
import RoleRedirect from "./routes/RoleRedirect"

import { PatientDashboard, CaretakerDashboard } from "./components/Dashboard"

export default function App() {
  return (
    <AuthProvider>
      <Routes>

        {/* ✅ ROOT ROUTE */}
        <Route path="/" element={<RoleRedirect />} />

        <Route path="/login" element={<Auth />} />

        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRole="patient">
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/caretaker"
          element={
            <ProtectedRoute allowedRole="caretaker">
              <CaretakerDashboard />
            </ProtectedRoute>
          }
        />

        {/* ✅ FALLBACK */}
        <Route path="*" element={<h2>Page Not Found</h2>} />

      </Routes>
    </AuthProvider>
  )
}
