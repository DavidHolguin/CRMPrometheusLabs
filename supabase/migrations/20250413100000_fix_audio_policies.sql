-- Políticas para la tabla mensajes_audio
DO $$
BEGIN
    -- Verificar si la política ya existe
    IF NOT EXISTS (
        SELECT FROM pg_policies
        WHERE tablename = 'mensajes_audio' AND policyname = 'Permitir inserción de mensajes de audio'
    ) THEN
        -- Política para permitir inserción en la tabla mensajes_audio
        CREATE POLICY "Permitir inserción de mensajes de audio" ON public.mensajes_audio
            FOR INSERT
            TO authenticated, anon
            WITH CHECK (true);
    END IF;

    -- Verificar si la política ya existe
    IF NOT EXISTS (
        SELECT FROM pg_policies
        WHERE tablename = 'mensajes_audio' AND policyname = 'Permitir lectura de mensajes de audio'
    ) THEN
        -- Política para permitir selección en la tabla mensajes_audio
        CREATE POLICY "Permitir lectura de mensajes de audio" ON public.mensajes_audio
            FOR SELECT
            TO authenticated, anon
            USING (true);
    END IF;

    -- Verificar si la política ya existe
    IF NOT EXISTS (
        SELECT FROM pg_policies
        WHERE tablename = 'mensajes_audio' AND policyname = 'Permitir actualización de mensajes de audio'
    ) THEN
        -- Política para permitir actualización en la tabla mensajes_audio
        CREATE POLICY "Permitir actualización de mensajes de audio" ON public.mensajes_audio
            FOR UPDATE
            TO authenticated, anon
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Habilitar RLS en la tabla mensajes_audio si no está habilitada
ALTER TABLE public.mensajes_audio ENABLE ROW LEVEL SECURITY;

-- Configurar políticas de almacenamiento para el bucket mensajes-audio
-- Primero, asegurarse de que el bucket existe
DO $$
BEGIN
    -- Verificar si el bucket ya existe
    IF NOT EXISTS (
        SELECT FROM storage.buckets
        WHERE name = 'mensajes-audio'
    ) THEN
        -- Crear el bucket si no existe
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('mensajes-audio', 'mensajes-audio', true);
    ELSE
        -- Actualizar el bucket a público si ya existe pero no es público
        UPDATE storage.buckets
        SET public = true
        WHERE name = 'mensajes-audio';
    END IF;
END $$;

-- Política para permitir inserción de archivos en el bucket mensajes-audio
BEGIN;
    DROP POLICY IF EXISTS "Permitir subida de archivos de audio" ON storage.objects;

    CREATE POLICY "Permitir subida de archivos de audio"
    ON storage.objects
    FOR INSERT
    TO authenticated, anon
    WITH CHECK (
        bucket_id = 'mensajes-audio'
    );
END;

-- Política para permitir selección de archivos en el bucket mensajes-audio
BEGIN;
    DROP POLICY IF EXISTS "Permitir lectura de archivos de audio" ON storage.objects;

    CREATE POLICY "Permitir lectura de archivos de audio"
    ON storage.objects
    FOR SELECT
    TO authenticated, anon
    USING (
        bucket_id = 'mensajes-audio'
    );
END;