CREATE OR REPLACE FUNCTION public.get_data_granular(
  p_empresa_id UUID,
  p_fecha_inicio TIMESTAMP WITH TIME ZONE,
  p_fecha_fin TIMESTAMP WITH TIME ZONE,
  p_agrupar_por TEXT DEFAULT 'dia',
  p_canal_ids TEXT[] DEFAULT NULL
) RETURNS TABLE (
  periodo TEXT,
  fecha_hora TIMESTAMP WITH TIME ZONE,
  total_eventos INTEGER,
  total_leads INTEGER,
  total_conversaciones INTEGER,
  score_promedio NUMERIC
) AS $$
DECLARE
  v_formato_fecha TEXT;
BEGIN
  -- Definir el formato según la agrupación
  CASE p_agrupar_por
    WHEN 'hora' THEN v_formato_fecha := 'YYYY-MM-DD HH24:00';
    WHEN 'dia' THEN v_formato_fecha := 'YYYY-MM-DD';
    WHEN 'semana' THEN v_formato_fecha := 'YYYY-"W"IW';
    WHEN 'mes' THEN v_formato_fecha := 'YYYY-MM';
    WHEN 'trimestre' THEN v_formato_fecha := 'YYYY-"Q"Q';
    WHEN 'año' THEN v_formato_fecha := 'YYYY';
    ELSE v_formato_fecha := 'YYYY-MM-DD';
  END CASE;
  
  RETURN QUERY
  SELECT
    TO_CHAR(fea.created_at, v_formato_fecha) AS periodo,
    date_trunc(p_agrupar_por, fea.created_at) AS fecha_hora,
    COUNT(DISTINCT fea.evento_accion_id) AS total_eventos,
    COUNT(DISTINCT fea.lead_id) AS total_leads,
    COUNT(DISTINCT fea.conversacion_id) AS total_conversaciones,
    COALESCE(AVG(fea.valor_score), 0) AS score_promedio
  FROM
    fact_eventos_acciones fea
  WHERE
    fea.empresa_id = p_empresa_id
    AND fea.created_at BETWEEN p_fecha_inicio AND p_fecha_fin
    AND (p_canal_ids IS NULL OR fea.canal_id = ANY(p_canal_ids::uuid[]))
  GROUP BY
    periodo, fecha_hora
  ORDER BY
    fecha_hora;
END;
$$ LANGUAGE plpgsql;
