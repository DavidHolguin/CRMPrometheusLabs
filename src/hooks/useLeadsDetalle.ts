import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface LeadDetalle {
  empresa_id: string;
  lead_id: string;
  lead_score: number | null;
  lead_estado: string | null;
  lead_activo: boolean;
  lead_creado_en: string;
  lead_actualizado_en: string;
  ultima_interaccion: string | null;
  asignado_a: string | null;
  stage_id: string | null;
  pipeline_id: string | null;
  nombre_lead: string | null;
  apellido_lead: string | null;
  email_lead: string | null;
  telefono_lead: string | null;
  pais_lead: string | null;
  ciudad_lead: string | null;
  direccion_lead: string | null;
  info_adicional_lead: any;
  canal_id: string | null;
  canal_nombre: string | null;
  canal_logo: string | null;
  canal_color: string | null;
  conversacion_id: string;
  conversacion_ultimo_mensaje: string | null;
  ultimo_mensaje_contenido: string | null;
  // Información del agente asignado
  nombre_asignado: string | null;
  email_asignado: string | null;
  avatar_asignado: string | null;
  // Información del chatbot
  chatbot_id?: string | null;
  chatbot_activo?: boolean;
  chatbot_nombre?: string | null;
}

export function useLeadsDetalle(options?: {
  limit?: number;
  offset?: number;
  busqueda?: string;
}) {
  const { user } = useAuth();
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;
  const busqueda = options?.busqueda;

  return useQuery<LeadDetalle[]>({
    queryKey: ['leads-detalle', user?.companyId, limit, offset, busqueda],
    queryFn: async () => {
      if (!user?.companyId) {
        console.error('No se encontró ID de empresa para el usuario');
        return [];
      }

      try {
        console.log(`Consultando vista_leads_detalle_empresa para empresa ${user.companyId}`);
        
        // Construir la consulta base
        let query = supabase
          .from('vista_leads_detalle_empresa')
          .select('*')
          .eq('empresa_id', user.companyId)
          .order('ultima_interaccion', { ascending: false })
          .range(offset, offset + limit - 1);
        
        // Agregar filtro de búsqueda si existe
        if (busqueda) {
          query = query.or(`nombre_lead.ilike.%${busqueda}%,apellido_lead.ilike.%${busqueda}%,email_lead.ilike.%${busqueda}%,telefono_lead.ilike.%${busqueda}%,ultimo_mensaje_contenido.ilike.%${busqueda}%`);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error al obtener datos de vista_leads_detalle_empresa:', error);
          throw error;
        }
        
        console.log(`Obtenidos ${data?.length || 0} leads de la vista`);
        
        // Obtener IDs de conversación para buscar el estado del chatbot
        const conversacionIds = data?.map(lead => lead.conversacion_id).filter(Boolean) || [];
        
        // Obtener información actual del estado del chatbot de la tabla conversaciones
        let chatbotStatusMap = new Map();
        
        if (conversacionIds.length > 0) {
          const { data: conversacionesData, error: conversacionesError } = await supabase
            .from('conversaciones')
            .select('id, chatbot_id, chatbot_activo')
            .in('id', conversacionIds);
            
          if (conversacionesError) {
            console.error('Error al obtener estado de chatbot:', conversacionesError);
          } else if (conversacionesData) {
            // Crear un mapa de id -> {chatbot_id, chatbot_activo}
            conversacionesData.forEach(conv => {
              chatbotStatusMap.set(conv.id, {
                chatbot_id: conv.chatbot_id,
                chatbot_activo: conv.chatbot_activo !== null ? conv.chatbot_activo : true // Por defecto TRUE si no está definido
              });
            });
            
            console.log(`Obtenido el estado del chatbot para ${chatbotStatusMap.size} conversaciones`);
          }
        }
        
        // Transformar los datos para proporcionar una estructura consistente
        const processedData = data?.map(lead => {
          const convId = lead.conversacion_id;
          const chatbotStatus = chatbotStatusMap.get(convId) || {};
          
          return {
            ...lead,
            // Asegurar que la información del agente esté directamente disponible
            agente_nombre: lead.nombre_asignado,
            agente_email: lead.email_asignado,
            agente_avatar: lead.avatar_asignado,
            // Crear objeto usuario_asignado para mantener compatibilidad
            usuario_asignado: lead.asignado_a ? {
              nombre: lead.nombre_asignado,
              email: lead.email_asignado,
              avatar_url: lead.avatar_asignado
            } : null,
            // Añadir información del chatbot de la tabla de conversaciones
            chatbot_id: chatbotStatus.chatbot_id || lead.chatbot_id,
            chatbot_activo: chatbotStatus.chatbot_activo !== undefined ? chatbotStatus.chatbot_activo : true
          };
        }) || [];
        
        return processedData;
        
      } catch (error) {
        console.error('Error procesando datos de leads detalle:', error);
        throw error;
      }
    },
    enabled: !!user?.companyId,
    refetchInterval: 20000, // Reducimos a 20 segundos para actualizaciones más frecuentes
    staleTime: 10000, // Reducimos a 10 segundos para obtener datos frescos más rápido
    refetchOnWindowFocus: true // Habilitamos refetch en focus para actualizar cuando el usuario vuelva a la pestaña
  });
}