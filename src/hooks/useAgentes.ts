import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/integrations/supabase/adminClient";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export interface Agente {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: 'admin' | 'admin_empresa' | 'agente';
  empresa_id: string | null;
  last_sign_in: string | null;
  onboarding_completed: boolean;
  is_active: boolean;
  created_at: string;
}

export function useAgentes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["agentes", user?.companyId],
    queryFn: async (): Promise<Agente[]> => {
      if (!user?.companyId) {
        throw new Error("No hay ID de empresa");
      }

      // Para administradores globales, pueden ver todos los usuarios
      // Para admin_empresa, solo pueden ver los usuarios de su empresa
      let query = supabase.from("profiles").select("*");
      
      if (user.role === 'admin_empresa') {
        query = query.eq('empresa_id', user.companyId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as Agente[];
    },
    enabled: !!user?.companyId,
  });

  const createAgente = useMutation({
    mutationFn: async (newAgente: { 
      email: string; 
      full_name: string;
      password?: string;
      role?: 'admin' | 'admin_empresa' | 'agente';
      empresa_id?: string;
      avatar?: File | null;
    }) => {
      try {
        if (!user?.companyId) {
          throw new Error("No hay empresa asociada al usuario administrador");
        }

        // Asignamos por defecto el rol 'agente' si no viene especificado
        const role = newAgente.role || 'agente';
        
        // Asignamos la empresa del administrador actual
        const empresa_id = newAgente.empresa_id || user.companyId;
        
        // Usamos el cliente administrativo para crear el usuario con la contraseña proporcionada o generamos una
        const password = newAgente.password || Math.random().toString(36).slice(-10);
        
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: newAgente.email,
          email_confirm: true,
          user_metadata: {
            full_name: newAgente.full_name,
          },
          password: password,
        });

        if (authError) throw authError;

        // Actualizamos el perfil con el rol, la empresa y marcamos el onboarding como completado
        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({
            role: role,
            empresa_id: empresa_id,
            onboarding_completed: true, // Marcamos el onboarding como completado para agentes
            onboarding_step: 'completed'
          })
          .eq("id", authData.user.id);

        if (updateError) throw updateError;

        // Si hay avatar, subir el archivo
        if (newAgente.avatar) {
          setIsUploading(true);
          try {
            const fileExt = newAgente.avatar.name.split('.').pop();
            const fileName = `avatar-${authData.user.id}-${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(fileName, newAgente.avatar);
              
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);
              
            // Actualizar la URL del avatar
            const { error: updateAvatarError } = await supabase
              .from("profiles")
              .update({ avatar_url: publicUrl })
              .eq("id", authData.user.id);
              
            if (updateAvatarError) throw updateAvatarError;
          } catch (error) {
            console.error("Error al subir avatar:", error);
          } finally {
            setIsUploading(false);
          }
        }

        return authData.user.id;
      } catch (error) {
        console.error("Error detallado al crear agente:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Agente creado correctamente");
      queryClient.invalidateQueries({ queryKey: ["agentes"] });
    },
    onError: (error) => {
      console.error("Error al crear agente:", error);
      toast.error(`Error al crear el agente: ${error.message || "Error desconocido"}`);
    }
  });

  const updateAgente = useMutation({
    mutationFn: async (data: { 
      id: string; 
      full_name?: string; 
      role?: 'admin' | 'admin_empresa' | 'agente'; 
      is_active?: boolean;
      avatar?: File | null;
    }) => {
      const updateData: any = {};
      
      if (data.full_name !== undefined) updateData.full_name = data.full_name;
      if (data.role !== undefined) updateData.role = data.role;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;

      // Si hay un nuevo avatar
      if (data.avatar) {
        setIsUploading(true);
        try {
          const fileExt = data.avatar.name.split('.').pop();
          const fileName = `avatar-${data.id}-${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, data.avatar);
            
          if (uploadError) throw uploadError;
          
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
            
          updateData.avatar_url = publicUrl;
        } catch (error) {
          console.error("Error al subir avatar:", error);
        } finally {
          setIsUploading(false);
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", data.id);

      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      toast.success("Agente actualizado correctamente");
      queryClient.invalidateQueries({ queryKey: ["agentes"] });
    },
    onError: (error) => {
      console.error("Error al actualizar agente:", error);
      toast.error("Error al actualizar el agente");
    }
  });
  
  const resetPassword = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      return email;
    },
    onSuccess: () => {
      toast.success("Se ha enviado un correo para restablecer la contraseña");
    },
    onError: (error) => {
      console.error("Error al enviar correo de restablecimiento:", error);
      toast.error("Error al enviar el correo");
    }
  });

  return {
    agentes: data || [],
    isLoading,
    isUploading,
    error,
    createAgente,
    updateAgente,
    resetPassword
  };
}