import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { signUp, signInWithRole } from "./authService"
import bgImage from "../../assets/img/med_1.png"


function Auth() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLogin, setIsLogin] = useState(true)
  const [message, setMessage] = useState("")
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(false)

  /* =========================
     SUBMIT HANDLER
  ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage("")

    if (!role) {
      setMessage("Please select a role")
      return
    }

    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await signInWithRole(email, password, role)

        if (error) {
          setMessage(error.message)
        } else {
          setMessage("Login successful ✅")
          navigate("/", { replace: true })
        }
      } else {
        const { error } = await signUp(email, password, role)

        if (error) {
          setMessage(error.message)
        } else {
          setMessage("📧 Verification email sent. Please verify before login.")
          setIsLogin(true)
        }
      }
    } catch (err) {
      setMessage("Something went wrong. Try again.")
    } finally {
      setLoading(false)
    }
  }

  /* =========================
     ROLE SELECTION
  ========================= */
  if (!role) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center relative"
        style={{
    backgroundImage: `url(${bgImage})`,
  }}
      >
        {/* Dark overlay */}

        <div className="relative bg-white/20 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-md text-center border border-white/30">
          <h2 className="text-3xl font-bold mb-8 text-white">
            Welcome 💊
          </h2>

          <div className="space-y-4">
            <button
              onClick={() => setRole("patient")}
              className="w-full bg-green-600 text-white py-4 rounded-xl text-lg hover:bg-green-700 transition"
            >
              💊 Patient Login
            </button>

            <button
              onClick={() => setRole("caretaker")}
              className="w-full bg-blue-600 text-white py-4 rounded-xl text-lg hover:bg-blue-700 transition"
            >
              👩‍⚕️ Caretaker Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* =========================
     LOGIN / SIGNUP FORM
  ========================= */
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center relative"
        style={{
    backgroundImage: `url(${bgImage})`,
  }}
    >
      {/* Dark overlay */}

      <form
  onSubmit={handleSubmit}
  className="relative bg-blue-50 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-blue-200"
>
  <button
    type="button"
    onClick={() => {
      setRole(null)
      setMessage("")
    }}
    className="text-sm text-blue-700 underline mb-4"
  >
    ← Back
  </button>

  <h2 className="text-2xl font-bold text-center mb-6 text-blue-900">
    {role === "caretaker" ? "Caretaker Access" : "Patient Access"}
  </h2>

  {/* Email */}
  <input
    type="email"
    placeholder="Email"
    className="w-full bg-white text-gray-800 placeholder-gray-400 border border-gray-300 p-3 mb-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    required
  />

  {/* Password */}
  <input
    type="password"
    placeholder="Password"
    className="w-full bg-white text-gray-800 placeholder-gray-400 border border-gray-300 p-3 mb-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
  />

  {/* Submit */}
  <button
    type="submit"
    disabled={loading}
    className={`w-full py-3 rounded-lg text-white font-semibold transition ${
      loading
        ? "bg-gray-400 cursor-not-allowed"
        : role === "patient"
        ? "bg-green-600 hover:bg-green-700"
        : "bg-blue-600 hover:bg-blue-700"
    }`}
  >
    {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
  </button>

  {/* Toggle */}
  <p
    className="text-center text-sm mt-6 cursor-pointer underline text-blue-700"
    onClick={() => setIsLogin(!isLogin)}
  >
    {isLogin
      ? "Need an account? Sign up"
      : "Already have an account? Login"}
  </p>

  {/* Message */}
  {message && (
    <p className="text-center text-red-600 mt-4 font-medium">
      {message}
    </p>
  )}
</form>

    </div>
  )
}

export default Auth
