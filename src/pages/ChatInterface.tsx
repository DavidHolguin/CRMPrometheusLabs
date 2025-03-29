
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Send, User, Bot, Smile, Check } from "lucide-react";
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
  const [sessionId, setSessionId] = useState<string>("");
  
  // Use the chat messages hook to get messages with real-time updates
  const { messages, isLoading: messagesLoading } = useChatMessages(conversationId);
  
  useEffect(() => {
    // Focus the input field when the component mounts
    inputRef.current?.focus();
    
    // Generate or retrieve a session ID
    const storedSessionId = localStorage.getItem(`session_${chatbotId}`);
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = crypto.randomUUID();
      localStorage.setItem(`session_${chatbotId}`, newSessionId);
      setSessionId(newSessionId);
    }
    
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
  
  const sendMessageToAPI = async (messageText: string) => {
    try {
      if (!chatbotId) {
        throw new Error("No se ha especificado el ID del chatbot");
      }
      
      const apiEndpoint = import.meta.env.VITE_API_BASE_URL || '';
      const url = `${apiEndpoint}/api/v1/channels/web`;
      
      // Extract empresa_id from chatbot if needed (this would require an additional API call)
      // For simplicity, we're using chatbotId as the only required identifier and letting the API handle the rest
      
      // Extract lead info if provided in the message
      const nameMatch = messageText.match(/nombre:?\s*([^,;]+)/i);
      const phoneMatch = messageText.match(/tel[eé]fono:?\s*([^,;]+)/i);
      const emailMatch = messageText.match(/email:?\s*([^,;]+)/i);
      
      let updatedLeadInfo = { ...leadInfo };
      
      if (nameMatch) {
        updatedLeadInfo.name = nameMatch[1].trim();
      }
      
      if (phoneMatch) {
        updatedLeadInfo.phone = phoneMatch[1].trim();
      }
      
      if (emailMatch) {
        updatedLeadInfo.email = emailMatch[1].trim();
      }
      
      setLeadInfo(updatedLeadInfo);
      
      // Construct the payload
      const payload = {
        chatbot_id: chatbotId,
        mensaje: messageText,
        session_id: sessionId,
        metadata: {
          lead_info: updatedLeadInfo,
          client_info: {
            device: navigator.userAgent,
            referrer: document.referrer,
            locale: navigator.language
          }
        }
      };
      
      console.log("Enviando mensaje a la API:", payload);
      
      // Make the API request
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error en la respuesta de la API:", errorData);
        throw new Error(`Error al enviar mensaje: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log("Respuesta de la API:", responseData);
      
      // Store the conversation ID for future messages
      if (responseData.conversacion_id && !conversationId) {
        setConversationId(responseData.conversacion_id);
        localStorage.setItem(`conversation_${chatbotId}`, responseData.conversacion_id);
      }
      
      return responseData;
    } catch (error) {
      console.error("Error al enviar mensaje a la API:", error);
      throw error;
    }
  };
  
  const sendMessage = async () => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    
    try {
      await sendMessageToAPI(message);
      
      // Clear the input
      setMessage("");
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
                                <Check className="h-3 w-3" />
                                <Check className="h-3 w-3" />
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
