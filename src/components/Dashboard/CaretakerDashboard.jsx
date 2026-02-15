import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../hooks/useAuth"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts"

export default function CaretakerDashboard() {
  const { user, role, logout, loading } = useAuth()

  const [patients, setPatients] = useState([])
  const [unassignedPatients, setUnassignedPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [medications, setMedications] = useState([])
  const [todayStatus, setTodayStatus] = useState({})
  const [adherence, setAdherence] = useState(0)
  const [chartData, setChartData] = useState([])
  const [alerts, setAlerts] = useState([])
  const [error, setError] = useState("")

  const todayISO = new Date().toISOString().split("T")[0]

  /* =========================
     GUARD
  ========================= */
  useEffect(() => {
    if (!loading && (!user || role !== "caretaker")) {
      setError("Unauthorized access")
    }
  }, [loading, user, role])

  /* =========================
     INITIAL LOAD
  ========================= */
  useEffect(() => {
    if (user && role === "caretaker") {
      loadPatients()
      loadUnassignedPatients()
      loadAlerts()
    }
  }, [user, role])

  /* =========================
     LOAD ASSIGNED PATIENTS
  ========================= */
  const loadPatients = async () => {
    const { data, error } = await supabase
      .from("patients")
      .select("id, name")
      .eq("caretaker_id", user.id)

    if (error) {
      setError("Failed to load patients")
    } else {
      setPatients(data || [])
    }
  }

  /* =========================
     LOAD UNASSIGNED PATIENTS
  ========================= */
  const loadUnassignedPatients = async () => {
    const { data, error } = await supabase
      .from("patients")
      .select("id, name")
      .is("caretaker_id", null)

    if (!error) setUnassignedPatients(data || [])
  }

  /* =========================
     ASSIGN PATIENT
  ========================= */
  const assignPatient = async (patientId) => {
    const { error } = await supabase
      .from("patients")
      .update({ caretaker_id: user.id })
      .eq("id", patientId)
      .is("caretaker_id", null)

    if (error) {
      alert("Patient already assigned or error occurred")
    } else {
      loadPatients()
      loadUnassignedPatients()
    }
  }

  /* =========================
     SELECT PATIENT
  ========================= */
  const selectPatient = async (patient) => {
    setSelectedPatient(patient)
    await loadMedicines(patient.id)
    await loadTodayStatus()
    await calculateAdherence(patient.id)
    await buildChart()
  }

  /* =========================
     MEDICINES
  ========================= */
  const loadMedicines = async (patientId) => {
    const { data, error } = await supabase
      .from("medications")
      .select("id, name, dosage")
      .eq("patient_id", patientId)

    if (!error) setMedications(data || [])
  }

  /* =========================
     TODAY STATUS
  ========================= */
  const loadTodayStatus = async () => {
    const { data } = await supabase
      .from("medication_logs")
      .select("medication_id")
      .eq("taken_date", todayISO)

    const map = {}
    data?.forEach((l) => (map[l.medication_id] = true))
    setTodayStatus(map)
  }

  /* =========================
     ADHERENCE %
  ========================= */
  const calculateAdherence = async (patientId) => {
    const fromDate = new Date(Date.now() - 6 * 86400000)
      .toISOString()
      .split("T")[0]

    const { data: meds } = await supabase
      .from("medications")
      .select("id")
      .eq("patient_id", patientId)

    const { data: logs } = await supabase
      .from("medication_logs")
      .select("taken_date")
      .gte("taken_date", fromDate)

    const expected = meds.length * 7
    const taken = logs?.length || 0

    setAdherence(expected === 0 ? 0 : Math.round((taken / expected) * 100))
  }

  /* =========================
     WEEKLY CHART
  ========================= */
  const buildChart = async () => {
    const fromDate = new Date(Date.now() - 6 * 86400000)
      .toISOString()
      .split("T")[0]

    const { data } = await supabase
      .from("medication_logs")
      .select("taken_date")
      .gte("taken_date", fromDate)

    const map = {}
    data?.forEach((l) => {
      map[l.taken_date] = (map[l.taken_date] || 0) + 1
    })

    const chart = [...Array(7)].map((_, i) => {
      const d = new Date(Date.now() - i * 86400000)
        .toISOString()
        .split("T")[0]
      return { date: d, taken: map[d] || 0 }
    }).reverse()

    setChartData(chart)
  }

  /* =========================
     ALERTS
  ========================= */
  const loadAlerts = async () => {
    const { data } = await supabase
      .from("alerts")
      .select("alert_date, message")
      .order("alert_date", { ascending: false })

    setAlerts(data || [])
  }

  /* =========================
     UI STATES
  ========================= */
  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  if (error) {
    return (
      <div className="p-6 text-red-600">
        {error}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">
          Caretaker Dashboard
        </h1>
        <button
          onClick={logout}
          className="text-sm text-red-600 underline"
        >
          Logout
        </button>
      </div>

      {/* Unassigned Patients */}
      <section className="bg-white rounded-xl shadow p-4 mb-6">
        <h2 className="font-semibold mb-3">Unassigned Patients</h2>
        {unassignedPatients.length === 0 && (
          <p className="text-gray-500 text-sm">No unassigned patients</p>
        )}
        {unassignedPatients.map((p) => (
          <div key={p.id} className="flex justify-between mb-2">
            <span>{p.name}</span>
            <button
              onClick={() => assignPatient(p.id)}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
            >
              Assign
            </button>
          </div>
        ))}
      </section>

      {/* Assigned Patients */}
      <section className="bg-white rounded-xl shadow p-4 mb-6">
        <h2 className="font-semibold mb-3">My Patients</h2>
        {patients.length === 0 && (
          <p className="text-gray-500 text-sm">No patients assigned</p>
        )}
        {patients.map((p) => (
          <div key={p.id} className="flex justify-between mb-2">
            <span>{p.name}</span>
            <button
              onClick={() => selectPatient(p)}
              className="text-blue-600 underline text-sm"
            >
              View
            </button>
          </div>
        ))}
      </section>

      {/* Selected Patient */}
      {selectedPatient && (
        <section className="bg-white rounded-xl shadow p-4 mb-6">
          <h2 className="text-xl font-semibold mb-2">
            {selectedPatient.name}
          </h2>

          <p className="mb-4">
            Adherence (7 days):{" "}
            <span
              className={`font-semibold ${
                adherence >= 80
                  ? "text-green-600"
                  : adherence < 60
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}
            >
              {adherence}%
            </span>
          </p>

          {/* Medicines */}
          <table className="w-full text-sm mb-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Medicine</th>
                <th className="p-2 text-left">Dosage</th>
                <th className="p-2 text-center">Today</th>
              </tr>
            </thead>
            <tbody>
              {medications.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="p-2">{m.name}</td>
                  <td className="p-2">{m.dosage}</td>
                  <td className="p-2 text-center">
                    {todayStatus[m.id] ? (
                      <span className="text-green-600">✔ Taken</span>
                    ) : (
                      <span className="text-red-600">✘ Missed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <XAxis
                dataKey="date"
                tickFormatter={(d) =>
                  new Date(d).toLocaleDateString("en-IN", {
                    weekday: "short",
                  })
                }
              />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="taken" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* Alerts */}
      <section className="bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold mb-3">Alerts</h2>
        {alerts.length === 0 && (
          <p className="text-gray-500 text-sm">No alerts 🎉</p>
        )}
        {alerts.map((a, i) => (
          <div key={i} className="text-sm text-red-700 mb-2">
            📅 {a.alert_date} — {a.message}
          </div>
        ))}
      </section>
    </div>
  )
}
