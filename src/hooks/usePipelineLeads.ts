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
    
    // Get all leads for the pipeline
    const { data: leads, error } = await supabase
      .from("leads")
      .select("*")
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
      .select("id")
      .eq("pipeline_id", pipelineId)
      .eq("is_active", true);
    
    if (!stages) {
      return {};
    }
    
    // Get enhanced lead data with tags, message counts, etc.
    const enhancedLeads = await Promise.all(
      leads.map(async (lead) => {
        // Get tags for this lead
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
        
        // Get conversations for this lead
        const { data: conversations } = await supabase
          .from("conversaciones")
          .select("id")
          .eq("lead_id", lead.id);
          
        let messageCount = 0;
        let interactionCount = 0;
        
        if (conversations && conversations.length > 0) {
          const conversationIds = conversations.map(conv => conv.id);
          
          // Count total messages
          const { count: msgCount } = await supabase
            .from("mensajes")
            .select("id", { count: "exact", head: true })
            .in("conversacion_id", conversationIds);
            
          messageCount = msgCount || 0;
          
          // Count interactions (non-chatbot messages)
          const { count: interCount } = await supabase
            .from("mensajes")
            .select("id", { count: "exact", head: true })
            .in("conversacion_id", conversationIds)
            .neq("origen", "chatbot");
            
          interactionCount = interCount || 0;
        }
        
        // Find stage info
        const { data: stageInfo } = await supabase
          .from("pipeline_stages")
          .select("nombre, color")
          .eq("id", lead.stage_id)
          .single();
        
        return {
          ...lead,
          message_count: messageCount,
          interaction_count: interactionCount,
          stage_name: stageInfo?.nombre || "Sin etapa",
          stage_color: stageInfo?.color || "#cccccc",
          tags
        } as Lead;
      })
    );
    
    // Group leads by stage
    const leadsByStage: Record<string, Lead[]> = {};
    
    // Initialize all stages with empty arrays
    stages.forEach(stage => {
      leadsByStage[stage.id] = [];
    });
    
    // Group leads by stage
    enhancedLeads.forEach(lead => {
      if (lead.stage_id && leadsByStage[lead.stage_id]) {
        leadsByStage[lead.stage_id].push(lead);
      } else if (stages.length > 0) {
        // If lead doesn't have a stage or its stage isn't in this pipeline,
        // add it to the first stage
        const firstStageId = stages[0].id;
        leadsByStage[firstStageId].push(lead);
      }
    });
    
    // Sort leads in each stage by most recent interaction
    Object.keys(leadsByStage).forEach(stageId => {
      leadsByStage[stageId].sort((a, b) => {
        const dateA = a.ultima_interaccion ? new Date(a.ultima_interaccion).getTime() : 0;
        const dateB = b.ultima_interaccion ? new Date(b.ultima_interaccion).getTime() : 0;
        return dateB - dateA; // Most recent first
      });
    });
    
    return leadsByStage;
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
            const leadIndex = leads.findIndex(lead => lead.id === leadId);
            if (leadIndex !== -1) {
              leadToMove = { ...leads[leadIndex] };
              sourceStageId = stgId;
              // Eliminar el lead de su etapa actual
              newData[stgId] = leads.filter(lead => lead.id !== leadId);
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
    isUpdating: updateLeadStage.isPending,
  };
}
