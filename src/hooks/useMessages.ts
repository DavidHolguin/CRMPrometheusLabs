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

  // Función para enviar un mensaje usando el endpoint API
  const sendMessage = async (
    content: string, 
    directMessageParamsOrMetadata?: {
      agent_id: string;
      lead_id: string;
      chatbot_canal_id?: string;
      channel_id?: string;
      channel_identifier?: string;
      chatbot_id?: string;
      empresa_id?: string;
      metadata?: any;
    } | any
  ) => {
    if (!conversationId) return null;
    
    try {
      // Si tenemos parámetros para mensaje directo, usar el endpoint API
      if (directMessageParamsOrMetadata && typeof directMessageParamsOrMetadata === 'object' && directMessageParamsOrMetadata.agent_id) {
        // Usar siempre la URL correcta de Railway para el endpoint de mensajes directos
        const apiEndpoint = 'https://web-production-01457.up.railway.app';
        
        const requestBody = {
          agent_id: directMessageParamsOrMetadata.agent_id,
          lead_id: directMessageParamsOrMetadata.lead_id,
          mensaje: content,
          chatbot_canal_id: directMessageParamsOrMetadata.chatbot_canal_id || '',
          channel_id: directMessageParamsOrMetadata.channel_id || '',
          channel_identifier: directMessageParamsOrMetadata.channel_identifier || '',
          chatbot_id: directMessageParamsOrMetadata.chatbot_id || '',
          empresa_id: directMessageParamsOrMetadata.empresa_id || '',
          metadata: directMessageParamsOrMetadata.metadata || {}
        };
        
        console.log('Enviando mensaje directo con parámetros:', requestBody);
        
        const response = await fetch(`${apiEndpoint}/api/v1/agent/direct-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Error desconocido' }));
          console.error('Error en respuesta del API:', errorData);
          throw new Error(`Error ${response.status}: ${errorData.detail || 'Error al enviar mensaje'}`);
        }
        
        const data = await response.json();
        console.log('Respuesta del API:', data);
        
        // Invalidar la query de mensajes para refrescar la lista
        queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        
        return data;
      } else {
        // Fallback: inserción directa en Supabase (para compatibilidad)
        console.log('Usando fallback: inserción directa en Supabase');
        
        const newMessage = {
          conversacion_id: conversationId,
          contenido: content,
          origen: 'agente',
          metadata: directMessageParamsOrMetadata || {}
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
      }
    } catch (err) {
      console.error("Error en sendMessage:", err);
      throw err;
    }
  };
  
  return { 
    messages, 
    isLoading, 
    error,
    sendMessage
  };
}
