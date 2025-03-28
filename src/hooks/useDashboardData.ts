
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

// Interfaces para los datos
export interface DashboardStats {
  totalLeads: number;
  conversaciones: number;
  tasaConversion: number;
  interaccionesChatbot: number;
}

export interface ChartDataPoint {
  name: string;
  leads?: number;
  conversations?: number;
  value?: number;
}

export interface RecentLead {
  id: string;
  name: string;
  email: string;
  source: string;
  status: string;
  date: string;
}

// Hook para obtener las estadísticas del Dashboard
export const useDashboardStats = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["dashboardStats", user?.companyId],
    queryFn: async (): Promise<DashboardStats> => {
      // Si no hay usuario o compañía, retornar datos vacíos
      if (!user?.companyId) {
        throw new Error("No hay ID de empresa");
      }
      
      // Obtener el total de leads
      const { count: totalLeads, error: leadsError } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("empresa_id", user.companyId);
        
      if (leadsError) {
        console.error("Error obteniendo leads:", leadsError);
      }
      
      // Obtener el total de conversaciones
      const { count: conversaciones, error: convsError } = await supabase
        .from("conversaciones")
        .select("id", { count: "exact", head: true })
        .eq("chatbot_id", "chatbot_id") // Aquí se necesitaría una relación entre chatbots y empresa_id
        .in("lead_id", supabase
          .from("leads")
          .select("id")
          .eq("empresa_id", user.companyId));
          
      if (convsError) {
        console.error("Error obteniendo conversaciones:", convsError);
      }
      
      // Obtener el total de mensajes (para interacciones de chatbot)
      const { count: mensajes, error: msgsError } = await supabase
        .from("mensajes")
        .select("id", { count: "exact", head: true })
        .in("conversacion_id", supabase
          .from("conversaciones")
          .select("id")
          .in("lead_id", supabase
            .from("leads")
            .select("id")
            .eq("empresa_id", user.companyId)));
            
      if (msgsError) {
        console.error("Error obteniendo mensajes:", msgsError);
      }
      
      // Calcular la tasa de conversión (asumiendo que es el % de leads que inician conversación)
      const tasaConversion = totalLeads && totalLeads > 0 
        ? Math.round((conversaciones || 0) / totalLeads * 100) 
        : 0;
      
      return {
        totalLeads: totalLeads || 0,
        conversaciones: conversaciones || 0,
        tasaConversion,
        interaccionesChatbot: mensajes || 0
      };
    },
    enabled: !!user?.companyId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para obtener datos de leads y conversaciones por día (últimos 7 días)
export const useLeadsActivityData = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["leadsActivity", user?.companyId],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      if (!user?.companyId) {
        throw new Error("No hay ID de empresa");
      }
      
      // Obtener los últimos 7 días
      const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date;
      });
      
      const dayNames = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
      
      // Para cada día, obtener leads y conversaciones
      const result = await Promise.all(days.map(async (day) => {
        const startOfDay = new Date(day);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(day);
        endOfDay.setHours(23, 59, 59, 999);
        
        // Contar leads creados en este día
        const { count: leadsCount, error: leadsError } = await supabase
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", user.companyId)
          .gte("created_at", startOfDay.toISOString())
          .lte("created_at", endOfDay.toISOString());
          
        if (leadsError) {
          console.error("Error obteniendo leads por día:", leadsError);
        }
        
        // Contar conversaciones creadas en este día
        const { count: convsCount, error: convsError } = await supabase
          .from("conversaciones")
          .select("id", { count: "exact", head: true })
          .in("lead_id", supabase
            .from("leads")
            .select("id")
            .eq("empresa_id", user.companyId))
          .gte("created_at", startOfDay.toISOString())
          .lte("created_at", endOfDay.toISOString());
          
        if (convsError) {
          console.error("Error obteniendo conversaciones por día:", convsError);
        }
        
        return {
          name: dayNames[day.getDay()],
          leads: leadsCount || 0,
          conversations: convsCount || 0
        };
      }));
      
      return result;
    },
    enabled: !!user?.companyId,
    staleTime: 15 * 60 * 1000, // 15 minutos
  });
};

// Hook para obtener distribución de leads por canal
export const useLeadsByChannelData = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["leadsByChannel", user?.companyId],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      if (!user?.companyId) {
        throw new Error("No hay ID de empresa");
      }
      
      // Obtener leads agrupados por canal
      const { data, error } = await supabase
        .from("leads")
        .select("canal_origen, count")
        .eq("empresa_id", user.companyId)
        .not("canal_origen", "is", null)
        .group("canal_origen");
        
      if (error) {
        console.error("Error obteniendo leads por canal:", error);
        return [];
      }
      
      // Si no hay datos, retornar un array vacío
      if (!data || data.length === 0) {
        return [];
      }
      
      // Calcular el total de leads
      const total = data.reduce((acc, curr) => acc + (curr.count || 0), 0);
      
      // Transformar los datos para el gráfico de barras
      return data.map(item => ({
        name: item.canal_origen || "Desconocido",
        value: Math.round(((item.count || 0) / total) * 100)
      }));
    },
    enabled: !!user?.companyId,
    staleTime: 15 * 60 * 1000, // 15 minutos
  });
};

// Hook para obtener los leads más recientes
export const useRecentLeads = (limit = 3) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["recentLeads", user?.companyId, limit],
    queryFn: async (): Promise<RecentLead[]> => {
      if (!user?.companyId) {
        throw new Error("No hay ID de empresa");
      }
      
      const { data, error } = await supabase
        .from("leads")
        .select("id, nombre, apellido, email, canal_origen, estado, created_at")
        .eq("empresa_id", user.companyId)
        .order("created_at", { ascending: false })
        .limit(limit);
        
      if (error) {
        console.error("Error obteniendo leads recientes:", error);
        return [];
      }
      
      // Transformar los datos para la tabla
      return (data || []).map(lead => {
        // Calcular tiempo transcurrido
        const createdAt = new Date(lead.created_at);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
        
        let dateText = "";
        if (diffInHours < 1) {
          dateText = "Hace menos de 1 hora";
        } else if (diffInHours < 24) {
          dateText = `Hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
        } else {
          const diffInDays = Math.floor(diffInHours / 24);
          dateText = `Hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`;
        }
        
        return {
          id: lead.id,
          name: `${lead.nombre || ''} ${lead.apellido || ''}`.trim() || 'Sin nombre',
          email: lead.email || 'Sin email',
          source: lead.canal_origen || 'Desconocido',
          status: lead.estado || 'Nuevo',
          date: dateText
        };
      });
    },
    enabled: !!user?.companyId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
