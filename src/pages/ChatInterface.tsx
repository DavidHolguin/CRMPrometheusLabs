
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send, Bot, User } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface Message {
  id: string;
  contenido: string;
  origen: string;
  created_at: string;
  metadata?: any;
}

const ChatInterface = () => {
  const { chatbotId } = useParams();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [leadId, setLeadId] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatbotInfo, setChatbotInfo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Create or retrieve session ID from localStorage
    let storedSessionId = localStorage.getItem(`chatbot_session_${chatbotId}`);
    if (!storedSessionId) {
      storedSessionId = uuidv4();
      localStorage.setItem(`chatbot_session_${chatbotId}`, storedSessionId);
    }
    setSessionId(storedSessionId);
    
    // Get lead_id from localStorage if it exists
    const storedLeadId = localStorage.getItem(`chatbot_lead_${chatbotId}`);
    if (storedLeadId) {
      setLeadId(storedLeadId);
    }

    // Get conversation_id from localStorage if it exists
    const storedConversationId = localStorage.getItem(`chatbot_conversation_${chatbotId}`);
    if (storedConversationId) {
      setConversationId(storedConversationId);
      fetchMessages(storedConversationId);
    }

    fetchChatbotInfo();

    return () => {
      if (channelRef.current) {
        console.log(`Removing realtime subscription for conversation: ${conversationId}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [chatbotId]);

  useEffect(() => {
    if (conversationId) {
      // Set up real-time listener for new messages
      setupRealtimeSubscription(conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatbotInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("chatbots")
        .select("*")
        .eq("id", chatbotId)
        .single();

      if (error) throw error;
      
      setChatbotInfo(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching chatbot info:", error);
      setLoading(false);
    }
  };

  const fetchMessages = async (convoId: string) => {
    try {
      const { data, error } = await supabase
        .from("mensajes")
        .select("*")
        .eq("conversacion_id", convoId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      console.log("Fetched messages:", data);
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const setupRealtimeSubscription = (convoId: string) => {
    // Remove existing channel if there is one
    if (channelRef.current) {
      console.log("Removing existing channel subscription");
      supabase.removeChannel(channelRef.current);
    }
    
    // Create new channel with timestamp to make it unique
    const channelName = `public-chat-${convoId}-${Date.now()}`;
    console.log(`Setting up realtime subscription for conversation: ${convoId} with channel: ${channelName}`);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mensajes',
          filter: `conversacion_id=eq.${convoId}`
        },
        (payload) => {
          console.log("Realtime message event received:", payload);
          
          if (payload.eventType === 'INSERT') {
            console.log("New message received:", payload.new);
            
            // Check if message already exists
            setMessages(currentMessages => {
              const messageExists = currentMessages.some(msg => msg.id === payload.new.id);
              
              if (messageExists) {
                return currentMessages;
              }
              
              return [...currentMessages, payload.new as Message];
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status: ${status}`);
      });
    
    channelRef.current = channel;
  };

  const sendMessage = async () => {
    if (!message.trim() || !chatbotId) return;
    
    setSending(true);
    
    try {
      // Get empresa_id from the chatbot info
      const empresaId = chatbotInfo?.empresa_id;
      
      if (!empresaId) {
        throw new Error("No se pudo determinar la empresa del chatbot");
      }
      
      console.log("Sending message to API:", {
        empresa_id: empresaId,
        chatbot_id: chatbotId,
        mensaje: message,
        session_id: sessionId,
        lead_id: leadId || undefined,
      });
      
      // Optimistically add message to UI
      const optimisticId = uuidv4();
      const optimisticMsg = {
        id: optimisticId,
        contenido: message,
        origen: "usuario",
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, optimisticMsg]);
      
      // Reset textarea
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      
      // Send message to API
      const apiEndpoint = import.meta.env.VITE_API_BASE_URL || 'https://web-production-01457.up.railway.app';
      const response = await fetch(`${apiEndpoint}/api/v1/channels/web`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          empresa_id: empresaId,
          chatbot_id: chatbotId,
          mensaje: optimisticMsg.contenido,
          session_id: sessionId,
          lead_id: leadId || undefined,
          metadata: {
            browser: navigator.userAgent,
            page: window.location.pathname,
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error al enviar mensaje: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("API response:", data);
      
      // Remove optimistic message and add confirmed messages
      setMessages(prev => {
        // Filter out optimistic message
        const filtered = prev.filter(msg => msg.id !== optimisticId);
        
        // Check if the user message already exists (from realtime)
        const userMsgExists = filtered.some(msg => 
          msg.id === data.mensaje_id && msg.origen === "usuario");
        
        // Check if bot response already exists (from realtime)
        const botResponseExists = filtered.some(msg => 
          msg.contenido === data.respuesta && msg.origen === "chatbot");
        
        let newMessages = [...filtered];
        
        // Add user message if it doesn't exist
        if (!userMsgExists) {
          newMessages.push({
            id: data.mensaje_id,
            contenido: optimisticMsg.contenido,
            origen: "usuario",
            created_at: new Date().toISOString(),
          });
        }
        
        // Add bot response if it doesn't exist and we have one
        if (!botResponseExists && data.respuesta) {
          newMessages.push({
            id: uuidv4(), // Generate ID for bot message
            contenido: data.respuesta,
            origen: "chatbot",
            created_at: new Date().toISOString(),
            metadata: data.metadata
          });
        }
        
        return newMessages;
      });
      
      // Save conversation_id to localStorage if it's new
      if (data.conversacion_id && data.conversacion_id !== conversationId) {
        setConversationId(data.conversacion_id);
        localStorage.setItem(`chatbot_conversation_${chatbotId}`, data.conversacion_id);
        
        // Set up realtime subscription for new conversation
        setupRealtimeSubscription(data.conversacion_id);
      }
      
      // Save lead_id to localStorage if it's provided
      if (data.lead_id && data.lead_id !== leadId) {
        setLeadId(data.lead_id);
        localStorage.setItem(`chatbot_lead_${chatbotId}`, data.lead_id);
      }
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("No se pudo enviar el mensaje. Intente de nuevo.");
      
      // Remove the optimistic message if it failed
      setMessages(prev => prev.filter(msg => msg.contenido !== message || msg.origen !== "usuario"));
    } finally {
      setSending(false);
    }
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getSenderType = (origen: string, metadata: any): "user" | "bot" | "agent" => {
    if (origen === 'usuario' || origen === 'lead' || origen === 'user') return "user";
    if (origen === 'chatbot' || origen === 'bot') return "bot";
    if (origen === 'agente' || origen === 'agent') return "agent";
    
    // Fallback to user
    return origen === "agente" ? "agent" : (origen === "chatbot" ? "bot" : "user");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Cargando chatbot...</p>
      </div>
    );
  }

  if (!chatbotInfo) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Chatbot no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b p-4 bg-card shadow-sm">
        <div className="flex items-center">
          <Bot className="h-6 w-6 text-primary mr-2" />
          <h1 className="text-lg font-medium">{chatbotInfo.nombre}</h1>
        </div>
        {chatbotInfo.descripcion && (
          <p className="text-sm text-muted-foreground mt-1">{chatbotInfo.descripcion}</p>
        )}
      </header>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Inicia una conversación con el chatbot.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const senderType = getSenderType(msg.origen, msg.metadata);
              const isUser = senderType === "user";
              const isBot = senderType === "bot";
              const isAgent = senderType === "agent";
              
              // Skip system messages
              if (msg.metadata && msg.metadata.is_system_message === true) {
                return null;
              }
              
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`
                      max-w-[80%] px-4 py-3 rounded-lg
                      ${isUser 
                        ? 'bg-primary text-primary-foreground' 
                        : isBot 
                          ? 'bg-muted text-foreground' 
                          : 'bg-secondary text-secondary-foreground'
                      }
                    `}
                  >
                    <div className="text-xs mb-1 font-medium flex items-center">
                      {isUser ? (
                        <>
                          <User className="h-3 w-3 mr-1" />
                          <span>Tú</span>
                        </>
                      ) : isBot ? (
                        <>
                          <Bot className="h-3 w-3 mr-1" />
                          <span>{chatbotInfo.nombre}</span>
                        </>
                      ) : (
                        <>
                          <User className="h-3 w-3 mr-1" />
                          <span>{msg.metadata?.agent_name || 'Agente'}</span>
                        </>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap break-words">{msg.contenido}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <Card className="rounded-none border-t p-4">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            className="min-h-[60px] max-h-[120px] resize-none"
            disabled={sending}
          />
          <Button 
            onClick={sendMessage} 
            disabled={!message.trim() || sending}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ChatInterface;
