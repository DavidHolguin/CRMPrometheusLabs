-- Create agent metrics functions
-- Este archivo contiene funciones para calcular varias métricas de rendimiento de los agentes

-- Función para calcular el tiempo de respuesta promedio de un agente
CREATE OR REPLACE FUNCTION public.calcular_tiempo_respuesta_agente(p_agente_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tiempo_promedio NUMERIC;
BEGIN
  WITH conversaciones_agente AS (
    -- Identificar conversaciones donde el agente ha participado
    SELECT DISTINCT conversacion_id 
    FROM mensajes 
    WHERE remitente_id = p_agente_id
  ),
  mensajes_pareados AS (
    -- Para cada mensaje del lead, encontrar el siguiente mensaje del agente
    SELECT 
      lead_msg.conversacion_id,
      lead_msg.created_at AS tiempo_lead,
      MIN(agente_msg.created_at) AS tiempo_respuesta_agente
    FROM mensajes lead_msg
    JOIN mensajes agente_msg ON 
      lead_msg.conversacion_id = agente_msg.conversacion_id AND
      agente_msg.created_at > lead_msg.created_at AND
      agente_msg.remitente_id = p_agente_id AND
      agente_msg.origen = 'agente'
    WHERE 
      lead_msg.origen = 'lead' AND
      lead_msg.conversacion_id IN (SELECT conversacion_id FROM conversaciones_agente)
    GROUP BY 
      lead_msg.conversacion_id, 
      lead_msg.id, 
      lead_msg.created_at
  )
  -- Calcular el promedio de tiempo de respuesta en minutos
  SELECT AVG(EXTRACT(EPOCH FROM (tiempo_respuesta_agente - tiempo_lead)) / 60)
  INTO v_tiempo_promedio
  FROM mensajes_pareados;
  
  RETURN COALESCE(v_tiempo_promedio, 0);
END;
$$;

-- Función para calcular la tasa de conversión de leads por agente
CREATE OR REPLACE FUNCTION public.calcular_tasa_conversion_agente(p_agente_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_leads INTEGER;
  v_leads_convertidos INTEGER;
  v_tasa_conversion NUMERIC;
BEGIN
  -- Contar leads totales asignados al agente
  SELECT COUNT(*)
  INTO v_total_leads
  FROM leads
  WHERE asignado_a = p_agente_id;
  
  -- Contar leads en etapa "Cerrado Ganado"
  SELECT COUNT(*)
  INTO v_leads_convertidos
  FROM leads l
  JOIN pipeline_stages ps ON l.stage_id = ps.id
  WHERE 
    l.asignado_a = p_agente_id AND
    ps.nombre = 'Cerrado Ganado';
  
  -- Calcular tasa de conversión como porcentaje
  IF v_total_leads > 0 THEN
    v_tasa_conversion := (v_leads_convertidos::NUMERIC / v_total_leads) * 100;
  ELSE
    v_tasa_conversion := 0;
  END IF;
  
  RETURN v_tasa_conversion;
END;
$$;

-- Función para calcular la tasa de resolución de conversaciones por agente
CREATE OR REPLACE FUNCTION public.calcular_tasa_resolucion_agente(p_agente_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_conversaciones INTEGER;
  v_conversaciones_resueltas INTEGER;
  v_tasa_resolucion NUMERIC;
BEGIN
  -- Identificar conversaciones donde el agente ha participado
  WITH conversaciones_agente AS (
    SELECT DISTINCT conversacion_id 
    FROM mensajes 
    WHERE remitente_id = p_agente_id
  )
  
  -- Contar conversaciones totales del agente
  SELECT COUNT(*)
  INTO v_total_conversaciones
  FROM conversaciones_agente;
  
  -- Contar conversaciones resueltas (estado = 'cerrada' o similar)
  SELECT COUNT(*)
  INTO v_conversaciones_resueltas
  FROM conversaciones c
  WHERE 
    c.id IN (SELECT conversacion_id FROM conversaciones_agente) AND
    (c.estado = 'cerrada' OR c.estado = 'resuelta');
  
  -- Calcular tasa de resolución como porcentaje
  IF v_total_conversaciones > 0 THEN
    v_tasa_resolucion := (v_conversaciones_resueltas::NUMERIC / v_total_conversaciones) * 100;
  ELSE
    v_tasa_resolucion := 0;
  END IF;
  
  RETURN v_tasa_resolucion;
END;
$$;

-- Función para obtener estadísticas completas de un agente
CREATE OR REPLACE FUNCTION public.obtener_estadisticas_agente(p_agente_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_resultado JSON;
BEGIN
  SELECT json_build_object(
    'id', p.id,
    'nombre', p.full_name,
    'email', p.email,
    'total_leads_asignados', COALESCE(l.total_leads, 0),
    'leads_activos', COALESCE(l.leads_activos, 0),
    'leads_cerrados_ganados', COALESCE(l.leads_ganados, 0),
    'leads_cerrados_perdidos', COALESCE(l.leads_perdidos, 0),
    'total_conversaciones', COALESCE(c.total_conversaciones, 0),
    'conversaciones_activas', COALESCE(c.conversaciones_activas, 0),
    'total_mensajes_enviados', COALESCE(m.total_mensajes, 0),
    'tiempo_respuesta_promedio', COALESCE(calcular_tiempo_respuesta_agente(p_agente_id), 0),
    'tasa_conversion', COALESCE(calcular_tasa_conversion_agente(p_agente_id), 0),
    'tasa_resolucion', COALESCE(calcular_tasa_resolucion_agente(p_agente_id), 0),
    'evaluaciones', (
      SELECT json_build_object(
        'promedio', COALESCE(AVG(er.puntuacion), 0),
        'total_evaluaciones', COUNT(er.id)
      )
      FROM evaluaciones_respuestas er
      WHERE er.evaluador_id = p_agente_id
    )
  ) INTO v_resultado
  FROM profiles p
  LEFT JOIN (
    -- Estadísticas de leads
    SELECT 
      asignado_a,
      COUNT(*) AS total_leads,
      SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) AS leads_activos,
      SUM(CASE WHEN ps.nombre = 'Cerrado Ganado' THEN 1 ELSE 0 END) AS leads_ganados,
      SUM(CASE WHEN ps.nombre = 'Cerrado Perdido' THEN 1 ELSE 0 END) AS leads_perdidos
    FROM leads l
    LEFT JOIN pipeline_stages ps ON l.stage_id = ps.id
    WHERE asignado_a = p_agente_id
    GROUP BY asignado_a
  ) l ON p.id = l.asignado_a
  LEFT JOIN (
    -- Estadísticas de conversaciones
    SELECT 
      m.remitente_id,
      COUNT(DISTINCT m.conversacion_id) AS total_conversaciones,
      SUM(CASE WHEN c.estado NOT IN ('cerrada', 'resuelta') THEN 1 ELSE 0 END) AS conversaciones_activas
    FROM mensajes m
    JOIN conversaciones c ON m.conversacion_id = c.id
    WHERE m.remitente_id = p_agente_id AND m.origen = 'agente'
    GROUP BY m.remitente_id
  ) c ON p.id = c.remitente_id
  LEFT JOIN (
    -- Estadísticas de mensajes
    SELECT
      remitente_id,
      COUNT(*) AS total_mensajes
    FROM mensajes
    WHERE remitente_id = p_agente_id AND origen = 'agente'
    GROUP BY remitente_id
  ) m ON p.id = m.remitente_id
  WHERE p.id = p_agente_id;
  
  RETURN v_resultado;
END;
$$;

-- Crear tabla para almacenar métricas calculadas periódicamente
CREATE TABLE IF NOT EXISTS public.metricas_agente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agente_id UUID NOT NULL REFERENCES public.profiles(id),
  empresa_id UUID REFERENCES public.empresas(id),
  periodo_inicio TIMESTAMP WITH TIME ZONE,
  periodo_fin TIMESTAMP WITH TIME ZONE,
  metricas JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT fk_agente FOREIGN KEY (agente_id) REFERENCES public.profiles(id)
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_metricas_agente_agente_id ON public.metricas_agente(agente_id);
CREATE INDEX IF NOT EXISTS idx_metricas_agente_empresa_id ON public.metricas_agente(empresa_id);
CREATE INDEX IF NOT EXISTS idx_metricas_agente_periodo ON public.metricas_agente(periodo_inicio, periodo_fin);

-- Función para registrar métricas de agente periódicamente
CREATE OR REPLACE FUNCTION public.registrar_metricas_agente()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.metricas_agente (
    agente_id,
    empresa_id,
    periodo_inicio,
    periodo_fin,
    metricas
  )
  VALUES (
    NEW.remitente_id,
    (SELECT empresa_id FROM profiles WHERE id = NEW.remitente_id),
    date_trunc('day', NOW()) - interval '7 days',
    date_trunc('day', NOW()),
    (SELECT obtener_estadisticas_agente(NEW.remitente_id))
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Comentar trigger por ahora para evitar sobrecarga de cálculos
-- Descomentar si se desea actualizar métricas al enviar mensajes
/*
CREATE TRIGGER trigger_registrar_metricas_agente
AFTER INSERT ON mensajes
FOR EACH ROW
WHEN (NEW.origen = 'agente' AND (NEW.id)::text LIKE '%00000000%')
EXECUTE FUNCTION public.registrar_metricas_agente();
*/