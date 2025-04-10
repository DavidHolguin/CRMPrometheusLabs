
// Supabase Edge Function to handle sanitized messages and PII tokens
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { url, method } = req
    const path = new URL(url).pathname

    // Get anonymous token for lead
    if (path === '/api/v1/tokens/anonymous' && method === 'POST') {
      const { lead_id } = await req.json()

      if (!lead_id) {
        return new Response(
          JSON.stringify({ error: 'Lead ID is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // Check if token already exists
      const { data: existingToken, error: fetchError } = await supabaseClient
        .from('pii_tokens')
        .select('token_anonimo')
        .eq('lead_id', lead_id)
        .eq('is_active', true)
        .maybeSingle()
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        return new Response(
          JSON.stringify({ error: fetchError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
      
      // Return existing token if found
      if (existingToken) {
        return new Response(
          JSON.stringify(existingToken),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Create a new token
      const { data: newToken, error: insertError } = await supabaseClient.rpc(
        'create_anonymous_token',
        { p_lead_id: lead_id }
      )
      
      if (insertError) {
        return new Response(
          JSON.stringify({ error: insertError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
      
      return new Response(
        JSON.stringify(newToken),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Store sanitized message
    if (path === '/api/v1/messages/sanitized' && method === 'POST') {
      const { mensaje_id, token_anonimo, contenido_sanitizado, metadata_sanitizada } = await req.json()

      if (!mensaje_id || !token_anonimo || !contenido_sanitizado) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // Store the sanitized message using direct insert instead of RPC
      const { data, error } = await supabaseClient
        .from('mensajes_sanitizados')
        .insert({
          mensaje_id,
          token_anonimo,
          contenido_sanitizado,
          metadata_sanitizada: metadata_sanitizada || {}
        })
        .select('id')
        .single()
      
      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
      
      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fallback for unknown routes
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
