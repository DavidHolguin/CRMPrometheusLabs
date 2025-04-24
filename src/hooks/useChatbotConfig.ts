import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Chatbot } from './useChatbots';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface ChatbotUpdateData {
  nombre?: string;
  descripcion?: string;
  avatar_url?: string;
  is_active?: boolean;
  pipeline_id?: string | null;
  llm_configuracion_id?: string | null;
}

interface ChatbotContextUpdateData {
  welcome_message?: string;
  personality?: string;
  general_context?: string;
  communication_tone?: string;
  main_purpose?: string;
  key_points?: string[];
  special_instructions?: string;
  qa_examples?: Array<{question: string, answer: string}>;
  prompt_template?: string;
}

interface EmbedConfig {
  messages?: string[];
  avatarUrl?: string;
  primaryColor?: string;
  widgetPosition?: 'left' | 'right';
  initialMessage?: string;
  borderRadius?: number;
  hiddenOnMobile?: boolean;
  headerText?: string;
  sendButtonColor?: string;
}

export function useChatbotUpdate(id: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateChatbotMutation = useMutation({
    mutationFn: async (data: ChatbotUpdateData) => {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('chatbots')
        .update(data)
        .eq('id', id);
        
      if (error) throw error;
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
      queryClient.invalidateQueries({ queryKey: ['chatbot', id] });
      setIsUpdating(false);
    },
    onError: (error) => {
      console.error('Error al actualizar chatbot:', error);
      toast.error('Error al actualizar el chatbot');
      setIsUpdating(false);
    }
  });

  const updateChatbotContextMutation = useMutation({
    mutationFn: async (data: ChatbotContextUpdateData) => {
      setIsUpdating(true);
      
      // Primero verificamos si existe un contexto para este chatbot
      const { data: existing, error: fetchError } = await supabase
        .from('chatbot_contextos')
        .select('id')
        .eq('chatbot_id', id)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      if (existing) {
        // Actualizar contexto existente
        const { error } = await supabase
          .from('chatbot_contextos')
          .update(data)
          .eq('id', existing.id);
          
        if (error) throw error;
      } else {
        // Crear nuevo contexto
        const { error } = await supabase
          .from('chatbot_contextos')
          .insert({
            chatbot_id: id,
            tipo: "principal", // Añadimos el campo obligatorio "tipo"
            contenido: "Contexto principal", // También añadimos contenido básico
            ...data
          });
          
        if (error) throw error;
      }
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
      queryClient.invalidateQueries({ queryKey: ['chatbot', id] });
      setIsUpdating(false);
    },
    onError: (error) => {
      console.error('Error al actualizar contexto del chatbot:', error);
      toast.error('Error al actualizar configuración del chatbot');
      setIsUpdating(false);
    }
  });

  const updateEmbedConfigMutation = useMutation({
    mutationFn: async (data: EmbedConfig) => {
      setIsUpdating(true);
      
      // Verificar si existe configuración para el canal web
      const { data: existingChannel, error: fetchError } = await supabase
        .from('chatbot_canales')
        .select('id')
        .eq('chatbot_id', id)
        .eq('canal_id', 'web') // Asumimos que el canal web tiene este ID
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      const configData = { configuracion: data };
      
      if (existingChannel) {
        // Actualizar configuración existente
        const { error } = await supabase
          .from('chatbot_canales')
          .update(configData)
          .eq('id', existingChannel.id);
          
        if (error) throw error;
      } else {
        // Crear nueva configuración
        const { error } = await supabase
          .from('chatbot_canales')
          .insert({
            chatbot_id: id,
            canal_id: 'web', // Asumimos que el canal web tiene este ID
            ...configData,
            is_active: true
          });
          
        if (error) throw error;
      }
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot_canales'] });
      setIsUpdating(false);
    },
    onError: (error) => {
      console.error('Error al actualizar configuración de embebido:', error);
      toast.error('Error al actualizar la configuración del widget');
      setIsUpdating(false);
    }
  });

  return {
    updateChatbot: updateChatbotMutation.mutate,
    updateChatbotContext: updateChatbotContextMutation.mutate,
    updateEmbedConfig: updateEmbedConfigMutation.mutate,
    isUpdating
  };
}

// Hook para crear un lead de prueba para interactuar con el chatbot
export function useCreateTestLead() {
  const { user } = useAuth();
  
  const createTestLeadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.companyId) {
        throw new Error("No hay ID de empresa");
      }
      
      // Crear un lead de prueba
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          empresa_id: user.companyId,
          canal_origen: 'chat_web',
          score: 0,
          estado: 'activo',
          is_active: true
        })
        .select('id')
        .single();
        
      if (leadError) throw leadError;
      
      // Crear datos personales básicos
      const { error: datosError } = await supabase
        .from('lead_datos_personales')
        .insert({
          lead_id: lead.id,
          nombre: 'Prueba Chatbot',
          email: 'test@chatbot.local'
        });
        
      if (datosError) throw datosError;
      
      return lead;
    }
  });
  
  return {
    createTestLead: createTestLeadMutation.mutate,
    isCreating: createTestLeadMutation.isPending,
    testLead: createTestLeadMutation.data
  };
}