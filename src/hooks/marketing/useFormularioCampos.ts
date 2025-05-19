import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

// Interfaces según el esquema de la base de datos
export interface FormularioCampo {
  id: string;
  formulario_id: string;
  nombre: string;
  tipo: string;
  etiqueta: string;
  placeholder: string;
  is_required: boolean;
  orden: number;
  validacion_regex: string | null;
  opciones: any | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFormularioCampoInput {
  formulario_id: string;
  nombre: string;
  tipo: string;
  etiqueta: string;
  placeholder?: string;
  is_required?: boolean;
  orden?: number;
  validacion_regex?: string;
  opciones?: any;
  is_active?: boolean;
}

export function useFormularioCampos(formularioId?: string) {
  const { toast } = useToast();
  const { user } = useAuth();

  // Obtener campos de un formulario específico
  const { data: campos, isLoading, error, refetch } = useQuery({
    queryKey: ["formularioCampos", formularioId],
    queryFn: async () => {
      if (!formularioId) return [];
      
      const { data, error } = await supabase
        .from("formulario_campos")
        .select("*")
        .eq("formulario_id", formularioId)
        .order("orden", { ascending: true });
      
      if (error) throw new Error(error.message);
      return data as FormularioCampo[];
    },
    enabled: !!formularioId
  });

  // Crear un nuevo campo
  const createCampo = useMutation({
    mutationFn: async (campo: CreateFormularioCampoInput) => {
      if (!user?.id) throw new Error("Usuario no autenticado");

      // Asignar orden automáticamente si no se proporciona
      if (!campo.orden && campos) {
        campo.orden = (campos.length > 0 ? Math.max(...campos.map(c => c.orden)) : 0) + 1;
      }

      const { data, error } = await supabase
        .from("formulario_campos")
        .insert([{
          ...campo,
          is_required: campo.is_required !== undefined ? campo.is_required : false,
          is_active: campo.is_active !== undefined ? campo.is_active : true
        }])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as FormularioCampo;
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Campo creado correctamente",
      });
      refetch();
    },
    onError: (error) => {
      console.error("Error al crear campo:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el campo",
        variant: "destructive"
      });
    }
  });

  // Actualizar un campo existente
  const updateCampo = useMutation({
    mutationFn: async (campo: Partial<FormularioCampo> & { id: string }) => {
      const { data, error } = await supabase
        .from("formulario_campos")
        .update({
          ...campo,
          updated_at: new Date().toISOString()
        })
        .eq("id", campo.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as FormularioCampo;
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Campo actualizado correctamente",
      });
      refetch();
    },
    onError: (error) => {
      console.error("Error al actualizar campo:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el campo",
        variant: "destructive"
      });
    }
  });

  // Eliminar un campo
  const deleteCampo = useMutation({
    mutationFn: async (campoId: string) => {
      const { error } = await supabase
        .from("formulario_campos")
        .delete()
        .eq("id", campoId);

      if (error) throw new Error(error.message);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Campo eliminado correctamente",
      });
      refetch();
    },
    onError: (error) => {
      console.error("Error al eliminar campo:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el campo",
        variant: "destructive"
      });
    }
  });

  // Función para convertir campos de la DB al formato interno
  const mapCamposToInternalFormat = (dbCampos: FormularioCampo[]) => {
    return dbCampos.map(campo => ({
      id: campo.id,
      label: campo.etiqueta,
      tipo: campo.tipo,
      requerido: campo.is_required,
      placeholder: campo.placeholder,
      opciones: campo.opciones ? 
        (typeof campo.opciones === 'string' ? 
          campo.opciones.split(',') : 
          Array.isArray(campo.opciones) ? 
            campo.opciones : 
            Object.values(campo.opciones)
        ) : [],
      orden: campo.orden
    }));
  };

  // Función para convertir campos del formato interno a formato DB
  const mapCamposToDBFormat = (internalCampos: any[]) => {
    return internalCampos.map((campo, index) => ({
      formulario_id: formularioId,
      nombre: campo.label.toLowerCase().replace(/\s+/g, '_'),
      tipo: campo.tipo,
      etiqueta: campo.label,
      placeholder: campo.placeholder || '',
      is_required: campo.requerido || false,
      orden: campo.orden || index + 1,
      validacion_regex: null,
      opciones: campo.opciones ? 
        (Array.isArray(campo.opciones) ? 
          campo.opciones : 
          typeof campo.opciones === 'string' ? 
            campo.opciones.split(',') : 
            campo.opciones
        ) : null,
      is_active: true
    }));
  };

  return {
    campos: campos || [],
    camposFormateados: campos ? mapCamposToInternalFormat(campos) : [],
    isLoading,
    error,
    createCampo,
    updateCampo,
    deleteCampo,
    refetch,
    mapCamposToInternalFormat,
    mapCamposToDBFormat
  };
}
