import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// Hooks
import { useConversations } from "@/hooks/useConversations";
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

  const { useCanalesQuery } = useCanales();
  const { data: canales = [] } = useCanalesQuery();

  const { 
    data: pipelines = [],
    isLoading: stagesLoading
  } = usePipelines();

  const { 
    data: conversationsData = [],
    isLoading: conversationsLoading, 
    refetch: refetchConversations
  } = useConversations();

  const { 
    data: messages = [], 
    isLoading: messagesLoading,
    markAsRead,
    sendMessage,
  } = useMessages(conversationId);

  const conversations = useMemo(() => {
    return conversationsData;
  }, [conversationsData]);
  
  const groupedConversations = useMemo(() => {
    const grouped: Record<string, any> = {};
    conversations.forEach((conv) => {
      const leadId = conv.lead_id;
      if (!grouped[leadId]) {
        const leadTags = conv.lead?.tags || [];
        const asignadoA = conv.lead?.asignado_a;
        const agenteName = conv.lead?.agente_nombre || '';
        const agentEmail = conv.lead?.agente_email || '';
        const agentAvatar = conv.lead?.agente_avatar || '';

        grouped[leadId] = {
          lead_id: leadId,
          lead_nombre: conv.lead?.nombre || 'Usuario',
          lead_apellido: conv.lead?.apellido,
          lead_email: conv.lead?.email,
          lead_telefono: conv.lead?.telefono,
          lead_score: conv.lead?.score,
          lead: {
            ...conv.lead,
            asignado_a: asignadoA || null,
            agente_nombre: agenteName,
            agente_email: agentEmail,
            agente_avatar: agentAvatar,
            tags: leadTags
          },
          conversations: [],
          total_mensajes_sin_leer: 0,
          ultima_actualizacion: conv.ultimo_mensaje || conv.created_at,
        };
      }
      
      grouped[leadId].conversations.push({
        id: conv.id,
        canal_id: conv.canal_id,
        canal_nombre: canales.find(c => c.id === conv.canal_id)?.nombre || conv.canal_nombre,
        canal_tipo: canales.find(c => c.id === conv.canal_id)?.tipo || conv.canal_tipo,
        canal_identificador: conv.canal_identificador,
        chatbot_id: conv.chatbot_id,
        chatbot_activo: conv.chatbot_activo || false,
        chatbot_nombre: conv.chatbot?.nombre,
        chatbot_avatar_url: conv.chatbot?.avatar_url,
        estado: conv.estado,
        ultimo_mensaje: conv.ultimo_mensaje || conv.created_at,
        unread_count: conv.unread_count || 0,
        message_count: conv.message_count || 0,
        created_at: conv.created_at,
      });
      
      grouped[leadId].total_mensajes_sin_leer += (conv.unread_count || 0);
      
      if (new Date(conv.ultimo_mensaje || conv.created_at) > new Date(grouped[leadId].ultima_actualizacion)) {
        grouped[leadId].ultima_actualizacion = conv.ultimo_mensaje || conv.created_at;
      }
    });
    
    return Object.values(grouped).sort((a, b) => 
      new Date(b.ultima_actualizacion).getTime() - new Date(a.ultima_actualizacion).getTime()
    );
  }, [conversations, canales]);

  const selectedConversation = useMemo(() => {
    return conversations.find(conv => conv.id === conversationId);
  }, [conversations, conversationId]);

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

  const toggleChatbot = async (status?: boolean) => {
    if (!conversationId) return;
    
    try {
      setToggleChatbotLoading(true);
      
      const toggleStatus = status !== undefined ? status : !selectedConversation?.chatbot_activo;
      
      const response = await fetch('https://web-production-01457.up.railway.app/api/v1/agent/toggle-chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          chatbot_activo: toggleStatus
        })
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.detail || 'Error al actualizar el estado del chatbot');
      }
      
      toast.success(toggleStatus ? 'Chatbot activado' : 'Chatbot desactivado');
      refetchConversations();
      
    } catch (error) {
      console.error('Error toggling chatbot:', error);
      toast.error('No se pudo cambiar el estado del chatbot');
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
      refetchConversations();
      
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
      refetchConversations();
      
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
        await refetchConversations();
        if (selectedLeadId) {
          const { data: updatedLeadData } = await supabase
            .from('vista_lead_completa')
            .select('*')
            .eq('lead_id', selectedLeadId)
            .single();
          
          if (updatedLeadData && updatedLeadData.asignado_a === user.id) {
            console.log("Lead asignado correctamente, datos actualizados:", updatedLeadData);
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
      refetchConversations();
      
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
      refetchConversations();
      setTransferDialogOpen(false);
      
    } catch (error) {
      console.error('Error transferring lead:', error);
      toast.error('No se pudo transferir el lead');
    } finally {
      setIsTransferring(false);
    }
  };

  useEffect(() => {
    if (conversationId) {
      // Marcar mensajes como leídos inmediatamente al cambiar de conversación
      markAsRead(conversationId);
    }
  }, [conversationId, markAsRead]);

  // Nuevo efecto para marcar mensajes como leídos cuando llegan nuevos mensajes
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      // Verificar si hay mensajes sin leer del lead
      const hasUnreadMessages = messages.some(msg => 
        (msg.origen === 'lead' || msg.origen === 'user') && msg.leido === false
      );
      
      if (hasUnreadMessages) {
        console.log("Marcando mensajes no leídos como leídos");
        markAsRead(conversationId);
      }
    }
  }, [conversationId, messages, markAsRead]);

  useEffect(() => {
    if (selectedLeadId) {
      fetchLeadComments(selectedLeadId);
    }
  }, [selectedLeadId]);

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
        (payload) => {
          refetchConversations();
        }
      )
      .on('postgres_changes', 
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
          filter: `asignado_a=is.null`
        }, 
        (payload) => {
          refetchConversations();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchConversations, user?.companyId]);

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
        isLoading={conversationsLoading}
        groupedConversations={groupedConversations}
        selectedLeadId={selectedLeadId} 
        setSelectedLeadId={(leadId) => {
          setSelectedLeadId(leadId);
          const leadGroup = groupedConversations.find(g => g.lead_id === leadId);
          if (leadGroup && leadGroup.conversations.length > 0) {
            const firstConv = leadGroup.conversations.sort((a:any, b:any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
            if (firstConv && firstConv.id !== conversationId) {
              navigate(`/dashboard/conversations/${firstConv.id}`);
            }
          } else if (!conversationId && leadId) {
             navigate(`/dashboard/conversations`);
          }
        }}
        canales={canales}
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
