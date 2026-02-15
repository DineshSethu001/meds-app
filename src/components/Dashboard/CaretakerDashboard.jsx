import { useEffect, useState } from "react"
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer
} from "recharts"
import { supabase } from "../../lib/supabase"

export default function CaretakerDashboard() {
    const [medications, setMedications] = useState([])
    const [search, setSearch] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedMed, setSelectedMed] = useState(null)
    const [chartData, setChartData] = useState([])

    const [showModal, setShowModal] = useState(false)
    const [editingMed, setEditingMed] = useState(null)

    const [formData, setFormData] = useState({
        name: "",
        dosage: "",
        patient_id: "",
        morning: false,
        afternoon: false,
        night: false
    })

    const rowsPerPage = 6

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        const { data } = await supabase
            .from("medications")
            .select("*, patients(name)")

        if (data) setMedications(data)
    }

    // 🔍 Search filter
    const filtered = medications.filter((m) =>
        m.patients?.name?.toLowerCase().includes(search.toLowerCase())
    )

    // 📄 Pagination
    const indexOfLast = currentPage * rowsPerPage
    const indexOfFirst = indexOfLast - rowsPerPage
    const currentRows = filtered.slice(indexOfFirst, indexOfLast)
    const totalPages = Math.ceil(filtered.length / rowsPerPage)

    // 🧠 Select Patient for Chart
    const handlePatientSelect = async (med) => {
        setSelectedMed(med)

        const today = new Date()
        const last7Days = new Date()
        last7Days.setDate(today.getDate() - 7)

        const { data: logs } = await supabase
            .from("medication_logs")
            .select("medication_id, taken_date")

        const recentLogs =
            logs?.filter(
                (log) =>
                    log.medication_id === med.id &&
                    new Date(log.taken_date) >= last7Days
            ) || []

        const totalDays = 7

        const calc = (enabled) =>
            enabled ? Math.round((recentLogs.length / totalDays) * 100) : 0

        setChartData([
            { name: "Morning", value: calc(med.morning) },
            { name: "Afternoon", value: calc(med.afternoon) },
            { name: "Night", value: calc(med.night) }
        ])
    }

    // ➕ Add Medicine
    const addMedicine = async () => {
        await supabase.from("medications").insert(formData)
        setShowModal(false)
        fetchData()
    }

    // ✏ Update Medicine
    const updateMedicine = async () => {
        if (!editingMed) return

        const { error } = await supabase
            .from("medications")
            .update({
                name: formData.name,
                dosage: formData.dosage,
                patient_id: formData.patient_id,
                morning: formData.morning,
                afternoon: formData.afternoon,
                night: formData.night
            })
            .eq("id", editingMed.id)

        if (error) {
            console.error("Update error:", error)
            alert("Failed to update medicine")
            return
        }

        alert("Medicine updated successfully")

        setShowModal(false)
        setEditingMed(null)

        await fetchData()   // 🔥 refresh table from DB
    }


    return (
        <div className="flex min-h-screen bg-gray-100">

            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md p-6 hidden md:block">
                <h2 className="text-2xl font-bold mb-8">Care Panel</h2>
                <nav className="space-y-4 text-gray-600">
                    <div className="hover:text-blue-600 cursor-pointer">Dashboard</div>
                    <div className="hover:text-blue-600 cursor-pointer">Patients</div>
                    <div className="hover:text-blue-600 cursor-pointer">Reports</div>
                </nav>
            </aside>

            <main className="flex-1 p-8">

                {/* Header */}
                <div className="flex justify-between mb-6">
                    <h1 className="text-3xl font-bold">Caretaker Dashboard</h1>

                    <div className="flex space-x-4">
                        <input
                            type="text"
                            placeholder="Search patient..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="border px-4 py-2 rounded-lg shadow-sm"
                        />

                        <button
                            onClick={() => {
                                setEditingMed(null)
                                setFormData({
                                    name: "",
                                    dosage: "",
                                    patient_id: "",
                                    morning: false,
                                    afternoon: false,
                                    night: false
                                })
                                setShowModal(true)
                            }}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg"
                        >
                            + Add Medicine
                        </button>
                    </div>
                </div>

                {/* Chart */}
                <div className="bg-white p-6 rounded-xl shadow mb-8">
                    <h2 className="text-lg font-semibold mb-4">
                        {selectedMed
                            ? `${selectedMed.patients?.name} - 7 Day Adherence`
                            : "Select a Patient to View Adherence"}
                    </h2>

                    {selectedMed && (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    dataKey="value"
                                    outerRadius={100}
                                    label
                                    isAnimationActive
                                    animationDuration={1000}
                                >
                                    {chartData.map((entry, index) => {
                                        let color = "#3B82F6"
                                        if (entry.name === "Morning") color = "#10B981"
                                        if (entry.name === "Afternoon") color = "#F59E0B"
                                        if (entry.name === "Night") color = "#3B82F6"
                                        return <Cell key={index} fill={color} />
                                    })}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left text-gray-600">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3">Patient</th>
                                    <th className="px-6 py-3">Medicine</th>
                                    <th className="px-6 py-3">Dosage</th>
                                    <th className="px-6 py-3 text-center">Morning</th>
                                    <th className="px-6 py-3 text-center">Afternoon</th>
                                    <th className="px-6 py-3 text-center">Night</th>
                                    <th className="px-6 py-3 text-center">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y">
                                {currentRows.map((med) => (
                                    <tr
                                        key={med.id}
                                        onClick={() => handlePatientSelect(med)}
                                        className="hover:bg-gray-100 cursor-pointer"
                                    >
                                        <td className="px-6 py-4 font-medium">
                                            {med.patients?.name}
                                        </td>
                                        <td className="px-6 py-4">{med.name}</td>
                                        <td className="px-6 py-4">{med.dosage}</td>
                                        <td className="px-6 py-4 text-center">{med.morning ? "✔" : "—"}</td>
                                        <td className="px-6 py-4 text-center">{med.afternoon ? "✔" : "—"}</td>
                                        <td className="px-6 py-4 text-center">{med.night ? "✔" : "—"}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()

                                                    setEditingMed(med)

                                                    setFormData({
                                                        name: med.name,
                                                        dosage: med.dosage,
                                                        patient_id: med.patient_id,
                                                        morning: med.morning,
                                                        afternoon: med.afternoon,
                                                        night: med.night
                                                    })

                                                    setShowModal(true)
                                                }}
                                                className="bg-blue-500 text-white px-3 py-1 rounded"
                                            >
                                                Edit
                                            </button>

                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                <div className="flex justify-center mt-6 space-x-2">
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`px-4 py-2 rounded ${currentPage === i + 1
                                    ? "bg-blue-600 text-white"
                                    : "bg-white border"
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <div className="bg-white p-6 rounded-xl w-96">
                            <h2 className="text-xl font-bold mb-4">
                                {editingMed ? "Edit Medicine" : "Add Medicine"}
                            </h2>

                            <input
                                type="text"
                                placeholder="Medicine Name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                className="border w-full mb-3 p-2 rounded"
                            />

                            <input
                                type="text"
                                placeholder="Dosage"
                                value={formData.dosage}
                                onChange={(e) =>
                                    setFormData({ ...formData, dosage: e.target.value })
                                }
                                className="border w-full mb-3 p-2 rounded"
                            />

                            <div className="flex justify-between mb-4">
                                {["morning", "afternoon", "night"].map((time) => (
                                    <label key={time}>
                                        <input
                                            type="checkbox"
                                            checked={formData[time]}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    [time]: e.target.checked
                                                })
                                            }
                                        />{" "}
                                        {time}
                                    </label>
                                ))}
                            </div>

                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border rounded"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={editingMed ? updateMedicine : addMedicine}
                                    className="px-4 py-2 bg-blue-600 text-white rounded"
                                >
                                    Save
                                </button>

                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    )
}
