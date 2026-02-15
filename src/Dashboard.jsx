import { useEffect, useState } from "react"
import { supabase } from "../src/lib/supabase"
import { CaretakerDashboard,PatientDashboard } from "./components/Dashboard"

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)

  useEffect(() => {
  const { data: listener } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (session?.user) {
        setUser(session.user)

        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()

        setRole(data?.role)
      }
    }
  )

  return () => {
    listener.subscription.unsubscribe()
  }
}, [])


  if (!role) return <p>Loading...</p>

  return (
    <>
      {role === "caretaker" && <CaretakerDashboard />}
      {role === "patient" && <PatientDashboard patientId={user.id} />}
    </>
  )
}
