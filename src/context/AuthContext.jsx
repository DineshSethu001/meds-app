import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUserAndRole = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          const { data, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", currentUser.id)
            .single()

          if (!error && data?.role) {
            setRole(data.role)
          } else {
            // 👇 IMPORTANT: role may be null, but loading must end
            setRole(null)
          }
        } else {
          setRole(null)
        }
      } catch (err) {
        console.error("Auth load error:", err)
        setUser(null)
        setRole(null)
      } finally {
        // ✅ ALWAYS stop loading
        setLoading(false)
      }
    }

    loadUserAndRole()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setLoading(true)

      try {
        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          const { data, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", currentUser.id)
            .single()

          if (!error && data?.role) {
            setRole(data.role)
          } else {
            setRole(null)
          }
        } else {
          setRole(null)
        }
      } catch (err) {
        console.error("Auth change error:", err)
        setUser(null)
        setRole(null)
      } finally {
        // ✅ ALWAYS stop loading
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        isAuthenticated: !!user,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider")
  }
  return context
}
