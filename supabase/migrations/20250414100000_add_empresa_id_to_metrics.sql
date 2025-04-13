-- Add empresa_id to metricas_calidad_llm table
ALTER TABLE metricas_calidad_llm ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- Comentario: Esta migración soluciona el error "column metricas_calidad_llm.empresa_id does not exist" 
-- que está afectando a la función fetchAIQualityData en el Dashboard
