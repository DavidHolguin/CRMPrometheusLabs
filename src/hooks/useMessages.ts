import { useEffect } from "react";
import { getSupabaseClient } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";

export interface Message {
  id: string;
  conversacion_id: string;
  contenido: string;
  contenido_sanitizado?: string;
  origen: string;
  created_at: string;
  metadata?: any;
}

export function useMessages(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  const supabase = getSupabaseClient();
  
  // Query para cargar mensajes
  const { 
    data: messages = [], 
    isLoading,
    error
  } = useQuery({
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
        console.error("Error cargando mensajes:", error);
        throw error;
      }
      
      return data as Message[];
    },
    enabled: !!conversationId,
  });

  // Suscripción en tiempo real a nuevos mensajes
  useEffect(() => {
    if (!conversationId) return;
    
    const channelName = `messages-${conversationId}`;
    console.log(`Creating new channel: ${channelName}`);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'mensajes',
          filter: `conversacion_id=eq.${conversationId}`
        },
        (payload) => {
          console.log("Real-time message event received:", payload);
          
          // Handle INSERT events
          if (payload.eventType === 'INSERT') {
            console.log("Processing INSERT event for message:", payload.new);
            
            // Get current messages from cache
            const currentMessages = queryClient.getQueryData<Message[]>(["messages", conversationId]) || [];
            console.log("Current messages in cache:", currentMessages.length);
            
            // Check if the message already exists to avoid duplicates
            const messageExists = currentMessages.some(msg => msg.id === payload.new.id);
            
            if (!messageExists) {
              console.log("Adding new message to cache");
              queryClient.setQueryData(["messages", conversationId], [...currentMessages, payload.new]);
            }
          }
          
          // Handle UPDATE events
          if (payload.eventType === 'UPDATE') {
            console.log("Processing UPDATE event for message:", payload.new);
            
            // Get current messages from cache
            const currentMessages = queryClient.getQueryData<Message[]>(["messages", conversationId]) || [];
            
            // Replace the updated message
            const updatedMessages = currentMessages.map(msg => 
              msg.id === payload.new.id ? payload.new : msg
            );
            
            queryClient.setQueryData(["messages", conversationId], updatedMessages);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status for messages: ${status}`);
      });
      
    // Cleanup function
    return () => {
      console.log(`Removing channel: ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  // Función para enviar un mensaje
  const sendMessage = async (content: string, metadata?: any) => {
    if (!conversationId) return null;
    
    try {
      const newMessage = {
        conversacion_id: conversationId,
        contenido: content,
        origen: 'agente', // Asumiendo que el contexto de uso es para un agente
        metadata
      };
      
      const { data, error } = await supabase
        .from('mensajes')
        .insert(newMessage)
        .select()
        .single();
        
      if (error) {
        console.error("Error al enviar mensaje:", error);
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error("Error en sendMessage:", err);
      return null;
    }
  };
  
  return { 
    messages, 
    isLoading, 
    error,
    sendMessage
  };
}
