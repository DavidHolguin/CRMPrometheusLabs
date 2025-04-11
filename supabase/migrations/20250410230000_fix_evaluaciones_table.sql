-- Iniciar transacción
BEGIN;

-- Renombrar la tabla existente
ALTER TABLE IF EXISTS evaluaciones_respuestas RENAME TO evaluaciones_respuestas_old;

-- Crear la nueva tabla con la estructura correcta
CREATE TABLE evaluaciones_respuestas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mensaje_id UUID NOT NULL,
    respuesta_id UUID NOT NULL,
    evaluador_id UUID NOT NULL,
    puntuacion INTEGER NOT NULL CHECK (puntuacion >= 0 AND puntuacion <= 10),
    retroalimentacion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT fk_mensaje FOREIGN KEY (mensaje_id) REFERENCES mensajes(id) ON DELETE CASCADE,
    CONSTRAINT fk_respuesta FOREIGN KEY (respuesta_id) REFERENCES mensajes(id) ON DELETE CASCADE,
    CONSTRAINT fk_evaluador FOREIGN KEY (evaluador_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT unique_evaluacion UNIQUE (mensaje_id, respuesta_id, evaluador_id)
);

-- Copiar los datos existentes si es posible
DO $$
BEGIN
    BEGIN
        INSERT INTO evaluaciones_respuestas (
            id, mensaje_id, respuesta_id, evaluador_id, puntuacion, 
            retroalimentacion, created_at, updated_at
        )
        SELECT 
            id::UUID,
            mensaje_id::UUID,
            respuesta_id::UUID,
            evaluador_id::UUID,
            puntuacion,
            retroalimentacion,
            created_at,
            updated_at
        FROM evaluaciones_respuestas_old;
    EXCEPTION WHEN OTHERS THEN
        -- Si hay error al copiar los datos, continuamos sin ellos
        RAISE NOTICE 'No se pudieron migrar los datos antiguos: %', SQLERRM;
    END;
END $$;

-- Eliminar la tabla antigua
DROP TABLE IF EXISTS evaluaciones_respuestas_old;

-- Recrear índices
CREATE INDEX idx_evaluaciones_mensaje ON evaluaciones_respuestas(mensaje_id);
CREATE INDEX idx_evaluaciones_respuesta ON evaluaciones_respuestas(respuesta_id);
CREATE INDEX idx_evaluaciones_evaluador ON evaluaciones_respuestas(evaluador_id);

-- Recrear trigger para updated_at
CREATE OR REPLACE FUNCTION update_evaluaciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_evaluaciones_respuestas_updated_at
    BEFORE UPDATE ON evaluaciones_respuestas
    FOR EACH ROW
    EXECUTE FUNCTION update_evaluaciones_updated_at();

-- Confirmar la transacción
COMMIT;