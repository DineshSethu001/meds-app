import { useState } from "react"
import { supabase } from "../../lib/supabase"

export default function ResetPassword() {
  const [password, setPassword] = useState("")
  const [msg, setMsg] = useState("")

  const handleReset = async () => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setMsg(error.message)
    else setMsg("✅ Password updated successfully")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Reset Password</h2>

        <input
          type="password"
          placeholder="New password"
          className="w-full border p-3 mb-4 rounded"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleReset}
          className="w-full bg-black text-white py-3 rounded"
        >
          Update Password
        </button>

        {msg && <p className="mt-4 text-center">{msg}</p>}
      </div>
    </div>
  )
}
