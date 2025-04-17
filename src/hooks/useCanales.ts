import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Canal = {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  logo_url: string | null;
  color?: string | null;
  configuracion_requerida: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ChatbotCanal = {
  id: string;
  chatbot_id: string;
  canal_id: string;
  configuracion: Record<string, any>;
  webhook_url: string | null;
  webhook_secret: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  canal?: Canal;
};

export function useCanales() {
  const queryClient = useQueryClient();

  // Obtener todos los canales disponibles
  const getCanales = async () => {
    const { data, error } = await supabase
      .from("canales")
      .select("*")
      .order("nombre");

    if (error) {
      throw error;
    }

    return data as Canal[];
  };

  // Obtener canales conectados a chatbots
  const getChatbotCanales = async (chatbotId?: string) => {
    let query = supabase
      .from("chatbot_canales")
      .select(`
        *,
        canal:canal_id(*)
      `)
      .order("created_at", { ascending: false });

    if (chatbotId) {
      query = query.eq("chatbot_id", chatbotId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data as ChatbotCanal[];
  };

  // Agregar un nuevo canal
  const addCanal = async (canalData: {
    nombre: string;
    tipo: string;
    descripcion?: string;
    logo_url?: string;
    color?: string;
    configuracion_requerida?: Record<string, any>;
    is_active?: boolean;
  }) => {
    const { data, error } = await supabase
      .from("canales")
      .insert([{
        nombre: canalData.nombre,
        tipo: canalData.tipo,
        descripcion: canalData.descripcion || null,
        logo_url: canalData.logo_url || null,
        color: canalData.color || null,
        configuracion_requerida: canalData.configuracion_requerida || {},
        is_active: canalData.is_active !== undefined ? canalData.is_active : true,
      }])
      .select();

    if (error) {
      throw error;
    }

    return data[0] as Canal;
  };

  // Actualizar un canal existente
  const updateCanal = async ({
    id,
    nombre,
    tipo,
    descripcion,
    logo_url,
    color,
    configuracion_requerida,
    is_active,
  }: {
    id: string;
    nombre?: string;
    tipo?: string;
    descripcion?: string | null;
    logo_url?: string | null;
    color?: string | null;
    configuracion_requerida?: Record<string, any>;
    is_active?: boolean;
  }) => {
    const updates: Record<string, any> = {};
    
    if (nombre !== undefined) updates.nombre = nombre;
    if (tipo !== undefined) updates.tipo = tipo;
    if (descripcion !== undefined) updates.descripcion = descripcion;
    if (logo_url !== undefined) updates.logo_url = logo_url;
    if (color !== undefined) updates.color = color;
    if (configuracion_requerida !== undefined) updates.configuracion_requerida = configuracion_requerida;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabase
      .from("canales")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) {
      throw error;
    }

    return data[0] as Canal;
  };

  // Agregar conexión a un canal
  const addChatbotCanal = async ({
    chatbotId,
    canalId,
    configuracion,
  }: {
    chatbotId: string;
    canalId: string;
    configuracion: Record<string, any>;
  }) => {
    const { data, error } = await supabase
      .from("chatbot_canales")
      .insert([
        {
          chatbot_id: chatbotId,
          canal_id: canalId,
          configuracion,
        },
      ])
      .select();

    if (error) {
      throw error;
    }

    return data[0] as ChatbotCanal;
  };

  // Actualizar configuración de canal
  const updateChatbotCanal = async ({
    id,
    configuracion,
    is_active,
  }: {
    id: string;
    configuracion?: Record<string, any>;
    is_active?: boolean;
  }) => {
    const updates: Record<string, any> = {};
    
    if (configuracion !== undefined) {
      updates.configuracion = configuracion;
    }
    
    if (is_active !== undefined) {
      updates.is_active = is_active;
    }

    const { data, error } = await supabase
      .from("chatbot_canales")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) {
      throw error;
    }

    return data[0] as ChatbotCanal;
  };

  // Eliminar conexión a canal
  const deleteChatbotCanal = async (id: string) => {
    const { error } = await supabase
      .from("chatbot_canales")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return true;
  };

  // Upload de logo de canal
  const uploadCanalLogo = async (file: File, path?: string): Promise<string> => {
    // Generar un nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `canales/${path || fileName}`;
    
    const { data, error } = await supabase.storage
      .from('public')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
      
    if (error) {
      throw error;
    }
    
    // Obtener la URL pública del archivo
    const { data: { publicUrl } } = supabase.storage
      .from('public')
      .getPublicUrl(filePath);
      
    return publicUrl;
  };

  // Hooks de React Query
  const useCanalesQuery = () => {
    return useQuery({
      queryKey: ["canales"],
      queryFn: getCanales,
    });
  };

  const useChatbotCanalesQuery = (chatbotId?: string) => {
    return useQuery({
      queryKey: ["chatbot_canales", chatbotId],
      queryFn: () => getChatbotCanales(chatbotId),
    });
  };

  const useAddCanalMutation = () => {
    return useMutation({
      mutationFn: addCanal,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["canales"] });
        toast.success("Canal creado exitosamente");
      },
      onError: (error) => {
        toast.error(`Error al crear canal: ${error.message}`);
      },
    });
  };

  const useUpdateCanalMutation = () => {
    return useMutation({
      mutationFn: updateCanal,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["canales"] });
        queryClient.invalidateQueries({ queryKey: ["chatbot_canales"] });
        toast.success("Canal actualizado exitosamente");
      },
      onError: (error) => {
        toast.error(`Error al actualizar canal: ${error.message}`);
      },
    });
  };

  const useAddChatbotCanalMutation = () => {
    return useMutation({
      mutationFn: addChatbotCanal,
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: ["chatbot_canales"] });
        toast.success("Canal conectado exitosamente");
      },
      onError: (error) => {
        toast.error(`Error al conectar canal: ${error.message}`);
      },
    });
  };

  const useUpdateChatbotCanalMutation = () => {
    return useMutation({
      mutationFn: updateChatbotCanal,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["chatbot_canales"] });
        toast.success("Canal actualizado exitosamente");
      },
      onError: (error) => {
        toast.error(`Error al actualizar canal: ${error.message}`);
      },
    });
  };

  const useDeleteChatbotCanalMutation = () => {
    return useMutation({
      mutationFn: deleteChatbotCanal,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["chatbot_canales"] });
        toast.success("Canal desconectado exitosamente");
      },
      onError: (error) => {
        toast.error(`Error al desconectar canal: ${error.message}`);
      },
    });
  };

  return {
    useCanalesQuery,
    useChatbotCanalesQuery,
    useAddCanalMutation,
    useUpdateCanalMutation,
    useAddChatbotCanalMutation,
    useUpdateChatbotCanalMutation,
    useDeleteChatbotCanalMutation,
    uploadCanalLogo,
  };
}
