
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ekrfazsmxuigmyellyon.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrcmZhenNteHVpZ215ZWxseW9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxOTI0NjcsImV4cCI6MjA1ODc2ODQ2N30.iucdBPZKLNNN5ttyfSj6dpSNVCJGlWSAGYFziPoDS4Q";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Verify storage buckets exist rather than trying to create them automatically
const verifyStorageBuckets = async () => {
  try {
    // Check logos bucket
    const { data: logosData, error: logosError } = await supabase
      .storage
      .getBucket('logos');
      
    if (logosError) {
      console.error('Error verifying logos bucket:', logosError.message);
    } else {
      console.log('Logos bucket verified');
    }
    
    // Check avatars bucket
    const { data: avatarsData, error: avatarsError } = await supabase
      .storage
      .getBucket('avatars');
      
    if (avatarsError) {
      console.error('Error verifying avatars bucket:', avatarsError.message);
    } else {
      console.log('Avatars bucket verified');
    }
  } catch (error) {
    console.error('Error checking storage buckets:', error);
  }
};

// Verify buckets when the client is initialized
verifyStorageBuckets();

