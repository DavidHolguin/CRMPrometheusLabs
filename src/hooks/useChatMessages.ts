
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

export interface ChatMessage {
  id: string;
  contenido: string;
  origen: string;
  created_at: string;
  metadata?: any;
}

export function useChatMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const channelRef = useRef<any>(null);

  // Fetch initial messages
  useEffect(() => {
    if (!conversationId) return;
    
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("mensajes")
          .select("*")
          .eq("conversacion_id", conversationId)
          .order("created_at", { ascending: true });
          
        if (error) throw error;
        
        console.log("Initial messages loaded:", data?.length);
        setMessages(data || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    
    fetchMessages();
  }, [conversationId]);

  // Set up real-time listener for messages with improved subscription handling
  useEffect(() => {
    if (!conversationId) return;
    
    // Clean up any existing subscription
    if (channelRef.current) {
      console.log("Removing existing channel subscription");
      supabase.removeChannel(channelRef.current)
        .then(response => {
          console.log(`Enhanced realtime subscription cleanup for conversation ${conversationId}:`, response);
        })
        .catch(err => {
          console.error(`Error removing channel for conversation ${conversationId}:`, err);
        });
      channelRef.current = null;
    }
    
    // Create a unique channel name with timestamp to avoid conflicts
    const timestamp = Date.now();
    const channelName = `realtime-messages-${conversationId}-${timestamp}`;
    console.log(`Setting up realtime subscription on channel: ${channelName}`);
    
    try {
      // Subscribe to ALL events (INSERT, UPDATE, DELETE) for mensajes table
      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', 
          { 
            event: '*', // Listen to all events: INSERT, UPDATE, DELETE
            schema: 'public', 
            table: 'mensajes', 
            filter: `conversacion_id=eq.${conversationId}` 
          },
          (payload) => {
            console.log("Realtime event received:", payload.eventType, payload);
            
            if (payload.eventType === 'INSERT') {
              // Check if message already exists to avoid duplicates
              setMessages(currentMessages => {
                const messageExists = currentMessages.some(msg => msg.id === payload.new.id);
                if (messageExists) {
                  console.log("Message already exists in state, skipping");
                  return currentMessages;
                }
                console.log("Adding new message to state:", payload.new);
                return [...currentMessages, payload.new as ChatMessage];
              });
            } else if (payload.eventType === 'UPDATE') {
              // Update existing message
              setMessages(currentMessages => 
                currentMessages.map(msg => 
                  msg.id === payload.new.id ? { ...msg, ...payload.new as ChatMessage } : msg
                )
              );
            } else if (payload.eventType === 'DELETE') {
              // Remove deleted message
              setMessages(currentMessages => 
                currentMessages.filter(msg => msg.id !== payload.old.id)
              );
            }
          }
        )
        .subscribe(status => {
          console.log(`Realtime subscription status on ${channelName}: ${status}`);
          if (status === 'SUBSCRIBED') {
            console.log(`Successfully subscribed to messages for conversation: ${conversationId}`);
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            console.error(`Realtime subscription error for conversation ${conversationId}: ${status}`);
          }
        });
      
      channelRef.current = channel;
    } catch (error) {
      console.error("Error setting up realtime subscription:", error);
    }
    
    // Cleanup function
    return () => {
      console.log(`Cleaning up realtime subscription for conversation: ${conversationId}`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
          .then(response => {
            console.log(`Enhanced realtime subscription cleanup for conversation ${conversationId}:`, response);
          })
          .catch(err => {
            console.error(`Error removing channel for conversation ${conversationId}:`, err);
          });
        channelRef.current = null;
      }
    };
  }, [conversationId]);

  // Function to add a new message locally
  const addMessage = (message: ChatMessage) => {
    setMessages(currentMessages => {
      const messageExists = currentMessages.some(msg => msg.id === message.id);
      if (messageExists) {
        return currentMessages;
      }
      return [...currentMessages, message];
    });
  };

  // Nueva función para enviar mensajes directamente a Supabase
  const sendMessageToSupabase = async (content: string, origin: string = 'user', metadata: any = {}) => {
    if (!conversationId || !content.trim()) {
      console.error("No se puede enviar el mensaje: falta el ID de conversación o el contenido");
      return null;
    }

    try {
      const messageId = uuidv4();
      const newMessage = {
        id: messageId,
        conversacion_id: conversationId,
        contenido: content,
        origen: origin,
        metadata: metadata,
        created_at: new Date().toISOString(),
      };

      // Optimistically add the message to the UI
      addMessage(newMessage as ChatMessage);

      // Send to Supabase
      const { data, error } = await supabase
        .from("mensajes")
        .insert(newMessage)
        .select();

      if (error) {
        console.error("Error sending message to Supabase:", error);
        return null;
      }

      console.log("Message sent successfully to Supabase:", data);
      return data[0];
    } catch (error) {
      console.error("Error in sendMessageToSupabase:", error);
      return null;
    }
  };

  return {
    messages,
    addMessage,
    sendMessageToSupabase
  };
}
