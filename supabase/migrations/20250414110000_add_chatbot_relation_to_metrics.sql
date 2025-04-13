-- Add chatbot_id column and relationship to metricas_calidad_llm table
ALTER TABLE metricas_calidad_llm ADD COLUMN IF NOT EXISTS chatbot_id UUID REFERENCES chatbots(id);

-- Comentario: Esta migración soluciona el error
-- "Could not find a relationship between 'metricas_calidad_llm' and 'chatbot_id' in the schema cache"
-- que está afectando a la consulta en Dashboard.tsx