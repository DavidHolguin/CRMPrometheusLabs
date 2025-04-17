CREATE OR REPLACE FUNCTION public.get_user_auth_data(user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Verificar si el usuario tiene permisos para acceder a estos datos
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- Obtener datos del usuario desde auth.users
  SELECT json_build_object(
    'id', au.id,
    'email', au.email,
    'created_at', au.created_at,
    'last_sign_in_at', au.last_sign_in_at,
    'confirmed_at', au.confirmed_at
  ) INTO result
  FROM auth.users au
  WHERE au.id = user_id;

  RETURN result;
END;
$$;
