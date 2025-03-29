
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Send, User, Bot, Smile } from "lucide-react";
import { toast } from "sonner";
import { useChatMessages } from "@/hooks/useChatMessages";

const ChatInterface = () => {
  const { chatbotId } = useParams();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [leadInfo, setLeadInfo] = useState({ name: "", email: "", phone: "" });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  
  // Use the new hook to get messages with real-time updates
  const { messages, isLoading: messagesLoading } = useChatMessages(conversationId);
  
  useEffect(() => {
    // Focus the input field when the component mounts
    inputRef.current?.focus();
    
    // Try to get a conversation ID from local storage
    const storedConversationId = localStorage.getItem(`conversation_${chatbotId}`);
    if (storedConversationId) {
      setConversationId(storedConversationId);
    }
  }, [chatbotId]);
  
  useEffect(() => {
    // Scroll to the bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const createConversation = async () => {
    try {
      const { data, error } = await supabase
        .from("conversaciones")
        .insert({
          chatbot_id: chatbotId,
          canal_id: null,
          canal_identificador: "web",
          estado: "activa",
          chatbot_activo: true,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      console.log("Created conversation:", data);
      setConversationId(data.id);
      localStorage.setItem(`conversation_${chatbotId}`, data.id);
      
      return data.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Error al iniciar conversación");
      return null;
    }
  };
  
  const sendMessage = async () => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Create conversation if it doesn't exist
      let currentConversationId = conversationId;
      
      if (!currentConversationId) {
        currentConversationId = await createConversation();
        if (!currentConversationId) {
          throw new Error("Failed to create conversation");
        }
      }
      
      // Extract lead info if name and phone are included in the message
      const nameMatch = message.match(/nombre:?\s*([^,;]+)/i);
      const phoneMatch = message.match(/tel[eé]fono:?\s*([^,;]+)/i);
      const emailMatch = message.match(/email:?\s*([^,;]+)/i);
      
      if (nameMatch) {
        setLeadInfo(prev => ({ ...prev, name: nameMatch[1].trim() }));
      }
      
      if (phoneMatch) {
        setLeadInfo(prev => ({ ...prev, phone: phoneMatch[1].trim() }));
      }
      
      if (emailMatch) {
        setLeadInfo(prev => ({ ...prev, email: emailMatch[1].trim() }));
      }
      
      // Send the message
      const { data: messageData, error: messageError } = await supabase
        .from("mensajes")
        .insert({
          conversacion_id: currentConversationId,
          origen: "user",
          contenido: message,
          tipo_contenido: "text",
          metadata: {},
          score_impacto: 1,
        })
        .select()
        .single();
      
      if (messageError) throw messageError;
      
      // Clear the input
      setMessage("");
      
      console.log("Message sent:", messageData);
      
      // Check if we need to create or update a lead
      if (nameMatch || phoneMatch || emailMatch) {
        // Get conversation to check if there's already a lead_id
        const { data: conversation, error: convError } = await supabase
          .from("conversaciones")
          .select("*, lead:lead_id(*)")
          .eq("id", currentConversationId)
          .single();
        
        if (convError) {
          console.error("Error fetching conversation:", convError);
        } else {
          // If lead doesn't exist, create one
          if (!conversation.lead_id) {
            const { data: leadData, error: leadError } = await supabase
              .from("leads")
              .insert({
                nombre: leadInfo.name || (nameMatch ? nameMatch[1].trim() : ""),
                telefono: leadInfo.phone || (phoneMatch ? phoneMatch[1].trim() : ""),
                email: leadInfo.email || (emailMatch ? emailMatch[1].trim() : ""),
                canal_origen: "web",
                estado: "nuevo",
                empresa_id: conversation.chatbot?.empresa_id,
              })
              .select()
              .single();
            
            if (leadError) {
              console.error("Error creating lead:", leadError);
            } else {
              // Update conversation with lead_id
              const { error: updateError } = await supabase
                .from("conversaciones")
                .update({ lead_id: leadData.id })
                .eq("id", currentConversationId);
              
              if (updateError) {
                console.error("Error updating conversation with lead:", updateError);
              }
            }
          } else {
            // Update existing lead if we have new information
            const updates: any = {};
            if (nameMatch && !conversation.lead.nombre) updates.nombre = nameMatch[1].trim();
            if (phoneMatch && !conversation.lead.telefono) updates.telefono = phoneMatch[1].trim();
            if (emailMatch && !conversation.lead.email) updates.email = emailMatch[1].trim();
            
            if (Object.keys(updates).length > 0) {
              const { error: updateError } = await supabase
                .from("leads")
                .update(updates)
                .eq("id", conversation.lead_id);
              
              if (updateError) {
                console.error("Error updating lead:", updateError);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Error al enviar mensaje");
    } finally {
      setIsLoading(false);
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
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  return (
    <div className="flex flex-col h-screen w-full">
      <div className="p-3 border-b bg-card/50 shadow-sm flex items-center">
        <div className="flex-1 flex items-center gap-2">
          <Bot className="text-primary h-5 w-5" />
          <h3 className="font-medium">Chatbot</h3>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4 chat-background">
        <div className="h-full flex flex-col justify-end chat-message-container">
          {messagesLoading ? (
            <div className="flex items-center justify-center">
              <p className="text-muted-foreground animate-pulse">Cargando mensajes...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center">
                  <div className="text-center p-4">
                    <Bot className="text-muted-foreground mx-auto mb-2 h-10 w-10" />
                    <p className="text-muted-foreground">
                      Escribe un mensaje para comenzar la conversación.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const senderType = getSenderType(msg.origen, msg.metadata);
                  const isLead = senderType === "user";
                  const isChatbot = senderType === "bot";
                  const isAgent = senderType === "agent";
                  const messageDate = new Date(msg.created_at);
                  
                  if (msg.metadata && msg.metadata.is_system_message === true) {
                    return null;
                  }
                  
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex ${isLead ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`
                          px-4 py-3 rounded-lg
                          ${isLead 
                            ? 'user-bubble' 
                            : isChatbot 
                              ? 'bot-bubble' 
                              : 'agent-bubble'
                          }
                        `}
                      >
                        <div className="text-xs mb-1 font-medium flex items-center">
                          {isLead ? (
                            <>
                              <User className="h-3 w-3 mr-1" />
                              <span>Tú</span>
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
                          <div className="message-content whitespace-pre-wrap break-words">
                            {msg.contenido}
                          </div>
                          <div className="chat-timestamp">
                            {messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isLead && (
                              <>
                                <CheckCheck className="h-3 w-3" />
                                <CheckCheck className="h-3 w-3" />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 border-t bg-card/50 shadow-md">
        <div className="flex items-center space-x-2 whatsapp-input-container">
          <button className="whatsapp-button">
            <Smile className="h-5 w-5" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            disabled={isLoading}
            className="whatsapp-input"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !message.trim()}
            className={`whatsapp-button ${
              message.trim() ? "whatsapp-send-button" : ""
            }`}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
