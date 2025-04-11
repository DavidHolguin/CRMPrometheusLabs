-- Función para guardar evaluación (insertar o actualizar)
CREATE OR REPLACE FUNCTION guardar_evaluacion(
    p_mensaje_id UUID,
    p_respuesta_id UUID,
    p_evaluador_id UUID,
    p_puntuacion INTEGER,
    p_retroalimentacion TEXT DEFAULT NULL
) RETURNS SETOF evaluaciones_respuestas AS $$
BEGIN
    RETURN QUERY
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
        p_mensaje_id,
        p_respuesta_id,
        p_evaluador_id,
        p_puntuacion,
        p_retroalimentacion,
        NOW(),
        NOW()
    )
    ON CONFLICT (mensaje_id, respuesta_id, evaluador_id)
    DO UPDATE SET
        puntuacion = p_puntuacion,
        retroalimentacion = p_retroalimentacion,
        updated_at = NOW()
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener evaluaciones
CREATE OR REPLACE FUNCTION obtener_evaluaciones(
    p_mensaje_id UUID
) RETURNS SETOF evaluaciones_respuestas AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM evaluaciones_respuestas
    WHERE mensaje_id = p_mensaje_id
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;