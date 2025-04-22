import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface MarketingContenido {
  id: string;
  tipo: string;
  titulo: string;
  contenido: string;
  is_active: boolean;
  empresa_id: string;
  created_at: string;
  updated_at: string | null;
  categoria: string | null;
  campania_id: string | null;
  url_imagen: string | null;
  engagement_score: number | null;
  tags: string[] | null;
  fecha_publicacion: string | null;
  canal_publicacion: string | null;
}

export interface MarketingContenidoInput {
  tipo: string;
  titulo: string;
  contenido: string;
  is_active?: boolean;
  categoria?: string;
  campania_id?: string;
  url_imagen?: string;
  engagement_score?: number;
  tags?: string[];
  fecha_publicacion?: string;
  canal_publicacion?: string;
}

export interface UpdateMarketingContenidoInput {
  id: string;
  tipo?: string;
  titulo?: string;
  contenido?: string;
  is_active?: boolean;
  categoria?: string;
  campania_id?: string;
  url_imagen?: string;
  engagement_score?: number;
  tags?: string[];
  fecha_publicacion?: string;
  canal_publicacion?: string;
}

export interface MarketingContenidoOptions {
  page?: number;
  pageSize?: number;
  filters?: {
    tipo?: string;
    categoria?: string;
    campania_id?: string;
    is_active?: boolean;
    canal_publicacion?: string;
    searchTerm?: string;
    tag?: string;
  };
  sort?: {
    field: string;
    direction: "asc" | "desc";
  };
}

export const useMarketingContenido = (options: MarketingContenidoOptions = {}) => {
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
  
  // Consulta principal para obtener contenidos
  const { data: contenidos, isLoading, isError, refetch } = useQuery({
    queryKey: ["marketing-contenidos", page, pageSize, filters, sort, user?.id],
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
          .from("marketing_contenidos")
          .select("*", { count: "exact" })
          .eq("empresa_id", empresa_id);
        
        // Aplicar filtros
        if (filters.tipo) {
          query = query.eq("tipo", filters.tipo);
        }
        
        if (filters.categoria) {
          query = query.eq("categoria", filters.categoria);
        }
        
        if (filters.campania_id) {
          query = query.eq("campania_id", filters.campania_id);
        }

        if (filters.is_active !== undefined) {
          query = query.eq("is_active", filters.is_active);
        }
        
        if (filters.canal_publicacion) {
          query = query.eq("canal_publicacion", filters.canal_publicacion);
        }
        
        if (filters.searchTerm) {
          query = query.or(`titulo.ilike.%${filters.searchTerm}%,contenido.ilike.%${filters.searchTerm}%`);
        }
        
        if (filters.tag) {
          query = query.contains("tags", [filters.tag]);
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
        
        return data as MarketingContenido[];
        
      } catch (error) {
        console.error("Error al obtener contenidos de marketing:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los contenidos de marketing",
          variant: "destructive"
        });
        return [];
      }
    },
    enabled: !!user?.id
  });

  // Crear nuevo contenido
  const createContenido = useMutation({
    mutationFn: async (contenido: MarketingContenidoInput) => {
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
        .from("marketing_contenidos")
        .insert([{ 
          ...contenido,
          empresa_id,
          is_active: contenido.is_active !== undefined ? contenido.is_active : true 
        }])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as MarketingContenido;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-contenidos"] });
      toast({
        title: "Contenido creado",
        description: "El contenido de marketing ha sido creado exitosamente",
      });
    },
    onError: (error) => {
      console.error("Error al crear contenido:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el contenido de marketing",
        variant: "destructive"
      });
    }
  });

  // Actualizar contenido existente
  const updateContenido = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateMarketingContenidoInput) => {
      const { data, error } = await supabase
        .from("marketing_contenidos")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as MarketingContenido;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-contenidos"] });
      toast({
        title: "Contenido actualizado",
        description: "El contenido de marketing ha sido actualizado exitosamente",
      });
    },
    onError: (error) => {
      console.error("Error al actualizar contenido:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el contenido de marketing",
        variant: "destructive"
      });
    }
  });

  // Eliminar contenido
  const deleteContenido = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketing_contenidos")
        .delete()
        .eq("id", id);
      
      if (error) {
        throw error;
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-contenidos"] });
      toast({
        title: "Contenido eliminado",
        description: "El contenido de marketing ha sido eliminado exitosamente",
      });
    },
    onError: (error) => {
      console.error("Error al eliminar contenido:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el contenido de marketing",
        variant: "destructive"
      });
    }
  });

  // Obtener un contenido específico por ID
  const getContenidoById = async (id: string): Promise<MarketingContenido | null> => {
    try {
      const { data, error } = await supabase
        .from("marketing_contenidos")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as MarketingContenido;
    } catch (error) {
      console.error("Error al obtener contenido por ID:", error);
      toast({
        title: "Error",
        description: "No se pudo obtener el contenido de marketing",
        variant: "destructive"
      });
      return null;
    }
  };

  // Obtener categorías disponibles
  const getCategorias = async (): Promise<string[]> => {
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
        return [];
      }
      
      const empresa_id = userData.empresa_id;
      
      // Esta es una consulta que obtiene categorías únicas utilizadas en los contenidos
      // de la empresa del usuario actual
      const { data, error } = await supabase
        .from("marketing_contenidos")
        .select("categoria")
        .eq("empresa_id", empresa_id)
        .not("categoria", "is", null);
      
      if (error) {
        throw error;
      }
      
      // Extraer categorías únicas
      const categorias = Array.from(new Set(data.map(item => item.categoria))).filter(Boolean) as string[];
      
      return categorias;
    } catch (error) {
      console.error("Error al obtener categorías:", error);
      return [];
    }
  };

  return {
    contenidos,
    isLoading,
    isError,
    refetch,
    totalCount,
    totalPages,
    page,
    hasPrevPage: page > 0,
    hasNextPage: page < totalPages - 1,
    createContenido,
    updateContenido,
    deleteContenido,
    getContenidoById,
    getCategorias
  };
};