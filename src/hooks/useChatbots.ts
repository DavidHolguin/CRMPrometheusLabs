
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ChatbotContext } from "@/types/chatbot";

export interface Chatbot {
  id: string;
  nombre: string;
  descripcion: string | null;
  avatar_url: string | null;
  is_active: boolean;
  empresa_id: string;
  tono: string | null;
  personalidad: string | null;
  instrucciones: string | null;
  created_at: string;
  updated_at: string;
  context?: ChatbotContext;
}

export function useChatbots() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["chatbots", user?.companyId],
    queryFn: async (): Promise<Chatbot[]> => {
      if (!user?.companyId) {
        console.error("No hay ID de empresa en el contexto de autenticación");
        return [];
      }
      
      console.log("Consultando chatbots para empresa:", user.companyId);
      
      const { data, error } = await supabase
        .from("chatbots")
        .select("*")
        .eq("empresa_id", user.companyId)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error obteniendo chatbots:", error);
        throw error;
      }
      
      console.log("Chatbots obtenidos:", data?.length || 0);
      
      // Fetch contexts for all chatbots
      if (data && data.length > 0) {
        const chatbotIds = data.map(chatbot => chatbot.id);
        const { data: contexts, error: contextsError } = await supabase
          .from("chatbot_contextos")
          .select("*")
          .in("chatbot_id", chatbotIds)
          .eq("tipo", "primary");
          
        if (contextsError) {
          console.error("Error obteniendo contextos de chatbots:", contextsError);
        } else if (contexts) {
          // Map contexts to their respective chatbots
          return data.map(chatbot => {
            const context = contexts.find(ctx => ctx.chatbot_id === chatbot.id);
            if (context) {
              // Parse JSON fields if they are strings
              const parsedContext = {
                ...context,
                key_points: typeof context.key_points === 'string' 
                  ? JSON.parse(context.key_points) 
                  : context.key_points,
                qa_examples: context.qa_examples && typeof context.qa_examples === 'string'
                  ? JSON.parse(context.qa_examples)
                  : context.qa_examples || []
              };
              return {
                ...chatbot,
                context: parsedContext as ChatbotContext
              };
            }
            
            return {
              ...chatbot,
              context: undefined
            };
          });
        }
      }
      
      return data || [];
    },
    enabled: !!user?.companyId,
  });
}

export function useChatbot(id: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["chatbot", id],
    queryFn: async (): Promise<Chatbot> => {
      if (!id) {
        throw new Error("No hay ID de chatbot");
      }
      
      const { data, error } = await supabase
        .from("chatbots")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) {
        console.error("Error obteniendo chatbot:", error);
        throw error;
      }
      
      // Fetch the chatbot context
      const { data: contextData, error: contextError } = await supabase
        .from("chatbot_contextos")
        .select("*")
        .eq("chatbot_id", id)
        .eq("tipo", "primary")
        .maybeSingle();
        
      if (contextError) {
        console.error("Error obteniendo contexto del chatbot:", contextError);
      } else if (contextData) {
        // Parse JSON fields if they are strings
        const parsedContext = {
          ...contextData,
          key_points: typeof contextData.key_points === 'string' 
            ? JSON.parse(contextData.key_points) 
            : contextData.key_points || [],
          qa_examples: contextData.qa_examples && typeof contextData.qa_examples === 'string'
            ? JSON.parse(contextData.qa_examples)
            : contextData.qa_examples || []
        };
        
        return {
          ...data,
          context: parsedContext as ChatbotContext
        };
      }
      
      return data;
    },
    enabled: !!id,
  });
}

export function useChatbotContext(chatbotId: string | undefined) {
  return useQuery({
    queryKey: ["chatbot-context", chatbotId],
    queryFn: async (): Promise<ChatbotContext | null> => {
      if (!chatbotId) {
        return null;
      }
      
      const { data, error } = await supabase
        .from("chatbot_contextos")
        .select("*")
        .eq("chatbot_id", chatbotId)
        .eq("tipo", "primary")
        .maybeSingle();
      
      if (error) {
        console.error("Error obteniendo contexto del chatbot:", error);
        throw error;
      }
      
      if (!data) {
        return null;
      }
      
      // Parse JSON fields if they are strings
      return {
        ...data,
        key_points: typeof data.key_points === 'string' 
          ? JSON.parse(data.key_points) 
          : data.key_points || [],
        qa_examples: data.qa_examples && typeof data.qa_examples === 'string'
          ? JSON.parse(data.qa_examples)
          : data.qa_examples || []
      } as ChatbotContext;
    },
    enabled: !!chatbotId,
  });
}
