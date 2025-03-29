
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Message {
  id: string;
  conversacion_id: string;
  contenido: string;
  origen: string;
  created_at: string;
  leido: boolean;
  remitente_id: string | null;
}

export function useMessages(conversationId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const messagesQuery = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async (): Promise<Message[]> => {
      if (!conversationId) {
        return [];
      }
      
      const { data, error } = await supabase
        .from("mensajes")
        .select("*")
        .eq("conversacion_id", conversationId)
        .order("created_at", { ascending: true });
      
      if (error) {
        console.error("Error obteniendo mensajes:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!conversationId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      // Mark all lead messages as read
      const { error } = await supabase
        .from("mensajes")
        .update({ leido: true })
        .eq("conversacion_id", conversationId)
        .eq("origen", "lead")
        .is("leido", false);
      
      if (error) {
        console.error("Error marcando mensajes como leídos:", error);
        throw error;
      }
      
      return true;
    },
    onSuccess: () => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversationId || !user?.id) {
        throw new Error("Falta información para enviar mensaje");
      }
      
      // Get the conversation to check if we need to update chatbot status
      const { data: conversation, error: convError } = await supabase
        .from("conversaciones")
        .select("*")
        .eq("id", conversationId)
        .single();
      
      if (convError) {
        console.error("Error obteniendo conversación:", convError);
        throw convError;
      }
      
      // Insert new message
      const { data, error } = await supabase
        .from("mensajes")
        .insert({
          conversacion_id: conversationId,
          contenido: content,
          origen: "agente",
          remitente_id: user.id,
          leido: true
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error enviando mensaje:", error);
        throw error;
      }
      
      // Update conversation's last message timestamp
      const { error: updateError } = await supabase
        .from("conversaciones")
        .update({ 
          ultimo_mensaje: new Date().toISOString()
        })
        .eq("id", conversationId);
      
      if (updateError) {
        console.error("Error actualizando timestamp de conversación:", updateError);
      }
      
      return data;
    },
    onSuccess: () => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  return {
    ...messagesQuery,
    markAsRead: markAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
  };
}
