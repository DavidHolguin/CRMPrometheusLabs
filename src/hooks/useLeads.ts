
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Lead {
  id: string;
  empresa_id: string;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  telefono: string | null;
  pais: string | null;
  ciudad: string | null;
  direccion: string | null;
  canal_origen: string | null;
  score: number;
  pipeline_id: string | null;
  stage_id: string | null;
  asignado_a: string | null;
  ultima_interaccion: string | null;
  estado: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  datos_adicionales?: Record<string, any> | null;
  // Stats derived from other tables
  message_count?: number;
  interaction_count?: number;
  stage_name?: string;
  stage_color?: string;
  tags?: Array<{id: string, nombre: string, color: string}>;
}

export function useLeads() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchLeadsWithStats = async (): Promise<Lead[]> => {
    if (!user?.companyId) {
      throw new Error("No hay ID de empresa");
    }
    
    // Get all leads for the company
    const { data: leads, error } = await supabase
      .from("leads")
      .select("*")
      .eq("empresa_id", user.companyId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
      
    if (error) {
      console.error("Error fetching leads:", error);
      throw error;
    }
    
    // Get all stages to add stage information
    const { data: stages } = await supabase
      .from("pipeline_stages")
      .select("id, nombre, color");
    
    // Get message counts for all leads
    const enhancedLeads = await Promise.all(
      leads.map(async (lead) => {
        // Process datos_adicionales to ensure it's a proper object
        const datos_adicionales = typeof lead.datos_adicionales === 'string' 
          ? JSON.parse(lead.datos_adicionales) 
          : lead.datos_adicionales || {};
        
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
        const stage = stages?.find(s => s.id === lead.stage_id) || null;
        
        return {
          ...lead,
          datos_adicionales,
          message_count: messageCount,
          interaction_count: interactionCount,
          stage_name: stage?.nombre || "Sin etapa",
          stage_color: stage?.color || "#cccccc",
          tags
        };
      })
    );
    
    return enhancedLeads as Lead[];
  };

  const leadsQuery = useQuery({
    queryKey: ["leads", user?.companyId],
    queryFn: fetchLeadsWithStats,
    enabled: !!user?.companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateLeadMutation = useMutation({
    mutationFn: async (updatedLead: Partial<Lead> & { id: string }) => {
      const { id, ...updateData } = updatedLead;
      
      const { data, error } = await supabase
        .from("leads")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
        
      if (error) {
        console.error("Error updating lead:", error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead actualizado correctamente");
    },
    onError: (error) => {
      console.error("Error in updateLeadMutation:", error);
      toast.error("Error al actualizar el lead");
    },
  });

  return {
    leads: leadsQuery.data || [],
    isLoading: leadsQuery.isLoading,
    isError: leadsQuery.isError,
    error: leadsQuery.error,
    refetch: leadsQuery.refetch,
    updateLead: updateLeadMutation.mutate,
    isUpdating: updateLeadMutation.isPending,
  };
}
