
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export function useChat(conversationId: string | undefined) {
  const { user } = useAuth();
  const [chatbotEnabled, setChatbotEnabled] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (conversationId) {
      fetchChatbotStatus();
    }
  }, [conversationId]);

  const fetchChatbotStatus = async () => {
    if (!conversationId) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("conversaciones")
        .select("chatbot_activo")
        .eq("id", conversationId)
        .single();
      
      if (error) {
        console.error("Error obteniendo estado del chatbot:", error);
        throw error;
      }
      
      // If the column doesn't exist or is null, default to true
      setChatbotEnabled(data.chatbot_activo !== false);
    } catch (error) {
      console.error("Error al consultar estado del chatbot:", error);
      // Default to enabled
      setChatbotEnabled(true);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChatbot = async () => {
    if (!conversationId || isToggling) return;
    
    setIsToggling(true);
    
    try {
      const newStatus = !chatbotEnabled;
      
      const { error } = await supabase
        .from("conversaciones")
        .update({ chatbot_activo: newStatus })
        .eq("id", conversationId);
      
      if (error) {
        console.error("Error actualizando estado del chatbot:", error);
        throw error;
      }
      
      setChatbotEnabled(newStatus);
    } catch (error) {
      console.error("Error al cambiar estado del chatbot:", error);
    } finally {
      setIsToggling(false);
    }
  };

  return {
    chatbotEnabled,
    toggleChatbot,
    isToggling,
    isLoading
  };
}
