
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function useChat(conversationId: string | undefined) {
  const { user } = useAuth();
  const [chatbotEnabled, setChatbotEnabled] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const queryClient = useQueryClient();

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
          .is("metadata->is_system_message", true)
          .order("created_at", { ascending: false })
          .limit(1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Find the latest system message about chatbot state
          const latestMessage = data[0];
          
          // Check if the message contains info about chatbot being disabled
          if (latestMessage.metadata && 
              latestMessage.metadata.is_system_message && 
              latestMessage.metadata.chatbot_state === false) {
            setChatbotEnabled(false);
          }
        }
      } catch (error) {
        console.error("Error checking chatbot state:", error);
      }
    };
    
    checkChatbotState();
  }, [conversationId]);

  const toggleChatbot = async () => {
    if (!conversationId || !user?.id) return;
    
    setIsToggling(true);
    
    try {
      const apiEndpoint = import.meta.env.VITE_API_BASE_URL || '';
      const url = `${apiEndpoint}/api/v1/agent/message`;
      
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      
      if (!token) {
        throw new Error("No hay sesión de autenticación");
      }
      
      // Create a special message to toggle the chatbot
      const payload = {
        conversation_id: conversationId,
        agent_id: user.id,
        mensaje: chatbotEnabled 
          ? "El chatbot ha sido desactivado para esta conversación." 
          : "El chatbot ha sido activado para esta conversación.",
        deactivate_chatbot: !chatbotEnabled, // Toggle the current state
        metadata: {
          agent_name: user.name || "Agente",
          department: "Sistema",
          is_system_message: true,
          chatbot_state: !chatbotEnabled
        }
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Error al ${chatbotEnabled ? 'desactivar' : 'activar'} el chatbot.`);
      }
      
      // Update local state
      setChatbotEnabled(!chatbotEnabled);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      
      toast.success(`Chatbot ${chatbotEnabled ? 'desactivado' : 'activado'} correctamente.`);
      
    } catch (error) {
      console.error("Error al cambiar el estado del chatbot:", error);
      toast.error(`No se pudo ${chatbotEnabled ? 'desactivar' : 'activar'} el chatbot.`);
    } finally {
      setIsToggling(false);
    }
  };

  return {
    chatbotEnabled,
    toggleChatbot,
    isToggling
  };
}
