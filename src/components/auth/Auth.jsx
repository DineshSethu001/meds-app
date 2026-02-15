import { useState } from "react"
import { signUp, signIn } from "./authService"

function Auth() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLogin, setIsLogin] = useState(true)
  const [message, setMessage] = useState("")
  const [role, setRole] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()

  if (isLogin) {
  const { data, error } = await signIn(email, password)
  if (error) {
    setMessage(error.message)
  } else {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single()

    if (profile.role !== role) {
      setMessage("❌ Wrong role selected")
      await supabase.auth.signOut()
    } else {
      setMessage("Login successful ✅")
    }
  }
}

  }

  // =========================
  // ROLE SELECTION SCREEN
  // =========================
  if (!role) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-cover bg-center px-4 relative"
        style={{
          backgroundImage: "url('/src/assets/img/med_1.png')",
        }}
      >

        <div className="relative backdrop-blur-md p-10 rounded-3xl shadow-2xl w-full max-w-md text-center">

          <h2 className="text-3xl font-semibold mb-8 text-[#00B7B5]">
            Welcome 💊
          </h2>

          <div className="space-y-6">

            

            <button
              onClick={() => setRole("patient")}
              className="w-full bg-[#00B7B5] text-white text-xl py-4 rounded-2xl hover:opacity-90 transition"
            >
              💊 My Medication
            </button>
<button
              onClick={() => setRole("caretaker")}
              className="w-full bg-blue-700 text-white text-xl py-4 rounded-2xl hover:bg-blue-900 transition"
            >
              👩‍⚕️ Caretaker Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // =========================
  // LOGIN / SIGNUP FORM
  // =========================
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center px-4 relative"
      style={{
        backgroundImage: "url('/src/assets/img/med_1.png')",
      }}
    >
      <div className="absolute inset-0 bg-black/60"></div>

      <div className="relative w-full max-w-md backdrop-blur-md p-8 rounded-2xl shadow-2xl">

        {/* Back Button */}
        <button
          onClick={() => {
            setRole(null)
            setMessage("")
          }}
          className="text-sm text-[#EBF4DD] underline mb-4"
        >
          ← Back
        </button>

        {/* Header */}
        <div className="flex gap-2 justify-center items-center mb-6">
          <span className="text-4xl">💊</span>

          <h2 className="text-2xl tracking-wide leading-relaxed text-center text-[#00B7B5]">
            {isLogin ? "Login to Continue" : "Create Your Account"}
          </h2>

          <span className="text-4xl">❤️</span>
        </div>

        {/* Role Indicator */}
        <p className="text-center text-lg text-[#EBF4DD] mb-6">
          {role === "caretaker" ? "Caretaker Access" : "Patient Access"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Email */}
          <div>
            <label className="block text-lg font-semibold mb-2 text-[#EBF4DD]">
              Email Address
            </label>
            <input
              type="email"
              className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-lg font-semibold mb-2 text-[#EBF4DD]">
              Password
            </label>
            <input
              type="password"
              className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full cursor-pointer bg-blue-700 text-white text-xl py-4 rounded-lg hover:bg-blue-900 transition"
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        {/* Toggle Login / Signup */}
        <p
          className="text-lg text-center mt-6 cursor-pointer text-[#EBF4DD] font-medium"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin
            ? "Need an account? Sign up"
            : "Already registered? Login"}
        </p>

        {/* Message */}
        {message && (
          <p className="text-lg text-center mt-4 text-red-600 font-medium">
            {message}
          </p>
        )}

      </div>
    </div>
  )
}

export default Auth
