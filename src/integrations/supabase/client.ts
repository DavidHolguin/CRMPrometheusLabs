// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Implementación de patrón singleton para evitar múltiples instancias de GoTrueClient
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true, // Mantener la sesión entre recargas
        storageKey: 'supabase-auth' // Clave única para el almacenamiento
      }
    })
  }
  return supabaseInstance
}

// Exportamos una instancia para compatibilidad con código existente
export const supabase = getSupabaseClient()
