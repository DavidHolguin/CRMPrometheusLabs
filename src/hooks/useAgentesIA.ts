import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export interface AgenteIA {
  id: string;
  empresa_id: string;
  nombre: string;
  descripcion: string;
  avatar_url: string | null;
  tipo: string;
  nivel_autonomia: number;
  especialidad: any;
  status: string;
  metricas_rendimiento: any;
  configuracion_evolutiva: any;
  llm_configuracion_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useAgentesIA() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const supabase = getSupabaseClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["agentesIA", user?.companyId],
    queryFn: async (): Promise<AgenteIA[]> => {
      if (!user?.companyId) {
        throw new Error("No hay ID de empresa");
      }

      // Consultar los agentes de IA específicamente de esta empresa
      const { data, error } = await supabase
        .from("agentes")
        .select("*")
        .eq("empresa_id", user.companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AgenteIA[];
    },
    enabled: !!user?.companyId,
  });

  const createAgenteIA = useMutation({
    mutationFn: async (newAgente: {
      nombre: string;
      descripcion?: string;
      avatar_url?: string;
      tipo?: string;
      nivel_autonomia?: number;
      especialidad?: any;
      status?: string;
    }) => {
      if (!user?.companyId) {
        throw new Error("No hay empresa asociada al usuario");
      }

      // Valores predeterminados
      const tipo = newAgente.tipo || "asistente";
      const nivel_autonomia = newAgente.nivel_autonomia || 1;
      const status = newAgente.status || "entrenamiento";

      const { data, error } = await supabase
        .from("agentes")
        .insert({
          empresa_id: user.companyId,
          nombre: newAgente.nombre,
          descripcion: newAgente.descripcion || "",
          avatar_url: newAgente.avatar_url || null,
          tipo: tipo,
          nivel_autonomia: nivel_autonomia,
          especialidad: newAgente.especialidad || {},
          status: status,
          is_active: true
        })
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Agente IA creado correctamente");
      queryClient.invalidateQueries({ queryKey: ["agentesIA"] });
    },
    onError: (error) => {
      console.error("Error al crear agente IA:", error);
      toast.error(`Error al crear el agente IA: ${error.message || "Error desconocido"}`);
    }
  });

  const updateAgenteIA = useMutation({
    mutationFn: async (data: {
      id: string;
      nombre?: string;
      descripcion?: string;
      avatar_url?: string;
      tipo?: string;
      nivel_autonomia?: number;
      especialidad?: any;
      status?: string;
      is_active?: boolean;
    }) => {
      const updateData: any = {};
      
      if (data.nombre !== undefined) updateData.nombre = data.nombre;
      if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
      if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;
      if (data.tipo !== undefined) updateData.tipo = data.tipo;
      if (data.nivel_autonomia !== undefined) updateData.nivel_autonomia = data.nivel_autonomia;
      if (data.especialidad !== undefined) updateData.especialidad = data.especialidad;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;

      const { error } = await supabase
        .from("agentes")
        .update(updateData)
        .eq("id", data.id);

      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      toast.success("Agente IA actualizado correctamente");
      queryClient.invalidateQueries({ queryKey: ["agentesIA"] });
    },
    onError: (error) => {
      console.error("Error al actualizar agente IA:", error);
      toast.error("Error al actualizar el agente IA");
    }
  });
  
  const deleteAgenteIA = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("agentes")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      toast.success("Agente IA eliminado correctamente");
      queryClient.invalidateQueries({ queryKey: ["agentesIA"] });
    },
    onError: (error) => {
      console.error("Error al eliminar agente IA:", error);
      toast.error("Error al eliminar el agente IA");
    }
  });

  return {
    agentesIA: data || [],
    isLoading,
    isUploading,
    error,
    createAgenteIA,
    updateAgenteIA,
    deleteAgenteIA
  };
}