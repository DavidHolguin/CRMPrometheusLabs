
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ChatMessage {
  id: string;
  conversacion_id: string;
  contenido: string;
  origen: string;
  created_at: string;
  leido: boolean;
  remitente_id: string | null;
  metadata?: any;
  tipo_contenido?: string;
}

export function useChatMessages(conversationId: string | undefined | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<any>(null);
  
  // Fetch initial messages
  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }
    
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("mensajes")
          .select("*")
          .eq("conversacion_id", conversationId)
          .order("created_at", { ascending: true });
        
        if (error) throw error;
        console.log("Fetched messages:", data);
        setMessages(data || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("No se pudieron cargar los mensajes");
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, [conversationId]);
  
  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!conversationId) return;
    
    // Clean up previous subscription if any
    if (channelRef.current) {
      console.log("Removing existing channel subscription");
      supabase.removeChannel(channelRef.current);
    }
    
    // Create a unique channel name
    const channelName = `messages-${conversationId}-${Date.now()}`;
    console.log(`Setting up realtime subscription for conversation: ${conversationId} with channel: ${channelName}`);
    
    // Subscribe to agent messages only - as other messages are already handled
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'mensajes', 
          filter: `conversacion_id=eq.${conversationId} AND origen=eq.agente` 
        },
        (payload) => {
          console.log("New agent message received:", payload.new);
          const newMsg = payload.new as ChatMessage;
          
          // Skip system messages
          if (newMsg.metadata && newMsg.metadata.is_system_message === true) {
            console.log("Skipping system message:", newMsg);
            return;
          }
          
          // Add the new message to the state
          setMessages(currentMessages => {
            // Check if the message already exists
            const messageExists = currentMessages.some(msg => msg.id === payload.new.id);
            if (messageExists) {
              return currentMessages;
            }
            return [...currentMessages, newMsg];
          });
        }
      )
      .subscribe(status => {
        console.log(`Realtime subscription status: ${status}`);
      });
    
    // Save channel reference for cleanup
    channelRef.current = channel;
    
    // Cleanup on unmount or conversationId change
    return () => {
      if (channelRef.current) {
        console.log(`Removing realtime subscription for conversation: ${conversationId}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId]);
  
  // Function to send a message
  const sendMessage = async (content: string) => {
    if (!conversationId || !content.trim()) {
      return;
    }
    
    try {
      // Add optimistic message
      const optimisticId = crypto.randomUUID();
      const optimisticMsg: ChatMessage = {
        id: optimisticId,
        conversacion_id: conversationId,
        contenido: content,
        origen: "usuario",
        created_at: new Date().toISOString(),
        leido: false,
        remitente_id: null,
      };
      
      setMessages(prev => [...prev, optimisticMsg]);
      
      // Get empresa_id and chatbot_id from the first message or from another source
      const apiEndpoint = import.meta.env.VITE_API_BASE_URL || 'https://web-production-01457.up.railway.app';
      
      // Prepare data for the API endpoint
      const sessionId = localStorage.getItem(`chatbot_session_${conversationId}`) || crypto.randomUUID();
      const leadId = localStorage.getItem(`chatbot_lead_${conversationId}`);
      const chatbotId = localStorage.getItem(`chatbot_id_${conversationId}`);
      const userName = localStorage.getItem(`chatbot_name_${conversationId}`);
      const userPhone = localStorage.getItem(`chatbot_phone_${conversationId}`);
      
      // Get empresa_id from localStorage or you might need to fetch it
      const empresaId = localStorage.getItem(`empresa_id_${conversationId}`);
      
      if (!empresaId || !chatbotId) {
        throw new Error("Información de empresa o chatbot no disponible");
      }
      
      // Send to API
      const response = await fetch(`${apiEndpoint}/api/v1/channels/web`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          empresa_id: empresaId,
          chatbot_id: chatbotId,
          mensaje: content,
          session_id: sessionId,
          lead_id: leadId || undefined,
          metadata: {
            browser: navigator.userAgent,
            page: window.location.pathname,
            name: userName || undefined,
            phone: userPhone || undefined
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error al enviar mensaje: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("API response:", data);
      
      // Update messages with the actual server response
      setMessages(prev => {
        // Remove optimistic message
        const filtered = prev.filter(msg => msg.id !== optimisticId);
        
        // Add confirmed user message if not already there
        const userMsgExists = filtered.some(msg => msg.id === data.mensaje_id);
        const botResponseExists = filtered.some(msg => 
          msg.contenido === data.respuesta && msg.origen === "chatbot"
        );
        
        let newMessages = [...filtered];
        
        if (!userMsgExists) {
          newMessages.push({
            id: data.mensaje_id,
            conversacion_id: conversationId,
            contenido: content,
            origen: "usuario",
            created_at: new Date().toISOString(),
            leido: true,
            remitente_id: null
          });
        }
        
        if (!botResponseExists && data.respuesta) {
          newMessages.push({
            id: crypto.randomUUID(),
            conversacion_id: conversationId,
            contenido: data.respuesta,
            origen: "chatbot",
            created_at: new Date().toISOString(),
            leido: true,
            remitente_id: null,
            metadata: data.metadata
          });
        }
        
        return newMessages;
      });
      
      // Store any new information returned by the API
      if (data.conversacion_id) {
        localStorage.setItem(`chatbot_conversation_${chatbotId}`, data.conversacion_id);
      }
      
      if (data.lead_id) {
        localStorage.setItem(`chatbot_lead_${chatbotId}`, data.lead_id);
      }
      
      return data;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("No se pudo enviar el mensaje. Intente de nuevo.");
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => 
        !(msg.contenido === content && msg.origen === "usuario" && !msg.id.includes("-"))
      ));
      
      throw error;
    }
  };
  
  return {
    messages,
    loading,
    sendMessage
  };
}
