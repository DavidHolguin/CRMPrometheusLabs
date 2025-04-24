import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// Hooks
import { useLeadsDetalle } from "@/hooks/useLeadsDetalle"; // Nuevo hook
import { useMessages } from "@/hooks/useMessages";
import { useCanales } from "@/hooks/useCanales";
import { usePipelines } from "@/hooks/usePipelines";
import { Lead as LeadType } from "@/hooks/useLeads"; // Importar el tipo Lead

// Componentes refactorizados
import LeadsList from "@/components/conversations/LeadsList";
import ChatHeader from "@/components/conversations/ChatHeader";
import ChatMessages from "@/components/conversations/ChatMessages";
import ChatInput from "@/components/conversations/ChatInput";
import TransferDialog from "@/components/conversations/TransferDialog";
import LeadDetailSidebar from "@/components/conversations/LeadDetailSidebar";

interface Mensaje {
  id: string;
  conversacion_id: string;
  origen: string;
  remitente_id?: string;
  contenido: string;
  tipo_contenido?: string;
  metadata?: any;
  created_at: string;
  leido?: boolean;
  intencion_id?: string;
  interaction_type_id?: string;
  audio?: {
    archivo_url: string;
    duracion_segundos: number;
    transcripcion?: string;
  };
}

const ConversationsPage = () => {
  const { user } = useAuth();
  const { conversationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isPrivateComment, setIsPrivateComment] = useState(false);
  const [leadComments, setLeadComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [submitCommentLoading, setSubmitCommentLoading] = useState(false);
  const [toggleChatbotLoading, setToggleChatbotLoading] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filtros de búsqueda que obtenemos de la URL
  const searchParams = new URLSearchParams(location.search);
  const filterUnreadOnly = searchParams.get('unread') === 'true';
  const filterCanalId = searchParams.get('canal');
  const filterAssignment = searchParams.get('assigned') as 'all' | 'assigned_to_me' | 'unassigned' || 'all';
  const filterTags = searchParams.get('tags')?.split(',') || [];
  const sortOrder = searchParams.get('sort') || 'date_desc';

  const { useCanalesQuery } = useCanales();
  const { data: canales = [] } = useCanalesQuery();

  const { 
    data: pipelines = [],
    isLoading: stagesLoading
  } = usePipelines();

  // Reemplazamos useConversations por useLeadsDetalle
  const { 
    data: leadsDetalleData = [],
    isLoading: leadsDetalleLoading, 
    refetch: refetchLeadsDetalle
  } = useLeadsDetalle({
    limit: 50,
    busqueda: searchQuery
  });

  const { 
    data: messages = [], 
    isLoading: messagesLoading,
    markAsRead,
    sendMessage,
  } = useMessages(conversationId);

  // Transformamos los datos de leadsDetalleData al formato que espera el componente
  const conversations = useMemo(() => {
    return leadsDetalleData.map(lead => ({
      id: lead.conversacion_id,
      lead_id: lead.lead_id,
      ultimo_mensaje: lead.conversacion_ultimo_mensaje,
      created_at: lead.lead_creado_en,
      canal_id: lead.canal_id || '',
      estado: lead.lead_estado || '',
      chatbot_id: '', // No tenemos esta información en la nueva vista
      chatbot_activo: false, // Añadimos esta propiedad con un valor predeterminado
      lead: {
        id: lead.lead_id,
        nombre: lead.nombre_lead || 'Usuario',
        apellido: lead.apellido_lead || '',
        email: lead.email_lead,
        telefono: lead.telefono_lead,
        score: lead.lead_score,
        asignado_a: lead.asignado_a,
        tags: [], // No tenemos tags en la nueva vista, habría que cargar por separado si se necesitan
        created_at: lead.lead_creado_en || '', // Añadimos created_at
        updated_at: lead.lead_actualizado_en || '' // Añadimos updated_at
      },
      unread_count: 0, // No tenemos esta información en la nueva vista, habría que cargar por separado
      message_count: 0, // No tenemos esta información en la nueva vista, habría que cargar por separado
      canal_nombre: lead.canal_nombre,
      canal_color: lead.canal_color,
      ultimo_mensaje_contenido: lead.ultimo_mensaje_contenido || ''
    }));
  }, [leadsDetalleData]);
  
  const groupedConversations = useMemo(() => {
    const grouped: Record<string, any> = {};
    leadsDetalleData.forEach((lead) => {
      const leadId = lead.lead_id;
      if (!grouped[leadId]) {
        grouped[leadId] = {
          lead_id: leadId,
          lead_nombre: lead.nombre_lead || 'Usuario',
          lead_apellido: lead.apellido_lead || '',
          lead_email: lead.email_lead,
          lead_telefono: lead.telefono_lead,
          lead_score: lead.lead_score,
          temperatura_actual: (lead.lead_score && lead.lead_score >= 70 ? 'Hot' : (lead.lead_score && lead.lead_score >= 40 ? 'Warm' : 'Cold')),
          lead: {
            id: leadId,
            nombre: lead.nombre_lead || 'Usuario',
            apellido: lead.apellido_lead || '',
            email: lead.email_lead,
            telefono: lead.telefono_lead,
            score: lead.lead_score,
            asignado_a: lead.asignado_a || null,
            tags: [] // No tenemos tags en la nueva vista
          },
          conversations: [],
          total_mensajes_sin_leer: 0, // No tenemos esta información en la nueva vista
          ultima_actualizacion: lead.ultima_interaccion || lead.lead_creado_en,
        };
      }
      
      grouped[leadId].conversations.push({
        id: lead.conversacion_id,
        canal_id: lead.canal_id,
        canal_nombre: lead.canal_nombre || 'N/A',
        canal_tipo: 'web', // Suponemos web por defecto
        canal_identificador: lead.canal_id,
        chatbot_id: null, // No tenemos esta información en la nueva vista
        chatbot_activo: false, // No tenemos esta información en la nueva vista
        estado: lead.lead_estado || 'activo',
        ultimo_mensaje: lead.conversacion_ultimo_mensaje || lead.lead_creado_en,
        unread_count: 0, // No tenemos esta información en la nueva vista
        message_count: 0, // No tenemos esta información en la nueva vista
        created_at: lead.lead_creado_en,
      });
      
      if (lead.ultima_interaccion && new Date(lead.ultima_interaccion) > new Date(grouped[leadId].ultima_actualizacion)) {
        grouped[leadId].ultima_actualizacion = lead.ultima_interaccion;
      }
    });
    
    return Object.values(grouped).sort((a, b) => 
      new Date(b.ultima_actualizacion).getTime() - new Date(a.ultima_actualizacion).getTime()
    );
  }, [leadsDetalleData]);

  const selectedConversation = useMemo(() => {
    if (!conversationId) return null;
    const convo = conversations.find(conv => conv.id === conversationId);
    // Si no encontramos la conversación, pero tenemos el ID, buscamos en leadsDetalleData
    if (!convo && conversationId) {
      const lead = leadsDetalleData.find(lead => lead.conversacion_id === conversationId);
      if (lead) {
        return {
          id: lead.conversacion_id,
          lead_id: lead.lead_id,
          ultimo_mensaje: lead.conversacion_ultimo_mensaje,
          created_at: lead.lead_creado_en,
          canal_id: lead.canal_id || '',
          estado: lead.lead_estado || '',
          chatbot_id: '',
          chatbot_activo: false,
          canal_nombre: lead.canal_nombre,
          lead: {
            id: lead.lead_id,
            nombre: lead.nombre_lead || 'Usuario',
            apellido: lead.apellido_lead || '',
            email: lead.email_lead || '',
            telefono: lead.telefono_lead || '',
            created_at: lead.lead_creado_en || '',
            updated_at: lead.lead_actualizado_en || '',
            score: lead.lead_score || 0,
            asignado_a: lead.asignado_a || null,
            tags: [] // Assuming tags are not available in this context
          }
        };
      }
    }
    return convo;
  }, [conversations, conversationId, leadsDetalleData]);

  const selectedLead = useMemo(() => {
    if (selectedLeadId) {
      const leadData = groupedConversations.find(group => group.lead_id === selectedLeadId);
      return leadData?.lead as LeadType | null;
    }
    return null;
  }, [selectedLeadId, groupedConversations]);

  const leadConversations = useMemo(() => {
    if (!selectedLeadId) return [];
    const leadGroup = groupedConversations.find(group => group.lead_id === selectedLeadId);
    return leadGroup?.conversations || [];
  }, [selectedLeadId, groupedConversations]);

  const processedMessages = useMemo(() => {
    return messages.map(msg => {
      const audioMessage = msg.audio || 
        (msg.metadata && msg.metadata.audio_url ? {
          archivo_url: msg.metadata.audio_url,
          duracion_segundos: msg.metadata.duracion_segundos || 0,
          transcripcion: msg.metadata.transcripcion
        } : undefined);
        
      return {
        ...msg,
        audio: audioMessage
      };
    });
  }, [messages]);

  // Cargar agentes disponibles para transferencia al abrir el diálogo
  useEffect(() => {
    const fetchAgents = async () => {
      if (!user?.companyId || !transferDialogOpen) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .eq('company_id', user.companyId)
          .in('role', ['admin', 'agent'])
          .neq('id', user.id); // Excluir al usuario actual
          
        if (error) throw error;
        
        setAgents(data || []);
      } catch (error) {
        console.error('Error fetching agents:', error);
        toast.error('No se pudieron cargar los agentes');
      }
    };
    
    fetchAgents();
  }, [transferDialogOpen, user?.companyId, user?.id]);

  // Actualizar los filtros en la URL - versión optimizada como useCallback
  const updateFilters = useCallback((params: {
    sortOrder?: string,
  }) => {
    const newSearchParams = new URLSearchParams(location.search);
    
    if (params.sortOrder !== undefined) {
      newSearchParams.set('sort', params.sortOrder);
    }
    
    const newSearch = newSearchParams.toString();
    navigate({
      pathname: location.pathname,
      search: newSearch ? `?${newSearch}` : ''
    }, { replace: true });
  }, [location.pathname, location.search, navigate]);

  const toggleChatbot = async (status?: boolean) => {
    if (!conversationId) {
      toast.error('No hay una conversación seleccionada');
      return;
    }
    
    try {
      setToggleChatbotLoading(true);
      
      const toggleStatus = status !== undefined ? status : !selectedConversation?.chatbot_activo;
      console.log(`Intentando ${toggleStatus ? 'activar' : 'desactivar'} el chatbot para la conversación ${conversationId}`);
      
      // Asegurarnos de enviar solo valores simples, no el evento completo de React
      const requestBody = {
        conversation_id: conversationId,
        chatbot_activo: toggleStatus
      };
      
      console.log('Enviando solicitud a la API:', requestBody);
      
      const response = await fetch('https://web-production-01457.up.railway.app/api/v1/agent/toggle-chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      console.log('Respuesta de la API:', data);
      
      if (!response.ok || !data.success) {
        const errorMessage = data.detail 
          ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) 
          : 'Error al actualizar el estado del chatbot';
        throw new Error(errorMessage);
      }
      
      toast.success(toggleStatus ? 'Chatbot activado' : 'Chatbot desactivado');
      
      // Esperar un momento y luego actualizar los datos
      setTimeout(() => {
        refetchLeadsDetalle();
      }, 300);
      
    } catch (error) {
      console.error('Error toggling chatbot:', error);
      toast.error(`No se pudo ${selectedConversation?.chatbot_activo ? 'desactivar' : 'activar'} el chatbot: ${error.message || 'Error desconocido'}`);
    } finally {
      setToggleChatbotLoading(false);
    }
  };

  const fetchLeadComments = async (leadId: string) => {
    if (!leadId) return;
    
    try {
      setIsLoadingComments(true);
      const { data: comments, error } = await supabase
        .from('lead_comments')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      if (comments && comments.length > 0) {
        const userIds = [...new Set(comments.map(comment => comment.usuario_id).filter(Boolean))];
        
        if (userIds.length > 0) {
          const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds);
            
          if (!usersError && users) {
            const commentsWithUsers = comments.map(comment => {
              const userInfo = users.find(u => u.id === comment.usuario_id);
              return {
                ...comment,
                usuario: userInfo || { full_name: 'Usuario desconocido' }
              };
            });
            
            setLeadComments(commentsWithUsers);
            return;
          }
        }
      }
      
      setLeadComments(comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('No se pudieron cargar los comentarios');
    } finally {
      setIsLoadingComments(false);
    }
  };

  const addLeadComment = async () => {
    if (!newComment.trim() || !selectedLeadId) return;
    
    try {
      setSubmitCommentLoading(true);
      
      const { data, error } = await supabase
        .from('lead_comments')
        .insert({
          lead_id: selectedLeadId,
          usuario_id: user?.id,
          contenido: newComment,
          is_private: isPrivateComment
        })
        .select();
        
      if (error) {
        throw error;
      }
      
      toast.success('Comentario añadido');
      setNewComment('');
      setCommentDialogOpen(false);
      fetchLeadComments(selectedLeadId);
      
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('No se pudo añadir el comentario');
    } finally {
      setSubmitCommentLoading(false);
    }
  };

  const updateLeadStage = async (stageId: string) => {
    if (!selectedLeadId) return;
    
    try {
      const { error } = await supabase
        .from('leads')
        .update({ stage_id: stageId })
        .eq('id', selectedLeadId);
        
      if (error) {
        throw error;
      }
      
      toast.success('Etapa actualizada');
      refetchLeadsDetalle();
      
    } catch (error) {
      console.error('Error updating lead stage:', error);
      toast.error('No se pudo actualizar la etapa');
    }
  };

  const updateLeadScore = async (score: number) => {
    if (!selectedLeadId) return;
    
    try {
      const { error } = await supabase
        .from('leads')
        .update({ score: score })
        .eq('id', selectedLeadId);
        
      if (error) {
        throw error;
      }
      
      toast.success(`Puntuación actualizada a ${score}`);
      refetchLeadsDetalle();
      
    } catch (error) {
      console.error('Error updating lead score:', error);
      toast.error('No se pudo actualizar la puntuación');
    }
  };

  const handleAssignToMe = async () => {
    if (!selectedLeadId || !user?.id) return;
    
    try {
      setIsAssigning(true);
      const { error } = await supabase
        .from('leads')
        .update({ asignado_a: user.id })
        .eq('id', selectedLeadId);
        
      if (error) {
        throw error;
      }
      
      toast.success('Lead asignado correctamente');
      
      setTimeout(async () => {
        await refetchLeadsDetalle();
        if (selectedLeadId) {
          const { data: updatedLeadData } = await supabase
            .from('vista_lead_completa')
            .select('*')
            .eq('lead_id', selectedLeadId)
            .single();
          
          if (updatedLeadData && updatedLeadData.asignado_a === user.id) {
            if (conversationId) {
              navigate(`/dashboard/conversations/${conversationId}?refresh=${new Date().getTime()}`);
            }
          }
        }
      }, 300);
      
    } catch (error) {
      console.error('Error assigning lead:', error);
      toast.error('No se pudo asignar el lead');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleReleaseAssignment = async () => {
    if (!selectedLeadId) return;
    
    try {
      setIsReleasing(true);
      const { error } = await supabase
        .from('leads')
        .update({ asignado_a: null })
        .eq('id', selectedLeadId);
        
      if (error) {
        throw error;
      }
      
      toast.success('Asignación liberada correctamente');
      refetchLeadsDetalle();
      
    } catch (error) {
      console.error('Error releasing lead assignment:', error);
      toast.error('No se pudo liberar la asignación');
    } finally {
      setIsReleasing(false);
    }
  };

  const handleTransferLead = async () => {
    if (!selectedLeadId || !selectedAgentId) return;
    
    try {
      setIsTransferring(true);
      const { error } = await supabase
        .from('leads')
        .update({ asignado_a: selectedAgentId })
        .eq('id', selectedLeadId);
        
      if (error) {
        throw error;
      }
      
      toast.success('Lead transferido correctamente');
      refetchLeadsDetalle();
      setTransferDialogOpen(false);
      
    } catch (error) {
      console.error('Error transferring lead:', error);
      toast.error('No se pudo transferir el lead');
    } finally {
      setIsTransferring(false);
    }
  };

  // Efecto para marcar mensajes como leídos cuando se abre una conversación
  useEffect(() => {
    if (conversationId) {
      // Agregamos un breve retraso para asegurar que la UI se haya actualizado antes de marcar como leídos
      const timer = setTimeout(() => {
        markAsRead(conversationId);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [conversationId, markAsRead]);

  // Efecto para marcar mensajes como leídos cuando llegan nuevos mensajes
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      // Verificar si hay mensajes sin leer del lead
      const hasUnreadMessages = messages.some(msg => 
        (msg.origen === 'lead' || msg.origen === 'user') && msg.leido === false
      );
      
      if (hasUnreadMessages) {
        markAsRead(conversationId);
      }
    }
  }, [conversationId, messages, markAsRead]);

  // Efecto para cargar comentarios cuando cambia el lead seleccionado
  useEffect(() => {
    if (selectedLeadId) {
      fetchLeadComments(selectedLeadId);
    }
  }, [selectedLeadId]);

  // Suscripción a cambios en asignaciones de leads - Optimizada
  useEffect(() => {
    if (!user?.companyId) return;
    
    const channel = supabase
      .channel('leads-assignment-changes')
      .on('postgres_changes', 
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
          filter: `asignado_a=is.not.null`
        }, 
        () => refetchLeadsDetalle()
      )
      .on('postgres_changes', 
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
          filter: `asignado_a=is.null`
        }, 
        () => refetchLeadsDetalle()
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchLeadsDetalle, user?.companyId]);

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || !conversationId) return;
    
    try {
      await sendMessage(messageText);
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      toast.error("No se pudo enviar el mensaje. Intente de nuevo.");
      throw error;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getChannelName = (canalId: string | null) => {
    if (!canalId) return "N/A";
    const canal = canales.find(c => c.id === canalId);
    return canal ? canal.nombre : "N/A";
  };

  const handleFilterChange = useCallback((filters: { sortOrder: string }) => {
    updateFilters({ sortOrder: filters.sortOrder });
  }, [updateFilters]);

  if (!user?.companyId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No hay empresa asociada a este usuario.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background text-foreground">
      <LeadsList 
        isLoading={leadsDetalleLoading}
        groupedConversations={groupedConversations}
        selectedLeadId={selectedLeadId}
        setSelectedLeadId={(leadId) => {
          setSelectedLeadId(leadId);
          const leadGroup = groupedConversations.find(g => g.lead_id === leadId);
          if (leadGroup && leadGroup.conversations.length > 0) {
            // Encontrar la conversación más reciente
            const firstConv = leadGroup.conversations.sort((a:any, b:any) => 
              new Date(b.ultimo_mensaje || b.created_at).getTime() - 
              new Date(a.ultimo_mensaje || a.created_at).getTime()
            )[0];
            
            // Si estamos cambiando de conversación, navegar a la nueva URL
            if (firstConv && firstConv.id !== conversationId) {
              navigate(`/dashboard/conversations/${firstConv.id}`);
            }
          } else if (!conversationId && leadId) {
             navigate(`/dashboard/conversations`);
          }
        }}
        canales={canales}
        user={user}
        initialFilters={{ sortOrder: sortOrder as any }}
        onFilterChange={handleFilterChange}
        onSearch={(query) => setSearchQuery(query)}
      />

      <main className="flex-1 flex flex-col h-full border-l border-r border-border">
        {conversationId && selectedConversation ? (
            <>
            <ChatHeader 
              selectedLead={selectedLead}
              selectedConversation={selectedConversation}
              toggleChatbot={toggleChatbot}
              toggleChatbotLoading={toggleChatbotLoading}
              formatDate={formatDate}
            />

            <ChatMessages 
              messages={processedMessages}
              isLoading={messagesLoading}
              leadConversations={leadConversations}
              selectedLead={selectedLead}
              getChannelName={getChannelName}
            />

            <ChatInput 
              onSendMessage={handleSendMessage} 
              disabled={!conversationId}
            />
            </>
        ) : (
          <div className="h-full flex items-center justify-center bg-muted/30">
            <div className="text-center max-w-md mx-auto p-8">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-20" />
              <h3 className="text-xl font-medium mb-2">Mensajes</h3>
              <p className="text-muted-foreground mb-6">
                {selectedLeadId 
                  ? "Selecciona o inicia una conversación para este lead."
                  : "Selecciona un lead de la lista para ver sus conversaciones."
                }
              </p>
            </div>
          </div>
        )}
      </main>

      <LeadDetailSidebar
        selectedLead={selectedLead}
        leadComments={leadComments}
        isLoadingComments={isLoadingComments}
        onAddComment={() => setCommentDialogOpen(true)}
        user={user}
        isAssigning={isAssigning}
        isReleasing={isReleasing}
        handleAssignToMe={handleAssignToMe}
        handleReleaseAssignment={handleReleaseAssignment}
        openTransferDialog={() => setTransferDialogOpen(true)}
        leadConversations={leadConversations}
      />

      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir comentario</DialogTitle>
            <DialogDescription>
              Agrega un comentario sobre este lead para el equipo de ventas.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Escribe tu comentario aquí..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="private-comment"
              checked={isPrivateComment}
              onChange={(e) => setIsPrivateComment(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="private-comment" className="text-sm">Comentario privado</label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={addLeadComment} disabled={submitCommentLoading || !newComment.trim()}>
              {submitCommentLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Guardando
                </>
              ) : 'Guardar comentario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TransferDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        agents={agents}
        selectedAgentId={selectedAgentId}
        setSelectedAgentId={setSelectedAgentId}
        isTransferring={isTransferring}
        handleTransfer={handleTransferLead}
      />
    </div>
  );
};

export default ConversationsPage;
