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
  configuracion: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    [key: string]: any;
  };
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
  configuracion: LLMConfig['configuracion'];
  api_key: string;
  is_default?: boolean;
  is_active?: boolean;
}

export interface UpdateLLMConfigInput {
  id: string;
  nombre?: string;
  proveedor?: string;
  modelo?: string;
  configuracion?: LLMConfig['configuracion'];
  api_key?: string;
  is_default?: boolean;
  is_active?: boolean;
}

export function useLLMConfigs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Obtener todas las configuraciones LLM de la empresa
  const { data: llmConfigs = [], ...queryInfo } = useQuery({
    queryKey: ['llm-configs', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];

      const { data, error } = await supabase
        .from('llm_configuraciones')
        .select('*')
        .eq('empresa_id', user.companyId);

      if (error) {
        console.error('Error al cargar configuraciones LLM:', error);
        toast.error('Error al cargar las configuraciones de LLM');
        throw error;
      }

      return data as LLMConfig[];
    },
    enabled: !!user?.companyId,
  });

  // Crear una nueva configuración LLM
  const createLLMConfig = useMutation({
    mutationFn: async (input: CreateLLMConfigInput) => {
      setIsLoading(true);
      
      try {
        // Si se marca como default, primero desmarcar cualquier otra configuración default
        if (input.is_default) {
          await supabase
            .from('llm_configuraciones')
            .update({ is_default: false })
            .eq('empresa_id', user?.companyId);
        }

        const { data, error } = await supabase
          .from('llm_configuraciones')
          .insert({
            ...input,
            empresa_id: user?.companyId,
            is_active: input.is_active !== undefined ? input.is_active : true,
            is_default: input.is_default !== undefined ? input.is_default : false,
          })
          .select();

        if (error) throw error;
        return data[0] as LLMConfig;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-configs'] });
      toast.success('Configuración LLM creada con éxito');
    },
    onError: (error) => {
      console.error('Error al crear configuración LLM:', error);
      toast.error('Error al crear la configuración de LLM');
    }
  });

  // Actualizar una configuración LLM existente
  const updateLLMConfig = useMutation({
    mutationFn: async (input: UpdateLLMConfigInput) => {
      setIsLoading(true);
      
      try {
        // Si se marca como default, primero desmarcar cualquier otra configuración default
        if (input.is_default) {
          await supabase
            .from('llm_configuraciones')
            .update({ is_default: false })
            .eq('empresa_id', user?.companyId)
            .neq('id', input.id);
        }

        const { data, error } = await supabase
          .from('llm_configuraciones')
          .update({
            ...input,
            updated_at: new Date().toISOString(),
          })
          .eq('id', input.id)
          .select();

        if (error) throw error;
        return data[0] as LLMConfig;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-configs'] });
      toast.success('Configuración LLM actualizada con éxito');
    },
    onError: (error) => {
      console.error('Error al actualizar configuración LLM:', error);
      toast.error('Error al actualizar la configuración de LLM');
    }
  });

  // Eliminar una configuración LLM
  const deleteLLMConfig = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('llm_configuraciones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-configs'] });
      toast.success('Configuración LLM eliminada con éxito');
    },
    onError: (error) => {
      console.error('Error al eliminar configuración LLM:', error);
      toast.error('Error al eliminar la configuración de LLM');
    }
  });

  // Definir una configuración como predeterminada
  const setDefaultConfig = useMutation({
    mutationFn: async (id: string) => {
      // Primero desmarcar todas las configuraciones como no predeterminadas
      await supabase
        .from('llm_configuraciones')
        .update({ is_default: false })
        .eq('empresa_id', user?.companyId);
      
      // Marcar la configuración seleccionada como predeterminada
      const { data, error } = await supabase
        .from('llm_configuraciones')
        .update({ is_default: true })
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0] as LLMConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-configs'] });
      toast.success('Configuración establecida como predeterminada');
    },
    onError: (error) => {
      console.error('Error al establecer configuración predeterminada:', error);
      toast.error('Error al establecer la configuración predeterminada');
    }
  });

  // Cambiar el estado activo/inactivo de una configuración
  const toggleActiveState = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('llm_configuraciones')
        .update({ is_active: isActive })
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0] as LLMConfig;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['llm-configs'] });
      toast.success(`Configuración ${data.is_active ? 'activada' : 'desactivada'} con éxito`);
    },
    onError: (error) => {
      console.error('Error al cambiar el estado de la configuración:', error);
      toast.error('Error al cambiar el estado de la configuración');
    }
  });

  // Lista de proveedores de LLM disponibles y sus modelos
  const providers = [
    {
      id: 'openai',
      name: 'OpenAI',
      models: [
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        { id: 'gpt-4', name: 'GPT-4' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
      ]
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      models: [
        { id: 'claude-3-opus', name: 'Claude 3 Opus' },
        { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet' },
        { id: 'claude-3-haiku', name: 'Claude 3 Haiku' },
        { id: 'claude-2', name: 'Claude 2' },
      ]
    },
    {
      id: 'mistral',
      name: 'Mistral AI',
      models: [
        { id: 'mistral-large', name: 'Mistral Large' },
        { id: 'mistral-medium', name: 'Mistral Medium' },
        { id: 'mistral-small', name: 'Mistral Small' },
      ]
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      models: [
        { id: 'gemini-pro', name: 'Gemini Pro' },
        { id: 'gemini-ultra', name: 'Gemini Ultra' },
      ]
    },
    {
      id: 'custom',
      name: 'Personalizado',
      models: [
        { id: 'custom', name: 'Modelo personalizado' },
      ]
    }
  ];

  return {
    llmConfigs,
    isLoading: queryInfo.isLoading || isLoading,
    createLLMConfig,
    updateLLMConfig,
    deleteLLMConfig,
    setDefaultConfig,
    toggleActiveState,
    providers,
    refetch: queryInfo.refetch,
  };
}