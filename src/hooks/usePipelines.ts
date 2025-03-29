
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  const queryClient = useQueryClient();

  const fetchPipelines = async (): Promise<Pipeline[]> => {
    if (!user?.companyId) {
      throw new Error("No hay ID de empresa");
    }
    
    // Get all pipelines for the company
    const { data: pipelines, error } = await supabase
      .from("pipelines")
      .select("*")
      .eq("empresa_id", user.companyId)
      .eq("is_active", true);
      
    if (error) {
      console.error("Error fetching pipelines:", error);
      throw error;
    }
    
    // Get all stages for all pipelines
    const { data: stages, error: stagesError } = await supabase
      .from("pipeline_stages")
      .select("*")
      .in("pipeline_id", pipelines.map(p => p.id))
      .eq("is_active", true)
      .order("posicion", { ascending: true });
      
    if (stagesError) {
      console.error("Error fetching stages:", stagesError);
      throw stagesError;
    }
    
    // Group stages by pipeline
    return pipelines.map(pipeline => ({
      ...pipeline,
      stages: stages?.filter(stage => stage.pipeline_id === pipeline.id) || []
    }));
  };

  const pipelinesQuery = useQuery({
    queryKey: ["pipelines", user?.companyId],
    queryFn: fetchPipelines,
    enabled: !!user?.companyId,
  });

  const createPipeline = useMutation({
    mutationFn: async (newPipeline: { nombre: string; descripcion?: string }) => {
      if (!user?.companyId) {
        throw new Error("No hay ID de empresa");
      }
      
      const { data, error } = await supabase
        .from("pipelines")
        .insert({
          empresa_id: user.companyId,
          nombre: newPipeline.nombre,
          descripcion: newPipeline.descripcion || null,
          is_default: false
        })
        .select()
        .single();
        
      if (error) {
        console.error("Error creating pipeline:", error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      toast.success("Pipeline creado correctamente");
    },
    onError: (error) => {
      console.error("Error in createPipeline:", error);
      toast.error("Error al crear el pipeline");
    },
  });

  const updatePipeline = useMutation({
    mutationFn: async (updatedPipeline: Partial<Pipeline> & { id: string }) => {
      const { id, ...updateData } = updatedPipeline;
      
      const { data, error } = await supabase
        .from("pipelines")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
        
      if (error) {
        console.error("Error updating pipeline:", error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      toast.success("Pipeline actualizado correctamente");
    },
    onError: (error) => {
      console.error("Error in updatePipeline:", error);
      toast.error("Error al actualizar el pipeline");
    },
  });

  const createStage = useMutation({
    mutationFn: async (newStage: {
      pipeline_id: string;
      nombre: string;
      descripcion?: string;
      color: string;
      posicion: number;
      probabilidad?: number;
    }) => {
      const { data, error } = await supabase
        .from("pipeline_stages")
        .insert({
          pipeline_id: newStage.pipeline_id,
          nombre: newStage.nombre,
          descripcion: newStage.descripcion || null,
          color: newStage.color,
          posicion: newStage.posicion,
          probabilidad: newStage.probabilidad || 0,
        })
        .select()
        .single();
        
      if (error) {
        console.error("Error creating stage:", error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      toast.success("Etapa creada correctamente");
    },
    onError: (error) => {
      console.error("Error in createStage:", error);
      toast.error("Error al crear la etapa");
    },
  });

  const updateStage = useMutation({
    mutationFn: async (updatedStage: Partial<PipelineStage> & { id: string }) => {
      const { id, ...updateData } = updatedStage;
      
      const { data, error } = await supabase
        .from("pipeline_stages")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
        
      if (error) {
        console.error("Error updating stage:", error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      toast.success("Etapa actualizada correctamente");
    },
    onError: (error) => {
      console.error("Error in updateStage:", error);
      toast.error("Error al actualizar la etapa");
    },
  });

  const reorderStages = useMutation({
    mutationFn: async (stageUpdates: { id: string; posicion: number }[]) => {
      const updates = stageUpdates.map(({ id, posicion }) => 
        supabase
          .from("pipeline_stages")
          .update({ posicion })
          .eq("id", id)
      );
      
      await Promise.all(updates);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
    },
    onError: (error) => {
      console.error("Error in reorderStages:", error);
      toast.error("Error al reordenar las etapas");
    },
  });

  return {
    pipelines: pipelinesQuery.data || [],
    isLoading: pipelinesQuery.isLoading,
    isError: pipelinesQuery.isError,
    error: pipelinesQuery.error,
    refetch: pipelinesQuery.refetch,
    createPipeline: createPipeline.mutate,
    updatePipeline: updatePipeline.mutate,
    createStage: createStage.mutate,
    updateStage: updateStage.mutate,
    reorderStages: reorderStages.mutate,
  };
}
