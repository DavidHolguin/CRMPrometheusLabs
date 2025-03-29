import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Send, Smile } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChatMessage, useChatMessages } from "@/hooks/useChatMessages";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import ReactMarkdown from "react-markdown";

const ChatInterface = () => {
  const { chatbotId } = useParams<{ chatbotId: string }>();
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState<string>("");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [showNamePhoneForm, setShowNamePhoneForm] = useState(true);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { messages } = useChatMessages(conversationId);

  // Initialize session ID
  useEffect(() => {
    // Check if we have a session ID in localStorage
    const storedSessionId = localStorage.getItem(`chat_session_${chatbotId}`);
    if (storedSessionId) {
      setSessionId(storedSessionId);
      
      // Check if this session already has a conversation
      const checkExistingConversation = async () => {
        const { data, error } = await supabase
          .from("conversaciones")
          .select("id, lead_id")
          .eq("session_id", storedSessionId)
          .eq("chatbot_id", chatbotId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
          
        if (data && !error) {
          console.log("Found existing conversation:", data);
          setConversationId(data.id);
          setLeadId(data.lead_id);
          setShowNamePhoneForm(false);
        }
      };
      
      checkExistingConversation();
    } else {
      // Generate a new session ID
      const newSessionId = uuidv4();
      localStorage.setItem(`chat_session_${chatbotId}`, newSessionId);
      setSessionId(newSessionId);
    }
  }, [chatbotId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Process name and phone to create lead
  const handleNamePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !phone.trim()) {
      toast.error("Por favor ingresa tu nombre y teléfono");
      return;
    }
    
    try {
      // Create lead with provided name and phone
      const { data: lead, error: leadError } = await supabase
        .from("leads")
        .insert({
          nombre: name,
          telefono: phone,
          empresa_id: chatbotId ? chatbotId.split("-")[0] : null,
          canal_origen: "web",
          datos_adicionales: {
            page: window.location.pathname,
            session_id: sessionId,
            user_agent: navigator.userAgent
          }
        })
        .select("id")
        .single();
        
      if (leadError) throw leadError;
      
      console.log("Lead created:", lead);
      setLeadId(lead.id);
      setShowNamePhoneForm(false);
      
      // Send welcome message automatically
      sendMessage("Hola, quiero más información");
      
    } catch (error) {
      console.error("Error creating lead:", error);
      toast.error("Error al crear el usuario. Inténtalo de nuevo.");
    }
  };

  // Send message to chatbot
  const sendMessage = async (messageContent: string = message) => {
    if (!messageContent.trim() || !chatbotId) return;
    
    try {
      setIsLoadingResponse(true);
      
      // If we don't have a conversation yet, create one
      if (!conversationId) {
        if (!leadId) {
          toast.error("Primero debes ingresar tu nombre y teléfono");
          setIsLoadingResponse(false);
          return;
        }
        
        const { data: conversation, error: convError } = await supabase
          .from("conversaciones")
          .insert({
            chatbot_id: chatbotId,
            lead_id: leadId,
            session_id: sessionId,
            canal_id: null, // Web chat doesn't have a channel ID
            estado: "activa"
          })
          .select("id")
          .single();
          
        if (convError) throw convError;
        
        console.log("Conversation created:", conversation);
        setConversationId(conversation.id);
      }
      
      // Generate a temporary ID for optimistic UI update
      const tempId = uuidv4();
      const timestamp = new Date().toISOString();
      
      // Add user message to UI immediately
      const userMessage: ChatMessage = {
        id: tempId,
        contenido: messageContent,
        origen: "user",
        created_at: timestamp,
      };
      
      // Clear input field
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      
      // Send message to API
      const response = await fetch(`/api/v1/chat/${chatbotId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageContent,
          conversation_id: conversationId,
          lead_id: leadId,
          session_id: sessionId
        }),
      });
      
      if (!response.ok) {
        throw new Error("Error sending message");
      }
      
      const data = await response.json();
      console.log("Chat response:", data);
      
      setIsLoadingResponse(false);
    } catch (error) {
      console.error("Error in chat:", error);
      setIsLoadingResponse(false);
      toast.error("Error al enviar el mensaje. Inténtalo de nuevo.");
    }
  };

  const renderMessageContent = (content: string) => {
    return (
      <ReactMarkdown className="message-content whitespace-pre-wrap break-words">
        {content}
      </ReactMarkdown>
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };
  
  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 bg-primary text-primary-foreground flex items-center">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">Asistente Virtual</h3>
            <p className="text-xs opacity-80">Respuestas en tiempo real</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 chat-background">
          {showNamePhoneForm ? (
            <div className="flex items-center justify-center h-full">
              <div className="bg-card p-6 rounded-lg shadow-lg w-full max-w-md">
                <h3 className="text-xl font-semibold mb-4 text-center">Bienvenido al Chat</h3>
                <p className="text-muted-foreground mb-6 text-center">
                  Para comenzar, por favor ingresa tu nombre y teléfono.
                </p>
                
                <form onSubmit={handleNamePhoneSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-1">
                        Nombre
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 border rounded-md bg-background"
                        placeholder="Tu nombre"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium mb-1">
                        Teléfono
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full p-2 border rounded-md bg-background"
                        placeholder="Tu número de teléfono"
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full">
                      Comenzar Chat
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-muted-foreground">
                    {isLoadingResponse ? "Cargando..." : "Envía un mensaje para comenzar"}
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.origen === "user" || msg.origen === "lead" || msg.origen === "usuario";
                  const isChatbot = msg.origen === "chatbot" || msg.origen === "bot";
                  const isAgent = msg.origen === "agente" || msg.origen === "agent";
                  
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`
                          px-4 py-3 rounded-lg max-w-[80%]
                          ${isUser 
                            ? 'user-bubble' 
                            : isChatbot 
                              ? 'bot-bubble' 
                              : 'agent-bubble'
                          }
                        `}
                      >
                        {renderMessageContent(msg.contenido)}
                        <div className="text-xs opacity-70 text-right mt-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              
              {isLoadingResponse && (
                <div className="flex justify-start">
                  <div className="bot-bubble px-4 py-3 rounded-lg">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="h-2 w-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      <div className="h-2 w-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {!showNamePhoneForm && (
          <div className="p-4 border-t bg-card/50">
            <div className="flex items-end gap-2">
              <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe un mensaje..."
                  className="w-full p-3 pr-12 rounded-md resize-none min-h-[60px] max-h-[150px] bg-background"
                  disabled={isLoadingResponse}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 bottom-2 h-8 w-8 text-muted-foreground"
                  disabled={isLoadingResponse}
                >
                  <Smile className="h-5 w-5" />
                </Button>
              </div>
              <Button
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => sendMessage()}
                disabled={!message.trim() || isLoadingResponse}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
