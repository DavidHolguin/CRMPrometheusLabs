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
import { Tabs, TabsContent } from "@/components/ui/tabs";

// Hooks
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { useCanales } from "@/hooks/useCanales";
import { usePipelines } from "@/hooks/usePipelines";

// Componentes refactorizados
import LeadsList from "@/components/conversations/LeadsList";
import ChatHeader from "@/components/conversations/ChatHeader";
import ChatMessages from "@/components/conversations/ChatMessages";
import ChatInput from "@/components/conversations/ChatInput";
import LeadComments from "@/components/conversations/LeadComments";
import LeadInfo from "@/components/conversations/LeadInfo";
import TransferDialog from "@/components/conversations/TransferDialog";

// Interfaces de tipos para trabajar con los datos
interface Lead {
  id: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  score?: number;
  pipeline_id?: string;
  stage_id?: string;
  asignado_a?: string;
  tags?: {
    id: string;
    nombre: string;
    color: string;
  }[];
  ultima_interaccion?: string;
}

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

  // Agregar este estado para controlar la pestaña activa
  const [activeTab, setActiveTab] = useState<string>("mensajes");

  const { useCanalesQuery } = useCanales();
  const { data: canales = [] } = useCanalesQuery();
  
  const { 
    pipelines,
    stages,
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

  // Agrupa conversaciones por lead
  const conversations = useMemo(() => {
    return conversationsData;
  }, [conversationsData]);
  
  const groupedConversations = useMemo(() => {
    // Agrupar conversaciones por lead_id
    const grouped: Record<string, any> = {};
    
    conversations.forEach((conv) => {
      const leadId = conv.lead_id;
      if (!grouped[leadId]) {
        grouped[leadId] = {
          lead_id: leadId,
          lead_nombre: conv.lead?.nombre || 'Usuario',
          lead_apellido: conv.lead?.apellido,
          lead_email: conv.lead?.email,
          lead_telefono: conv.lead?.telefono,
          lead_score: conv.lead?.score,
          conversations: [],
          total_mensajes_sin_leer: 0,
          ultima_actualizacion: conv.ultimo_mensaje || conv.created_at,
        };
      }
      
      grouped[leadId].conversations.push({
        id: conv.id,
        canal_id: conv.canal_id,
        canal_nombre: canales.find(c => c.id === conv.canal_id)?.nombre,
        canal_tipo: canales.find(c => c.id === conv.canal_id)?.tipo,
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
      
      // Actualiza la fecha más reciente
      if (new Date(conv.ultimo_mensaje || conv.created_at) > new Date(grouped[leadId].ultima_actualizacion)) {
        grouped[leadId].ultima_actualizacion = conv.ultimo_mensaje || conv.created_at;
      }
    });
    
    // Convertir a array y ordenar por última actualización
    return Object.values(grouped).sort((a, b) => 
      new Date(b.ultima_actualizacion).getTime() - new Date(a.ultima_actualizacion).getTime()
    );
  }, [conversations, canales]);
  
  const selectedConversation = useMemo(() => {
    return conversations.find(conv => conv.id === conversationId);
  }, [conversations, conversationId]);

  const selectedLead = useMemo(() => {
    if (selectedConversation) {
      setSelectedLeadId(selectedConversation.lead_id);
      return selectedConversation.lead;
    }
    if (selectedLeadId) {
      return conversations.find(conv => conv.lead_id === selectedLeadId)?.lead;
    }
    return null;
  }, [selectedConversation, conversations, selectedLeadId]);

  const leadConversations = useMemo(() => {
    if (!selectedLead) return [];
    return conversations
      .filter(conv => conv.lead_id === selectedLead.id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [selectedLead, conversations]);

  // Estado para actualizar mensajes según la estructura de la tabla
  const processedMessages = useMemo(() => {
    return messages.map(msg => {
      // Si el mensaje tiene audio asociado, agregar esa información
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

  // Toggle chatbot function
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
      // Modificado: Obteniendo comentarios sin unir con profiles
      const { data: comments, error } = await supabase
        .from('lead_comments')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      // Si hay comentarios, obtener información de usuarios por separado
      if (comments && comments.length > 0) {
        const userIds = [...new Set(comments.map(comment => comment.usuario_id).filter(Boolean))];
        
        if (userIds.length > 0) {
          const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds);
            
          if (!usersError && users) {
            // Combinar datos manualmente
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

  // Función para asignar el lead al agente actual
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
      refetchConversations();
      
    } catch (error) {
      console.error('Error assigning lead:', error);
      toast.error('No se pudo asignar el lead');
    } finally {
      setIsAssigning(false);
    }
  };

  // Función para liberar la asignación del lead
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

  // Función para transferir el lead a otro agente
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

  // Cargar lista de agentes para transferencia
  useEffect(() => {
    const fetchAgents = async () => {
      if (!user?.companyId || !transferDialogOpen) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, role')
          .eq('empresa_id', user.companyId)
          .eq('is_active', true)
          .neq('id', user.id);
          
        if (error) {
          throw error;
        }
        
        setAgents(data || []);
        
      } catch (error) {
        console.error('Error fetching agents:', error);
        toast.error('No se pudieron cargar los agentes');
      }
    };
    
    if (transferDialogOpen) {
      fetchAgents();
    }
  }, [transferDialogOpen, user?.companyId, user?.id]);

  // Marcar mensajes como leídos cuando se carga una conversación
  useEffect(() => {
    if (conversationId) {
      markAsRead(conversationId);
    }
  }, [conversationId, markAsRead]);

  // Cargar comentarios del lead
  useEffect(() => {
    if (selectedLeadId) {
      fetchLeadComments(selectedLeadId);
    }
  }, [selectedLeadId]);

  // Manejar el envío de mensajes
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

  // Función para formatear fechas en un formato legible
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

  // Obtener el nombre del canal según su ID
  const getChannelName = (canalId: string | null) => {
    if (!canalId) return "N/A";
    const canal = canales.find(c => c.id === canalId);
    return canal ? canal.nombre : "N/A";
  };

  // Verificar si el usuario tiene una empresa asociada
  if (!user?.companyId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No hay empresa asociada a este usuario.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Panel lateral de conversaciones */}
      <LeadsList 
        isLoading={conversationsLoading}
        groupedConversations={groupedConversations}
        selectedLeadId={selectedLeadId} 
        setSelectedLeadId={setSelectedLeadId}
        canales={canales}
      />

      {/* Panel principal de mensajes */}
      <div className="flex-1 flex flex-col h-full">
        {conversationId ? (
          <>
            {/* Cabecera con información del lead */}
            <ChatHeader 
              selectedLead={selectedLead}
              selectedConversation={selectedConversation}
              toggleChatbot={toggleChatbot}
              toggleChatbotLoading={toggleChatbotLoading}
              commentDialogOpen={commentDialogOpen}
              setCommentDialogOpen={setCommentDialogOpen}
              leadConversations={leadConversations}
              formatDate={formatDate}
              leadComments={leadComments}
              navigate={navigate}
              updateLeadStage={updateLeadStage}
              updateLeadScore={updateLeadScore}
              stages={stages}
              stagesLoading={stagesLoading}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />

            {/* Contenedor principal del contenido */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 h-full">
                <TabsContent value="mensajes" className="flex-1 h-full flex flex-col relative overflow-hidden m-0 p-0">
                  {/* El componente de mensajes tendrá un padding inferior para dejar espacio al input */}
                  <ChatMessages 
                    messages={processedMessages}
                    isLoading={messagesLoading}
                    leadConversations={leadConversations}
                    selectedLead={selectedLead}
                    getChannelName={getChannelName}
                  />

                  {/* Input del chat, posicionado de forma sticky en la parte inferior */}
                  <ChatInput 
                    onSendMessage={handleSendMessage} 
                    disabled={!conversationId}
                  />
                </TabsContent>

                {/* Pestaña de Comentarios - Ocupa toda la altura disponible */}
                <TabsContent value="comentarios" className="flex-1 h-full m-0 p-0">
                  <LeadComments 
                    isLoading={isLoadingComments}
                    comments={leadComments}
                    onAddComment={() => setCommentDialogOpen(true)}
                  />
                </TabsContent>

                {/* Pestaña de Información del Lead - Ocupa toda la altura disponible */}
                <TabsContent value="info" className="flex-1 h-full m-0 p-0">
                  <LeadInfo 
                    selectedLead={selectedLead}
                    leadConversations={leadConversations}
                    user={user}
                    isAssigning={isAssigning}
                    isReleasing={isReleasing}
                    handleAssignToMe={handleAssignToMe}
                    handleReleaseAssignment={handleReleaseAssignment}
                    openTransferDialog={() => setTransferDialogOpen(true)}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Diálogo para añadir comentarios */}
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

            {/* Diálogo de transferencia de lead */}
            <TransferDialog
              open={transferDialogOpen}
              onOpenChange={setTransferDialogOpen}
              agents={agents}
              selectedAgentId={selectedAgentId}
              setSelectedAgentId={setSelectedAgentId}
              isTransferring={isTransferring}
              handleTransfer={handleTransferLead}
            />
          </>
        ) : (
          <div className="h-full flex items-center justify-center bg-card/5">
            <div className="text-center max-w-md mx-auto p-8">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-20" />
              <h3 className="text-xl font-medium mb-2">Mensajes</h3>
              <p className="text-muted-foreground mb-6">
                Selecciona una conversación de la lista para comenzar a chatear con tus leads.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationsPage;
