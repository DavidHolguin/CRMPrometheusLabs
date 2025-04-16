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
        
        // Depuración: mostrar qué campos de agente vienen en la respuesta
        if (leadsData && leadsData.length > 0) {
          const leadConAsignacion = leadsData.find(lead => lead.asignado_a);
          if (leadConAsignacion) {
            console.log("Ejemplo de lead con asignación:", {
              lead_id: leadConAsignacion.lead_id,
              asignado_a: leadConAsignacion.asignado_a,
              agente_nombre: leadConAsignacion.agente_nombre,
              agente_email: leadConAsignacion.agente_email,
              agente_id: leadConAsignacion.agente_id,
              full_name: leadConAsignacion.full_name, // Por si está usando otro campo para el nombre
              nombres_agente: Object.keys(leadConAsignacion).filter(key => 
                key.includes('nombre') || key.includes('name') || key.includes('agent')
              )
            });
          } else {
            console.log("No se encontraron leads con asignación");
            console.log("Nombres de campos disponibles en la vista:", Object.keys(leadsData[0]));
          }
        }
        
        // Creamos un mapa de leads para fácil acceso
        const leadsMap = new Map();
        leadsData?.forEach(lead => {
          // Buscar el nombre del agente en varios campos posibles
          const nombreAgente = lead.agente_nombre || // Campo directo 
                              lead.full_name || // Puede ser que el perfil esté con otro nombre
                              (lead.profile ? lead.profile.full_name : null) || // Si viene anidado
                              (lead.profile_full_name); // Campo específico de join
                              
          // Crear un objeto con información completa del usuario asignado
          const usuarioAsignado = lead.asignado_a ? {
            id: lead.asignado_a,
            nombre: nombreAgente || 'Agente asignado',
            email: lead.agente_email || lead.email,
            avatar_url: lead.agente_avatar || lead.avatar_url
          } : null;
          
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
            // AÑADIDO: Información de asignación con más alternativas de campos
            asignado_a: lead.asignado_a,
            agente_nombre: nombreAgente,
            agente_email: lead.agente_email || lead.email,
            agente_avatar: lead.agente_avatar || lead.avatar_url,
            usuario_asignado: usuarioAsignado,
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

        // También buscamos información del agente en la vista de conversaciones
        // por si allí viene más completa
        if (data && data.length > 0) {
          const itemConAsignacion = data.find(item => item.lead_asignado_a);
          if (itemConAsignacion) {
            console.log("Ejemplo de dato de conversación con asignación:", {
              conversacion_id: itemConAsignacion.conversacion_id,
              lead_id: itemConAsignacion.lead_id,
              lead_asignado_a: itemConAsignacion.lead_asignado_a,
              agente_nombre: itemConAsignacion.agente_nombre,
              agente_email: itemConAsignacion.agente_email,
              agente_avatar: itemConAsignacion.agente_avatar,
              nombres_campos: Object.keys(itemConAsignacion).filter(key => 
                key.includes('agent') || key.includes('asigna') || key.includes('profile')
              )
            });
          }
        }
        
        // Luego procesamos los datos de conversaciones
        data?.forEach(item => {
          if (!conversationsMap.has(item.conversacion_id)) {
            // Obtenemos el lead completo del mapa
            const leadCompleto = leadsMap.get(item.lead_id);
            
            // Buscar nombre de agente en varios campos posibles de la vista de conversaciones
            const nombreAgenteMensajes = item.agente_nombre || 
                                       item.asignado_nombre || 
                                       item.full_name_agente || 
                                       'Agente'; 
            
            // Si no existe en el mapa de leads, usamos la información básica de la vista de mensajes
            const leadInfo = leadCompleto || {
              id: item.lead_id,
              nombre: item.lead_nombre || 'Usuario',
              apellido: item.lead_apellido || '',
              // AÑADIDO: Información de asignación desde vista de mensajes como fallback
              asignado_a: item.lead_asignado_a || null,
              agente_nombre: nombreAgenteMensajes,
              agente_email: item.agente_email,
              agente_avatar: item.agente_avatar,
              usuario_asignado: item.lead_asignado_a ? {
                id: item.lead_asignado_a,
                nombre: nombreAgenteMensajes,
                email: item.agente_email,
                avatar_url: item.agente_avatar
              } : null
            };
            
            // Debuggear información sobre este lead específico
            if (item.lead_asignado_a) {
              console.log(`Lead ${item.lead_id} asignado a: ${leadInfo.agente_nombre || 'No se encontró el nombre'}`);
            }
            
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
