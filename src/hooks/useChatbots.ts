
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
}

export function useChatbots() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["chatbots", user?.companyId],
    queryFn: async (): Promise<Chatbot[]> => {
      if (!user?.companyId) {
        throw new Error("No hay ID de empresa");
      }
      
      const { data, error } = await supabase
        .from("chatbots")
        .select("*")
        .eq("empresa_id", user.companyId)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error obteniendo chatbots:", error);
        throw error;
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
      
      return data;
    },
    enabled: !!id,
  });
}
