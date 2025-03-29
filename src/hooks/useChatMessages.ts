
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
  const mainChannelRef = useRef<any>(null);
  const agentChannelRef = useRef<any>(null);

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
      });
    
    mainChannelRef.current = channel;
    
    return () => {
      if (mainChannelRef.current) {
        supabase.removeChannel(mainChannelRef.current);
        mainChannelRef.current = null;
      }
    };
  }, [conversationId]);

  // Set up real-time listener for agent messages from mensajes_agentes table
  useEffect(() => {
    if (!conversationId) return;
    
    // Clean up any existing subscription
    if (agentChannelRef.current) {
      console.log("Removing existing agent channel subscription");
      supabase.removeChannel(agentChannelRef.current);
      agentChannelRef.current = null;
    }
    
    // Create a unique channel name with timestamp to avoid conflicts
    const timestamp = Date.now();
    const agentChannelName = `realtime-agent-messages-${conversationId}-${timestamp}`;
    console.log(`Setting up agent realtime subscription on channel: ${agentChannelName}`);
    
    const agentChannel = supabase
      .channel(agentChannelName)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'mensajes_agentes', 
          filter: `conversacion_id=eq.${conversationId}` 
        },
        (payload) => {
          console.log("New agent message received from realtime:", payload.new);
          
          // Check if message already exists to avoid duplicates
          setMessages(currentMessages => {
            const messageExists = currentMessages.some(msg => msg.id === payload.new.id);
            if (messageExists) {
              console.log("Agent message already exists in state, skipping");
              return currentMessages;
            }
            console.log("Adding new agent message to state");
            return [...currentMessages, payload.new as ChatMessage];
          });
        }
      )
      .subscribe(status => {
        console.log(`Agent realtime subscription status on ${agentChannelName}: ${status}`);
      });
    
    agentChannelRef.current = agentChannel;
    
    return () => {
      if (agentChannelRef.current) {
        supabase.removeChannel(agentChannelRef.current);
        agentChannelRef.current = null;
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
