-- Eliminar las funciones anteriores
DROP FUNCTION IF EXISTS guardar_evaluacion(UUID, UUID, UUID, INTEGER, TEXT);
DROP FUNCTION IF EXISTS obtener_evaluaciones(UUID);

-- Crear nueva función con manejo explícito de tipos
CREATE OR REPLACE FUNCTION guardar_evaluacion_v2(
    p_mensaje_id TEXT,
    p_respuesta_id TEXT,
    p_evaluador_id TEXT,
    p_puntuacion INTEGER,
    p_retroalimentacion TEXT DEFAULT NULL
) RETURNS json AS $$
DECLARE
    v_mensaje_uuid UUID;
    v_respuesta_uuid UUID;
    v_evaluador_uuid UUID;
    v_result evaluaciones_respuestas;
BEGIN
    -- Convertir explícitamente los IDs a UUID
    BEGIN
        v_mensaje_uuid := p_mensaje_id::UUID;
        v_respuesta_uuid := p_respuesta_id::UUID;
        v_evaluador_uuid := p_evaluador_id::UUID;
    EXCEPTION WHEN invalid_text_representation THEN
        RAISE EXCEPTION 'Invalid UUID format';
    END;

    -- Insertar o actualizar el registro
    INSERT INTO evaluaciones_respuestas (
        mensaje_id,
        respuesta_id,
        evaluador_id,
        puntuacion,
        retroalimentacion,
        created_at,
        updated_at
    )
    VALUES (
        v_mensaje_uuid,
        v_respuesta_uuid,
        v_evaluador_uuid,
        p_puntuacion,
        p_retroalimentacion,
        NOW(),
        NOW()
    )
    ON CONFLICT (mensaje_id, respuesta_id, evaluador_id)
    DO UPDATE SET
        puntuacion = EXCLUDED.puntuacion,
        retroalimentacion = EXCLUDED.retroalimentacion,
        updated_at = NOW()
    RETURNING * INTO v_result;

    -- Devolver el resultado como JSON
    RETURN row_to_json(v_result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear nueva función para obtener evaluaciones
CREATE OR REPLACE FUNCTION obtener_evaluaciones_v2(
    p_mensaje_id TEXT
) RETURNS json AS $$
DECLARE
    v_mensaje_uuid UUID;
BEGIN
    -- Convertir explícitamente el ID a UUID
    BEGIN
        v_mensaje_uuid := p_mensaje_id::UUID;
    EXCEPTION WHEN invalid_text_representation THEN
        RAISE EXCEPTION 'Invalid UUID format';
    END;

    -- Devolver las evaluaciones como JSON
    RETURN (
        SELECT json_agg(row_to_json(er))
        FROM (
            SELECT *
            FROM evaluaciones_respuestas
            WHERE mensaje_id = v_mensaje_uuid
            ORDER BY created_at DESC
        ) er
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;