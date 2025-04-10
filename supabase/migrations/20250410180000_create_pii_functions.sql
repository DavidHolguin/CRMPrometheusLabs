
-- Function to create an anonymous token for a lead
CREATE OR REPLACE FUNCTION public.create_anonymous_token(p_lead_id UUID)
RETURNS TABLE (token_anonimo UUID) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token_anonimo UUID := gen_random_uuid();
BEGIN
  INSERT INTO public.pii_tokens (
    lead_id,
    token_anonimo,
    expires_at
  ) VALUES (
    p_lead_id,
    v_token_anonimo,
    NOW() + INTERVAL '30 days'
  );
  
  RETURN QUERY SELECT v_token_anonimo;
END;
$$;

-- Function to insert a sanitized message
CREATE OR REPLACE FUNCTION public.insert_mensaje_sanitizado(
  p_mensaje_id UUID,
  p_token_anonimo UUID,
  p_contenido_sanitizado TEXT,
  p_metadata_sanitizada JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.mensajes_sanitizados (
    mensaje_id,
    token_anonimo,
    contenido_sanitizado,
    metadata_sanitizada
  ) VALUES (
    p_mensaje_id,
    p_token_anonimo,
    p_contenido_sanitizado,
    p_metadata_sanitizada
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;
