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
        
        // Obtenemos también las etiquetas para cada lead
        const { data: tagsData, error: tagsError } = await supabase
          .from('lead_tag_relation')
          .select(`
            lead_id,
            tag_id,
            lead_tags (
              id,
              nombre,
              color
            )
          `);
          
        if (tagsError) {
          console.error('Error al obtener etiquetas de leads:', tagsError);
          // No lanzamos error para que la app siga funcionando si no puede obtener tags
        }
        
        // Agrupar etiquetas por lead_id para fácil acceso
        const tagsByLeadId = new Map();
        tagsData?.forEach(relation => {
          if (!tagsByLeadId.has(relation.lead_id)) {
            tagsByLeadId.set(relation.lead_id, []);
          }
          if (relation.lead_tags) {
            tagsByLeadId.get(relation.lead_id).push({
              id: relation.tag_id,
              nombre: ((relation.lead_tags as unknown) as { nombre: any })?.nombre,
              color: ((relation.lead_tags as unknown) as { color: any }).color
            });
          }
        });
        
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
          
          // Obtener etiquetas para este lead
          const tags = tagsByLeadId.get(lead.lead_id) || [];
          
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
            tags: tags, // Añadimos las etiquetas al lead
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
        
        // Si estamos filtrando por chatbotId y es un UUID,
        // también intentamos buscar en la columna mensaje_remitente_id
        if (chatbotId && chatbotId.includes('-')) {
          console.log(`Filtrando mensajes por chatbot con ID: ${chatbotId}`);
          // No aplicamos el filtro aquí porque la columna chatbot_id no existe en la vista
        }
        
        // Ordenamos por última actualización para tener las más recientes primero
        const { data, error } = await queryBuilder.order('conversacion_ultima_actualizacion', { ascending: false });

        if (error) {
          console.error('Error al obtener conversaciones:', error);
          throw error;
        }
        
        console.log(`Obtenidas ${data?.length || 0} entradas de vista_lead_conversaciones_mensajes`);
        
        const conversationsMap = new Map();
        const unreadCountsMap = new Map();
        const messageCountsMap = new Map();
        
        // Consulta adicional para obtener mensajes no leídos por conversación
        const { data: unreadData, error: unreadError } = await supabase
          .from('mensajes')
          .select('conversacion_id, id, leido, origen')
          .eq('leido', false)
          .eq('origen', 'lead');
          
        if (unreadError) {
          console.error('Error al obtener mensajes no leídos:', unreadError);
        } else {
          console.log(`Obtenidos ${unreadData?.length || 0} mensajes no leídos`);
          
          // Contar mensajes no leídos por conversación
          unreadData?.forEach(msg => {
            const currentCount = unreadCountsMap.get(msg.conversacion_id) || 0;
            unreadCountsMap.set(msg.conversacion_id, currentCount + 1);
          });
        }
        
        // Consulta adicional para obtener el conteo total de mensajes por conversación
        const { data: allMessagesData, error: allMessagesError } = await supabase
          .from('mensajes')
          .select('conversacion_id, id');
          
        if (allMessagesError) {
          console.error('Error al obtener todos los mensajes:', allMessagesError);
        } else {
          const countsMap = new Map();
          allMessagesData?.forEach(msg => {
            const convId = msg.conversacion_id;
            countsMap.set(convId, (countsMap.get(convId) || 0) + 1);
          });
          
          countsMap.forEach((count, convId) => {
            messageCountsMap.set(convId, count);
          });
          
          console.log(`Calculado conteo de mensajes para ${countsMap.size} conversaciones`);
        }
        
        data?.forEach(item => {
          if (!conversationsMap.has(item.conversacion_id)) {
            const leadCompleto = leadsMap.get(item.lead_id);
            
            const nombreAgenteMensajes = item.agente_nombre || 
                                       item.asignado_nombre || 
                                       item.full_name_agente || 
                                       'Agente'; 
            
            const leadInfo = leadCompleto || {
              id: item.lead_id,
              nombre: item.lead_nombre || 'Usuario',
              apellido: item.lead_apellido || '',
              asignado_a: item.lead_asignado_a || null,
              agente_nombre: nombreAgenteMensajes,
              agente_email: item.agente_email,
              agente_avatar: item.agente_avatar,
              usuario_asignado: item.lead_asignado_a ? {
                id: item.lead_asignado_a,
                nombre: nombreAgenteMensajes,
                email: item.agente_email,
                avatar_url: item.agente_avatar
              } : null,
              tags: []
            };
            
            if (item.lead_asignado_a) {
              console.log(`Lead ${item.lead_id} asignado a: ${leadInfo.agente_nombre || 'No se encontró el nombre'}`);
            }
            
            const chatbotIdentifiers = [];
            
            if (chatbotId && item.conversacion_id) {
              console.log(`Analizando estructura para conversación ${item.conversacion_id.substring(0, 6)}...`, {
                tiene_chatbot_nombre: !!item.chatbot_nombre,
                tiene_chatbot_info: !!item.chatbot_info,
                chatbot_info_estructura: item.chatbot_info ? Object.keys(item.chatbot_info) : 'No disponible',
                conversacion_metadata: item.conversacion_metadata ? 
                  (item.conversacion_metadata.chatbot_id ? 'Tiene chatbot_id' : 'Sin chatbot_id') : 'No disponible',
                mensaje_remitente_id: item.mensaje_remitente_id || 'No disponible'
              });
            }
            
            if (item.mensaje_origen === 'chatbot' && item.mensaje_remitente_id) {
              chatbotIdentifiers.push(item.mensaje_remitente_id);
            }
            
            if (item.chatbot_info && typeof item.chatbot_info === 'object') {
              if (item.chatbot_info.id) {
                chatbotIdentifiers.push(item.chatbot_info.id);
              } 
              if (item.chatbot_info.chatbot_id) {
                chatbotIdentifiers.push(item.chatbot_info.chatbot_id);
              }
            }
            
            if (item.conversacion_metadata && item.conversacion_metadata.chatbot_id) {
              chatbotIdentifiers.push(item.conversacion_metadata.chatbot_id);
            }
            
            if (item.chatbot_nombre) {
              chatbotIdentifiers.push(`nombre:${item.chatbot_nombre}`);
            }
            
            const chatbotIdentificador = chatbotIdentifiers.length > 0 ? 
              chatbotIdentifiers[0] : 
              (item.mensaje_origen === 'chatbot' ? item.mensaje_remitente_id : null);
            
            if (chatbotId && chatbotIdentifiers.length === 0) {
              console.log(`Advertencia: Conversación ${item.conversacion_id.substring(0, 6)} sin identificador de chatbot`);
            }
            
            if (chatbotId) {
              const tieneCoincidencia = chatbotIdentifiers.some(identifier => identifier === chatbotId);
              
              const esRemitenteCoincidente = 
                chatbotId.includes('-') && 
                item.mensaje_origen === 'chatbot' && 
                item.mensaje_remitente_id === chatbotId;
              
              if (!tieneCoincidencia && !esRemitenteCoincidente) {
                console.log(`Filtrando: chatbotId=${chatbotId}, identificadores=${chatbotIdentifiers.join(', ')}, ¿coincide alguno?`, tieneCoincidencia);
                console.log(`Verificación por remitente: mensaje_remitente_id=${item.mensaje_remitente_id || 'no disponible'}, ¿coincide?`, esRemitenteCoincidente);
                return;
              }
            }
            
            const unreadCount = unreadCountsMap.get(item.conversacion_id) || 0;
            const messageCount = messageCountsMap.get(item.conversacion_id) || 
                                item.total_mensajes_conversacion || 0;
            
            conversationsMap.set(item.conversacion_id, {
              id: item.conversacion_id,
              lead_id: item.lead_id,
              ultimo_mensaje: item.conversacion_ultimo_mensaje || item.mensaje_contenido,
              created_at: item.conversacion_fecha_inicio,
              canal_id: item.canal_id || '',
              estado: item.conversacion_estado,
              chatbot_id: chatbotIdentificador || '',
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
              unread_count: unreadCount,
              message_count: messageCount,
              canal_nombre: item.canal_nombre,
              canal_tipo: item.canal_tipo,
              minutos_desde_mensaje: item.minutos_desde_mensaje,
              conversacion_ultima_actualizacion: item.conversacion_ultima_actualizacion
            });
          }
        });
        
        const result = Array.from(conversationsMap.values());
        console.log(`Procesadas ${result.length} conversaciones únicas`);
        
        let filteredResult = result;
        if (chatbotId) {
          filteredResult = result.filter(conv => {
            const matchesById = conv.chatbot_id && (
              conv.chatbot_id === chatbotId || 
              conv.chatbot_id.includes(chatbotId) ||
              chatbotId.includes(conv.chatbot_id)
            );
            
            const matchesByName = chatbotId.startsWith('nombre:') && 
              conv.chatbot?.nombre === chatbotId.replace('nombre:', '');
              
            const matchesByNameReverse = chatbotId.includes('-') && 
              conv.chatbot?.nombre && 
              conv.chatbot_id && 
              conv.chatbot_id.startsWith('nombre:');
              
            const matchesByLeadInfo = conv.lead?.chatbot_info && (
              conv.lead.chatbot_info.id === chatbotId || 
              conv.lead.chatbot_info.chatbot_id === chatbotId
            );
              
            const matchesByMetadata = conv.metadata && 
              conv.metadata.chatbot_id === chatbotId;
              
            return matchesById || matchesByName || matchesByNameReverse || matchesByLeadInfo || matchesByMetadata;
          });
          
          console.log(`Después de filtrado adicional por chatbot: ${filteredResult.length} conversaciones`);
        }
        
        if (filteredResult.length === 0 && chatbotId && chatbotId.includes('-')) {
          console.log(`No se encontraron conversaciones con filtrado normal. Intentando consulta específica por mensaje_remitente_id=${chatbotId}`);
          
          try {
            const { data: mensajesChatbotData, error: mensajesError } = await supabase
              .from('vista_lead_conversaciones_mensajes')
              .select('conversacion_id, lead_id')
              .eq('mensaje_remitente_id', chatbotId)
              .eq('mensaje_origen', 'chatbot');
              
            if (!mensajesError && mensajesChatbotData?.length > 0) {
              console.log(`Encontrados ${mensajesChatbotData.length} mensajes del chatbot. Buscando conversaciones correspondientes.`);
              
              const conversacionesIds = [...new Set(mensajesChatbotData.map(item => item.conversacion_id))];
              
              filteredResult = result.filter(conv => conversacionesIds.includes(conv.id));
              console.log(`Después de recuperar por mensaje_remitente_id: ${filteredResult.length} conversaciones`);
            }
          } catch (innerError) {
            console.error('Error en consulta específica por remitente:', innerError);
          }
        }
        
        if (filteredResult.length === 0 && result.length > 0 && chatbotId) {
          console.log(`ADVERTENCIA: No se encontraron conversaciones para el chatbot ${chatbotId}. ` + 
            "Devolveremos todas las conversaciones no filtradas como último recurso.");
          return result;
        }
        
        return filteredResult;
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
