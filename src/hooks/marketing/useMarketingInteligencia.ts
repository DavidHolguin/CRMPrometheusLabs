import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Interfaces para competidores
export interface MarketingCompetidor {
  id: string;
  empresa_id: string;
  nombre: string;
  descripcion: string | null;
  sitio_web: string | null;
  industria: string | null;
  tamano: string | null;
  fortalezas: string[] | null;
  debilidades: string[] | null;
  nivel_amenaza: number | null;
  productos_servicios: any;
  canales_sociales: any | null;
  datos_historicos: any | null;
  created_at: string;
  updated_at: string | null;
}

export interface MarketingCompetidorInput {
  nombre: string;
  descripcion?: string | null;
  sitio_web?: string | null;
  industria?: string | null;
  tamano?: string | null;
  fortalezas?: string[] | null;
  debilidades?: string[] | null;
  nivel_amenaza?: number | null;
  productos_servicios?: any;
  canales_sociales?: any | null;
  datos_historicos?: any | null;
}

// Interface para contenido de competidor
export interface MarketingCompetidorContenido {
  id: string;
  competidor_id: string;
  empresa_id: string;
  tipo: string;
  url: string | null;
  titulo: string | null;
  contenido: string | null;
  fecha_captura: string | null;
  palabras_clave: string[] | null;
  tono: string | null;
  puntos_fuertes: string[] | null;
  puntos_debiles: string[] | null;
  analisis_sentimiento: any | null;
  analisis_semantico: any | null;
  vectores_embeddings: any | null;
  created_at: string;
  updated_at: string | null;
}

export interface MarketingCompetidorContenidoInput {
  competidor_id: string;
  tipo: string;
  url?: string | null;
  titulo?: string | null;
  contenido?: string | null;
  fecha_captura?: string | null;
  palabras_clave?: string[] | null;
  tono?: string | null;
  puntos_fuertes?: string[] | null;
  puntos_debiles?: string[] | null;
  analisis_sentimiento?: any | null;
  analisis_semantico?: any | null;
}

// Interfaces para análisis de tendencias
export interface MarketingTendencia {
  id: string;
  empresa_id: string;
  categoria: string;
  titulo: string;
  descripcion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  datos_temporales: any | null;
  fuente_datos: string | null;
  impacto_estimado: string | null;
  acciones_recomendadas: any | null;
  created_at: string;
  updated_at: string | null;
}

export interface MarketingTendenciaInput {
  categoria: string;
  titulo: string;
  descripcion?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  datos_temporales?: any | null;
  fuente_datos?: string | null;
  impacto_estimado?: string | null;
  acciones_recomendadas?: any | null;
}

// Interfaces para opciones de filtrado
export interface MarketingInteligenciaOptions {
  page?: number;
  pageSize?: number;
  filters?: {
    industria?: string;
    tamano?: string;
    nivelAmenaza?: number;
    categoria?: string;
    impacto?: string;
    searchTerm?: string;
  };
  sort?: {
    field: string;
    direction: "asc" | "desc";
  };
}

export const useMarketingInteligencia = (options: MarketingInteligenciaOptions = {}) => {
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
  
  // Consulta principal para obtener competidores
  const { data: competidores, isLoading, isError, refetch } = useQuery({
    queryKey: ["marketing-competidores", page, pageSize, filters, sort, empresaId],
    queryFn: async () => {
      try {
        if (!empresaId) {
          return [];
        }
        
        // Construir la consulta base
        let query = supabase
          .from("marketing_competidores")
          .select("*", { count: "exact" })
          .eq("empresa_id", empresaId);
        
        // Aplicar filtros
        if (filters.industria) {
          query = query.eq("industria", filters.industria);
        }
        
        if (filters.tamano) {
          query = query.eq("tamano", filters.tamano);
        }
        
        if (filters.nivelAmenaza) {
          query = query.gte("nivel_amenaza", filters.nivelAmenaza);
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
        
        return data as MarketingCompetidor[];
        
      } catch (error) {
        console.error("Error al obtener competidores de marketing:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los competidores",
          variant: "destructive"
        });
        return [];
      }
    },
    enabled: !!empresaId
  });

  // Consulta para obtener tendencias
  const { data: tendencias, isLoading: isLoadingTendencias } = useQuery({
    queryKey: ["marketing-tendencias", filters.categoria, filters.impacto, empresaId],
    queryFn: async () => {
      try {
        if (!empresaId) {
          return [];
        }
        
        // Construir la consulta base
        let query = supabase
          .from("marketing_tendencias")
          .select("*")
          .eq("empresa_id", empresaId);
        
        // Aplicar filtros
        if (filters.categoria) {
          query = query.eq("categoria", filters.categoria);
        }
        
        if (filters.impacto) {
          query = query.eq("impacto_estimado", filters.impacto);
        }
        
        if (filters.searchTerm) {
          query = query.or(`titulo.ilike.%${filters.searchTerm}%,descripcion.ilike.%${filters.searchTerm}%`);
        }
        
        // Aplicar ordenamiento
        query = query.order("created_at", {
          ascending: false
        });
        
        // Limitar resultados para el dashboard
        query = query.limit(5);
        
        // Ejecutar consulta
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        return data as MarketingTendencia[];
        
      } catch (error) {
        console.error("Error al obtener tendencias de marketing:", error);
        return [];
      }
    },
    enabled: !!empresaId
  });

  // Crear nuevo competidor
  const createCompetidor = useMutation({
    mutationFn: async (competidor: MarketingCompetidorInput) => {
      if (!empresaId) {
        throw new Error("No se pudo determinar la empresa del usuario");
      }
      
      const { data, error } = await supabase
        .from("marketing_competidores")
        .insert([{ ...competidor, empresa_id: empresaId }])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as MarketingCompetidor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-competidores"] });
      toast({
        title: "Competidor creado",
        description: "El competidor ha sido añadido exitosamente",
      });
    },
    onError: (error) => {
      console.error("Error al crear competidor:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el competidor",
        variant: "destructive"
      });
    }
  });

  // Crear nueva tendencia
  const createTendencia = useMutation({
    mutationFn: async (tendencia: MarketingTendenciaInput) => {
      if (!empresaId) {
        throw new Error("No se pudo determinar la empresa del usuario");
      }
      
      const { data, error } = await supabase
        .from("marketing_tendencias")
        .insert([{ ...tendencia, empresa_id: empresaId }])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as MarketingTendencia;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-tendencias"] });
      toast({
        title: "Tendencia creada",
        description: "La tendencia ha sido añadida exitosamente",
      });
    },
    onError: (error) => {
      console.error("Error al crear tendencia:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la tendencia",
        variant: "destructive"
      });
    }
  });

  // Crear contenido competidor
  const createCompetidorContenido = useMutation({
    mutationFn: async (contenido: MarketingCompetidorContenidoInput) => {
      if (!empresaId) {
        throw new Error("No se pudo determinar la empresa del usuario");
      }
      
      const { data, error } = await supabase
        .from("marketing_competidor_contenido")
        .insert([{ ...contenido, empresa_id: empresaId }])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as MarketingCompetidorContenido;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-competidor-contenido"] });
      toast({
        title: "Contenido añadido",
        description: "El contenido del competidor ha sido añadido exitosamente",
      });
    },
    onError: (error) => {
      console.error("Error al crear contenido de competidor:", error);
      toast({
        title: "Error",
        description: "No se pudo añadir el contenido del competidor",
        variant: "destructive"
      });
    }
  });

  // Obtener contenidos de un competidor
  const getCompetidorContenido = async (competidorId: string): Promise<MarketingCompetidorContenido[]> => {
    try {
      const { data, error } = await supabase
        .from("marketing_competidor_contenido")
        .select("*")
        .eq("competidor_id", competidorId)
        .order("created_at", { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data as MarketingCompetidorContenido[];
    } catch (error) {
      console.error("Error al obtener contenido del competidor:", error);
      toast({
        title: "Error",
        description: "No se pudo obtener el contenido del competidor",
        variant: "destructive"
      });
      return [];
    }
  };

  // Obtener categorías disponibles para tendencias
  const getCategoriasTendencias = async (): Promise<string[]> => {
    try {
      if (!empresaId) {
        return [];
      }
      
      // Obtener categorías únicas
      const { data, error } = await supabase
        .from("marketing_tendencias")
        .select("categoria")
        .eq("empresa_id", empresaId)
        .not("categoria", "is", null);
      
      if (error) {
        throw error;
      }
      
      // Extraer categorías únicas
      const categorias = Array.from(new Set(data.map(item => item.categoria))).filter(Boolean) as string[];
      
      return categorias;
    } catch (error) {
      console.error("Error al obtener categorías de tendencias:", error);
      return [];
    }
  };

  // Obtener industrias disponibles
  const getIndustrias = async (): Promise<string[]> => {
    try {
      if (!empresaId) {
        return [];
      }
      
      // Obtener industrias únicas
      const { data, error } = await supabase
        .from("marketing_competidores")
        .select("industria")
        .eq("empresa_id", empresaId)
        .not("industria", "is", null);
      
      if (error) {
        throw error;
      }
      
      // Extraer industrias únicas
      const industrias = Array.from(new Set(data.map(item => item.industria))).filter(Boolean) as string[];
      
      return industrias;
    } catch (error) {
      console.error("Error al obtener industrias:", error);
      return [];
    }
  };

  return {
    competidores,
    tendencias,
    isLoading,
    isLoadingTendencias,
    isError,
    refetch,
    totalCount,
    totalPages,
    page,
    hasPrevPage: page > 0,
    hasNextPage: page < totalPages - 1,
    createCompetidor,
    createTendencia,
    createCompetidorContenido,
    getCompetidorContenido,
    getCategoriasTendencias,
    getIndustrias
  };
};