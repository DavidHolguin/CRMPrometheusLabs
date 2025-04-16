import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lead } from "@/hooks/useLeads";
import { useEffect } from "react";

export function usePipelineLeads(pipelineId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchLeadsByStage = async (): Promise<Record<string, Lead[]>> => {
    if (!user?.companyId || !pipelineId) {
      return {};
    }
    
    try {
      // Obtener leads usando la tabla leads normal ya que vista_lead_completa no tiene el campo empresa_id directamente
      const { data: leadsData, error } = await supabase
        .from("leads")
        .select(`
          id, 
          empresa_id, 
          canal_origen, 
          score, 
          pipeline_id, 
          stage_id, 
          asignado_a, 
          ultima_interaccion, 
          estado, 
          is_active,
          created_at,
          updated_at
        `)
        .eq("empresa_id", user.companyId)
        .eq("pipeline_id", pipelineId)
        .eq("is_active", true);
        
      if (error) {
        console.error("Error fetching pipeline leads:", error);
        throw error;
      }
      
      // Get the stages for the pipeline
      const { data: stages } = await supabase
        .from("pipeline_stages")
        .select("id, nombre, color, posicion, probabilidad")
        .eq("pipeline_id", pipelineId)
        .eq("is_active", true)
        .order("posicion");
      
      if (!stages || !leadsData) {
        return {};
      }
      
      // Obtener todos los IDs de usuarios asignados para hacer una única consulta
      const userIds = leadsData
        .map(lead => lead.asignado_a)
        .filter(id => id !== null && id !== undefined);
      
      // Obtener perfiles de usuarios asignados en una sola consulta
      const userProfiles: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url, role")
          .in("id", userIds);
        
        // Crear un mapa de perfiles por ID
        if (profiles) {
          profiles.forEach(profile => {
            userProfiles[profile.id] = profile;
          });
        }
      }
      
      // Enriquecer los datos de leads con información adicional
      const enhancedLeads = await Promise.all(
        leadsData.map(async (lead) => {
          // Obtener datos personales del lead
          const { data: datosPersonales } = await supabase
            .from("lead_datos_personales")
            .select("*")
            .eq("lead_id", lead.id)
            .single();
          
          // Obtener etiquetas (tags) del lead
          const { data: tagRelations } = await supabase
            .from("lead_tag_relation")
            .select("tag_id")
            .eq("lead_id", lead.id);
          
          let tags = [];
          if (tagRelations && tagRelations.length > 0) {
            const tagIds = tagRelations.map(rel => rel.tag_id);
            const { data: tagsData } = await supabase
              .from("lead_tags")
              .select("id, nombre, color")
              .in("id", tagIds);
            tags = tagsData || [];
          }
          
          // Obtener información sobre mensajes y conversaciones
          const { data: conversations } = await supabase
            .from("conversaciones")
            .select("id")
            .eq("lead_id", lead.id);
            
          let messageCount = 0;
          
          if (conversations && conversations.length > 0) {
            const conversationIds = conversations.map(conv => conv.id);
            
            const { count } = await supabase
              .from("mensajes")
              .select("id", { count: "exact", head: true })
              .in("conversacion_id", conversationIds);
              
            messageCount = count || 0;
          }
          
          // Encontrar información de la etapa
          const stageInfo = stages.find(stage => stage.id === lead.stage_id);
          
          // Obtener información del usuario asignado
          const assignedUser = lead.asignado_a ? userProfiles[lead.asignado_a] : null;
          
          return {
            id: lead.id,
            nombre: datosPersonales?.nombre || "",
            apellido: datosPersonales?.apellido || "",
            email: datosPersonales?.email || "",
            telefono: datosPersonales?.telefono || "",
            pipeline_id: lead.pipeline_id,
            stage_id: lead.stage_id,
            score: lead.score,
            canal_origen: lead.canal_origen,
            ultima_interaccion: lead.ultima_interaccion,
            created_at: lead.created_at,
            updated_at: lead.updated_at,
            asignado_a: lead.asignado_a,
            usuario_asignado: assignedUser ? {
              id: assignedUser.id,
              nombre: assignedUser.full_name,
              email: assignedUser.email,
              avatar_url: assignedUser.avatar_url,
              role: assignedUser.role
            } : null,
            empresa_id: lead.empresa_id,
            message_count: messageCount,
            interaction_count: conversations?.length || 0,
            stage_name: stageInfo?.nombre || "Sin etapa",
            stage_color: stageInfo?.color || "#cccccc",
            tags,
            ciudad: datosPersonales?.ciudad,
            pais: datosPersonales?.pais,
            direccion: datosPersonales?.direccion,
            datos_adicionales: datosPersonales?.datos_adicionales,
            probabilidad_cierre: stageInfo?.probabilidad
          } as Lead;
        })
      );
      
      // Agrupar leads por etapa
      const leadsByStage: Record<string, Lead[]> = {};
      
      // Inicializar todas las etapas con arrays vacíos
      stages.forEach(stage => {
        leadsByStage[stage.id] = [];
      });
      
      // Agrupar leads por etapa
      enhancedLeads.forEach(lead => {
        if (lead.stage_id && leadsByStage[lead.stage_id]) {
          leadsByStage[lead.stage_id].push(lead);
        } else if (stages.length > 0) {
          // Si el lead no tiene una etapa o su etapa no está en este pipeline,
          // añadirlo a la primera etapa
          const firstStageId = stages[0].id;
          leadsByStage[firstStageId].push(lead);
        }
      });
      
      // Ordenar leads en cada etapa por interacción más reciente
      Object.keys(leadsByStage).forEach(stageId => {
        leadsByStage[stageId].sort((a, b) => {
          const dateA = a.ultima_interaccion ? new Date(a.ultima_interaccion).getTime() : 0;
          const dateB = b.ultima_interaccion ? new Date(b.ultima_interaccion).getTime() : 0;
          return dateB - dateA; // Más reciente primero
        });
      });
      
      return leadsByStage;
      
    } catch (error) {
      console.error("Error processing pipeline leads:", error);
      throw error;
    }
  };

  const leadsQuery = useQuery({
    queryKey: ["pipeline-leads", pipelineId, user?.companyId],
    queryFn: fetchLeadsByStage,
    enabled: !!user?.companyId && !!pipelineId,
  });

  const updateLeadStage = useMutation({
    mutationFn: async ({ 
      leadId, 
      stageId 
    }: { 
      leadId: string; 
      stageId: string 
    }) => {
      // First log the change to lead_history
      if (user?.id) {
        const { data: lead } = await supabase
          .from("leads")
          .select("stage_id")
          .eq("id", leadId)
          .single();
        
        if (lead?.stage_id) {
          await supabase
            .from("lead_history")
            .insert({
              lead_id: leadId,
              campo: "stage_id",
              valor_anterior: lead.stage_id,
              valor_nuevo: stageId,
              usuario_id: user.id
            });
        }
      }
      
      // Then update the lead stage
      const { data, error } = await supabase
        .from("leads")
        .update({ 
          stage_id: stageId,
          ultima_interaccion: new Date().toISOString() 
        })
        .eq("id", leadId)
        .select()
        .single();
        
      if (error) {
        console.error("Error updating lead stage:", error);
        throw error;
      }
      
      return data;
    },
    // Configuración de actualización optimista para una transición fluida
    onMutate: async ({ leadId, stageId }) => {
      // Cancelar cualquier refetch activa para evitar sobreescribir nuestro cambio optimista
      await queryClient.cancelQueries({ 
        queryKey: ["pipeline-leads", pipelineId, user?.companyId] 
      });
      
      // Guardar el estado anterior
      const previousLeadsByStage = queryClient.getQueryData(
        ["pipeline-leads", pipelineId, user?.companyId]
      );
      
      // Realizar una actualización optimista del estado en la UI
      queryClient.setQueryData(
        ["pipeline-leads", pipelineId, user?.companyId],
        (oldData: Record<string, Lead[]> = {}) => {
          // Crear una copia profunda del estado actual
          const newData = JSON.parse(JSON.stringify(oldData));
          
          // Buscar el lead en todas las etapas
          let leadToMove: Lead | undefined;
          let sourceStageId: string | undefined;
          
          // Encontrar el lead y su etapa actual
          for (const [stgId, leads] of Object.entries(newData)) {
            const leadsArray = leads as Lead[]; // Añadir aserción de tipo aquí
            const leadIndex = leadsArray.findIndex(lead => lead.id === leadId);
            if (leadIndex !== -1) {
              leadToMove = { ...leadsArray[leadIndex] };
              sourceStageId = stgId;
              // Eliminar el lead de su etapa actual
              newData[stgId] = leadsArray.filter(lead => lead.id !== leadId);
              break;
            }
          }
          
          // Si encontramos el lead, lo movemos a la nueva etapa
          if (leadToMove && sourceStageId) {
            // Actualizar la información del lead
            leadToMove.stage_id = stageId;
            leadToMove.ultima_interaccion = new Date().toISOString();
            
            // Asegurarnos de que existe el array para la etapa destino
            if (!newData[stageId]) {
              newData[stageId] = [];
            }
            
            // Añadir el lead a la nueva etapa al principio (por ser el más reciente)
            newData[stageId] = [leadToMove, ...newData[stageId]];
          }
          
          return newData;
        }
      );
      
      // Devolver el contexto con los datos anteriores para posible rollback
      return { previousLeadsByStage };
    },
    onError: (error, variables, context) => {
      console.error("Error in updateLeadStage:", error);
      toast.error("Error al actualizar la etapa del lead");
      
      // Revertir a los datos anteriores en caso de error
      if (context?.previousLeadsByStage) {
        queryClient.setQueryData(
          ["pipeline-leads", pipelineId, user?.companyId], 
          context.previousLeadsByStage
        );
      }
    },
    onSuccess: () => {
      // Invalidar la query para actualizar los datos en segundo plano
      // Esto es importante para asegurar que los datos locales estén en sinc con el backend
      queryClient.invalidateQueries({ 
        queryKey: ["pipeline-leads", pipelineId, user?.companyId],
        // Evitamos recargar inmediatamente para mantener la transición fluida
        refetchType: "none"
      });
      
      // Refetch en segundo plano después de un breve retraso
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: ["pipeline-leads", pipelineId, user?.companyId] 
        });
      }, 1000);
    },
  });

  // Nueva mutación para actualizar la asignación de un lead
  const updateLeadAssignment = useMutation({
    mutationFn: async ({ 
      leadId, 
      userId 
    }: { 
      leadId: string; 
      userId: string | null; // null para liberar la asignación
    }) => {
      // Registrar el cambio en el historial
      if (user?.id) {
        const { data: lead } = await supabase
          .from("leads")
          .select("asignado_a")
          .eq("id", leadId)
          .single();
        
        if (lead?.asignado_a !== undefined) {
          await supabase
            .from("lead_history")
            .insert({
              lead_id: leadId,
              campo: "asignado_a",
              valor_anterior: lead.asignado_a || null,
              valor_nuevo: userId,
              usuario_id: user.id
            });
        }
      }
      
      // Actualizar la asignación del lead
      const { data, error } = await supabase
        .from("leads")
        .update({ 
          asignado_a: userId,
          ultima_interaccion: new Date().toISOString() 
        })
        .eq("id", leadId)
        .select()
        .single();
        
      if (error) {
        console.error("Error actualizando asignación de lead:", error);
        throw error;
      }
      
      // Obtener información del perfil del usuario asignado si existe
      let userProfile = null;
      if (userId) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url, role")
          .eq("id", userId)
          .single();
          
        if (profileData) {
          userProfile = {
            id: profileData.id,
            nombre: profileData.full_name,
            email: profileData.email,
            avatar_url: profileData.avatar_url,
            role: profileData.role
          };
        }
      }
      
      // Devolver los datos con información del usuario asignado
      return {...data, usuario_asignado: userProfile};
    },
    // Actualización optimista para una mejor experiencia de usuario
    onMutate: async ({ leadId, userId }) => {
      // Cancelar cualquier refetch pendiente
      await queryClient.cancelQueries({ 
        queryKey: ["pipeline-leads", pipelineId, user?.companyId] 
      });
      
      // Guardar el estado anterior
      const previousLeadsByStage = queryClient.getQueryData(
        ["pipeline-leads", pipelineId, user?.companyId]
      );
      
      // Si estamos asignando un usuario, necesitamos su información de perfil
      let userProfile = null;
      if (userId) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url, role")
          .eq("id", userId)
          .single();
          
        if (profileData) {
          userProfile = {
            id: profileData.id,
            nombre: profileData.full_name,
            email: profileData.email,
            avatar_url: profileData.avatar_url,
            role: profileData.role
          };
        }
      }
      
      // Actualizar optimistamente los datos en el cliente
      queryClient.setQueryData(
        ["pipeline-leads", pipelineId, user?.companyId],
        (oldData: Record<string, Lead[]> = {}) => {
          // Crear una copia profunda
          const newData = JSON.parse(JSON.stringify(oldData));
          
          // Actualizar la asignación del lead en todas las etapas
          for (const stageId in newData) {
            const leadsInStage = newData[stageId] as Lead[];
            const leadIndex = leadsInStage.findIndex(lead => lead.id === leadId);
            
            if (leadIndex !== -1) {
              // Actualizar lead con la nueva asignación
              newData[stageId][leadIndex].asignado_a = userId;
              newData[stageId][leadIndex].usuario_asignado = userProfile;
              newData[stageId][leadIndex].ultima_interaccion = new Date().toISOString();
              break;
            }
          }
          
          return newData;
        }
      );
      
      // También actualizar la caché de leads individuales si existe
      queryClient.setQueriesData(
        { queryKey: ["leads"] },
        (oldData: any) => {
          if (!Array.isArray(oldData)) return oldData;
          
          return oldData.map((lead: Lead) => 
            lead.id === leadId 
              ? { 
                  ...lead, 
                  asignado_a: userId, 
                  usuario_asignado: userProfile,
                  ultima_interaccion: new Date().toISOString() 
                }
              : lead
          );
        }
      );
      
      return { previousLeadsByStage };
    },
    onError: (error, variables, context) => {
      console.error("Error en updateLeadAssignment:", error);
      toast.error("Error al actualizar la asignación del lead");
      
      // Revertir a los datos anteriores en caso de error
      if (context?.previousLeadsByStage) {
        queryClient.setQueryData(
          ["pipeline-leads", pipelineId, user?.companyId], 
          context.previousLeadsByStage
        );
      }
    },
    onSuccess: (data) => {
      // Invalidar queries para asegurar consistencia de datos
      queryClient.invalidateQueries({ 
        queryKey: ["pipeline-leads", pipelineId, user?.companyId],
        refetchType: "none"
      });
      
      // Invalidar también otras queries que podrían contener este lead
      queryClient.invalidateQueries({ 
        queryKey: ["leads"],
        refetchType: "none"
      });
      
      // Refetch en segundo plano después de un breve retraso
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: ["pipeline-leads", pipelineId, user?.companyId] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ["leads"] 
        });
      }, 1000);
      
      // Mostrar una notificación según el resultado
      if (data.asignado_a) {
        toast.success(`Lead asignado a ${data.usuario_asignado?.nombre || 'un usuario'}`);
      } else {
        toast.info("Asignación del lead liberada");
      }
    },
  });

  // Set up real-time subscription to leads changes
  useEffect(() => {
    if (!pipelineId || !user?.companyId) return;
    
    const channel = supabase
      .channel('pipeline-changes')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `pipeline_id=eq.${pipelineId}`
        }, 
        () => {
          // Invalidate query to refresh data
          queryClient.invalidateQueries({ queryKey: ["pipeline-leads", pipelineId] });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [pipelineId, user?.companyId, queryClient]);

  return {
    leadsByStage: leadsQuery.data || {},
    isLoading: leadsQuery.isLoading,
    isError: leadsQuery.isError,
    error: leadsQuery.error,
    refetch: leadsQuery.refetch,
    updateLeadStage: updateLeadStage.mutate,
    updateLeadAssignment: updateLeadAssignment.mutate,
    isUpdating: updateLeadStage.isPending || updateLeadAssignment.isPending,
  };
}
