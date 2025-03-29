
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

export interface Message {
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

export function useMessages(conversationId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  
  // Clean up realtime listener when component unmounts or conversationId changes
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        console.log(`Cleaning up realtime subscription for conversation: ${conversationId}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId]);
  
  // Set up real-time listener for messages
  useEffect(() => {
    if (!conversationId) return;
    
    console.log(`Setting up enhanced realtime subscription for conversation: ${conversationId}`);
    
    // Remove existing channel if there is one
    if (channelRef.current) {
      console.log("Removing existing channel subscription");
      supabase.removeChannel(channelRef.current);
    }
    
    // Create new channel with improved configuration - added timestamp to make the channel name unique
    const channelName = `messages-${conversationId}-${Date.now()}`;
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
            
            if (messageExists) {
              console.log("Message already exists in cache, skipping update");
              return;
            }
            
            console.log("Adding new message to cache:", payload.new);
            console.log("Message origin:", payload.new.origen);
            
            // Add the message to the cache
            queryClient.setQueryData(["messages", conversationId], [...currentMessages, payload.new as Message]);
            
            // Force refetch to ensure we've got the latest state
            queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
            
            // Also invalidate conversations to refresh the list
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
          }
          
          // Handle UPDATE events
          else if (payload.eventType === 'UPDATE') {
            console.log("Processing UPDATE event for message:", payload.new);
            
            queryClient.setQueryData(["messages", conversationId], (oldData: Message[] = []) => {
              return oldData.map(msg => 
                msg.id === payload.new.id ? { ...msg, ...payload.new as Message } : msg
              );
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`Enhanced realtime subscription status for conversation ${conversationId}: ${status}`);
        
        // Force refetch on successful subscription to ensure we have latest data
        if (status === 'SUBSCRIBED') {
          console.log("Channel successfully subscribed, fetching latest messages");
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        }
      });
    
    // Save channel reference for cleanup
    channelRef.current = channel;
    
  }, [conversationId, queryClient]);
  
  const messagesQuery = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async (): Promise<Message[]> => {
      if (!conversationId) {
        return [];
      }
      
      console.log(`Fetching messages for conversation: ${conversationId}`);
      
      const { data, error } = await supabase
        .from("mensajes")
        .select("*")
        .eq("conversacion_id", conversationId)
        .order("created_at", { ascending: true });
      
      if (error) {
        console.error("Error obteniendo mensajes:", error);
        throw error;
      }
      
      console.log(`Found ${data?.length || 0} messages for conversation ${conversationId}`);
      return data || [];
    },
    enabled: !!conversationId,
    refetchInterval: 5000, // Maintain a 5-second refresh as backup
    staleTime: 1000, // Mark data as stale quickly to encourage refetches
  });

  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      // Mark all lead messages as read
      const { error } = await supabase
        .from("mensajes")
        .update({ leido: true })
        .eq("conversacion_id", conversationId)
        .eq("origen", "lead")
        .is("leido", false);
      
      if (error) {
        console.error("Error marcando mensajes como leídos:", error);
        throw error;
      }
      
      return true;
    },
    onSuccess: () => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Send message directly to Supabase instead of via API
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversationId || !user?.id) {
        throw new Error("Falta información para enviar mensaje");
      }
      
      console.log("Enviando mensaje directamente a Supabase:", {
        conversacion_id: conversationId,
        remitente_id: user.id,
        contenido: content
      });
      
      // Generate a UUID for the message
      const messageId = crypto.randomUUID();
      
      // Create the message directly in Supabase
      const { data, error } = await supabase
        .from("mensajes")
        .insert({
          id: messageId,
          conversacion_id: conversationId,
          contenido: content,
          origen: "agente",
          remitente_id: user.id,
          tipo_contenido: "texto",
          leido: true,
          metadata: {
            agent_name: user.name || "Agente",
            department: "Ventas",
            agent_id: user.id
          }
        })
        .select();
      
      if (error) {
        console.error("Error al enviar mensaje a Supabase:", error);
        throw error;
      }
      
      console.log("Mensaje enviado correctamente a Supabase:", data);
      
      return { 
        mensaje_id: messageId, 
        mensaje: content 
      };
    },
    onSuccess: (data) => {
      console.log("Message sent successfully, response:", data);
      // Immediately update the UI with our sent message without waiting for realtime
      queryClient.setQueryData(["messages", conversationId], (oldData: Message[] = []) => {
        // Ensure we don't add a duplicate message
        if (oldData.some(msg => msg.id === data.mensaje_id)) {
          return oldData;
        }
        
        return [...oldData, {
          id: data.mensaje_id,
          conversacion_id: conversationId,
          contenido: data.mensaje || "",
          origen: "agente",
          created_at: new Date().toISOString(),
          leido: true,
          remitente_id: user?.id,
          metadata: {
            agent_name: user?.name || "Agente",
            department: "Ventas"
          }
        }];
      });
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  return {
    ...messagesQuery,
    markAsRead: markAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
  };
}
