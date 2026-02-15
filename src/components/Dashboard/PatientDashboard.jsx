import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../hooks/useAuth"
import { useNavigate } from "react-router-dom"

export default function PatientDashboard() {
  const { user, role, loading, logout } = useAuth()
  const navigate = useNavigate()

  const [patientId, setPatientId] = useState(null)
  const [medications, setMedications] = useState([])
  const [takenToday, setTakenToday] = useState({})
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const todayISO = new Date().toISOString().split("T")[0]
  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  /* =========================
     AUTH GUARD
  ========================= */
  useEffect(() => {
    if (loading) return

    if (!user || role !== "patient") {
      navigate("/login", { replace: true })
      return
    }

    loadPatientAndMeds()
  }, [loading, user, role])

  /* =========================
     LOGOUT
  ========================= */
  const handleLogout = async () => {
    await logout()
    navigate("/login", { replace: true })
  }

  /* =========================
     LOAD PATIENT + MEDS
  ========================= */
  const loadPatientAndMeds = async () => {
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (patientError) {
      setError("Patient record not found")
      return
    }

    setPatientId(patient.id)

    const { data: meds } = await supabase
      .from("medications")
      .select("id, name, dosage")
      .eq("patient_id", patient.id)

    setMedications(meds || [])
    await checkTakenToday(meds || [])
  }

  /* =========================
     CHECK TODAY STATUS
  ========================= */
  const checkTakenToday = async (meds) => {
    const { data: logs } = await supabase
      .from("medication_logs")
      .select("medication_id")
      .eq("taken_date", todayISO)

    const map = {}
    logs?.forEach((l) => {
      map[l.medication_id] = true
    })

    setTakenToday(map)
    generateMessage(meds, map)
  }

  /* =========================
     TOGGLE MEDICATION
  ========================= */
  const toggleTaken = async (medId) => {
    if (takenToday[medId]) {
      await supabase
        .from("medication_logs")
        .delete()
        .eq("medication_id", medId)
        .eq("taken_date", todayISO)

      setTakenToday((prev) => {
        const copy = { ...prev }
        delete copy[medId]
        return copy
      })
    } else {
      await supabase.from("medication_logs").insert({
        medication_id: medId,
        taken_date: todayISO,
      })

      setTakenToday((prev) => ({ ...prev, [medId]: true }))
    }
  }

  /* =========================
     MESSAGE GENERATOR
  ========================= */
  const generateMessage = (meds, map) => {
    if (meds.length === 0) {
      setMessage("ℹ️ No medicines assigned yet.")
      return
    }

    const missed = meds.filter((m) => !map[m.id])
    if (missed.length === 0) {
      setMessage("✅ Great job! All medicines taken today.")
    } else {
      setMessage(`⚠️ You missed ${missed.length} medicine(s) today.`)
    }
  }

  /* =========================
     UI STATES
  ========================= */
  if (loading) {
    return <div className="p-6">Loading dashboard...</div>
  }

  if (error) {
    return (
      <div className="p-6 text-red-600 font-medium">
        {error}
      </div>
    )
  }

  /* =========================
     MAIN UI
  ========================= */
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Patient Dashboard
          </h1>
          <p className="text-sm text-gray-500">📅 {todayLabel}</p>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Logout
        </button>
      </div>

      {/* Message */}
      <div className="mb-4 p-3 rounded bg-blue-50 text-blue-800">
        {message}
      </div>

      {/* Medicines */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Medicine</th>
              <th className="p-3 text-left">Dosage</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>

          <tbody>
            {medications.length === 0 && (
              <tr>
                <td
                  colSpan="3"
                  className="p-4 text-center text-gray-500"
                >
                  No medicines assigned
                </td>
              </tr>
            )}

            {medications.map((med) => (
              <tr key={med.id} className="border-t">
                <td className="p-3">{med.name}</td>
                <td className="p-3">{med.dosage}</td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => toggleTaken(med.id)}
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      takenToday[med.id]
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {takenToday[med.id] ? "✔ Taken" : "Mark Taken"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
