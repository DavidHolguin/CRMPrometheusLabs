import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Lead {
  id: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  pipeline_id?: string;
  stage_id?: string;
  score?: number;
  canal?: string;
  canal_origen?: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  interaction_count?: number;
  ultima_interaccion?: string;
  stage_name?: string;
  stage_color?: string;
  asignado_a?: string;
  usuario_asignado?: {
    id: string;
    nombre: string;
    email: string;
    avatar_url?: string;
    role?: string;
  };
  empresa_id?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  datos_adicionales?: Record<string, any>;
  tags?: Array<{
    id: string;
    nombre: string;
    color: string;
  }>;
  lead_datos_personales?: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    direccion?: string;
    ciudad?: string;
    pais?: string;
    fecha_nacimiento?: string;
  };
  // Nuevos campos de la vista vista_lead_completa
  lead_id?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  lead_score?: number;
  lead_estado?: string;
  lead_creado?: string;
  lead_actualizado?: string;
  pipeline_nombre?: string;
  probabilidad_cierre?: number;
  agente_nombre?: string;
  agente_email?: string;
  agente_avatar?: string;
  empresa_nombre?: string;
  empresa_descripcion?: string;
  empresa_logo?: string;
  canal_nombre_detalle?: string;
  canal_tipo_detalle?: string;
  canal_descripcion?: string;
  canal_logo_url?: string;
  canal_color?: string;
  canal_configuracion?: any;
  canal_is_active?: boolean;
  etiquetas?: string;
  intenciones_detectadas?: string;
  ultimas_interacciones?: string;
  historial_etapas?: string;
  ultima_conversacion_id?: string;
  ultimo_mensaje?: string;
  ultima_evaluacion_llm?: any;
  ultimos_comentarios?: string;
  chatbot_info?: any;
  total_conversaciones?: number;
  total_mensajes?: number;
  mensajes_sin_leer?: number;
  dias_en_etapa_actual?: number;
  // Propiedad para la temperatura/calificación del lead
  temperatura_actual?: 'Hot' | 'Warm' | 'Cold' | string;
}

export function useLeads(chatbotId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery<Lead[]>({
    queryKey: ['leads', chatbotId],
    queryFn: async () => {
      try {
        // Utilizamos la vista vista_leads_completa para obtener todos los datos de los leads en una sola consulta
        let query = supabase
          .from('vista_leads_completa')
          .select('*')
          .order('lead_creado', { ascending: false });

        // Si se proporciona un chatbotId, filtramos para obtener solo los leads relacionados con ese chatbot
        if (chatbotId) {
          // Utilizamos el campo chatbot_info que contiene información sobre los chatbots relacionados
          // La estructura exacta de chatbot_info determinará cómo realizamos este filtrado
          query = query.filter('chatbot_info', 'cs', JSON.stringify({id: chatbotId}));
          
          // Alternativa: si tenemos los IDs de conversación primero
          const { data: conversations, error: convError } = await supabase
            .from('conversaciones')
            .select('lead_id')
            .eq('chatbot_id', chatbotId);

          if (convError) {
            console.error('Error obteniendo conversaciones:', convError);
            throw convError;
          }

          const leadIds = conversations?.map(conv => conv.lead_id).filter(Boolean) || [];
          
          // Si no hay leads asociados a este chatbot, devolver un array vacío
          if (leadIds.length === 0) return [];
          
          // Filtrar los leads por IDs
          query = supabase
            .from('vista_leads_completa')
            .select('*')
            .in('lead_id', leadIds)
            .order('lead_creado', { ascending: false });
        }
        
        // Limitamos a 100 para evitar problemas de rendimiento
        query = query.limit(100);
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error obteniendo leads desde vista_leads_completa:', error);
          throw error;
        }
        
        // Mapear los datos de la vista a la estructura de Lead que espera la UI
        return data.map(item => {
          // Función para manejar de forma segura las etiquetas
          const procesarEtiquetas = (etiquetas: any) => {
            // Si es undefined o null, devolver array vacío
            if (!etiquetas) return [];
            
            // Si ya es un array u objeto, devolverlo tal cual
            if (typeof etiquetas !== 'string') return etiquetas;
            
            try {
              // Intentar parsearlo como JSON
              return JSON.parse(etiquetas);
            } catch (e) {
              // Si falla, significa que es un string común
              // Convertirlo a un formato de etiqueta con un ID único basado en el contenido
              return [{
                id: `tag-${etiquetas.replace(/\s+/g, '-').toLowerCase()}`,
                nombre: etiquetas,
                color: '#6366f1' // Color por defecto para etiquetas de texto
              }];
            }
          };

          return {
            id: item.lead_id,
            nombre: item.nombre,
            apellido: item.apellido,
            email: item.email,
            telefono: item.telefono,
            score: item.score,
            canal_origen: item.canal_origen,
            created_at: item.fecha_creacion || item.lead_creado,
            updated_at: item.fecha_actualizacion || item.lead_actualizado,
            ultima_interaccion: item.ultima_interaccion,
            stage_name: item.stage_nombre,
            stage_color: item.stage_color,
            asignado_a: item.asignado_a,
            ciudad: item.ciudad,
            pais: item.pais,
            direccion: item.direccion,
            datos_adicionales: item.datos_adicionales,
            // Nuevos campos específicos de vista_leads_completa
            lead_creado: item.lead_creado,
            lead_actualizado: item.lead_actualizado,
            canal_nombre_detalle: item.canal_nombre_detalle,
            canal_tipo_detalle: item.canal_tipo_detalle,
            canal_descripcion: item.canal_descripcion,
            canal_logo_url: item.canal_logo_url,
            canal_color: item.canal_color,
            canal_configuracion: item.canal_configuracion,
            canal_is_active: item.canal_is_active,
            empresa_nombre: item.empresa_nombre,
            empresa_descripcion: item.empresa_descripcion,
            empresa_logo: item.empresa_logo,
            // Usando la función helper para procesar etiquetas de forma segura
            tags: procesarEtiquetas(item.etiquetas),
            // Campos adicionales de la vista
            message_count: item.total_mensajes,
            mensajes_sin_leer: item.mensajes_sin_leer,
            interaction_count: parseInt(item.ultimas_interacciones?.split(",").length || "0"),
            agente_nombre: item.agente_nombre,
            agente_email: item.agente_email,
            agente_avatar: item.agente_avatar,
            ultima_evaluacion_llm: item.ultima_evaluacion_llm,
            pipeline_nombre: item.pipeline_nombre,
            probabilidad_cierre: item.probabilidad_cierre,
            dias_en_etapa_actual: item.dias_en_etapa_actual,
            total_conversaciones: item.total_conversaciones,
            ultima_conversacion_id: item.ultima_conversacion_id,
            ultimo_mensaje: item.ultimo_mensaje,
            ultimos_comentarios: item.ultimos_comentarios,
            intenciones_detectadas: item.intenciones_detectadas,
            chatbot_info: item.chatbot_info,
            // Añadimos el mapeo de temperatura_actual o lo calculamos basado en el score si no existe
            temperatura_actual: item.temperatura_actual || (
              item.score >= 70 ? 'Hot' : 
              item.score >= 40 ? 'Warm' : 'Cold'
            )
          };
        });
      } catch (error) {
        console.error('Error en useLeads:', error);
        throw error;
      }
    }
  });

  const updateLeadMutation = useMutation({
    mutationFn: async (lead: Partial<Lead> & { id: string }) => {
      // Para actualizar, seguimos usando la tabla leads original
      const { data, error } = await supabase
        .from('leads')
        .update({
          score: lead.score,
          stage_id: lead.stage_id,
          asignado_a: lead.asignado_a,
          // Otros campos que se pueden actualizar
        })
        .eq('id', lead.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });

  return {
    ...query,
    updateLead: updateLeadMutation.mutate,
    isUpdating: updateLeadMutation.isPending
  };
}
