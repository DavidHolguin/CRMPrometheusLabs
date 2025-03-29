
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Search, 
  Filter, 
  MessageSquare, 
  Send, 
  Smile, 
  CheckCheck, 
  Bot, 
  BotOff 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { EmojiPicker } from "@/components/conversations/EmojiPicker";
import { toast } from "sonner";
import { useChat } from "@/hooks/useChat";

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

  // Get conversations
  const { 
    data: conversations = [],
    isLoading: conversationsLoading, 
    isError: conversationsError 
  } = useConversations();
  
  // Get messages for selected conversation
  const { 
    data: messages = [], 
    isLoading: messagesLoading,
    isError: messagesError,
    markAsRead,
    sendMessage
  } = useMessages(conversationId);
  
  // Get selected conversation
  const selectedConversation = conversations.find(conv => conv.id === conversationId);
  
  // Get chatbot status
  const { 
    chatbotEnabled,
    toggleChatbot,
    isToggling 
  } = useChat(conversationId);

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (conversationId) {
      markAsRead(conversationId);
    }
  }, [conversationId]);

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
    
    // Auto-resize textarea
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

  const filteredConversations = conversations.filter(conv => {
    const leadName = `${conv.lead?.nombre || ''} ${conv.lead?.apellido || ''}`.toLowerCase();
    const matchesSearch = searchTerm ? leadName.includes(searchTerm.toLowerCase()) : true;
    const matchesFilter = filterActive ? conv.unread_count > 0 : true;
    return matchesSearch && matchesFilter;
  });

  // Sort conversations by last message date (newest first)
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    return new Date(b.ultimo_mensaje || 0).getTime() - new Date(a.ultimo_mensaje || 0).getTime();
  });

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

  if (!user?.companyId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No hay empresa asociada a este usuario.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
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
              <p className="text-muted-foreground animate-pulse">Cargando conversaciones...</p>
            </div>
          ) : sortedConversations.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-muted-foreground">No hay conversaciones.</p>
            </div>
          ) : (
            <div className="py-2">
              {sortedConversations.map((conversation) => {
                const leadName = `${conversation.lead?.nombre || ''} ${conversation.lead?.apellido || ''}`.trim();
                const hasUnread = conversation.unread_count > 0;
                
                return (
                  <div 
                    key={conversation.id}
                    className={`
                      flex items-center p-3 cursor-pointer hover:bg-muted transition-colors
                      ${conversationId === conversation.id ? 'bg-muted' : ''}
                      ${hasUnread ? 'font-medium' : ''}
                    `}
                    onClick={() => navigate(`/dashboard/conversations/${conversation.id}`)}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{getInitials(leadName || 'Usuario')}</AvatarFallback>
                      </Avatar>
                      {hasUnread && (
                        <span className="absolute -top-1 -right-1 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    
                    <div className="ml-3 flex-1 overflow-hidden">
                      <div className="flex justify-between items-baseline">
                        <p className="truncate">{leadName || 'Usuario'}</p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {conversation.ultimo_mensaje ? formatDate(conversation.ultimo_mensaje) : ''}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.last_message?.contenido || 'No hay mensajes'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Conversation Area */}
      <div className="flex-1 flex flex-col">
        {conversationId ? (
          <>
            {/* Conversation Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarFallback>
                    {selectedConversation?.lead?.nombre 
                      ? getInitials(`${selectedConversation.lead.nombre} ${selectedConversation.lead.apellido || ''}`)
                      : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">
                    {selectedConversation?.lead?.nombre 
                      ? `${selectedConversation.lead.nombre} ${selectedConversation.lead.apellido || ''}`
                      : 'Usuario'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation?.ultimo_mensaje 
                      ? `Último mensaje: ${formatDate(selectedConversation.ultimo_mensaje)}`
                      : 'Sin mensajes'}
                  </p>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleChatbot()}
                disabled={isToggling}
                className="gap-2"
              >
                {chatbotEnabled ? (
                  <>
                    <BotOff className="h-4 w-4" />
                    <span>Desactivar Chatbot</span>
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4" />
                    <span>Activar Chatbot</span>
                  </>
                )}
              </Button>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground animate-pulse">Cargando mensajes...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground">No hay mensajes en esta conversación.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isLead = msg.origen === 'lead';
                    const isChatbot = msg.origen === 'chatbot';
                    const isAgent = msg.origen === 'agente';
                    const messageDate = new Date(msg.created_at);
                    
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex ${isLead ? 'justify-start' : 'justify-end'}`}
                      >
                        <div 
                          className={`
                            max-w-[80%] px-4 py-2 rounded-lg
                            ${isLead 
                              ? 'bg-muted text-foreground' 
                              : isChatbot 
                                ? 'bg-primary/20 text-foreground' 
                                : 'bg-primary text-primary-foreground'
                            }
                          `}
                        >
                          <div className="text-xs mb-1 font-medium">
                            {isLead 
                              ? selectedConversation?.lead?.nombre || 'Usuario'
                              : isChatbot 
                                ? 'Chatbot' 
                                : 'Tú'
                            }
                          </div>
                          <p className="whitespace-pre-wrap break-words">{msg.contenido}</p>
                          <div className="text-xs mt-1 opacity-70 flex justify-end items-center gap-1">
                            {messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {!isLead && <CheckCheck className="h-3 w-3" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                      >
                        <Smile className="h-5 w-5 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={handleSendMessage}
                        disabled={!message.trim()}
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
                {emojiPickerOpen && (
                  <div className="absolute bottom-full right-0 mb-2">
                    <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          // No conversation selected state
          <div className="h-full flex items-center justify-center">
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
