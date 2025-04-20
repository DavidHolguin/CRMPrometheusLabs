import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// Interfaces
export interface LLMConfig {
  id: string;
  empresa_id: string;
  nombre: string;
  proveedor: string;
  modelo: string;
  configuracion: any;
  api_key: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateLLMConfigInput {
  nombre: string;
  proveedor: string;
  modelo: string;
  api_key: string;
  is_default: boolean;
  is_active: boolean;
  configuracion: any;
}

export interface UpdateLLMConfigInput {
  id: string;
  nombre?: string;
  proveedor?: string;
  modelo?: string;
  api_key?: string;
  is_default?: boolean;
  is_active?: boolean;
  configuracion?: any;
}

// Proveedores disponibles con sus modelos
const LLM_PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    models: [
      { id: "gpt-4o", name: "GPT-4o" },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
      { id: "gpt-4", name: "GPT-4" },
      { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    models: [
      { id: "claude-3-opus", name: "Claude 3 Opus" },
      { id: "claude-3-sonnet", name: "Claude 3 Sonnet" },
      { id: "claude-3-haiku", name: "Claude 3 Haiku" },
      { id: "claude-2", name: "Claude 2" },
    ],
  },
  {
    id: "mistral",
    name: "Mistral AI",
    models: [
      { id: "mistral-large", name: "Mistral Large" },
      { id: "mistral-medium", name: "Mistral Medium" },
      { id: "mistral-small", name: "Mistral Small" },
    ],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    models: [
      { id: "gemini-pro", name: "Gemini Pro" },
      { id: "gemini-flash", name: "Gemini Flash" },
    ],
  },
];

export function useLLMConfigs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Consulta principal de configuraciones
  const llmConfigsQuery = useQuery({
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
        .order("nombre");
      
      if (error) {
        console.error("Error obteniendo configuraciones LLM:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user?.companyId,
  });

  // Crear configuración LLM
  const createLLMConfig = useMutation({
    mutationFn: async (input: CreateLLMConfigInput) => {
      if (!user?.companyId) throw new Error("No hay ID de empresa");
      
      const newConfig = {
        ...input,
        empresa_id: user.companyId,
      };
      
      const { data, error } = await supabase
        .from("llm_configuraciones")
        .insert(newConfig)
        .select()
        .single();
      
      if (error) {
        console.error("Error creando configuración LLM:", error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["llm_configs"] });
    },
  });

  // Actualizar configuración LLM
  const updateLLMConfig = useMutation({
    mutationFn: async (input: UpdateLLMConfigInput) => {
      const { id, ...updates } = input;
      
      const { data, error } = await supabase
        .from("llm_configuraciones")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) {
        console.error("Error actualizando configuración LLM:", error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["llm_configs"] });
    },
  });

  // Eliminar configuración LLM
  const deleteLLMConfig = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("llm_configuraciones")
        .delete()
        .eq("id", id);
      
      if (error) {
        console.error("Error eliminando configuración LLM:", error);
        throw error;
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["llm_configs"] });
    },
  });

  // Establecer configuración como predeterminada
  const setDefaultConfig = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.companyId) throw new Error("No hay ID de empresa");
      
      // Primero quitamos la marca de predeterminado de todas las configuraciones
      const { error: resetError } = await supabase
        .from("llm_configuraciones")
        .update({ is_default: false })
        .eq("empresa_id", user.companyId);
      
      if (resetError) {
        console.error("Error reseteando configuraciones predeterminadas:", resetError);
        throw resetError;
      }
      
      // Luego marcamos la configuración seleccionada como predeterminada
      const { data, error } = await supabase
        .from("llm_configuraciones")
        .update({ is_default: true })
        .eq("id", id)
        .select()
        .single();
      
      if (error) {
        console.error("Error estableciendo configuración predeterminada:", error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["llm_configs"] });
      toast.success("Configuración predeterminada actualizada");
    },
  });

  // Activar/desactivar configuración
  const toggleActiveState = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from("llm_configuraciones")
        .update({ is_active: isActive })
        .eq("id", id)
        .select()
        .single();
      
      if (error) {
        console.error("Error cambiando estado de configuración:", error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["llm_configs"] });
      toast.success(`Configuración ${data.is_active ? "activada" : "desactivada"}`);
    },
  });

  return {
    llmConfigs: llmConfigsQuery.data || [],
    isLoading: llmConfigsQuery.isLoading,
    isError: llmConfigsQuery.isError,
    error: llmConfigsQuery.error,
    createLLMConfig,
    updateLLMConfig,
    deleteLLMConfig,
    setDefaultConfig,
    toggleActiveState,
    providers: LLM_PROVIDERS,
  };
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