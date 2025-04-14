import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Search,
  Filter,
  MessageSquare,
  Send,
  Smile,
  CheckCheck,
  Bot,
  BotOff,
  User,
  Calendar,
  Hash,
  Mail,
  Tag,
  FileEdit,
  Star,
  ChevronRight,
  MoreHorizontal,
  CircleDollarSign,
  FileSpreadsheet,
  MessageCircle,
  Forward,
  ChevronDown,
  Clock,
  Phone,
  Loader2,
  AlignLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { EmojiPicker } from "@/components/conversations/EmojiPicker";
import { toast } from "sonner";
import { useChat } from "@/hooks/useChat";
import { useCanales } from "@/hooks/useCanales";
import { CanalIcon } from "@/components/canales/CanalIcon";
import { useChatMessages } from "@/hooks/useChatMessages";
import { AudioMessage } from "@/components/conversations/AudioMessage";
import { usePipelines } from "@/hooks/usePipelines";

// Interfaces mejoradas para trabajar con la nueva estructura de base de datos
interface Lead {
  id: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  score?: number;
  pipeline_id?: string;
  stage_id?: string;
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

interface ConversacionAgrupada {
  lead_id: string;
  lead_nombre: string;
  lead_apellido?: string;
  lead_email?: string;
  lead_telefono?: string;
  lead_score?: number;
  conversations: {
    id: string;
    canal_id: string;
    canal_nombre?: string;
    canal_tipo?: string;
    canal_identificador?: string;
    chatbot_id?: string;
    chatbot_activo: boolean;
    chatbot_nombre?: string;
    chatbot_avatar_url?: string;
    estado: string;
    ultimo_mensaje: string;
    unread_count: number;
    message_count: number;
    created_at: string;
  }[];
  total_mensajes_sin_leer: number;
  ultima_actualizacion: string;
}

// Nuevo componente para marcar el inicio de una conversación en el chat
const ConversationDivider = ({ date, canalName }: { date: string, canalName: string }) => {
  const formattedDate = new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  
  return (
    <div className="flex items-center justify-center my-4">
      <div className="bg-muted/30 text-muted-foreground text-xs px-3 py-1 rounded-full flex items-center gap-2">
        <Calendar className="h-3 w-3" />
        <span>Conversación iniciada el {formattedDate} en {canalName}</span>
      </div>
    </div>
  );
};

// Componente para mostrar comentarios del equipo de ventas
const LeadComment = ({ comment }: { comment: any }) => {
  return (
    <div className="bg-accent/20 border border-accent rounded-md p-3 my-2">
      <div className="flex items-center gap-2 mb-1">
        <Avatar className="h-6 w-6">
          <AvatarImage src={comment.usuario?.avatar_url} />
          <AvatarFallback>{comment.usuario?.full_name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium">{comment.usuario?.full_name}</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {new Date(comment.created_at).toLocaleString()}
        </span>
      </div>
      <p className="text-sm">{comment.contenido}</p>
    </div>
  );
};

const ConversationsPage = () => {
  const { user } = useAuth();
  const { conversationId } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
  
  // Corregido: Usando el hook usePipelines correctamente
  const { 
    pipelines,
    stages,
    isLoading: stagesLoading
  } = usePipelines();
  
  const { 
    data: conversationsData = [],
    isLoading: conversationsLoading, 
    isError: conversationsError,
    refetch: refetchConversations
  } = useConversations();
  
  const { 
    data: messages = [], 
    isLoading: messagesLoading,
    isError: messagesError,
    markAsRead,
    sendMessage,
    refetch: refetchMessages
  } = useMessages(conversationId);

  // Agrupa conversaciones por lead
  const conversations = useMemo(() => {
    return conversationsData;
  }, [conversationsData]);
  
  const groupedConversations = useMemo(() => {
    // Agrupar conversaciones por lead_id
    const grouped: Record<string, ConversacionAgrupada> = {};
    
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
      const { data, error } = await supabase
        .from('leads')
        .update({ stage_id: stageId })
        .eq('id', selectedLeadId)
        .select();
        
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
      const { data, error } = await supabase
        .from('leads')
        .update({ score: score })
        .eq('id', selectedLeadId)
        .select();
        
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
      const { data, error } = await supabase
        .from('leads')
        .update({ asignado_a: user.id })
        .eq('id', selectedLeadId)
        .select();
        
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
      const { data, error } = await supabase
        .from('leads')
        .update({ asignado_a: null })
        .eq('id', selectedLeadId)
        .select();
        
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
      const { data, error } = await supabase
        .from('leads')
        .update({ asignado_a: selectedAgentId })
        .eq('id', selectedLeadId)
        .select();
        
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
  }, [transferDialogOpen, user?.companyId]);

  useEffect(() => {
    scrollToBottom();
  }, [processedMessages]);

  useEffect(() => {
    if (conversationId) {
      markAsRead(conversationId);
    }
  }, [conversationId, processedMessages.length]);

  useEffect(() => {
    if (selectedLeadId) {
      fetchLeadComments(selectedLeadId);
    }
  }, [selectedLeadId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !conversationId) return;
    
    try {
      await sendMessage(message);
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      toast.error("No se pudo enviar el mensaje. Intente de nuevo.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setEmojiPickerOpen(false);
    textareaRef.current?.focus();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const filteredGroupedConversations = useMemo(() => {
    return groupedConversations.filter(group => {
      const leadName = `${group.lead_nombre || ''} ${group.lead_apellido || ''}`.toLowerCase();
      const matchesSearch = searchTerm ? leadName.includes(searchTerm.toLowerCase()) : true;
      const matchesFilter = filterActive ? group.total_mensajes_sin_leer > 0 : true;
      return matchesSearch && matchesFilter;
    });
  }, [groupedConversations, searchTerm, filterActive]);

  const getChannelName = (canalId: string | null) => {
    if (!canalId) return "N/A";
    const canal = canales.find(c => c.id === canalId);
    return canal ? canal.nombre : "N/A";
  };

  const getChannelType = (canalId: string | null) => {
    if (!canalId) return "default";
    const canal = canales.find(c => c.id === canalId);
    return canal ? canal.tipo.toLowerCase() : "default";
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

  const getSenderType = (origen: string, metadata: any): "user" | "bot" | "agent" => {
    if (origen === 'usuario' || origen === 'lead' || origen === 'user') return "user";
    if (origen === 'chatbot' || origen === 'bot') return "bot";
    if (origen === 'agente' || origen === 'agent') return "agent";
    
    if (metadata) {
      if (metadata.agent_id || metadata.agent_name || metadata.origin === "agent") {
        return "agent";
      }
      
      if (metadata.is_bot || metadata.origin === "bot" || metadata.origin === "chatbot") {
        return "bot";
      }
      
      if (metadata.is_user || metadata.origin === "user" || metadata.origin === "lead") {
        return "user";
      }
    }
    
    return origen === "agente" ? "agent" : (origen === "chatbot" ? "bot" : "user");
  };

  // Función para renderizar conversaciones agrupadas por fecha
  const renderConversationMessages = () => {
    if (messagesLoading) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
            <p className="text-muted-foreground">Cargando mensajes...</p>
          </div>
        </div>
      );
    }
    
    if (processedMessages.length === 0) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-20" />
            <p className="text-muted-foreground">No hay mensajes en esta conversación.</p>
          </div>
        </div>
      );
    }
    
    let currentConversationId = '';
    let currentDate = '';

    return (
      <div className="space-y-4 chat-message-container">
        {processedMessages.map((msg, index) => {
          const senderType = getSenderType(msg.origen, msg.metadata);
          const isLead = senderType === "user";
          const isChatbot = senderType === "bot";
          const isAgent = senderType === "agent";
          const messageDate = new Date(msg.created_at);
          
          // Si cambia la conversación, mostrar un divisor
          const showConversationDivider = msg.conversacion_id !== currentConversationId;
          if (showConversationDivider) {
            currentConversationId = msg.conversacion_id;
            const conversation = leadConversations.find(c => c.id === msg.conversacion_id);
            currentDate = msg.created_at;
            
            // Mostrar el divisor sólo si hay un cambio de conversación
            if (index > 0) {
              return (
                <div key={`divider-${msg.id}`} className="space-y-4">
                  <ConversationDivider 
                    date={msg.created_at} 
                    canalName={getChannelName(conversation?.canal_id || null)} 
                  />
                  {renderMessageBubble(msg, senderType, isLead, isChatbot, isAgent, messageDate)}
                </div>
              );
            }
          }
          
          return renderMessageBubble(msg, senderType, isLead, isChatbot, isAgent, messageDate, index);
        })}
        <div ref={messagesEndRef} />
      </div>
    );
  };
  
  // Función auxiliar para renderizar una burbuja de mensaje individual
  const renderMessageBubble = (
    msg: any, 
    senderType: "user" | "bot" | "agent",
    isLead: boolean,
    isChatbot: boolean,
    isAgent: boolean,
    messageDate: Date,
    index?: number
  ) => {
    // Ignorar mensajes del sistema
    if (msg.metadata && msg.metadata.is_system_message === true) {
      return null;
    }
    
    const bubbleClass = isLead ? 'user-bubble' : (isChatbot ? 'bot-bubble' : 'agent-bubble');
    const leadName = selectedLead ? `${selectedLead.nombre || ''} ${selectedLead.apellido || ''}`.trim() : 'Usuario';
    
    return (
      <div 
        key={msg.id || index} 
        className={`flex ${isLead ? 'justify-end' : 'justify-start'} mb-1`}
      >
        <div 
          className={`
            px-4 py-3 rounded-lg max-w-[80%] md:max-w-[70%]
            ${bubbleClass}
          `}
        >
          <div className="text-xs mb-1 font-medium flex items-center">
            {isLead ? (
              <>
                <User className="h-3 w-3 mr-1" />
                <span>{leadName}</span>
              </>
            ) : isChatbot ? (
              <>
                <Bot className="h-3 w-3 mr-1" />
                <span>Chatbot</span>
              </>
            ) : (
              <>
                <User className="h-3 w-3 mr-1" />
                <span>{msg.metadata?.agent_name || 'Agente'}</span>
              </>
            )}
          </div>
          
          <div className="flex flex-wrap items-end">
            {/* Renderizar audio si es un mensaje de audio */}
            {msg.tipo_contenido === 'audio' || msg.audio ? (
              <AudioMessage 
                src={msg.audio?.archivo_url || msg.metadata?.audio_url}
                duration={msg.audio?.duracion_segundos || msg.metadata?.duracion_segundos || 0}
                transcription={msg.audio?.transcripcion || msg.metadata?.transcripcion}
              />
            ) : (
              <div className="message-content whitespace-pre-wrap break-words">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  className="markdown-message"
                >
                  {msg.contenido}
                </ReactMarkdown>
              </div>
            )}
            <div className="chat-timestamp">
              {messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {isLead && (
                <>
                  {msg.leido ? (
                    <CheckCheck className="h-3 w-3 text-blue-400" />
                  ) : (
                    <CheckCheck className="h-3 w-3" />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

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
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b bg-card/50">
          <h2 className="font-semibold text-lg mb-4">Conversaciones</h2>
          
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar lead..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button
              variant={filterActive ? "default" : "outline"}
              size="icon"
              onClick={() => setFilterActive(!filterActive)}
              title={filterActive ? "Mostrar todas" : "Solo no leídos"}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {conversationsLoading ? (
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
                <p className="text-muted-foreground">Cargando conversaciones...</p>
              </div>
            </div>
          ) : filteredGroupedConversations.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-muted-foreground">No hay conversaciones.</p>
            </div>
          ) : (
            <div className="py-2">
              {filteredGroupedConversations.map((group) => {
                const leadName = `${group.lead_nombre || ''} ${group.lead_apellido || ''}`.trim() || 'Sin nombre';
                const hasUnread = group.total_mensajes_sin_leer > 0;
                const latestConversation = group.conversations[0];
                
                return (
                  <div key={group.lead_id} className="mb-1">
                    <div
                      className={`
                        p-3 cursor-pointer hover:bg-muted transition-colors
                        ${selectedLeadId === group.lead_id ? 'bg-muted' : ''}
                        ${hasUnread ? 'border-l-4 border-primary' : ''}
                      `}
                      onClick={() => {
                        setSelectedLeadId(group.lead_id);
                        if (group.conversations.length > 0) {
                          navigate(`/dashboard/conversations/${group.conversations[0].id}`);
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(leadName)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                            <h3 className="font-medium text-sm truncate">
                              {leadName}
                              {hasUnread && (
                                <Badge variant="default" className="ml-2 text-xs">
                                  {group.total_mensajes_sin_leer}
                                </Badge>
                              )}
                            </h3>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(group.ultima_actualizacion)}
                            </span>
                          </div>
                          
                          <div className="mt-1 flex flex-wrap gap-2">
                            <div className="flex items-center text-xs text-muted-foreground">
                              <CanalIcon 
                                tipo={getChannelType(latestConversation?.canal_id || null)} 
                                size={12} 
                                className="mr-1" 
                              />
                              <span className="truncate max-w-[90px]">
                                {getChannelName(latestConversation?.canal_id || null)}
                              </span>
                            </div>
                            
                            <div className="flex items-center text-xs text-muted-foreground">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              <span>{group.conversations.reduce((acc, conv) => acc + (conv.message_count || 0), 0)}</span>
                            </div>
                            
                            {group.lead_score !== undefined && (
                              <div className="flex items-center text-xs">
                                <Badge 
                                  variant={group.lead_score > 70 ? "default" : 
                                         (group.lead_score > 40 ? "secondary" : "outline")}
                                  className="px-1.5 py-0 h-4"
                                >
                                  {group.lead_score || 0}
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          {group.conversations.length > 1 && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {group.conversations.length} conversaciones
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Panel principal de mensajes */}
      <div className="flex-1 flex flex-col h-full">
        {conversationId ? (
          <>
            {/* Cabecera mejorada con información y acciones del lead */}
            <div className="p-4 border-b bg-[#020817] shadow-sm z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedLead?.nombre 
                        ? getInitials(`${selectedLead.nombre} ${selectedLead.apellido || ''}`)
                        : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">
                      {selectedLead?.nombre 
                        ? `${selectedLead.nombre} ${selectedLead.apellido || ''}`.trim() || 'Sin nombre'
                        : 'Sin nombre'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {selectedLead?.email && (
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          <span>{selectedLead.email}</span>
                        </div>
                      )}
                      {selectedLead?.telefono && (
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          <span>{selectedLead.telefono}</span>
                        </div>
                      )}
                      {selectedConversation?.ultimo_mensaje && (
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatDate(selectedConversation.ultimo_mensaje)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleChatbot()}
                          disabled={toggleChatbotLoading}
                          className="gap-2"
                        >
                          {toggleChatbotLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : selectedConversation?.chatbot_activo ? (
                            <BotOff className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {selectedConversation?.chatbot_activo ? 'Desactivar Chatbot' : 'Activar Chatbot'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        <span className="sm:inline hidden">Comentario</span>
                      </Button>
                    </DialogTrigger>
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
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Guardando
                            </>
                          ) : 'Guardar comentario'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-shrink-0">
                        <Tag className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Categorizar</span>
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Acciones de Lead</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem className="cursor-pointer">
                        <FileEdit className="h-4 w-4 mr-2" />
                        Editar datos de lead
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem className="cursor-pointer">
                        <Tag className="h-4 w-4 mr-2" />
                        Asignar etiquetas
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem asChild>
                        <div className="w-full">
                          <Popover>
                            <PopoverTrigger className="w-full flex items-center px-2 py-1.5 cursor-pointer">
                              <FileSpreadsheet className="h-4 w-4 mr-2" />
                              <span>Cambiar etapa</span>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2">
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm">Seleccionar etapa</h4>
                                {stagesLoading ? (
                                  <div className="flex justify-center p-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    {stages.map(stage => (
                                      <Button 
                                        key={stage.id}
                                        variant="ghost"
                                        className="w-full justify-start text-sm h-8"
                                        onClick={() => updateLeadStage(stage.id)}
                                      >
                                        <div
                                          className="w-3 h-3 rounded-full mr-2"
                                          style={{ backgroundColor: stage.color || '#888' }}
                                        />
                                        {stage.nombre}
                                      </Button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem asChild>
                        <div className="w-full">
                          <Popover>
                            <PopoverTrigger className="w-full flex items-center px-2 py-1.5 cursor-pointer">
                              <Star className="h-4 w-4 mr-2" />
                              <span>Cambiar puntuación</span>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2">
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm">Puntuación (0-100)</h4>
                                <div className="grid grid-cols-2 gap-1">
                                  {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(score => (
                                    <Button 
                                      key={score}
                                      variant={score > 70 ? "default" : (score > 40 ? "secondary" : "outline")}
                                      className="text-sm"
                                      onClick={() => updateLeadScore(score)}
                                    >
                                      {score}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem className="cursor-pointer">
                        <CircleDollarSign className="h-4 w-4 mr-2" />
                        Añadir oportunidad
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        if (selectedLead?.pipeline_id) {
                          navigate(`/dashboard/leads/${selectedLead.id}`);
                        }
                      }}>
                        <ChevronRight className="h-4 w-4 mr-2" />
                        Ver ficha completa
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        if (leadConversations.length > 1) {
                          // Lógica para mostrar todas las conversaciones
                        }
                      }}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Ver todas las conversaciones
                        <Badge variant="secondary" className="ml-2 px-1 text-xs">
                          {leadConversations.length}
                        </Badge>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Forward className="h-4 w-4 mr-2" />
                        Transferir conversación
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {/* Pestañas para alternar entre mensajes y otros datos */}
              <Tabs defaultValue="mensajes" className="mt-2">
                <TabsList className="grid grid-cols-3 h-8">
                  <TabsTrigger value="mensajes" className="text-xs">Mensajes</TabsTrigger>
                  <TabsTrigger value="comentarios" className="text-xs">
                    Comentarios
                    {leadComments.length > 0 && (
                      <Badge variant="secondary" className="ml-1.5 px-1 py-0 text-xs">
                        {leadComments.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="info" className="text-xs">Información</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Contenido principal de mensajes con estructura mejorada para scroll correcto */}
            <div className="flex flex-col flex-1 overflow-hidden">
              <Tabs defaultValue="mensajes">
                <TabsContent value="mensajes" className="flex-1 h-full flex flex-col overflow-hidden m-0 p-0">
                  <ScrollArea className="flex-1 p-4 pb-20 conversation-background">
                    {renderConversationMessages()}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="comentarios" className="flex-1 h-full flex flex-col overflow-hidden m-0 p-0">
                  <ScrollArea className="flex-1 p-4">
                    {isLoadingComments ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Cargando comentarios...</span>
                      </div>
                    ) : leadComments.length === 0 ? (
                      <div className="text-center p-8">
                        <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">No hay comentarios registrados</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setCommentDialogOpen(true)}
                          className="mt-3"
                        >
                          Añadir primer comentario
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {leadComments.map(comment => (
                          <LeadComment key={comment.id} comment={comment} />
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="info" className="flex-1 h-full flex flex-col overflow-hidden m-0 p-0">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {/* Información básica */}
                      <Card className="p-4">
                        <h3 className="text-sm font-medium mb-3">Información del Lead</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex flex-col">
                            <span className="text-muted-foreground text-xs">Nombre</span>
                            <span className="font-medium">
                              {selectedLead?.nombre ? `${selectedLead.nombre} ${selectedLead.apellido || ''}`.trim() : 'N/A'}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-muted-foreground text-xs">Email</span>
                            <span className="font-medium">{selectedLead?.email || 'N/A'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-muted-foreground text-xs">Teléfono</span>
                            <span className="font-medium">{selectedLead?.telefono || 'N/A'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-muted-foreground text-xs">Score</span>
                            <div className="flex items-center">
                              <Badge 
                                variant={selectedLead?.score && selectedLead.score > 70 ? "default" : 
                                      (selectedLead?.score && selectedLead.score > 40 ? "secondary" : "outline")}
                                className="px-1.5 py-0 h-5"
                              >
                                {selectedLead?.score || 0}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </Card>
                      
                      {/* Gráficos y métricas */}
                      <Card className="p-4">
                        <h3 className="text-sm font-medium mb-3">Métricas</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-muted/20 p-3 rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">Total mensajes</div>
                            <div className="text-2xl font-semibold">
                              {leadConversations.reduce((acc, conv) => acc + (conv.message_count || 0), 0)}
                            </div>
                            <div className="h-8 w-full bg-muted/20 rounded-full mt-2 overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ 
                                  width: `${Math.min(100, leadConversations.reduce((acc, conv) => acc + (conv.message_count || 0), 0) / 2)}%` 
                                }}
                              />
                            </div>
                          </div>
                          
                          <div className="bg-muted/20 p-3 rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">Conversaciones</div>
                            <div className="text-2xl font-semibold">
                              {leadConversations.length}
                            </div>
                            <div className="flex mt-2 gap-1">
                              {leadConversations.map((conv, idx) => (
                                <div 
                                  key={idx}
                                  className="h-8 flex-1 bg-primary/80 rounded-md" 
                                  style={{ 
                                    opacity: 0.3 + (idx / leadConversations.length) * 0.7
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                      
                      {/* Asignación de lead */}
                      <Card className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium">Asignación</h3>
                          {selectedLead?.asignado_a && selectedLead.asignado_a !== user?.id ? (
                            <Badge variant="outline" className="text-xs">Asignado a otro agente</Badge>
                          ) : selectedLead?.asignado_a && selectedLead.asignado_a === user?.id ? (
                            <Badge variant="secondary" className="text-xs">Asignado a ti</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/20">Sin asignar</Badge>
                          )}
                        </div>
                        
                        {!selectedLead?.asignado_a ? (
                          <Button 
                            size="sm" 
                            className="w-full" 
                            variant="outline"
                            onClick={() => handleAssignToMe()}
                            disabled={isAssigning}
                          >
                            {isAssigning ? (
                              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            ) : (
                              <User className="h-3.5 w-3.5 mr-1.5" />
                            )}
                            Asignarme este lead
                          </Button>
                        ) : selectedLead.asignado_a === user?.id ? (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="flex-1" 
                              variant="outline"
                              onClick={() => handleReleaseAssignment()}
                              disabled={isReleasing}
                            >
                              {isReleasing ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                              ) : "Liberar asignación"}
                            </Button>
                            <Button 
                              size="sm" 
                              className="flex-1" 
                              variant="outline"
                              onClick={() => setTransferDialogOpen(true)}
                            >
                              <Forward className="h-3.5 w-3.5 mr-1.5" />
                              Transferir
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            size="sm" 
                            className="w-full" 
                            variant="outline" 
                            disabled
                          >
                            Lead asignado a otro agente
                          </Button>
                        )}
                      </Card>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              {/* Campo de entrada de mensajes - fijo en la parte inferior */}
              <div className="p-4 border-t bg-[#020817] shadow-md w-full">
                <div className="relative">
                  <div className="flex">
                    <div className="relative flex-1">
                      <Textarea
                        ref={textareaRef}
                        value={message}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribe un mensaje..."
                        className="min-h-[60px] max-h-[200px] pr-20 resize-none py-3"
                      />
                      <div className="absolute right-3 bottom-3 flex gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                              >
                                <Smile className="h-5 w-5 text-muted-foreground" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Emojis
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90"
                                onClick={handleSendMessage}
                                disabled={!message.trim()}
                              >
                                <Send className="h-5 w-5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Enviar mensaje
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                  {emojiPickerOpen && (
                    <div className="absolute bottom-full right-0 mb-2 z-10">
                      <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  <span>Pro tip: </span>
                  <span>Puedes usar Markdown para dar formato a tu mensaje</span>
                </div>
              </div>
            </div>

            {/* Diálogo de transferencia de lead */}
            <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Transferir lead a otro agente</DialogTitle>
                  <DialogDescription>
                    Selecciona a qué agente quieres transferir este lead.
                  </DialogDescription>
                </DialogHeader>
                
                {agents.length === 0 ? (
                  <div className="text-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Cargando agentes disponibles...</p>
                  </div>
                ) : (
                  <div className="space-y-3 my-2 max-h-[300px] overflow-y-auto">
                    {agents.map(agent => (
                      <div
                        key={agent.id}
                        className={`
                          flex items-center p-2 rounded-md cursor-pointer
                          ${selectedAgentId === agent.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'}
                        `}
                        onClick={() => setSelectedAgentId(agent.id)}
                      >
                        <Avatar className="h-8 w-8 mr-3">
                          <AvatarImage src={agent.avatar_url} />
                          <AvatarFallback>
                            {agent.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{agent.full_name}</p>
                          <p className="text-xs text-muted-foreground">{agent.role || 'Agente'}</p>
                        </div>
                        {selectedAgentId === agent.id && (
                          <div className="ml-auto">
                            <CheckCheck className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleTransferLead} 
                    disabled={isTransferring || !selectedAgentId}
                  >
                    {isTransferring ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Transfiriendo
                      </>
                    ) : 'Transferir lead'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
