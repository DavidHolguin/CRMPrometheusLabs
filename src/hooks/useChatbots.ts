
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

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
  contexto?: {
    generalContext?: string;
    welcomeMessage?: string;
    mainPurpose?: string;
    communicationTone?: string;
    personality?: string;
    specialInstructions?: string;
    qaExamples?: Array<{question: string, answer: string}>;
  } | null;
}

export interface ChatbotContext {
  id: string;
  chatbot_id: string;
  tipo: string;
  contenido: string;
  welcome_message: string | null;
  personality: string | null;
  general_context: string | null;
  communication_tone: string | null;
  main_purpose: string | null;
  special_instructions: string | null;
  key_points: any[] | null;
  qa_examples: any[] | null;
  created_at: string;
  updated_at: string;
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
        .select(`
          *,
          contexto:chatbot_contextos(
            id,
            general_context,
            welcome_message,
            personality,
            communication_tone,
            main_purpose,
            special_instructions,
            key_points,
            qa_examples
          )
        `)
        .eq("empresa_id", user.companyId)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error obteniendo chatbots:", error);
        throw error;
      }
      
      console.log("Chatbots obtenidos:", data?.length || 0);
      
      // Procesar y transformar los datos si es necesario
      const processedData = data?.map(chatbot => {
        // Transformar el contexto si existe
        const contextoItems = chatbot.contexto || [];
        const contexto = contextoItems.length > 0 ? {
          generalContext: contextoItems[0]?.general_context || null,
          welcomeMessage: contextoItems[0]?.welcome_message || null,
          mainPurpose: contextoItems[0]?.main_purpose || null,
          communicationTone: contextoItems[0]?.communication_tone || null,
          personality: contextoItems[0]?.personality || null,
          specialInstructions: contextoItems[0]?.special_instructions || null,
          qaExamples: contextoItems[0]?.qa_examples || [],
        } : null;
        
        return {
          ...chatbot,
          contexto
        };
      });
      
      return processedData || [];
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
        .select(`
          *,
          contexto:chatbot_contextos(
            id,
            general_context,
            welcome_message,
            personality,
            communication_tone,
            main_purpose,
            special_instructions,
            key_points,
            qa_examples
          )
        `)
        .eq("id", id)
        .single();
      
      if (error) {
        console.error("Error obteniendo chatbot:", error);
        throw error;
      }
      
      // Procesar contexto
      const contextoItems = data.contexto || [];
      const contexto = contextoItems.length > 0 ? {
        generalContext: contextoItems[0]?.general_context || null,
        welcomeMessage: contextoItems[0]?.welcome_message || null,
        mainPurpose: contextoItems[0]?.main_purpose || null,
        communicationTone: contextoItems[0]?.communication_tone || null,
        personality: contextoItems[0]?.personality || null,
        specialInstructions: contextoItems[0]?.special_instructions || null,
        qaExamples: contextoItems[0]?.qa_examples || [],
      } : null;
      
      return {
        ...data,
        contexto
      };
    },
    enabled: !!id,
  });
}
