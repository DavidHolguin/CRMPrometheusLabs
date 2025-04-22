import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface MarketingUTM {
  id: string;
  campania_id: string | null;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string | null;
  utm_content: string | null;
  url_destino: string;
  descripcion: string | null;
  empresa_id: string;
  created_at: string;
  updated_at: string | null;
  clics: number | null;
  conversiones: number | null;
  ultima_modificacion_por: string | null;
}

export interface CreateMarketingUTMInput {
  campania_id?: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term?: string;
  utm_content?: string;
  url_destino: string;
  descripcion?: string;
}

export interface UpdateMarketingUTMInput {
  id: string;
  campania_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string | null;
  utm_content?: string | null;
  url_destino?: string;
  descripcion?: string | null;
  clics?: number;
  conversiones?: number;
}

export interface MarketingUTMsOptions {
  page?: number;
  pageSize?: number;
  filters?: {
    campania_id?: string;
    utm_source?: string;
    utm_medium?: string;
    searchTerm?: string;
  };
  sort?: {
    field: string;
    direction: "asc" | "desc";
  };
}

export const useMarketingUTMs = (options: MarketingUTMsOptions = {}) => {
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
  
  // Consulta principal para obtener UTMs
  const { data: utms, isLoading, isError, refetch } = useQuery({
    queryKey: ["marketing-utms", page, pageSize, filters, sort, user?.id],
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
          .from("marketing_utms")
          .select("*", { count: "exact" })
          .eq("empresa_id", empresa_id);
        
        // Aplicar filtros
        if (filters.campania_id) {
          query = query.eq("campania_id", filters.campania_id);
        }
        
        if (filters.utm_source) {
          query = query.eq("utm_source", filters.utm_source);
        }
        
        if (filters.utm_medium) {
          query = query.eq("utm_medium", filters.utm_medium);
        }
        
        if (filters.searchTerm) {
          query = query.or(`utm_campaign.ilike.%${filters.searchTerm}%,url_destino.ilike.%${filters.searchTerm}%,descripcion.ilike.%${filters.searchTerm}%`);
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
        
        return data as MarketingUTM[];
        
      } catch (error) {
        console.error("Error al obtener UTMs:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los UTMs",
          variant: "destructive"
        });
        return [];
      }
    },
    enabled: !!user?.id
  });

  // Construir URL completa con parámetros UTM
  const buildCompleteUrl = (utmData: CreateMarketingUTMInput): string => {
    try {
      const baseUrl = new URL(utmData.url_destino);
      
      // Añadir parámetros UTM
      baseUrl.searchParams.append("utm_source", utmData.utm_source);
      baseUrl.searchParams.append("utm_medium", utmData.utm_medium);
      baseUrl.searchParams.append("utm_campaign", utmData.utm_campaign);
      
      if (utmData.utm_term) {
        baseUrl.searchParams.append("utm_term", utmData.utm_term);
      }
      
      if (utmData.utm_content) {
        baseUrl.searchParams.append("utm_content", utmData.utm_content);
      }
      
      return baseUrl.toString();
    } catch (error) {
      console.error("Error al construir URL con UTMs:", error);
      throw new Error("URL base inválida. Asegúrate de incluir http:// o https://");
    }
  };

  // Crear nuevo UTM
  const createUTM = useMutation({
    mutationFn: async (utm: CreateMarketingUTMInput) => {
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
        .from("marketing_utms")
        .insert([{ 
          ...utm, 
          empresa_id,
          ultima_modificacion_por: user.id
        }])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as MarketingUTM;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-utms"] });
      toast({
        title: "UTM creado",
        description: "El enlace UTM ha sido creado exitosamente",
      });
    },
    onError: (error) => {
      console.error("Error al crear UTM:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el enlace UTM",
        variant: "destructive"
      });
    }
  });

  // Actualizar UTM existente
  const updateUTM = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateMarketingUTMInput) => {
      if (!user?.id) {
        throw new Error("Usuario no autenticado");
      }
      
      const { data, error } = await supabase
        .from("marketing_utms")
        .update({ 
          ...updates,
          ultima_modificacion_por: user.id,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as MarketingUTM;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-utms"] });
      toast({
        title: "UTM actualizado",
        description: "El enlace UTM ha sido actualizado exitosamente",
      });
    },
    onError: (error) => {
      console.error("Error al actualizar UTM:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el enlace UTM",
        variant: "destructive"
      });
    }
  });

  // Eliminar UTM
  const deleteUTM = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketing_utms")
        .delete()
        .eq("id", id);
      
      if (error) {
        throw error;
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-utms"] });
      toast({
        title: "UTM eliminado",
        description: "El enlace UTM ha sido eliminado exitosamente",
      });
    },
    onError: (error) => {
      console.error("Error al eliminar UTM:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el enlace UTM",
        variant: "destructive"
      });
    }
  });

  // Obtener un UTM específico por ID
  const getUTMById = async (id: string): Promise<MarketingUTM | null> => {
    try {
      const { data, error } = await supabase
        .from("marketing_utms")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as MarketingUTM;
    } catch (error) {
      console.error("Error al obtener UTM por ID:", error);
      toast({
        title: "Error",
        description: "No se pudo obtener el enlace UTM",
        variant: "destructive"
      });
      return null;
    }
  };

  // Registrar clic en un UTM
  const registerUTMClick = async (id: string): Promise<void> => {
    try {
      // Primero obtenemos el UTM actual para conocer el número de clics
      const { data, error: getError } = await supabase
        .from("marketing_utms")
        .select("clics")
        .eq("id", id)
        .single();
      
      if (getError) {
        throw getError;
      }
      
      // Incrementamos el contador de clics
      const clicsActuales = data?.clics || 0;
      const nuevosClics = clicsActuales + 1;
      
      // Actualizamos el registro
      const { error: updateError } = await supabase
        .from("marketing_utms")
        .update({ clics: nuevosClics })
        .eq("id", id);
      
      if (updateError) {
        throw updateError;
      }
      
    } catch (error) {
      console.error("Error al registrar clic en UTM:", error);
    }
  };

  // Obtener fuentes (sources) únicas
  const getUtmSources = async (): Promise<string[]> => {
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
      
      // Obtener fuentes únicas
      const { data, error } = await supabase
        .from("marketing_utms")
        .select("utm_source")
        .eq("empresa_id", empresa_id);
      
      if (error) {
        throw error;
      }
      
      // Extraer fuentes únicas
      return Array.from(new Set(data.map(item => item.utm_source)));
    } catch (error) {
      console.error("Error al obtener fuentes UTM:", error);
      return [];
    }
  };

  // Obtener medios (mediums) únicos
  const getUtmMediums = async (): Promise<string[]> => {
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
      
      // Obtener medios únicos
      const { data, error } = await supabase
        .from("marketing_utms")
        .select("utm_medium")
        .eq("empresa_id", empresa_id);
      
      if (error) {
        throw error;
      }
      
      // Extraer medios únicos
      return Array.from(new Set(data.map(item => item.utm_medium)));
    } catch (error) {
      console.error("Error al obtener medios UTM:", error);
      return [];
    }
  };

  // Obtener estadísticas resumidas de todos los UTMs
  const getUTMStatistics = async () => {
    try {
      if (!user?.id) {
        return null;
      }
      
      // Obtener la empresa_id del usuario actual
      const { data: userData, error: userError } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("user_id", user.id)
        .single();
        
      if (userError || !userData?.empresa_id) {
        return null;
      }
      
      const empresa_id = userData.empresa_id;
      
      // Obtener todos los UTMs de la empresa
      const { data, error } = await supabase
        .from("marketing_utms")
        .select("clics, conversiones, utm_source, utm_medium")
        .eq("empresa_id", empresa_id);
      
      if (error) {
        throw error;
      }
      
      // Calcular estadísticas
      const totalClics = data.reduce((sum, item) => sum + (item.clics || 0), 0);
      const totalConversiones = data.reduce((sum, item) => sum + (item.conversiones || 0), 0);
      
      // Agrupar por fuente
      const clicksPorFuente = data.reduce((acc, item) => {
        const source = item.utm_source;
        if (!acc[source]) {
          acc[source] = 0;
        }
        acc[source] += (item.clics || 0);
        return acc;
      }, {} as Record<string, number>);
      
      // Agrupar por medio
      const clicksPorMedio = data.reduce((acc, item) => {
        const medium = item.utm_medium;
        if (!acc[medium]) {
          acc[medium] = 0;
        }
        acc[medium] += (item.clics || 0);
        return acc;
      }, {} as Record<string, number>);
      
      return {
        totalClics,
        totalConversiones,
        tasaConversion: totalClics > 0 ? (totalConversiones / totalClics) * 100 : 0,
        clicksPorFuente,
        clicksPorMedio
      };
      
    } catch (error) {
      console.error("Error al obtener estadísticas de UTMs:", error);
      return null;
    }
  };

  return {
    utms,
    isLoading,
    isError,
    refetch,
    totalCount,
    totalPages,
    page,
    hasPrevPage: page > 0,
    hasNextPage: page < totalPages - 1,
    buildCompleteUrl,
    createUTM,
    updateUTM,
    deleteUTM,
    getUTMById,
    registerUTMClick,
    getUtmSources,
    getUtmMediums,
    getUTMStatistics
  };
};