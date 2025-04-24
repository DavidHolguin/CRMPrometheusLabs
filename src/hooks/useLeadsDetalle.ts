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
        
        // Transformar los datos para proporcionar una estructura consistente
        const processedData = data?.map(lead => ({
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
          } : null
        })) || [];
        
        return processedData;
        
      } catch (error) {
        console.error('Error procesando datos de leads detalle:', error);
        throw error;
      }
    },
    enabled: !!user?.companyId,
    refetchInterval: 45000, // 45 segundos
    staleTime: 30000, // 30 segundos
    refetchOnWindowFocus: false
  });
}