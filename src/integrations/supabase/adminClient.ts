// Admin client with service_role key for administrative operations
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { getSupabaseClient } from './client'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrcmZhenNteHVpZ215ZWxseW9uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzE5MjQ2NywiZXhwIjoyMDU4NzY4NDY3fQ.uzoyLMCA6IGunKhGZRmPhgsGtFQutSvDSXXMHMm2YJ0'

// Implementación de patrón singleton para el cliente admin
let supabaseAdminInstance: ReturnType<typeof createClient<Database>> | null = null

export const getSupabaseAdminClient = () => {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        storageKey: 'supabase-admin-auth' // Clave diferente para evitar conflictos
      }
    })
  }
  return supabaseAdminInstance
}

// Exportamos una instancia para compatibilidad con código existente
export const supabaseAdmin = getSupabaseAdminClient()