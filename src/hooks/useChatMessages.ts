
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export function useChatMessages(conversationId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<any>(null);
  
  // Fetch initial messages
  useEffect(() => {
    if (!conversationId) return;
    
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        console.log(`Fetching messages for conversation: ${conversationId}`);
        
        const { data, error } = await supabase
          .from("mensajes")
          .select("*")
          .eq("conversacion_id", conversationId)
          .order("created_at", { ascending: true });
        
        if (error) {
          throw error;
        }
        
        setMessages(data || []);
        console.log(`Found ${data?.length || 0} messages for conversation ${conversationId}`);
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessages();
  }, [conversationId]);
  
  // Set up real-time listener for messages
  useEffect(() => {
    if (!conversationId) return;
    
    console.log(`Setting up realtime subscription for conversation: ${conversationId}`);
    
    // Remove existing channel if there is one
    if (channelRef.current) {
      console.log("Removing existing channel subscription");
      supabase.removeChannel(channelRef.current);
    }
    
    // Create new channel with improved configuration - added timestamp to make the channel name unique
    const channelName = `public-chat-${conversationId}-${Date.now()}`;
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
            
            // Check if the message already exists to avoid duplicates
            setMessages(currentMessages => {
              const messageExists = currentMessages.some(msg => msg.id === payload.new.id);
              
              if (messageExists) {
                console.log("Message already exists in state, skipping update");
                return currentMessages;
              }
              
              console.log("Adding new message to state:", payload.new);
              return [...currentMessages, payload.new as ChatMessage];
            });
          }
          
          // Handle UPDATE events
          else if (payload.eventType === 'UPDATE') {
            console.log("Processing UPDATE event for message:", payload.new);
            
            setMessages(currentMessages => {
              return currentMessages.map(msg => 
                msg.id === payload.new.id ? { ...msg, ...payload.new as ChatMessage } : msg
              );
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status for conversation ${conversationId}: ${status}`);
      });
    
    // Save channel reference for cleanup
    channelRef.current = channel;
    
    return () => {
      if (channelRef.current) {
        console.log(`Cleaning up realtime subscription for conversation: ${conversationId}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId]);
  
  return { messages, isLoading, error };
}
