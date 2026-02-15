import { useEffect, useState } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { supabase } from "./lib/supabase"

import Auth from "./components/auth/Auth"
import PatientDashboard from "./components/Dashboard/PatientDashboard"
import CaretakerDashboard from "./components/Dashboard/CaretakerDashboard"

export default function App() {
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) fetchRole(data.session.user.id)
      setLoading(false)
    })

    // auth listener
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        if (session) fetchRole(session.user.id)
        else setRole(null)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const fetchRole = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()

    if (!error) setRole(data.role)
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <Routes>
      {/* LOGIN */}
      <Route
        path="/login"
        element={!session ? <Auth /> : <Navigate to="/" />}
      />

      {/* ROOT */}
      <Route
        path="/"
        element={
          !session ? (
            <Navigate to="/login" />
          ) : role === "patient" ? (
            <Navigate to="/patient" />
          ) : role === "caretaker" ? (
            <Navigate to="/caretaker" />
          ) : (
            <div className="p-6 text-red-600">
              Role not assigned
            </div>
          )
        }
      />

      {/* PATIENT */}
      <Route
        path="/patient"
        element={
          session && role === "patient"
            ? <PatientDashboard />
            : <Navigate to="/login" />
        }
      />

      {/* CARETAKER */}
      <Route
        path="/caretaker"
        element={
          session && role === "caretaker"
            ? <CaretakerDashboard />
            : <Navigate to="/login" />
        }
      />
    </Routes>
  )
}
