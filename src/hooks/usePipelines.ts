import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export interface PipelineStage {
  id: string;
  pipeline_id: string;
  nombre: string;
  descripcion: string | null;
  color: string;
  posicion: number;
  probabilidad: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Pipeline {
  id: string;
  empresa_id: string;
  nombre: string;
  descripcion: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  stages?: PipelineStage[];
}

export function usePipelines() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["pipelines", user?.companyId],
    queryFn: async (): Promise<Pipeline[]> => {
      if (!user?.companyId) {
        console.error("No hay ID de empresa en el contexto de autenticación");
        return [];
      }
      
      const { data, error } = await supabase
        .from("pipelines")
        .select(`
          *,
          stages:pipeline_stages(*)
        `)
        .eq("empresa_id", user.companyId)
        .eq("is_active", true)
        .order("nombre");
      
      if (error) {
        console.error("Error obteniendo pipelines:", error);
        throw error;
      }

      // Ordenar las etapas por posición
      const processedData = data?.map(pipeline => ({
        ...pipeline,
        stages: pipeline.stages?.sort((a, b) => a.posicion - b.posicion) || []
      }));
      
      return processedData || [];
    },
    enabled: !!user?.companyId,
  });
}

export function usePipeline(id: string | undefined) {
  return useQuery({
    queryKey: ["pipeline", id],
    queryFn: async (): Promise<Pipeline> => {
      if (!id) {
        throw new Error("No hay ID de pipeline");
      }
      
      const { data, error } = await supabase
        .from("pipelines")
        .select(`
          *,
          stages:pipeline_stages(*)
        `)
        .eq("id", id)
        .single();
      
      if (error) {
        console.error("Error obteniendo pipeline:", error);
        throw error;
      }
      
      // Ordenar las etapas por posición
      const processedData = {
        ...data,
        stages: data.stages?.sort((a, b) => a.posicion - b.posicion) || []
      };
      
      return processedData;
    },
    enabled: !!id,
  });
}
