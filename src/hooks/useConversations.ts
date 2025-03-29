
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export interface Lead {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string | null;
  telefono: string | null;
}

export interface Message {
  id: string;
  contenido: string;
  origen: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  ultimo_mensaje: string | null;
  lead: Lead | null;
  lead_id: string | null;
  chatbot_id: string | null;
  unread_count: number;
  last_message: Message | null;
}

export function useConversations() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["conversations", user?.companyId],
    queryFn: async (): Promise<Conversation[]> => {
      if (!user?.companyId) {
        console.error("No hay ID de empresa en el contexto de autenticación");
        return [];
      }
      
      console.log("Consultando conversaciones para empresa:", user.companyId);
      
      // First get all leads for the company
      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select("id, nombre, apellido, email, telefono")
        .eq("empresa_id", user.companyId);
      
      if (leadsError) {
        console.error("Error obteniendo leads:", leadsError);
        throw leadsError;
      }

      // Get all conversations for those leads
      const { data: conversations, error: convsError } = await supabase
        .from("conversaciones")
        .select(`
          id, 
          ultimo_mensaje, 
          lead_id,
          chatbot_id
        `)
        .in("lead_id", leads.map(lead => lead.id))
        .order("ultimo_mensaje", { ascending: false });
      
      if (convsError) {
        console.error("Error obteniendo conversaciones:", convsError);
        throw convsError;
      }

      // Get last message for each conversation
      const enhancedConversations = await Promise.all(
        conversations.map(async (conv) => {
          // Get last message
          const { data: lastMessage, error: msgError } = await supabase
            .from("mensajes")
            .select("id, contenido, origen, created_at")
            .eq("conversacion_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          
          if (msgError && msgError.code !== "PGRST116") {
            console.error("Error obteniendo último mensaje:", msgError);
          }
          
          // Get unread count
          const { count, error: countError } = await supabase
            .from("mensajes")
            .select("id", { count: "exact" })
            .eq("conversacion_id", conv.id)
            .eq("origen", "lead")
            .is("leido", false);
          
          if (countError) {
            console.error("Error obteniendo conteo de no leídos:", countError);
          }
          
          // Find the lead for this conversation
          const lead = leads.find(l => l.id === conv.lead_id) || null;
          
          return {
            ...conv,
            lead,
            unread_count: count || 0,
            last_message: lastMessage || null
          };
        })
      );
      
      console.log("Conversaciones obtenidas:", enhancedConversations.length);
      return enhancedConversations;
    },
    enabled: !!user?.companyId,
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}
