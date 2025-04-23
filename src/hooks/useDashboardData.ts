import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { GroupByTime } from "@/components/dashboard/DashboardToolbar";

export interface EventoDataPoint {
  categoria: string;
  valor: number;
  porcentaje: number;
  color?: string;
}

export interface TimelineDataPoint {
  fecha: string;
  eventos: number;
  leads: number;
  conversaciones: number;
}

export interface DashboardStatsData {
  totalLeads: number;
  conversaciones: number;
  tasaConversion: number;
  interaccionesChatbot: number;
}

export interface DimensionalData {
  tipoEventos: EventoDataPoint[];
  timelineData: TimelineDataPoint[];
  rendimientoCanales: EventoDataPoint[];
  rendimientoChatbots: EventoDataPoint[];
}

export interface GranularDataPoint {
  periodo: string;
  fecha_hora: string;
  total_eventos: number;
  total_leads: number;
  total_conversaciones: number;
  score_promedio: number;
  score_count?: number; // Added property for score count
  lead_ids?: string[]; // Added property
  conv_ids?: string[]; // Added property for conversation IDs
}

// Hook para datos detallados con granularidad ajustable
export const useGranularData = (
  timeRange: string,
  dateRange: { from?: Date; to?: Date },
  groupBy: GroupByTime = "dia",
  includeHours: boolean = false,
  hourRange?: { start: number; end: number },
  channelIds?: string[]
) => {
  const { user } = useAuth();
  const [data, setData] = useState<GranularDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.companyId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Calcular fechas según el timeRange
        let startDate: Date;
        let endDate: Date = new Date();
        
        if (timeRange === "custom" && dateRange.from && dateRange.to) {
          startDate = dateRange.from;
          endDate = dateRange.to;
        } else if (timeRange === "today") {
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
        } else if (timeRange === "yesterday") {
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
        } else {
          // Usar rangos predefinidos
          const days = timeRange === "7d" ? 7 : 
                      timeRange === "30d" ? 30 : 
                      timeRange === "90d" ? 90 : 
                      timeRange === "6m" ? 180 : 
                      timeRange === "1y" ? 365 : 30;
          
          startDate = new Date();
          startDate.setDate(startDate.getDate() - days);
        }
        
        // Como la función get_data_granular aún no está disponible, 
        // implementamos directamente la lógica de consulta
        
        // Determinar formato de fecha para agrupar según el tipo de agrupación
        let dateFormat = "YYYY-MM-DD";
        let dateFormatJS = "%Y-%m-%d";  // Formato para PostgreSQL date_trunc
        let dateTruncUnit = "day";      // Unidad para PostgreSQL date_trunc
        
        if (groupBy === "hora") {
          dateFormat = "YYYY-MM-DD HH24:00";
          dateFormatJS = "%Y-%m-%d %H:00";
          dateTruncUnit = "hour";
        } else if (groupBy === "dia") {
          dateFormat = "YYYY-MM-DD";
          dateFormatJS = "%Y-%m-%d";
          dateTruncUnit = "day";
        } else if (groupBy === "semana") {
          dateFormat = "YYYY-\"W\"IW";
          dateFormatJS = "%Y-W%W";
          dateTruncUnit = "week";
        } else if (groupBy === "mes") {
          dateFormat = "YYYY-MM";
          dateFormatJS = "%Y-%m";
          dateTruncUnit = "month";
        } else if (groupBy === "trimestre") {
          dateFormat = "YYYY-\"Q\"Q";
          dateFormatJS = "%Y-Q%Q";
          dateTruncUnit = "quarter";
        } else if (groupBy === "año") {
          dateFormat = "YYYY";
          dateFormatJS = "%Y";
          dateTruncUnit = "year";
        }

        // Consulta principal para obtener datos granulares
        // Cambiamos 'id' por 'evento_accion_id' que es el nombre correcto de la columna
        const { data: resultData, error: queryError } = await supabase
          .from('fact_eventos_acciones')
          .select(`
            evento_accion_id,
            created_at,
            lead_id,
            conversacion_id,
            valor_score,
            canal_id
          `)
          .eq('empresa_id', user.companyId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: true });
          
        if (queryError) throw queryError;

        // Si no hay datos, devolver un array vacío
        if (!resultData || resultData.length === 0) {
          setData([]);
          return;
        }
          
        // Filtrar por canales si es necesario
        let filteredData = resultData;
        if (channelIds && channelIds.length > 0) {
          filteredData = resultData.filter(item => 
            item.canal_id && channelIds.includes(item.canal_id)
          );
        }
        
        // Filtrar por horas si es necesario
        if (includeHours && hourRange && groupBy === "hora") {
          filteredData = filteredData.filter(item => {
            const hour = new Date(item.created_at).getHours();
            return hour >= hourRange.start && hour <= hourRange.end;
          });
        }

        // Agrupar los datos según el tipo de agrupación
        const groupedData: {[key: string]: GranularDataPoint} = {};
        
        filteredData.forEach(item => {
          const date = new Date(item.created_at);
          
          // Determinar la clave de agrupación según el tipo
          let groupKey = '';
          
          if (groupBy === "hora") {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const hour = date.getHours();
            groupKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour}:00`;
          } else if (groupBy === "dia") {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            groupKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          } else if (groupBy === "semana") {
            // Obtener el primer día de la semana (lunes)
            const firstDay = new Date(date);
            const dayOfWeek = date.getDay() || 7; // 0 es domingo, lo convertimos a 7
            firstDay.setDate(date.getDate() - dayOfWeek + 1);
            
            const year = firstDay.getFullYear();
            const weekNum = Math.ceil((((firstDay.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + 1) / 7);
            
            groupKey = `${year}-W${weekNum.toString().padStart(2, '0')}`;
          } else if (groupBy === "mes") {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            groupKey = `${year}-${month.toString().padStart(2, '0')}`;
          } else if (groupBy === "trimestre") {
            const year = date.getFullYear();
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            groupKey = `${year}-Q${quarter}`;
          } else {
            groupKey = date.getFullYear().toString();
          }
          
          if (!groupedData[groupKey]) {
            groupedData[groupKey] = {
              periodo: groupKey,
              fecha_hora: date.toISOString(),
              total_eventos: 0,
              total_leads: 0,
              total_conversaciones: 0,
              score_promedio: 0
            };
          }
          
          // Incrementar contadores
          groupedData[groupKey].total_eventos += 1;
          
          if (item.lead_id && !groupedData[groupKey].lead_ids?.includes(item.lead_id)) {
            groupedData[groupKey].total_leads += 1;
            groupedData[groupKey].lead_ids = [
              ...(groupedData[groupKey].lead_ids || []), 
              item.lead_id
            ];
          }
          
          if (item.conversacion_id && !groupedData[groupKey].conv_ids?.includes(item.conversacion_id)) {
            groupedData[groupKey].total_conversaciones += 1;
            groupedData[groupKey].conv_ids = [
              ...(groupedData[groupKey].conv_ids || []), 
              item.conversacion_id
            ];
          }
          
          // Actualizar score promedio
          if (typeof item.valor_score === 'number') {
            const currentScore = groupedData[groupKey].score_promedio || 0;
            const currentCount = groupedData[groupKey].score_count || 0;
            const newCount = currentCount + 1;
            const newScore = ((currentScore * currentCount) + item.valor_score) / newCount;
            
            groupedData[groupKey].score_promedio = newScore;
            groupedData[groupKey].score_count = newCount;
          }
        });
        
        // Convertir a array y eliminar los campos auxiliares que no queremos en el resultado
        const formattedData = Object.values(groupedData).map(item => {
          const { lead_ids, conv_ids, score_count, ...rest } = item as any;
          return rest;
        });
        
        // Ordenar por fecha
        formattedData.sort((a, b) => {
          return new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime();
        });
        
        setData(formattedData);
      } catch (err) {
        console.error("Error fetching granular data:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.companyId, timeRange, dateRange, groupBy, includeHours, hourRange, channelIds]);

  return { data, isLoading, error };
};

// Hook para las estadísticas principales del dashboard
export const useDashboardStats = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardStatsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user?.companyId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Obtener total de leads
        const { count: totalLeads, error: leadsError } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("empresa_id", user.companyId);
        
        if (leadsError) throw leadsError;
        
        // Obtener total de conversaciones
        const { count: conversaciones, error: convsError } = await supabase
          .from("conversaciones")
          .select("*", { count: "exact", head: true })
          .eq("chatbot_activo", true);
        
        if (convsError) throw convsError;
        
        // Obtener interacciones con chatbot
        const { data: mensajesData, error: mensajesError } = await supabase
          .from("mensajes")
          .select("id", { count: "exact" })
          .eq("origen", "chatbot");
        
        if (mensajesError) throw mensajesError;
        const interaccionesChatbot = mensajesData?.length || 0;
        
        // Calcular tasa de conversión (ejemplo: leads que avanzaron a etapa de interesado o superior)
        const tasaConversion = totalLeads && totalLeads > 0 
          ? Math.round((conversaciones / totalLeads) * 100) 
          : 0;
        
        setData({
          totalLeads: totalLeads || 0,
          conversaciones: conversaciones || 0,
          tasaConversion,
          interaccionesChatbot
        });
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardStats();
  }, [user?.companyId]);

  return { data, isLoading, error };
};

// Hook para los datos de actividad de leads
export const useLeadsActivityData = (days: number = 7) => {
  const { user } = useAuth();
  const [data, setData] = useState<Array<{date: string, leads: number, conversations: number}>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchActivityData = async () => {
      if (!user?.companyId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Generar fechas para los últimos N días
        const dates = Array.from({ length: days }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (days - 1 - i));
          return date.toISOString().split('T')[0];
        });
        
        // Obtener actividad para cada fecha
        const results = await Promise.all(dates.map(async (date) => {
          // Crear objetos Date para principio y fin del día
          const startOfDay = new Date(date);
          startOfDay.setUTCHours(0, 0, 0, 0);
          
          const endOfDay = new Date(date);
          endOfDay.setUTCHours(23, 59, 59, 999);
          
          // Contar leads creados ese día
          const { count: leadsCount, error: leadsError } = await supabase
            .from("leads")
            .select("id", { count: "exact", head: true })
            .eq("empresa_id", user.companyId)
            .gte("created_at", startOfDay.toISOString())
            .lte("created_at", endOfDay.toISOString());
          
          if (leadsError) throw leadsError;
          
          // Contar conversaciones iniciadas ese día
          const { count: convsCount, error: convsError } = await supabase
            .from("conversaciones")
            .select("id", { count: "exact", head: true })
            .gte("created_at", startOfDay.toISOString())
            .lte("created_at", endOfDay.toISOString());
          
          if (convsError) throw convsError;
          
          return {
            date,
            leads: leadsCount || 0,
            conversations: convsCount || 0
          };
        }));
        
        setData(results);
      } catch (err) {
        console.error("Error fetching activity data:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchActivityData();
  }, [user?.companyId, days]);

  return { data, isLoading, error };
};

// Hook para los datos de distribución de leads por canal
export const useLeadsByChannelData = () => {
  const { user } = useAuth();
  const [data, setData] = useState<Array<{name: string, value: number}>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchChannelData = async () => {
      if (!user?.companyId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Obtener todos los leads y agruparlos por canal
        const { data: leads, error: leadsError } = await supabase
          .from("leads")
          .select("canal_origen")
          .eq("empresa_id", user.companyId);
        
        if (leadsError) throw leadsError;
        
        // Agrupar y contar por canal
        const channelCounts = leads.reduce((acc: {[key: string]: number}, lead) => {
          const canal = lead.canal_origen || "Desconocido";
          acc[canal] = (acc[canal] || 0) + 1;
          return acc;
        }, {});
        
        // Convertir a formato para el gráfico
        const channelData = Object.entries(channelCounts).map(([name, value]) => ({
          name,
          value: value as number
        }));
        
        // Ordenar de mayor a menor
        channelData.sort((a, b) => b.value - a.value);
        
        setData(channelData);
      } catch (err) {
        console.error("Error fetching channel data:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChannelData();
  }, [user?.companyId]);

  return { data, isLoading, error };
};

// Hook para obtener leads recientes
export const useRecentLeads = (limit: number = 5) => {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchRecentLeads = async () => {
      if (!user?.companyId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Obtener leads recientes usando la vista_leads_completa
        const { data: leads, error: leadsError } = await supabase
          .from("vista_leads_completa")
          .select(`
            lead_id,
            lead_creado,
            nombre,
            apellido,
            email,
            telefono,
            canal_origen,
            pipeline_nombre,
            stage_nombre,
            stage_color
          `)
          .eq("empresa_id", user.companyId)
          .order("lead_creado", { ascending: false })
          .limit(limit);
        
        if (leadsError) throw leadsError;
        
        setData(leads || []);
      } catch (err) {
        console.error("Error fetching recent leads:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecentLeads();
  }, [user?.companyId, limit]);

  return { data, isLoading, error };
};

// Hook para datos dimensionales
export const useDimensionalData = (timeRange: string = "30d") => {
  const { user } = useAuth();
  const [data, setData] = useState<DimensionalData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDimensionalData = async () => {
      if (!user?.companyId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Calcular rango de fechas según el timeRange
        const endDate = new Date();
        let startDate: Date;
        
        if (timeRange === "7d") {
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
        } else if (timeRange === "30d") {
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
        } else if (timeRange === "90d") {
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 90);
        } else if (timeRange === "6m") {
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 6);
        } else if (timeRange === "1y") {
          startDate = new Date();
          startDate.setFullYear(startDate.getFullYear() - 1);
        } else {
          // Default a 30 días
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
        }

        // 1. Obtener datos de tipos de eventos
        const { data: tipoEventosData } = await supabase
          .from('fact_eventos_acciones')
          .select('tipo_evento_id, tipo_eventos:dim_tipos_eventos!inner(nombre)')
          .eq('empresa_id', user.companyId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
        
        // Agrupar y contar por tipo de evento
        const tipoEventosCounts: {[key: string]: number} = {};
        tipoEventosData?.forEach(ev => {
          // @ts-ignore
          const nombre = ev.tipo_eventos?.nombre || 'Desconocido';
          tipoEventosCounts[nombre] = (tipoEventosCounts[nombre] || 0) + 1;
        });
        
        const totalEventos = Object.values(tipoEventosCounts).reduce((a, b) => a + b, 0);
        
        const tipoEventos: EventoDataPoint[] = Object.entries(tipoEventosCounts)
          .map(([categoria, valor], index) => ({
            categoria,
            valor,
            porcentaje: totalEventos > 0 ? Math.round((valor / totalEventos) * 100) : 0,
            // Asignar colores, para efectos de visualización
            color: getColorForIndex(index)
          }))
          .sort((a, b) => b.valor - a.valor);
        
        // 2. Obtener datos de rendimiento de canales
        const { data: canalEventosData } = await supabase
          .from('fact_eventos_acciones')
          .select('canal_id, canales:canales!inner(nombre, color)')
          .eq('empresa_id', user.companyId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .not('canal_id', 'is', null);
        
        // Agrupar y contar por canal
        const canalCounts: {[key: string]: {count: number, color: string}} = {};
        canalEventosData?.forEach(ev => {
          // @ts-ignore
          const nombre = ev.canales?.nombre || 'Desconocido';
          // @ts-ignore
          const color = ev.canales?.color || '';
          if (!canalCounts[nombre]) canalCounts[nombre] = {count: 0, color};
          canalCounts[nombre].count += 1;
        });
        
        const totalCanales = Object.values(canalCounts).reduce((a, b) => a + b.count, 0);
        
        const rendimientoCanales: EventoDataPoint[] = Object.entries(canalCounts)
          .map(([categoria, data], index) => ({
            categoria,
            valor: data.count,
            porcentaje: totalCanales > 0 ? Math.round((data.count / totalCanales) * 100) : 0,
            color: data.color || getColorForIndex(index)
          }))
          .sort((a, b) => b.valor - a.valor);
        
        // 3. Obtener datos de rendimiento de chatbots
        const { data: chatbotEventosData } = await supabase
          .from('fact_eventos_acciones')
          .select('chatbot_id, chatbots:chatbots!inner(nombre)')
          .eq('empresa_id', user.companyId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .not('chatbot_id', 'is', null);
        
        // Agrupar y contar por chatbot
        const chatbotCounts: {[key: string]: number} = {};
        chatbotEventosData?.forEach(ev => {
          // @ts-ignore
          const nombre = ev.chatbots?.nombre || 'Desconocido';
          chatbotCounts[nombre] = (chatbotCounts[nombre] || 0) + 1;
        });
        
        const totalChatbots = Object.values(chatbotCounts).reduce((a, b) => a + b, 0);
        
        const rendimientoChatbots: EventoDataPoint[] = Object.entries(chatbotCounts)
          .map(([categoria, valor], index) => ({
            categoria,
            valor,
            porcentaje: totalChatbots > 0 ? Math.round((valor / totalChatbots) * 100) : 0,
            color: getColorForIndex(index + 5) // Offset para tener colores distintos
          }))
          .sort((a, b) => b.valor - a.valor);
        
        // 4. Generar datos de timeline
        const totalDays = getDaysBetween(startDate, endDate);
        const intervalDays = totalDays <= 7 ? 1 : // diario
                             totalDays <= 30 ? 3 : // cada 3 días 
                             totalDays <= 90 ? 7 : // semanal
                             totalDays <= 180 ? 15 : // quincenal
                             30; // mensual
        
        const timelineData = await generateTimelineData(
          startDate, 
          endDate, 
          intervalDays,
          user.companyId
        );
        
        setData({
          tipoEventos,
          rendimientoCanales,
          rendimientoChatbots,
          timelineData
        });
      } catch (err) {
        console.error("Error fetching dimensional data:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDimensionalData();
  }, [user?.companyId, timeRange]);

  return { data, isLoading, error };
};

// Función auxiliar para generar datos de timeline
const generateTimelineData = async (
  startDate: Date, 
  endDate: Date, 
  intervalDays: number,
  companyId: string
): Promise<TimelineDataPoint[]> => {
  const result: TimelineDataPoint[] = [];
  
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const periodStart = new Date(currentDate);
    
    // Ajustar fecha fin del período
    currentDate.setDate(currentDate.getDate() + intervalDays - 1);
    if (currentDate > endDate) currentDate = new Date(endDate);
    
    const periodEnd = new Date(currentDate);
    periodEnd.setHours(23, 59, 59, 999);
    
    // Consultar datos para este período
    const { count: eventosCount } = await supabase
      .from('fact_eventos_acciones')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', companyId)
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString());
      
    const { count: leadsCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', companyId)
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString());
      
    const { count: conversacionesCount } = await supabase
      .from('conversaciones')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString());
    
    // Añadir al resultado
    result.push({
      fecha: periodStart.toISOString().split('T')[0],
      eventos: eventosCount || 0,
      leads: leadsCount || 0,
      conversaciones: conversacionesCount || 0
    });
    
    // Avanzar al siguiente período
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return result;
};

// Función auxiliar para obtener días entre dos fechas
const getDaysBetween = (startDate: Date, endDate: Date): number => {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Función auxiliar para asignar colores según el índice
const getColorForIndex = (index: number): string => {
  const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--chart-6))',
    'hsl(var(--chart-7))',
    'hsl(var(--chart-8))',
    'hsl(var(--chart-9))',
  ];
  
  return colors[index % colors.length];
};
