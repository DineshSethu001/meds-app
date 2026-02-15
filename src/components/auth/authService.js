import { supabase } from "../../lib/supabase"

export const signInWithRole = async (email, password, role) => {
  const res = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (res.error) return res

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", res.data.user.id)
    .single()

  if (data.role !== role) {
    await supabase.auth.signOut()
    return { error: { message: "❌ Wrong role selected" } }
  }

  return res
}

export const signUp = async (email, password, role) => {
  const res = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin
    }
  })

  if (res.error) return res

  // profile already created by trigger
  await supabase
    .from("profiles")
    .update({ role })
    .eq("id", res.data.user.id)

  return res
}

export const logout = async () => {
  await supabase.auth.signOut()
}


export const resetPassword = async (email) => {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/reset-password"
  })
}
