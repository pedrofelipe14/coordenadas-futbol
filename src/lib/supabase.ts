import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Faltan las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. ' +
    'Creá un archivo .env en la raíz del proyecto (mirá .env.example).'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
