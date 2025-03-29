
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
      supabase.removeChannel(channelRef.current);
    }
    
    // Create new channel
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
          filter: `conversacion_id=eq.${conversationId}`
        },
        (payload) => {
          console.log("Real-time message received:", payload);
          // Update the query cache with the new message
          queryClient.setQueryData(["messages", conversationId], (oldData: Message[] = []) => {
            // Check if the message already exists to avoid duplicates
            const messageExists = oldData.some(msg => msg.id === payload.new.id);
            if (messageExists) {
              console.log("Message already exists in cache, skipping update");
              return oldData;
            }
            
            console.log("Adding new message to cache:", payload.new);
            return [...oldData, payload.new as Message];
          });
          
          // Also invalidate conversations to refresh the list
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe((status) => {
        console.log(`Enhanced realtime subscription status for conversation ${conversationId}:`, status);
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
    refetchInterval: 5000, // Refresh every 5 seconds
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

  // Send message via API endpoint instead of direct Supabase call
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversationId || !user?.id) {
        throw new Error("Falta información para enviar mensaje");
      }
      
      const apiEndpoint = import.meta.env.VITE_API_BASE_URL || '';
      const url = `${apiEndpoint}/api/v1/agent/message`;
      
      // Create the payload for the API
      const payload = {
        conversation_id: conversationId,
        agent_id: user.id,
        mensaje: content,
        deactivate_chatbot: false, // By default, don't deactivate chatbot
        metadata: {
          agent_name: user.name || "Agente", // Using name instead of fullName
          department: "Ventas" // Default to "Ventas" as user doesn't have a department property
        }
      };
      
      console.log("Enviando mensaje a la API:", payload);
      
      // Get the auth token from Supabase
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      
      if (!token) {
        throw new Error("No hay sesión de autenticación");
      }
      
      // Make the API request
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error en la respuesta de la API:", errorData);
        throw new Error(`Error al enviar mensaje: ${response.statusText}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
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
