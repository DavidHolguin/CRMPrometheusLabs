import React, { useRef, useEffect } from "react";
import { Bot, Calendar, CheckCheck, Loader2, MessageSquare, User } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollArea } from "@/components/ui/scroll-area";
import { AudioMessage } from "@/components/conversations/AudioMessage";

interface ConversationDividerProps {
  date: string;
  canalName: string;
}

const ConversationDivider: React.FC<ConversationDividerProps> = ({ date, canalName }) => {
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

interface ChatMessagesProps {
  messages: any[];
  isLoading: boolean;
  leadConversations: any[];
  selectedLead: any;
  getChannelName: (canalId: string | null) => string;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoading,
  leadConversations,
  selectedLead,
  getChannelName
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Efecto para hacer scroll al último mensaje cada vez que cambian los mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
          <p className="text-muted-foreground">Cargando mensajes...</p>
        </div>
      </div>
    );
  }
  
  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-20" />
          <p className="text-muted-foreground">No hay mensajes en esta conversación.</p>
        </div>
      </div>
    );
  }
  
  // Función para determinar el tipo de remitente
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

  // Mensaje individual
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
    
    // Crear una clave verdaderamente única usando el ID del mensaje o un índice estable
    const messageKey = `${senderType}-${msg.id || `idx-${index}`}`;
    
    return (
      <div 
        key={messageKey}
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

  return (
    <ScrollArea className="flex-1 p-4 conversation-background" ref={scrollAreaRef}>
      <div className="space-y-4 chat-message-container">
        {(() => {
          let currentConversationId = '';
          let currentDate = '';
          
          return messages.map((msg, index) => {
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
                  <React.Fragment key={`fragment-${msg.id || index}`}>
                    <div key={`divider-${index}`} className="space-y-4">
                      <ConversationDivider 
                        date={msg.created_at} 
                        canalName={getChannelName(conversation?.canal_id || null)} 
                      />
                    </div>
                    {renderMessageBubble(msg, senderType, isLead, isChatbot, isAgent, messageDate, index)}
                  </React.Fragment>
                );
              }
            }
            
            // Usar un prefijo para asegurar que las claves sean únicas
            return renderMessageBubble(msg, senderType, isLead, isChatbot, isAgent, messageDate, index);
          });
        })()}
        <div ref={messagesEndRef} className="h-1" /> {/* Añadida altura para asegurar visibilidad */}
      </div>
    </ScrollArea>
  );
};

export default ChatMessages;