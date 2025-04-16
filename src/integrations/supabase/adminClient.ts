// Admin client with service_role key for administrative operations
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrcmZhenNteHVpZ215ZWxseW9uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzE5MjQ2NywiZXhwIjoyMDU4NzY4NDY3fQ.uzoyLMCA6IGunKhGZRmPhgsGtFQutSvDSXXMHMm2YJ0'

export const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey)