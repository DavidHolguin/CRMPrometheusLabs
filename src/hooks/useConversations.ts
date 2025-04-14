import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/hooks/useLeads';

export interface Conversation {
  id: string;
  lead_id: string;
  ultimo_mensaje: string;
  created_at: string;
  canal_id: string;
  estado: string;
  chatbot_id: string;
  metadata?: any;
  evaluacion?: {
    score_satisfaccion: number;
    score_potencial: number;
    comentario?: string;
  } | null;
  // Propiedades adicionales necesarias
  lead?: Lead;
  canal_identificador?: string;
  chatbot_activo?: boolean;
  chatbot?: {
    nombre?: string;
    avatar_url?: string;
  };
  unread_count?: number;
  message_count?: number;
  // Propiedades de la vista_lead_conversaciones_mensajes
  lead_nombre?: string;
  lead_apellido?: string;
  conversacion_fecha_inicio?: string;
  conversacion_ultima_actualizacion?: string;
  conversacion_estado?: string;
  conversacion_ultimo_mensaje?: string;
  conversacion_metadata?: any;
  canal_nombre?: string;
  canal_tipo?: string;
  chatbot_nombre?: string;
  chatbot_avatar?: string;
  total_mensajes_conversacion?: number;
  minutos_desde_mensaje?: number;
}

export function useConversations(chatbotId?: string) {
  return useQuery<Conversation[]>({
    queryKey: ['conversations', chatbotId],
    queryFn: async () => {
      try {
        console.log("Iniciando consulta de conversaciones...");
        
        // Obtenemos primero los datos de lead completos de la vista vista_lead_completa
        const { data: leadsData, error: leadsError } = await supabase
          .from('vista_lead_completa')
          .select('*');
          
        if (leadsError) {
          console.error('Error al obtener datos completos de leads:', leadsError);
          throw leadsError;
        }
        
        console.log(`Obtenidos ${leadsData?.length || 0} leads de vista_lead_completa`);
        
        // Creamos un mapa de leads para fácil acceso
        const leadsMap = new Map();
        leadsData?.forEach(lead => {
          leadsMap.set(lead.lead_id, {
            id: lead.lead_id,
            nombre: lead.nombre || 'Usuario',
            apellido: lead.apellido || '',
            email: lead.email,
            telefono: lead.telefono,
            score: lead.lead_score,
            pipeline_id: lead.pipeline_nombre ? lead.pipeline_nombre : null,
            stage_id: lead.stage_nombre ? lead.stage_nombre : null,
            ultima_interaccion: lead.ultima_interaccion,
            ultimas_interacciones: lead.ultimas_interacciones,
            intenciones_detectadas: lead.intenciones_detectadas,
            etiquetas: lead.etiquetas,
            ultima_conversacion_id: lead.ultima_conversacion_id,
            ultimo_mensaje: lead.ultimo_mensaje,
            // Información adicional relevante
            chatbot_info: lead.chatbot_info,
            total_conversaciones: lead.total_conversaciones,
            total_mensajes: lead.total_mensajes,
            ultima_evaluacion_llm: lead.ultima_evaluacion_llm
          });
        });

        // Usamos la vista vista_lead_conversaciones_mensajes para obtener las conversaciones enriquecidas
        let queryBuilder = supabase
          .from('vista_lead_conversaciones_mensajes')
          .select('*');
        
        // Agrupamos por conversación para evitar duplicados
        const conversationIds = new Set();
        const groupedConversations = [];
        
        // Solo filtrar por chatbotId si se proporciona uno
        if (chatbotId) {
          queryBuilder = queryBuilder.eq('chatbot_id', chatbotId);
        }
        
        // Ordenamos por última actualización para tener las más recientes primero
        const { data, error } = await queryBuilder.order('conversacion_ultima_actualizacion', { ascending: false });

        if (error) {
          console.error('Error al obtener conversaciones:', error);
          throw error;
        }
        
        console.log(`Obtenidas ${data?.length || 0} entradas de vista_lead_conversaciones_mensajes`);
        
        // Transformar los datos agrupando por conversación
        const conversationsMap = new Map();
        const unreadCountsMap = new Map();
        
        // Primero contamos mensajes no leídos por conversación
        data?.forEach(item => {
          if (!item.mensaje_leido && item.mensaje_origen === 'lead') {
            const currentCount = unreadCountsMap.get(item.conversacion_id) || 0;
            unreadCountsMap.set(item.conversacion_id, currentCount + 1);
          }
        });
        
        // Luego procesamos los datos de conversaciones
        data?.forEach(item => {
          if (!conversationsMap.has(item.conversacion_id)) {
            // Obtenemos el lead completo del mapa
            const leadCompleto = leadsMap.get(item.lead_id);
            
            // Si no existe en el mapa de leads, usamos la información básica de la vista de mensajes
            const leadInfo = leadCompleto || {
              id: item.lead_id,
              nombre: item.lead_nombre || 'Usuario',
              apellido: item.lead_apellido || ''
            };
            
            conversationsMap.set(item.conversacion_id, {
              id: item.conversacion_id,
              lead_id: item.lead_id,
              ultimo_mensaje: item.conversacion_ultimo_mensaje || item.mensaje_contenido,
              created_at: item.conversacion_fecha_inicio,
              canal_id: item.canal_id || '',
              estado: item.conversacion_estado,
              chatbot_id: item.chatbot_id || '',
              metadata: item.conversacion_metadata,
              canal_identificador: item.canal_identificador,
              chatbot_activo: item.chatbot_activo || false,
              chatbot: {
                nombre: item.chatbot_nombre,
                avatar_url: item.chatbot_avatar
              },
              lead: leadInfo,
              lead_nombre: item.lead_nombre || leadInfo.nombre || 'Usuario',
              lead_apellido: item.lead_apellido || leadInfo.apellido || '',
              unread_count: unreadCountsMap.get(item.conversacion_id) || 0,
              message_count: item.total_mensajes_conversacion || 0,
              canal_nombre: item.canal_nombre,
              canal_tipo: item.canal_tipo,
              minutos_desde_mensaje: item.minutos_desde_mensaje,
              conversacion_ultima_actualizacion: item.conversacion_ultima_actualizacion
            });
          }
        });
        
        const result = Array.from(conversationsMap.values());
        console.log(`Procesadas ${result.length} conversaciones únicas`);
        
        return result;
      } catch (error) {
        console.error('Error procesando datos de conversaciones:', error);
        throw error;
      }
    },
    enabled: true,
    refetchInterval: 15000, // Refrescar cada 15 segundos para mantener los datos actualizados
    staleTime: 10000 // Los datos se consideran obsoletos después de 10 segundos
  });
}
