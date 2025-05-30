import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Interfaces para los tipos de datos de marketing
export interface MarketingCampaign {
  id: string;
  empresa_id: string;
  nombre: string;
  descripcion: string;
  objetivo: string;
  presupuesto: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  plataformas: string[];
  audiencia_objetivo: Record<string, any>;
  kpis: Record<string, any>;
  resultados_resumen: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MarketingContent {
  id: string;
  empresa_id: string;
  tipo: string;
  categoria: string;
  contenido: string;
  longitud_caracteres: number;
  keywords: string[];
  is_active: boolean;
  engagement_score: number;
  performance_data: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MarketingUTM {
  id: string;
  empresa_id: string;
  campania_id: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  url_destino: string;
  url_completa: string;
  descripcion: string;
  qr_code_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarketingAudience {
  id: string;
  empresa_id: string;
  nombre: string;
  descripcion: string;
  segmento: string;
  tamano_estimado: number;
  caracteristicas: Record<string, any>;
  comportamiento: Record<string, any>;
  fuentes_datos: string[];
  valor_estimado: number;
  tasa_conversion: number;
  interacciones_promedio: number;
  created_at: string;
  updated_at: string;
}

export interface MarketingInsight {
  id: string;
  empresa_id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  fuente: string;
  prioridad: number;
  impacto_estimado: string;
  categoria: string;
  datos_relacionados: Record<string, any>;
  acciones_recomendadas: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarketingPlatformData {
  id: string;
  empresa_id: string;
  campania_id: string;
  nombre: string;
  impresiones: number;
  clics: number;
  conversiones: number;
  costo: number;
  ctr: number;
  // Campos adicionales específicos por plataforma
  [key: string]: any;
}

// Nuevas interfaces para eventos
export interface TipoEvento {
  tipo_evento_id: string;
  categoria: string;
  nombre: string;
  descripcion: string;
  impacto_score: number;
  requiere_seguimiento: boolean;
  grupo_analisis: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventoAccion {
  evento_accion_id: string;
  tiempo_id: number;
  empresa_id: string;
  tipo_evento_id: string;
  entidad_origen_id: string;
  entidad_destino_id: string;
  lead_id: string;
  agente_id: string;
  chatbot_id: string;
  canal_id: string;
  conversacion_id: string;
  mensaje_id: string;
  valor_score: number;
  duracion_segundos: number;
  resultado: string;
  estado_final: string;
  detalle: string;
  metadata: Record<string, any>;
  latitud: number;
  longitud: number;
  created_at: string;
  fecha?: string; // Campo adicional para facilitar el manejo de fechas en gráficos
  nombre_tipo_evento?: string; // Campo adicional que se llenará al unir con dim_tipos_eventos
  categoria_tipo_evento?: string; // Campo adicional que se llenará al unir con dim_tipos_eventos
}

export interface EventosSummary {
  categoria: string;
  total: number;
  porcentaje: number;
}

export interface EventosPorDia {
  fecha: string;
  total: number;
  por_categoria: Record<string, number>;
}

export interface MarketingFilterParams {
  fechaInicio?: string;
  fechaFin?: string;
  estado?: string;
  tipo?: string;
  categoria?: string;
  plataforma?: string;
  campania_id?: string;
  segmento?: string;
  query?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export const useMarketingData = () => {
  const { user } = useAuth();
  const empresaId = user?.companyId;
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [contents, setContents] = useState<MarketingContent[]>([]);
  const [utms, setUtms] = useState<MarketingUTM[]>([]);
  const [audiences, setAudiences] = useState<MarketingAudience[]>([]);
  const [insights, setInsights] = useState<MarketingInsight[]>([]);
  const [tiposEventos, setTiposEventos] = useState<TipoEvento[]>([]);
  const [eventosAcciones, setEventosAcciones] = useState<EventoAccion[]>([]);
  
  // Función para cargar campañas de marketing
  const loadCampaigns = async (params?: MarketingFilterParams) => {
    if (!empresaId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('marketing_campanias')
        .select('*')
        .eq('empresa_id', empresaId);
        
      // Aplicar filtros si existen
      if (params?.fechaInicio) {
        query = query.gte('fecha_inicio', params.fechaInicio);
      }
      
      if (params?.fechaFin) {
        query = query.lte('fecha_fin', params.fechaFin);
      }
      
      if (params?.estado) {
        query = query.eq('estado', params.estado);
      }
      
      if (params?.query) {
        query = query.ilike('nombre', `%${params.query}%`);
      }
      
      // Límite y paginación
      if (params?.limit) {
        query = query.limit(params.limit);
      }
      
      if (params?.offset) {
        query = query.range(params.offset, params.offset + (params?.limit || 10) - 1);
      }
      
      // Ordenamiento
      if (params?.orderBy) {
        query = query.order(params.orderBy, { 
          ascending: params.orderDirection === 'asc'
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setCampaigns(data || []);
      
    } catch (err: any) {
      console.error('Error al cargar campañas:', err);
      setError(err.message || 'Error al cargar campañas');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para cargar contenido de marketing
  const loadContents = async (params?: MarketingFilterParams) => {
    if (!empresaId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('marketing_contenido')
        .select('*')
        .eq('empresa_id', empresaId);
        
      // Aplicar filtros si existen
      if (params?.tipo) {
        query = query.eq('tipo', params.tipo);
      }
      
      if (params?.categoria) {
        query = query.eq('categoria', params.categoria);
      }
      
      if (params?.query) {
        query = query.ilike('contenido', `%${params.query}%`);
      }
      
      // Estado activo/inactivo
      if (params?.estado === 'activo') {
        query = query.eq('is_active', true);
      } else if (params?.estado === 'inactivo') {
        query = query.eq('is_active', false);
      }
      
      // Límite y paginación
      if (params?.limit) {
        query = query.limit(params.limit);
      }
      
      if (params?.offset) {
        query = query.range(params.offset, params.offset + (params?.limit || 10) - 1);
      }
      
      // Ordenamiento
      if (params?.orderBy) {
        query = query.order(params.orderBy, { 
          ascending: params.orderDirection === 'asc'
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setContents(data || []);
      
    } catch (err: any) {
      console.error('Error al cargar contenidos:', err);
      setError(err.message || 'Error al cargar contenidos');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para cargar UTMs
  const loadUtms = async (params?: MarketingFilterParams) => {
    if (!empresaId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('marketing_utm')
        .select('*')
        .eq('empresa_id', empresaId);
        
      // Aplicar filtros si existen
      if (params?.campania_id) {
        query = query.eq('campania_id', params.campania_id);
      }
      
      // Estado activo/inactivo
      if (params?.estado === 'activo') {
        query = query.eq('is_active', true);
      } else if (params?.estado === 'inactivo') {
        query = query.eq('is_active', false);
      }
      
      // Límite y paginación
      if (params?.limit) {
        query = query.limit(params.limit);
      }
      
      if (params?.offset) {
        query = query.range(params.offset, params.offset + (params?.limit || 10) - 1);
      }
      
      // Ordenamiento
      if (params?.orderBy) {
        query = query.order(params.orderBy, { 
          ascending: params.orderDirection === 'asc'
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setUtms(data || []);
      
    } catch (err: any) {
      console.error('Error al cargar UTMs:', err);
      setError(err.message || 'Error al cargar UTMs');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para cargar audiencias
  const loadAudiences = async (params?: MarketingFilterParams) => {
    if (!empresaId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('marketing_audiencias')
        .select('*')
        .eq('empresa_id', empresaId);
        
      // Aplicar filtros si existen
      if (params?.segmento) {
        query = query.eq('segmento', params.segmento);
      }
      
      if (params?.query) {
        query = query.ilike('nombre', `%${params.query}%`);
      }
      
      // Límite y paginación
      if (params?.limit) {
        query = query.limit(params.limit);
      }
      
      if (params?.offset) {
        query = query.range(params.offset, params.offset + (params?.limit || 10) - 1);
      }
      
      // Ordenamiento
      if (params?.orderBy) {
        query = query.order(params.orderBy, { 
          ascending: params.orderDirection === 'asc'
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setAudiences(data || []);
      
    } catch (err: any) {
      console.error('Error al cargar audiencias:', err);
      setError(err.message || 'Error al cargar audiencias');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para cargar insights
  const loadInsights = async (params?: MarketingFilterParams) => {
    if (!empresaId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('marketing_insights')
        .select('*')
        .eq('empresa_id', empresaId);
        
      // Aplicar filtros si existen
      if (params?.tipo) {
        query = query.eq('tipo', params.tipo);
      }
      
      if (params?.categoria) {
        query = query.eq('categoria', params.categoria);
      }
      
      // Filtrar por prioridad
      if (params?.query === 'alta_prioridad') {
        query = query.gte('prioridad', 7);
      }
      
      // Estado activo/inactivo
      if (params?.estado === 'activo') {
        query = query.eq('is_active', true);
      } else if (params?.estado === 'inactivo') {
        query = query.eq('is_active', false);
      }
      
      // Límite y paginación
      if (params?.limit) {
        query = query.limit(params.limit);
      }
      
      if (params?.offset) {
        query = query.range(params.offset, params.offset + (params?.limit || 10) - 1);
      }
      
      // Ordenamiento
      if (params?.orderBy) {
        query = query.order(params.orderBy, { 
          ascending: params.orderDirection === 'asc'
        });
      } else {
        // Por defecto, ordenar por prioridad descendente
        query = query.order('prioridad', { ascending: false });
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setInsights(data || []);
      
    } catch (err: any) {
      console.error('Error al cargar insights:', err);
      setError(err.message || 'Error al cargar insights');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Funciones para crear registros
  
  const createCampaign = async (campaign: Omit<MarketingCampaign, 'id' | 'empresa_id' | 'created_at' | 'updated_at'>) => {
    if (!empresaId) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('marketing_campanias')
        .insert({
          ...campaign,
          empresa_id: empresaId,
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Actualizar el estado local
      setCampaigns(prev => [data, ...prev]);
      return data;
      
    } catch (err: any) {
      console.error('Error al crear campaña:', err);
      setError(err.message || 'Error al crear campaña');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  const createContent = async (content: Omit<MarketingContent, 'id' | 'empresa_id' | 'created_at' | 'updated_at'>) => {
    if (!empresaId) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('marketing_contenido')
        .insert({
          ...content,
          empresa_id: empresaId,
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Actualizar el estado local
      setContents(prev => [data, ...prev]);
      return data;
      
    } catch (err: any) {
      console.error('Error al crear contenido:', err);
      setError(err.message || 'Error al crear contenido');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  const createUtm = async (utm: Omit<MarketingUTM, 'id' | 'empresa_id' | 'created_at' | 'updated_at'>) => {
    if (!empresaId) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('marketing_utm')
        .insert({
          ...utm,
          empresa_id: empresaId,
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Actualizar el estado local
      setUtms(prev => [data, ...prev]);
      return data;
      
    } catch (err: any) {
      console.error('Error al crear UTM:', err);
      setError(err.message || 'Error al crear UTM');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para obtener datos de las plataformas específicas (Google Ads, Meta Ads)
  const loadPlatformData = async (platformType: 'google' | 'meta', campaignId?: string) => {
    if (!empresaId) return [];
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tableName = platformType === 'google' ? 'marketing_google_ads' : 'marketing_meta_ads';
      
      let query = supabase
        .from(tableName)
        .select('*')
        .eq('empresa_id', empresaId);
        
      if (campaignId) {
        query = query.eq('campania_id', campaignId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data || [];
      
    } catch (err: any) {
      console.error(`Error al cargar datos de ${platformType}:`, err);
      setError(err.message || `Error al cargar datos de ${platformType}`);
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cargar KPIs
  const loadKPIs = async (params?: MarketingFilterParams) => {
    if (!empresaId) return [];
    
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('marketing_kpis')
        .select('*')
        .eq('empresa_id', empresaId);
        
      if (params?.categoria) {
        query = query.eq('categoria', params.categoria);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data || [];
      
    } catch (err: any) {
      console.error('Error al cargar KPIs:', err);
      setError(err.message || 'Error al cargar KPIs');
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  // Obtener resúmenes y estadísticas
  const getMarketingStats = async () => {
    if (!empresaId) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      // 1. Obtener campañas activas
      const { data: activeCampaigns, error: campaignError } = await supabase
        .from('marketing_campanias')
        .select('id, nombre, presupuesto, estado')
        .eq('empresa_id', empresaId)
        .eq('estado', 'active');
        
      if (campaignError) throw campaignError;
      
      // 2. Sumar presupuesto utilizado
      const totalBudget = activeCampaigns?.reduce((sum, campaign) => sum + (campaign.presupuesto || 0), 0) || 0;
      
      // 3. Obtener insights recientes de alta prioridad
      const { data: topInsights, error: insightsError } = await supabase
        .from('marketing_insights')
        .select('id, titulo, descripcion, prioridad, tipo')
        .eq('empresa_id', empresaId)
        .gte('prioridad', 7)
        .limit(5);
        
      if (insightsError) throw insightsError;
      
      return {
        activeCampaignsCount: activeCampaigns?.length || 0,
        totalBudget,
        topInsights,
        // Datos simulados para completar
        leadsGenerated: 325,
        conversionRate: 2.8,
        totalClicks: 4823,
        totalImpressions: 78590
      };
      
    } catch (err: any) {
      console.error('Error al obtener estadísticas de marketing:', err);
      setError(err.message || 'Error al obtener estadísticas');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // NUEVAS FUNCIONES PARA EVENTOS
  // Función para cargar tipos de eventos
  const loadTiposEventos = async () => {
    if (!empresaId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('dim_tipos_eventos')
        .select('*')
        .eq('is_active', true)
        .order('categoria', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      setTiposEventos(data || []);
      
    } catch (err: any) {
      console.error('Error al cargar tipos de eventos:', err);
      setError(err.message || 'Error al cargar tipos de eventos');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cargar eventos y acciones
  const loadEventosAcciones = async (params?: MarketingFilterParams) => {
    if (!empresaId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Primero obtenemos los tipos de eventos si aún no los tenemos
      if (tiposEventos.length === 0) {
        await loadTiposEventos();
      }

      let query = supabase
        .from('fact_eventos_acciones')
        .select(`
          *,
          dim_tipos_eventos(tipo_evento_id, nombre, categoria),
          dim_tiempo(fecha, hora, dia, mes, anio, nombre_mes)
        `)
        .eq('empresa_id', empresaId);
        
      // Aplicar filtros si existen
      if (params?.fechaInicio) {
        query = query.gte('created_at', params.fechaInicio);
      }
      
      if (params?.fechaFin) {
        query = query.lte('created_at', params.fechaFin);
      }

      if (params?.tipo) {
        query = query.eq('tipo_evento_id', params.tipo);
      }
      
      // Límite y paginación
      if (params?.limit) {
        query = query.limit(params.limit);
      }
      
      if (params?.offset) {
        query = query.range(params.offset, params.offset + (params?.limit || 10) - 1);
      }
      
      // Ordenamiento
      if (params?.orderBy) {
        query = query.order(params.orderBy, { 
          ascending: params.orderDirection === 'asc'
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // Procesamos los datos para añadir información del tipo de evento y fecha formateada
      const eventosFormateados = data?.map(evento => {
        const tipoEvento = evento.dim_tipos_eventos;
        const tiempo = evento.dim_tiempo;
        
        return {
          ...evento,
          nombre_tipo_evento: tipoEvento?.nombre || 'Desconocido',
          categoria_tipo_evento: tipoEvento?.categoria || 'Desconocido',
          fecha: tiempo?.fecha ? new Date(tiempo.fecha).toISOString().split('T')[0] : 
                  new Date(evento.created_at).toISOString().split('T')[0]
        };
      }) || [];
      
      setEventosAcciones(eventosFormateados);
      
    } catch (err: any) {
      console.error('Error al cargar eventos y acciones:', err);
      setError(err.message || 'Error al cargar eventos y acciones');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para obtener un resumen de eventos por categoría
  const getEventosSummary = (): EventosSummary[] => {
    const totales: Record<string, number> = {};
    const totalEventos = eventosAcciones.length;

    // Agrupamos por categoría
    eventosAcciones.forEach(evento => {
      const categoria = evento.categoria_tipo_evento || 'Desconocido';
      totales[categoria] = (totales[categoria] || 0) + 1;
    });

    // Calculamos los porcentajes y formateamos la respuesta
    return Object.entries(totales).map(([categoria, total]) => ({
      categoria,
      total,
      porcentaje: totalEventos > 0 ? Math.round((total / totalEventos) * 100) : 0,
    }));
  };

  // Función para obtener eventos agrupados por día
  const getEventosPorDia = (): EventosPorDia[] => {
    const eventosPorDia: Record<string, {
      total: number,
      por_categoria: Record<string, number>
    }> = {};

    // Agrupamos por fecha y categoría
    eventosAcciones.forEach(evento => {
      const fecha = evento.fecha || new Date(evento.created_at).toISOString().split('T')[0];
      const categoria = evento.categoria_tipo_evento || 'Desconocido';

      if (!eventosPorDia[fecha]) {
        eventosPorDia[fecha] = {
          total: 0,
          por_categoria: {}
        };
      }

      eventosPorDia[fecha].total += 1;
      eventosPorDia[fecha].por_categoria[categoria] = 
        (eventosPorDia[fecha].por_categoria[categoria] || 0) + 1;
    });

    // Formateamos la respuesta
    return Object.entries(eventosPorDia)
      .map(([fecha, datos]) => ({
        fecha,
        total: datos.total,
        por_categoria: datos.por_categoria
      }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  };
  
  return {
    // Estados
    isLoading,
    error,
    campaigns,
    contents,
    utms,
    audiences,
    insights,
    tiposEventos,
    eventosAcciones,
    
    // Funciones de carga
    loadCampaigns,
    loadContents,
    loadUtms,
    loadAudiences,
    loadInsights,
    loadPlatformData,
    loadKPIs,
    loadTiposEventos,
    loadEventosAcciones,
    
    // Funciones de creación
    createCampaign,
    createContent,
    createUtm,
    
    // Funciones de análisis de eventos
    getEventosSummary,
    getEventosPorDia,
    
    // Estadísticas
    getMarketingStats
  };
};