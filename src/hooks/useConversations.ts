import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
}

export function useConversations(chatbotId?: string) {
  return useQuery<Conversation[]>({
    queryKey: ['conversations', chatbotId],
    queryFn: async () => {
      let query = supabase
        .from('conversaciones')
        .select(`
          *,
          evaluacion:evaluaciones_llm(
            score_satisfaccion,
            score_potencial,
            comentario
          )
        `);
      
      // Solo filtrar por chatbotId si se proporciona uno
      if (chatbotId) {
        query = query.eq('chatbot_id', chatbotId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error al obtener conversaciones:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: true // Siempre está habilitado, pero si hay chatbotId filtrará
  });
}
