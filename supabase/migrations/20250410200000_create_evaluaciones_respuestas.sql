-- Crear tabla de evaluaciones_respuestas
CREATE TABLE IF NOT EXISTS evaluaciones_respuestas (
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

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX idx_evaluaciones_mensaje ON evaluaciones_respuestas(mensaje_id);
CREATE INDEX idx_evaluaciones_respuesta ON evaluaciones_respuestas(respuesta_id);
CREATE INDEX idx_evaluaciones_evaluador ON evaluaciones_respuestas(evaluador_id);

-- Función para actualizar el timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar automáticamente updated_at
CREATE TRIGGER update_evaluaciones_respuestas_updated_at
    BEFORE UPDATE ON evaluaciones_respuestas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();