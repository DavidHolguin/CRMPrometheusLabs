
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  // Set up real-time listener for all messages
  useEffect(() => {
    if (!conversationId) return;
    
    // Clean up any existing subscription
    if (channelRef.current) {
      console.log("Removing existing channel subscription");
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    // Create a unique channel name with timestamp to avoid conflicts
    const timestamp = Date.now();
    const channelName = `realtime-messages-${conversationId}-${timestamp}`;
    console.log(`Setting up realtime subscription on channel: ${channelName}`);
    
    // Enable realtime on the mensajes table if not already done
    // This happens on the server side so we don't need to do it here
    
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
              console.log("Message already exists in state, skipping");
              return currentMessages;
            }
            console.log("Adding new message to state");
            return [...currentMessages, payload.new as ChatMessage];
          });
        }
      )
      .subscribe(status => {
        console.log(`Realtime subscription status on ${channelName}: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to messages for conversation: ${conversationId}`);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.error(`Enhanced realtime subscription status for conversation ${conversationId}: ${status}`);
        }
      });
    
    channelRef.current = channel;
    
    return () => {
      console.log(`Cleaning up realtime subscription for conversation: ${conversationId}`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
          .then(response => {
            console.log(`Enhanced realtime subscription status for conversation ${conversationId}: ${response.status}`);
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

  return {
    messages,
    addMessage
  };
}
