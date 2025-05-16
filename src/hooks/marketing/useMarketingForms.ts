import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Formulario {
  id: string;
  empresa_id: string;
  pipeline_id: string;
  stage_id: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  campos: Array<{
    id: string;
    label: string;
    tipo: string;
    requerido: boolean;
    opciones?: string[];
  }>;
  codigo_integracion: string;
  redirect_url: string;
  estado: string;
  envios: number;
  conversion: number;
  tasa_conversion: number;
  is_active: boolean;
  fecha_creacion: string;
  fecha_modificacion: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFormularioInput {
  nombre: string;
  descripcion: string;
  pipeline_id: string;
  stage_id: string;
  codigo_integracion?: string;
  redirect_url?: string;
  is_active?: boolean;
}

export interface UpdateFormularioInput {
  id: string;
  nombre?: string;
  descripcion?: string;
  pipeline_id?: string;
  stage_id?: string;
  codigo_integracion?: string;
  redirect_url?: string;
  is_active?: boolean;
}

export interface FormulariosOptions {
  page?: number;
  pageSize?: number;
  filters?: {
    pipeline_id?: string;
    stage_id?: string;
    is_active?: boolean;
    searchTerm?: string;
  };
  sort?: {
    field: string;
    direction: "asc" | "desc";
  };
}

export const useMarketingForms = (options: FormulariosOptions = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Valores predeterminados
  const page = options.page || 0;
  const pageSize = options.pageSize || 10;
  const filters = options.filters || {};
  const sort = options.sort || { field: "created_at", direction: "desc" };

  // Estados para paginación
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  // Consulta principal para obtener formularios
  const { data: formularios, isLoading, isError, refetch } = useQuery({
    queryKey: ["marketing-forms", page, pageSize, filters, sort, user?.id],
    queryFn: async () => {
      try {
        if (!user?.id) return [];

        // Obtener la empresa_id del usuario actual
        const { data: userData, error: userError } = await supabase
          .from("profiles")
          .select("empresa_id")
          .eq("id", user.id)
          .single();

        if (userError || !userData?.empresa_id) {
          console.error("Error al obtener empresa_id:", userError);
          return [];
        }

        const empresa_id = userData.empresa_id;

        // Construir la consulta base
        let query = supabase
          .from("formularios")
          .select("*", { count: "exact" })
          .eq("empresa_id", empresa_id);

        // Aplicar filtros
        if (filters.pipeline_id) {
          query = query.eq("pipeline_id", filters.pipeline_id);
        }

        if (filters.stage_id) {
          query = query.eq("stage_id", filters.stage_id);
        }

        if (filters.is_active !== undefined) {
          query = query.eq("is_active", filters.is_active);
        }

        if (filters.searchTerm) {
          query = query.or(`nombre.ilike.%${filters.searchTerm}%,descripcion.ilike.%${filters.searchTerm}%`);
        }

        // Aplicar ordenamiento
        query = query.order(sort.field, {
          ascending: sort.direction === "asc"
        });

        // Aplicar paginación
        const from = page * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        // Ejecutar consulta
        const { data, error, count } = await query;

        if (error) throw error;

        // Actualizar estados de paginación
        if (count !== null) {
          setTotalCount(count);
          setTotalPages(Math.ceil(count / pageSize));
        }

        return data as Formulario[];

      } catch (error) {
        console.error("Error al obtener formularios:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los formularios",
          variant: "destructive"
        });
        return [];
      }
    },
    enabled: !!user?.id
  });

  // Crear nuevo formulario
  const createForm = useMutation({
    mutationFn: async (form: CreateFormularioInput) => {
      if (!user?.id) throw new Error("Usuario no autenticado");

      // Obtener la empresa_id del usuario actual
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("empresa_id")
        .eq("id", user.id)
        .single();

      if (userError || !userData?.empresa_id) {
        throw new Error("No se pudo obtener la empresa del usuario");
      }

      const { data, error } = await supabase
        .from("marketing_formularios")
        .insert([
          {
            ...form,
            empresa_id: userData.empresa_id,
            is_active: form.is_active !== undefined ? form.is_active : true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-forms"] });
      toast({
        title: "Éxito",
        description: "Formulario creado correctamente",
      });
    },
    onError: (error) => {
      console.error("Error al crear formulario:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el formulario",
        variant: "destructive"
      });
    }
  });

  // Actualizar formulario existente
  const updateForm = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateFormularioInput) => {
      const { data, error } = await supabase
        .from("formularios")
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-forms"] });
      toast({
        title: "Éxito",
        description: "Formulario actualizado correctamente",
      });
    },
    onError: (error) => {
      console.error("Error al actualizar formulario:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el formulario",
        variant: "destructive"
      });
    }
  });

  // Eliminar formulario
  const deleteForm = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketing_formularios")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-forms"] });
      toast({
        title: "Éxito",
        description: "Formulario eliminado correctamente",
      });
    },
    onError: (error) => {
      console.error("Error al eliminar formulario:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el formulario",
        variant: "destructive"
      });
    }
  });

  // Obtener un formulario específico por ID
  const getFormById = async (id: string): Promise<Formulario | null> => {
    try {
      const { data, error } = await supabase
        .from("marketing_formularios")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error("Error al obtener formulario:", error);
      toast({
        title: "Error",
        description: "No se pudo obtener el formulario",
        variant: "destructive"
      });
      return null;
    }
  };

  return {
    formularios,
    isLoading,
    isError,
    totalCount,
    totalPages,
    refetch,
    createForm,
    updateForm,
    deleteForm,
    getFormById
  };
};