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
}

export function useLeads(chatbotId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery<Lead[]>({
    queryKey: ['leads', chatbotId],
    queryFn: async () => {
      try {
        if (chatbotId) {
          // Primero obtenemos los lead_ids de las conversaciones asociadas al chatbot
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

          // División en lotes y mapeo para todos los casos
          return await fetchLeadsWithStages(leadIds);
        } else {
          // Si no hay chatbotId, obtenemos todos los leads, pero limitamos a 100 para evitar problemas de rendimiento
          const { data: allLeads, error } = await supabase
            .from('leads')
            .select('id')
            .order('created_at', { ascending: false })
            .limit(100);
            
          if (error) {
            console.error('Error obteniendo lista de leads:', error);
            throw error;
          }
          
          const allLeadIds = allLeads?.map(lead => lead.id) || [];
          
          // Si no hay leads, devolver un array vacío
          if (allLeadIds.length === 0) return [];
          
          // Usar la misma función para obtener los leads con sus stages
          return await fetchLeadsWithStages(allLeadIds);
        }
      } catch (error) {
        console.error('Error en useLeads:', error);
        throw error;
      }
    }
  });

  // Función auxiliar para obtener leads con su información de stages
  const fetchLeadsWithStages = async (leadIds: string[]): Promise<Lead[]> => {
    try {
      // Dividir en lotes de máximo 10 IDs para consultas más pequeñas y evitar URLs muy largas
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < leadIds.length; i += batchSize) {
        batches.push(leadIds.slice(i, i + batchSize));
      }

      // Array para almacenar todos los leads que iremos recopilando
      let allLeads: any[] = [];
      
      // Consultar los leads por lotes
      for (const batchIds of batches) {
        // Obtenemos los leads con JOIN a lead_datos_personales
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select(`
            *,
            lead_datos_personales (
              nombre,
              apellido,
              email,
              telefono,
              direccion,
              ciudad,
              pais,
              fecha_nacimiento
            )
          `)
          .in('id', batchIds)
          .order('created_at', { ascending: false });

        if (leadsError) {
          console.error('Error obteniendo leads por lote:', leadsError);
          continue; // Seguimos con el siguiente lote aunque este falle
        }
        
        if (!leadsData || leadsData.length === 0) continue;
        
        // Procesar los leads para incluir los datos personales como campos de nivel superior
        // y también mantener los datos originales en la propiedad lead_datos_personales
        const processedLeads = leadsData.map(lead => {
          const personalData = lead.lead_datos_personales || {};
          
          return {
            ...lead,
            // Añadir datos personales como campos de nivel superior para compatibilidad con código existente
            nombre: personalData.nombre || '',
            apellido: personalData.apellido || '',
            email: personalData.email || '',
            telefono: personalData.telefono || '',
            // Si hay datos en lead_datos_personales que también están a nivel raíz,
            // mantenemos ambos pero priorizamos los de lead_datos_personales
            direccion: personalData.direccion || lead.direccion,
            ciudad: personalData.ciudad || lead.ciudad,
            pais: personalData.pais || lead.pais,
          };
        });
        
        // Para cada lead, obtenemos su información de stage en consultas separadas
        const leadsWithStages = await Promise.all(processedLeads.map(async (lead) => {
          // Solo obtenemos la información del stage si el lead tiene un stage_id
          if (lead.stage_id) {
            const { data: stageData } = await supabase
              .from('pipeline_stages')
              .select('nombre, color')
              .eq('id', lead.stage_id)
              .single();
              
            return {
              ...lead,
              stage_name: stageData?.nombre || 'Sin etapa',
              stage_color: stageData?.color || '#cccccc'
            };
          }
          
          return {
            ...lead,
            stage_name: 'Sin etapa',
            stage_color: '#cccccc'
          };
        }));
        
        // Agregar este lote al acumulado
        allLeads = [...allLeads, ...leadsWithStages];
      }
      
      return allLeads;
    } catch (error) {
      console.error('Error en fetchLeadsWithStages:', error);
      return [];
    }
  };

  const updateLeadMutation = useMutation({
    mutationFn: async (lead: Partial<Lead> & { id: string }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(lead)
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
