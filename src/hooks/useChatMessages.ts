import { useState, useEffect, useRef } from "react";
import { getSupabaseClient } from "@/integrations/supabase/client";

export interface ChatMessage {
  id: string;
  conversacion_id: string;
  contenido: string;
  origen: string;
  created_at: string;
  metadata?: any;
  // Propiedades adicionales para mensajes de audio
  isAudio?: boolean;
  audioUrl?: string;
  audioDuration?: number;
}

export function useChatMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const mainChannelRef = useRef<any>(null);
  const supabase = getSupabaseClient();
  
  // Función para cargar mensajes históricos
  useEffect(() => {
    const fetchMessages = async () => {
      if (!conversationId) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('mensajes')
          .select('*')
          .eq('conversacion_id', conversationId)
          .order('created_at', { ascending: true });
          
        if (error) {
          throw error;
        }
        
        setMessages(data || []);
        
      } catch (err: any) {
        console.error("Error cargando mensajes:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessages();
  }, [conversationId]);
  
  // Establecer una suscripción en tiempo real para nuevos mensajes
  useEffect(() => {
    if (!conversationId) return;
    
    // Limpiamos cualquier suscripción anterior
    if (mainChannelRef.current) {
      console.log("Removing existing main channel subscription");
      supabase.removeChannel(mainChannelRef.current);
      mainChannelRef.current = null;
    }
    
    // Create a unique channel name with timestamp to avoid conflicts
    const timestamp = Date.now();
    const channelName = `realtime-messages-${conversationId}-${timestamp}`;
    console.log(`Setting up realtime subscription on channel: ${channelName}`);
    
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'mensajes', 
          filter: `conversacion_id=eq.${conversationId}` 
        },
        (payload) => {
          console.log("New message received from realtime:", payload.new);
          
          // Check if message already exists to avoid duplicates
          setMessages(currentMessages => {
            const messageExists = currentMessages.some(msg => msg.id === payload.new.id);
            if (messageExists) {
              return currentMessages;
            }
            return [...currentMessages, payload.new as ChatMessage];
          });
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status: ${status}`);
      });
      
    mainChannelRef.current = channel;
    
    // Cleanup function to remove the channel subscription
    return () => {
      console.log("Cleaning up realtime subscription");
      if (mainChannelRef.current) {
        supabase.removeChannel(mainChannelRef.current);
        mainChannelRef.current = null;
      }
    };
  }, [conversationId]);
  
  // Función para agregar un mensaje al estado (sin enviarlo a la API)
  const addMessage = (message: ChatMessage) => {
    // Asegurarnos de que el mensaje tenga un conversacion_id
    const completeMessage: ChatMessage = {
      ...message,
      conversacion_id: message.conversacion_id || conversationId || '',
    };

    setMessages(currentMessages => {
      // Verificar si el mensaje ya existe
      const exists = currentMessages.some(msg => msg.id === completeMessage.id);
      if (exists) {
        return currentMessages;
      }
      return [...currentMessages, completeMessage];
    });
  };

  // Función para actualizar un mensaje existente
  const updateMessage = (id: string, updates: Partial<ChatMessage>) => {
    setMessages(currentMessages => 
      currentMessages.map(msg => 
        msg.id === id ? { ...msg, ...updates } : msg
      )
    );
  };
  
  const sendMessage = async (content: string) => {
    if (!conversationId) return null;
    
    try {
      const newMessage = {
        conversacion_id: conversationId,
        contenido: content,
        origen: 'usuario'
      };
      
      const { data, error } = await supabase
        .from('mensajes')
        .insert(newMessage)
        .select()
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
      return null;
    }
  };
  
  return { 
    messages, 
    isLoading, 
    error, 
    sendMessage,
    addMessage,
    updateMessage
  };
}
