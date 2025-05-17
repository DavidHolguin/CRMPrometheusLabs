import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface LandingPage {
  id: string;
  empresa_id: string;
  url: string;
  nombre: string;
  descripcion: string;
  formulario_id: string;
  configuracion_seguimiento: {
    analytics?: {
      gtm_id?: string;
      ga_id?: string;
    };
    social?: {
      og_title?: string;
      og_description?: string;
      og_image?: string;
      twitter_card?: string;
    };
    custom_scripts?: string[];
    custom_styles?: string[];
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateLandingPageInput {
  nombre: string;
  descripcion: string;
  formulario_id: string;
  configuracion_seguimiento?: {
    analytics?: {
      gtm_id?: string;
      ga_id?: string;
    };
    social?: {
      og_title?: string;
      og_description?: string;
      og_image?: string;
      twitter_card?: string;
    };
    custom_scripts?: string[];
    custom_styles?: string[];
  };
  is_active?: boolean;
}

export interface UpdateLandingPageInput {
  id: string;
  nombre?: string;
  descripcion?: string;
  formulario_id?: string;
  configuracion_seguimiento?: {
    analytics?: {
      gtm_id?: string;
      ga_id?: string;
    };
    social?: {
      og_title?: string;
      og_description?: string;
      og_image?: string;
      twitter_card?: string;
    };
    custom_scripts?: string[];
    custom_styles?: string[];
  };
  is_active?: boolean;
}

export interface LandingPagesOptions {
  page?: number;
  pageSize?: number;
  filters?: {
    formulario_id?: string;
    is_active?: boolean;
    searchTerm?: string;
  };
  sort?: {
    field: string;
    direction: "asc" | "desc";
  };
}

export const useMarketingLandings = (options: LandingPagesOptions = {}) => {
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

  // Consulta principal para obtener landing pages
  const { data: landingPages, isLoading, isError, refetch } = useQuery({
    queryKey: ["marketing-landings", page, pageSize, filters, sort, user?.id],
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
          .from("landing_pages")
          .select("*", { count: "exact" })
          .eq("empresa_id", empresa_id);

        // Aplicar filtros
        if (filters.formulario_id) {
          query = query.eq("formulario_id", filters.formulario_id);
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

        return data as LandingPage[];

      } catch (error) {
        console.error("Error al obtener landing pages:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las landing pages",
          variant: "destructive"
        });
        return [];
      }
    },
    enabled: !!user?.id
  });

  // Generar URL única para la landing page
  const generateUniqueUrl = async (nombre: string): Promise<string> => {
    const slug = nombre
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const baseUrl = `${window.location.origin}/l/${slug}`;
    let url = baseUrl;
    let counter = 1;

    while (true) {
      const { data, error } = await supabase
        .from("landing_pages")
        .select("id")
        .eq("url", url)
        .single();

      if (error || !data) break;
      url = `${baseUrl}-${counter}`;
      counter++;
    }

    return url;
  };

  // Crear nueva landing page
  const createLanding = useMutation({
    mutationFn: async (landing: CreateLandingPageInput) => {
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

      // Generar URL única
      const url = await generateUniqueUrl(landing.nombre);

      // Crear un objeto con solo los campos que existen en la tabla
      const landingData = {
        nombre: landing.nombre,
        descripcion: landing.descripcion,
        formulario_id: landing.formulario_id,
        configuracion_seguimiento: landing.configuracion_seguimiento || {},
        is_active: landing.is_active !== undefined ? landing.is_active : true,
        empresa_id: userData.empresa_id,
        url
      };
      
      const { data, error } = await supabase
        .from("landing_pages")
        .insert([landingData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-landings"] });
      toast({
        title: "Éxito",
        description: "Landing page creada correctamente",
      });
    },
    onError: (error) => {
      console.error("Error al crear landing page:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la landing page",
        variant: "destructive"
      });
    }
  });

  // Actualizar landing page existente
  const updateLanding = useMutation({
    mutationFn: async (landing: UpdateLandingPageInput) => {
      const { data, error } = await supabase
        .from("landing_pages")
        .update({
          ...landing,
          fecha_modificacion: new Date().toISOString()
        })
        .eq("id", landing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-landings"] });
      toast({
        title: "Éxito",
        description: "Landing page actualizada correctamente",
      });
    },
    onError: (error) => {
      console.error("Error al actualizar landing page:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la landing page",
        variant: "destructive"
      });
    }
  });

  // Eliminar landing page
  const deleteLanding = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("landing_pages")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-landings"] });
      toast({
        title: "Éxito",
        description: "Landing page eliminada correctamente",
      });
    },
    onError: (error) => {
      console.error("Error al eliminar landing page:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la landing page",
        variant: "destructive"
      });
    }
  });

  // Obtener una landing page específica por ID
  const getLandingById = async (id: string): Promise<LandingPage | null> => {
    try {
      const { data, error } = await supabase
        .from("landing_pages")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error("Error al obtener landing page:", error);
      toast({
        title: "Error",
        description: "No se pudo obtener la landing page",
        variant: "destructive"
      });
      return null;
    }
  };

  // Registrar visita a landing page
  const registerVisit = async (id: string) => {
    try {
      const { data: landing } = await supabase
        .from("marketing_landing_pages")
        .select("visitas, conversiones")
        .eq("id", id)
        .single();

      if (landing) {
        const { error } = await supabase
          .from("landing_pages")
          .update({
            visitas: (landing.visitas || 0) + 1,
            tasa_conversion: landing.conversiones / ((landing.visitas || 0) + 1) * 100
          })
          .eq("id", id);

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error al registrar visita:", error);
    }
  };

  // Registrar conversión en landing page
  const registerConversion = async (id: string) => {
    try {
      const { data: landing } = await supabase
        .from("marketing_landing_pages")
        .select("visitas, conversiones")
        .eq("id", id)
        .single();

      if (landing) {
        const { error } = await supabase
          .from("landing_pages")
          .update({
            conversiones: (landing.conversiones || 0) + 1,
            tasa_conversion: ((landing.conversiones || 0) + 1) / (landing.visitas || 1) * 100
          })
          .eq("id", id);

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error al registrar conversión:", error);
    }
  };

  return {
    landingPages,
    isLoading,
    isError,
    totalCount,
    totalPages,
    refetch,
    createLanding,
    updateLanding,
    deleteLanding,
    getLandingById,
    registerVisit,
    registerConversion
  };
};