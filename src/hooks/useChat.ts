import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getSupabaseClient } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function useChat(conversationId: string | undefined) {
  const { user } = useAuth();
  const [chatbotEnabled, setChatbotEnabled] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const queryClient = useQueryClient();
  const supabase = getSupabaseClient();

  // Get current chatbot state on mount
  useEffect(() => {
    const checkChatbotState = async () => {
      if (!conversationId) return;
      
      try {
        // Check if there's a system message indicating chatbot was disabled
        const { data, error } = await supabase
          .from("mensajes")
          .select("metadata")
          .eq("conversacion_id", conversationId)
          .eq("origen", "agente")
          .order("created_at", { ascending: false })
          .limit(1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Find the latest system message about chatbot state
          const latestMessage = data[0];
          if (latestMessage.metadata && latestMessage.metadata.chatbotDisabled !== undefined) {
            setChatbotEnabled(!latestMessage.metadata.chatbotDisabled);
          }
        }
      } catch (err) {
        console.error("Error checking chatbot state:", err);
      }
    };
    
    checkChatbotState();
  }, [conversationId]);

  // Function to toggle chatbot state
  const toggleChatbot = async () => {
    if (!conversationId || !user || isToggling) return;
    
    setIsToggling(true);
    
    try {
      // Update the conversation first
      const { error: convError } = await supabase
        .from("conversaciones")
        .update({ chatbot_activo: !chatbotEnabled })
        .eq("id", conversationId);
      
      if (convError) throw convError;
      
      // Send a system message indicating the state change
      const { error: msgError } = await supabase
        .from("mensajes")
        .insert({
          conversacion_id: conversationId,
          contenido: chatbotEnabled 
            ? "El agente ha desactivado las respuestas automáticas del chatbot"
            : "El agente ha activado las respuestas automáticas del chatbot",
          origen: "agente",
          metadata: { 
            system: true,
            chatbotDisabled: chatbotEnabled
          }
        });
      
      if (msgError) throw msgError;
      
      // Update local state
      setChatbotEnabled(!chatbotEnabled);
      
      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      
      toast.success(chatbotEnabled 
        ? "Chatbot desactivado. Ahora responderás manualmente." 
        : "Chatbot activado. Las respuestas automáticas están habilitadas.");
      
    } catch (error) {
      console.error("Error al cambiar estado del chatbot:", error);
      toast.error("No se pudo cambiar el estado del chatbot");
    } finally {
      setIsToggling(false);
    }
  };

  return {
    chatbotEnabled,
    isToggling,
    toggleChatbot
  };
}
