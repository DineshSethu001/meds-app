import { supabase } from "../../lib/supabase"

export const addMedication = async (name, dosage, userId) => {
  const { data, error } = await supabase
    .from("medications")
    .insert([
      {
        name,
        dosage,
        user_id: userId,
      },
    ])

  return { data, error }
}

export const getMedications = async (userId) => {
  const { data, error } = await supabase
    .from("medications")
    .select("*")
    .eq("user_id", userId)

  return { data, error }
}
