// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ekrfazsmxuigmyellyon.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrcmZhenNteHVpZ215ZWxseW9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxOTI0NjcsImV4cCI6MjA1ODc2ODQ2N30.iucdBPZKLNNN5ttyfSj6dpSNVCJGlWSAGYFziPoDS4Q";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);