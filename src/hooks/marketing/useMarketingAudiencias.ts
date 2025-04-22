import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface MarketingAudiencia {
  id: string;
  empresa_id: string;
  nombre: string;
  descripcion: string | null;
  segmento: string;
  tamano_estimado: number | null;
  caracteristicas: any;
  comportamiento: any | null;
  fuentes_datos: string[] | null;
  valor_estimado: number | null;
  tasa_conversion: number | null;
  interacciones_promedio: number | null;
  created_at: string;
  updated_at: string | null;
}

export interface MarketingAudienciaInput {
  nombre: string;
  descripcion?: string | null;
  segmento: string;
  tamano_estimado?: number | null;
  caracteristicas: any;
  comportamiento?: any | null;
  fuentes_datos?: string[] | null;
  valor_estimado?: number | null;
  tasa_conversion?: number | null;
  interacciones_promedio?: number | null;
}

export interface UpdateMarketingAudienciaInput extends Partial<MarketingAudienciaInput> {
  id: string;
}

export interface MarketingAudienciasOptions {
  page?: number;
  pageSize?: number;
  filters?: {
    segmento?: string;
    valorMinimo?: number;
    valorMaximo?: number;
    tasaMinima?: number;
    searchTerm?: string;
  };
  sort?: {
    field: string;
    direction: "asc" | "desc";
  };
}

export const useMarketingAudiencias = (options: MarketingAudienciasOptions = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Obtener el empresaId directamente del usuario
  const empresaId = user?.companyId;
  
  // Valores predeterminados
  const page = options.page || 0;
  const pageSize = options.pageSize || 10;
  const filters = options.filters || {};
  const sort = options.sort || { field: "created_at", direction: "desc" };
  
  // Estados para paginación
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  
  // Consulta principal para obtener audiencias
  const { data: audiencias, isLoading, isError, refetch } = useQuery({
    queryKey: ["marketing-audiencias", page, pageSize, filters, sort, empresaId],
    queryFn: async () => {
      try {
        if (!empresaId) {
          return [];
        }
        
        // Construir la consulta base
        let query = supabase
          .from("marketing_audiencias")
          .select("*", { count: "exact" })
          .eq("empresa_id", empresaId);
        
        // Aplicar filtros
        if (filters.segmento) {
          query = query.eq("segmento", filters.segmento);
        }
        
        if (filters.valorMinimo !== undefined) {
          query = query.gte("valor_estimado", filters.valorMinimo);
        }
        
        if (filters.valorMaximo !== undefined) {
          query = query.lte("valor_estimado", filters.valorMaximo);
        }
        
        if (filters.tasaMinima !== undefined) {
          query = query.gte("tasa_conversion", filters.tasaMinima);
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
        
        return data as MarketingAudiencia[];
        
      } catch (error) {
        console.error("Error al obtener audiencias de marketing:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las audiencias de marketing",
          variant: "destructive"
        });
        return [];
      }
    },
    enabled: !!empresaId
  });

  // Crear nueva audiencia
  const createAudiencia = useMutation({
    mutationFn: async (audiencia: MarketingAudienciaInput) => {
      if (!empresaId) {
        throw new Error("No se pudo determinar la empresa del usuario");
      }
      
      const { data, error } = await supabase
        .from("marketing_audiencias")
        .insert([{ ...audiencia, empresa_id: empresaId }])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as MarketingAudiencia;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-audiencias"] });
      toast({
        title: "Audiencia creada",
        description: "La audiencia de marketing ha sido creada exitosamente",
      });
    },
    onError: (error) => {
      console.error("Error al crear audiencia:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la audiencia de marketing",
        variant: "destructive"
      });
    }
  });

  // Actualizar audiencia existente
  const updateAudiencia = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateMarketingAudienciaInput) => {
      const { data, error } = await supabase
        .from("marketing_audiencias")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as MarketingAudiencia;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-audiencias"] });
      toast({
        title: "Audiencia actualizada",
        description: "La audiencia de marketing ha sido actualizada exitosamente",
      });
    },
    onError: (error) => {
      console.error("Error al actualizar audiencia:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la audiencia de marketing",
        variant: "destructive"
      });
    }
  });

  // Eliminar audiencia
  const deleteAudiencia = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketing_audiencias")
        .delete()
        .eq("id", id);
      
      if (error) {
        throw error;
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-audiencias"] });
      toast({
        title: "Audiencia eliminada",
        description: "La audiencia de marketing ha sido eliminada exitosamente",
      });
    },
    onError: (error) => {
      console.error("Error al eliminar audiencia:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la audiencia de marketing",
        variant: "destructive"
      });
    }
  });

  // Obtener una audiencia específica por ID
  const getAudienciaById = async (id: string): Promise<MarketingAudiencia | null> => {
    try {
      const { data, error } = await supabase
        .from("marketing_audiencias")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as MarketingAudiencia;
    } catch (error) {
      console.error("Error al obtener audiencia por ID:", error);
      toast({
        title: "Error",
        description: "No se pudo obtener la audiencia de marketing",
        variant: "destructive"
      });
      return null;
    }
  };

  // Obtener segmentos disponibles
  const getSegmentos = async (): Promise<string[]> => {
    try {
      if (!empresaId) {
        return [];
      }
      
      // Obtener segmentos únicos
      const { data, error } = await supabase
        .from("marketing_audiencias")
        .select("segmento")
        .eq("empresa_id", empresaId)
        .not("segmento", "is", null);
      
      if (error) {
        throw error;
      }
      
      // Extraer segmentos únicos
      const segmentos = Array.from(new Set(data.map(item => item.segmento))).filter(Boolean) as string[];
      
      return segmentos;
    } catch (error) {
      console.error("Error al obtener segmentos:", error);
      return [];
    }
  };

  return {
    audiencias,
    isLoading,
    isError,
    refetch,
    totalCount,
    totalPages,
    page,
    hasPrevPage: page > 0,
    hasNextPage: page < totalPages - 1,
    createAudiencia,
    updateAudiencia,
    deleteAudiencia,
    getAudienciaById,
    getSegmentos
  };
};