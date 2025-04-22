import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface MarketingCampania {
  id: string;
  nombre: string;
  descripcion: string | null;
  objetivo: string;
  estado: string;
  presupuesto: number | null;
  gastado: number | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  empresa_id: string;
  created_at: string;
  updated_at: string | null;
  conversion_objetivo: number | null;
  tipo_campania: string | null;
  tags: string[] | null;
  audiencia_objetivo: string | null;
  canal_principal: string | null;
}

export interface MarketingCampaniaInput {
  nombre: string;
  descripcion?: string;
  objetivo: string;
  estado: string;
  presupuesto?: number;
  gastado?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  conversion_objetivo?: number;
  tipo_campania?: string;
  tags?: string[];
  audiencia_objetivo?: string;
  canal_principal?: string;
}

export interface UpdateMarketingCampaniaInput extends Partial<MarketingCampaniaInput> {
  id: string;
}

export interface MarketingCampaniasOptions {
  page?: number;
  pageSize?: number;
  filters?: {
    estado?: string;
    objetivo?: string;
    tipo_campania?: string;
    canal_principal?: string;
    searchTerm?: string;
  };
  sort?: {
    field: string;
    direction: "asc" | "desc";
  };
}

export const useMarketingCampanias = (options: MarketingCampaniasOptions = {}) => {
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
  
  // Consulta principal para obtener campañas
  const { data: campanias, isLoading, isError, refetch } = useQuery({
    queryKey: ["marketing-campanias", page, pageSize, filters, sort, user?.id],
    queryFn: async () => {
      try {
        if (!user?.id) {
          return [];
        }
        
        // Obtener la empresa_id del usuario actual
        const { data: userData, error: userError } = await supabase
          .from("usuarios")
          .select("empresa_id")
          .eq("user_id", user.id)
          .single();
          
        if (userError || !userData?.empresa_id) {
          console.error("Error al obtener empresa_id:", userError);
          return [];
        }
        
        const empresa_id = userData.empresa_id;
        
        // Construir la consulta base
        let query = supabase
          .from("marketing_campanias")
          .select("*", { count: "exact" })
          .eq("empresa_id", empresa_id);
        
        // Aplicar filtros
        if (filters.estado) {
          query = query.eq("estado", filters.estado);
        }
        
        if (filters.objetivo) {
          query = query.eq("objetivo", filters.objetivo);
        }
        
        if (filters.tipo_campania) {
          query = query.eq("tipo_campania", filters.tipo_campania);
        }
        
        if (filters.canal_principal) {
          query = query.eq("canal_principal", filters.canal_principal);
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
        
        if (error) {
          throw error;
        }
        
        // Actualizar estados de paginación
        if (count !== null) {
          setTotalCount(count);
          setTotalPages(Math.ceil(count / pageSize));
        }
        
        return data as MarketingCampania[];
        
      } catch (error) {
        console.error("Error al obtener campañas de marketing:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las campañas de marketing",
          variant: "destructive"
        });
        return [];
      }
    },
    enabled: !!user?.id
  });

  // Crear nueva campaña
  const createCampania = useMutation({
    mutationFn: async (campania: MarketingCampaniaInput) => {
      if (!user?.id) {
        throw new Error("Usuario no autenticado");
      }
      
      // Obtener la empresa_id del usuario actual
      const { data: userData, error: userError } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("user_id", user.id)
        .single();
        
      if (userError || !userData?.empresa_id) {
        throw new Error("No se pudo determinar la empresa del usuario");
      }
      
      const empresa_id = userData.empresa_id;
      
      const { data, error } = await supabase
        .from("marketing_campanias")
        .insert([{ ...campania, empresa_id }])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as MarketingCampania;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-campanias"] });
      toast({
        title: "Campaña creada",
        description: "La campaña de marketing ha sido creada exitosamente",
      });
    },
    onError: (error) => {
      console.error("Error al crear campaña:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la campaña de marketing",
        variant: "destructive"
      });
    }
  });

  // Actualizar campaña existente
  const updateCampania = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateMarketingCampaniaInput) => {
      const { data, error } = await supabase
        .from("marketing_campanias")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as MarketingCampania;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-campanias"] });
      toast({
        title: "Campaña actualizada",
        description: "La campaña de marketing ha sido actualizada exitosamente",
      });
    },
    onError: (error) => {
      console.error("Error al actualizar campaña:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la campaña de marketing",
        variant: "destructive"
      });
    }
  });

  // Eliminar campaña
  const deleteCampania = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketing_campanias")
        .delete()
        .eq("id", id);
      
      if (error) {
        throw error;
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-campanias"] });
      toast({
        title: "Campaña eliminada",
        description: "La campaña de marketing ha sido eliminada exitosamente",
      });
    },
    onError: (error) => {
      console.error("Error al eliminar campaña:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la campaña de marketing",
        variant: "destructive"
      });
    }
  });

  // Obtener una campaña específica por ID
  const getCampaniaById = async (id: string): Promise<MarketingCampania | null> => {
    try {
      const { data, error } = await supabase
        .from("marketing_campanias")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as MarketingCampania;
    } catch (error) {
      console.error("Error al obtener campaña por ID:", error);
      toast({
        title: "Error",
        description: "No se pudo obtener la campaña de marketing",
        variant: "destructive"
      });
      return null;
    }
  };

  // Obtener datos de rendimiento de una campaña
  const getCampaniaPerformance = async (id: string) => {
    try {
      // Aquí se implementaría la lógica para obtener métricas de rendimiento
      // Esto podría ser una consulta a una tabla específica de métricas o un RPC
      
      // Ejemplo temporal con datos simulados
      return {
        vistas: Math.floor(Math.random() * 10000),
        clics: Math.floor(Math.random() * 1000),
        conversiones: Math.floor(Math.random() * 100),
        ctr: (Math.random() * 5).toFixed(2),
        costo_conversion: (Math.random() * 50).toFixed(2)
      };
    } catch (error) {
      console.error("Error al obtener métricas de campaña:", error);
      return null;
    }
  };

  return {
    campanias,
    isLoading,
    isError,
    refetch,
    totalCount,
    totalPages,
    page,
    hasPrevPage: page > 0,
    hasNextPage: page < totalPages - 1,
    createCampania,
    updateCampania,
    deleteCampania,
    getCampaniaById,
    getCampaniaPerformance
  };
};