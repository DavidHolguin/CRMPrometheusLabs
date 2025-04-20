-- Crear una función RPC para actualizar los contadores de mensajes no leídos para un lead específico
-- Esta función será invocada después de marcar mensajes como leídos

CREATE OR REPLACE FUNCTION actualizar_contadores_mensajes_no_leidos(p_lead_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Actualizar los contadores en las tablas relacionadas
    -- Esta función asume que existe una tabla o vista llamada vista_leads_completa
    -- que tiene una columna mensajes_sin_leer que se usa en la interfaz de usuario

    -- Primero, obtener todas las conversaciones asociadas al lead
    WITH conversaciones_lead AS (
        SELECT id 
        FROM conversaciones 
        WHERE lead_id = p_lead_id
    ),
    -- Contar mensajes sin leer para cada conversación
    mensajes_sin_leer_count AS (
        SELECT 
            c.id as conversacion_id,
            COUNT(*) FILTER (WHERE m.leido = false AND (m.origen = 'lead' OR m.origen = 'user')) AS unread_count
        FROM 
            conversaciones_lead c
        LEFT JOIN
            mensajes m ON m.conversacion_id = c.id
        GROUP BY 
            c.id
    )
    -- Actualizar la tabla de conversaciones con el nuevo conteo
    UPDATE conversaciones
    SET unread_count = msc.unread_count
    FROM mensajes_sin_leer_count msc
    WHERE conversaciones.id = msc.conversacion_id;

    -- Si existe una tabla de caché para la vista_leads_completa, refrescarla
    -- Este es un ejemplo adaptativo; si no existe esta tabla, simplemente no hará nada
    BEGIN
        REFRESH MATERIALIZED VIEW IF EXISTS vista_leads_completa_cache;
    EXCEPTION
        WHEN undefined_table THEN
            -- La vista materializada no existe, no hacer nada
            NULL;
    END;
END;
$$;

-- Añadir permisos para que la función pueda ser llamada por usuarios autenticados
GRANT EXECUTE ON FUNCTION actualizar_contadores_mensajes_no_leidos(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION actualizar_contadores_mensajes_no_leidos(UUID) TO service_role;

