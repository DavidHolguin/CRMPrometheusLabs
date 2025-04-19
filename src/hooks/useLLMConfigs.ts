import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface LLMConfig {
  id: string;
  empresa_id: string;
  nombre: string;
  proveedor: string;
  modelo: string;
  configuracion: any;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useLLMConfigs() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["llm_configs", user?.companyId],
    queryFn: async (): Promise<LLMConfig[]> => {
      if (!user?.companyId) {
        console.error("No hay ID de empresa en el contexto de autenticación");
        return [];
      }
      
      const { data, error } = await supabase
        .from("llm_configuraciones")
        .select("*")
        .eq("empresa_id", user.companyId)
        .eq("is_active", true)
        .order("nombre");
      
      if (error) {
        console.error("Error obteniendo configuraciones LLM:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user?.companyId,
  });
}

export function useLLMConfig(id: string | undefined) {
  return useQuery({
    queryKey: ["llm_config", id],
    queryFn: async (): Promise<LLMConfig> => {
      if (!id) {
        throw new Error("No hay ID de configuración LLM");
      }
      
      const { data, error } = await supabase
        .from("llm_configuraciones")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) {
        console.error("Error obteniendo configuración LLM:", error);
        throw error;
      }
      
      return data;
    },
    enabled: !!id,
  });
}