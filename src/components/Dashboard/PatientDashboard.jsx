import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useNavigate } from "react-router-dom"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts"

export default function PatientDashboard() {
  /* -------------------- ROUTER -------------------- */
  const navigate = useNavigate()

  /* -------------------- DATE HELPERS -------------------- */
  const todayISO = new Date().toISOString().split("T")[0]

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric"
  })

  /* -------------------- STATE -------------------- */
  const [patientId, setPatientId] = useState(null)
  const [medications, setMedications] = useState([])
  const [takenMap, setTakenMap] = useState({})
  const [lastMarked, setLastMarked] = useState({})
  const [calendar, setCalendar] = useState({})
  const [message, setMessage] = useState("")
  const [time, setTime] = useState("")
  const [adherence, setAdherence] = useState(0)
  const [selectedDate, setSelectedDate] = useState(todayISO)

  /* -------------------- LIVE CLOCK -------------------- */
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit"
        })
      )
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  /* -------------------- LOAD DATA -------------------- */
  useEffect(() => {
    loadPatientAndMeds()
  }, [])

  const loadPatientAndMeds = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return navigate("/login")

    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", user.id)
      .single()

    setPatientId(patient.id)

    const { data: meds } = await supabase
      .from("medications")
      .select("id, name, dosage")
      .eq("patient_id", patient.id)

    setMedications(meds)

    await checkTakenForDate(meds, selectedDate)
    await loadCalendarHistory()
    await recalculateAdherence(meds)
  }

  /* -------------------- CHECK TAKEN -------------------- */
  const checkTakenForDate = async (meds, date) => {
    const { data: logs } = await supabase
      .from("medication_logs")
      .select("medication_id, created_at")
      .eq("taken_date", date)

    const map = {}
    const timeMap = {}

    logs?.forEach(l => {
      map[l.medication_id] = true
      timeMap[l.medication_id] = new Date(l.created_at)
        .toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    })

    setTakenMap(map)
    setLastMarked(timeMap)

    const missed = meds.filter(m => !map[m.id])
    setMessage(
      missed.length === 0
        ? "✅ All medicines taken"
        : `⚠️ ${missed.length} medicine(s) missed`
    )
  }

  /* -------------------- TOGGLE TAKEN -------------------- */
  const toggleTaken = async (medicationId) => {
    if (takenMap[medicationId]) {
      await supabase
        .from("medication_logs")
        .delete()
        .eq("medication_id", medicationId)
        .eq("taken_date", selectedDate)

      await supabase.from("alerts").insert({
        patient_id: patientId,
        alert_date: selectedDate,
        message: "Patient undone a medicine"
      })
    } else {
      await supabase.from("medication_logs").insert({
        medication_id: medicationId,
        taken_date: selectedDate
      })
    }

    await checkTakenForDate(medications, selectedDate)
    await loadCalendarHistory()
    await recalculateAdherence(medications)
  }

  /* -------------------- ADHERENCE -------------------- */
  const recalculateAdherence = async (meds) => {
    const fromDate = new Date(Date.now() - 6 * 86400000)
      .toISOString()
      .split("T")[0]

    const { data: logs } = await supabase
      .from("medication_logs")
      .select("taken_date")
      .gte("taken_date", fromDate)

    const total = meds.length * 7
    setAdherence(
      total === 0 ? 0 : Math.round((logs?.length / total) * 100)
    )
  }

  /* -------------------- CALENDAR -------------------- */
  const loadCalendarHistory = async () => {
    const fromDate = new Date(Date.now() - 6 * 86400000)
      .toISOString()
      .split("T")[0]

    const { data } = await supabase
      .from("medication_logs")
      .select("medication_id, taken_date")
      .gte("taken_date", fromDate)

    const map = {}
    data?.forEach(l => {
      if (!map[l.taken_date]) map[l.taken_date] = []
      map[l.taken_date].push(l.medication_id)
    })

    setCalendar(map)
  }

  /* -------------------- LOGOUT -------------------- */
const logout = async () => {
  await supabase.auth.signOut()
  window.location.reload()
}


  /* -------------------- CHART DATA -------------------- */
  const chartData = [...Array(7)].map((_, i) => {
    const date = new Date(Date.now() - (6 - i) * 86400000)
      .toISOString()
      .split("T")[0]
    return { date, taken: calendar[date]?.length || 0 }
  })

  /* -------------------- UI -------------------- */
  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow p-4 sm:p-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Patient Dashboard</h1>
            <p className="text-sm text-gray-500">📅 {todayLabel}</p>
            <p className="text-sm text-gray-500">🕘 {time}</p>
            <p className="font-semibold text-green-700">
              📊 Adherence: {adherence}%
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="date"
              value={selectedDate}
              max={todayISO}
              onChange={(e) => {
                setSelectedDate(e.target.value)
                checkTakenForDate(medications, e.target.value)
              }}
              className="border rounded px-3 py-2 text-sm"
            />
            <button
              onClick={logout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Message */}
        <div className="mb-4 p-3 rounded bg-blue-50 text-blue-800">
          {message}
        </div>

        {/* Medicines – Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {medications.map(m => (
            <div key={m.id} className="border rounded-lg p-4">
              <h3 className="font-semibold">{m.name}</h3>
              <p className="text-sm text-gray-500">{m.dosage}</p>
              <p className="text-xs text-gray-400">
                Last: {lastMarked[m.id] || "—"}
              </p>

              <button
                onClick={() => toggleTaken(m.id)}
                className={`mt-3 w-full px-4 py-3 rounded-lg font-semibold ${
                  takenMap[m.id]
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {takenMap[m.id] ? "✔ Taken" : "Take"}
              </button>
            </div>
          ))}
        </div>

        {/* Chart */}
        <h2 className="font-semibold mb-2">Weekly Trend</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <XAxis
              dataKey="date"
              tickFormatter={(d) =>
                new Date(d).toLocaleDateString("en-IN", { weekday: "short" })
              }
            />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="taken" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>

      </div>
    </div>
  )
}
