
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useChatbot } from "@/hooks/useChatbots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Smile, Send, ArrowLeft, MessagesSquare, Bot, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMessages } from "@/hooks/useMessages";
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot" | "agent";
  timestamp: Date;
}

const userFormSchema = z.object({
  nombre: z.string().min(2, "Por favor ingresa tu nombre"),
  telefono: z.string().min(5, "Por favor ingresa un número de teléfono válido"),
});

type UserFormValues = z.infer<typeof userFormSchema>;

const ChatInterface = () => {
  const { chatbotId } = useParams<{ chatbotId: string }>();
  const { data: chatbot, isLoading, isError } = useChatbot(chatbotId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userMessage, setUserMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      nombre: "",
      telefono: "",
    },
  });

  useEffect(() => {
    // Generar un sessionId único si no existe
    const storedSessionId = localStorage.getItem(`session_${chatbotId}`);
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = uuidv4();
      setSessionId(newSessionId);
      localStorage.setItem(`session_${chatbotId}`, newSessionId);
    }

    const checkUserSession = async () => {
      const storedLeadId = localStorage.getItem(`lead_${chatbotId}`);
      const storedConversationId = localStorage.getItem(`conversation_${chatbotId}`);
      
      if (storedLeadId && storedConversationId) {
        setLeadId(storedLeadId);
        setConversationId(storedConversationId);
        
        // Verify if conversation still exists
        const { data: convoExists, error: convoError } = await supabase
          .from("conversaciones")
          .select("id")
          .eq("id", storedConversationId)
          .single();
        
        if (convoError || !convoExists) {
          console.log("Stored conversation no longer exists. Resetting session...");
          localStorage.removeItem(`lead_${chatbotId}`);
          localStorage.removeItem(`conversation_${chatbotId}`);
          setShowUserForm(true);
          return;
        }
        
        // Load message history
        await loadMessageHistory(storedConversationId);
      } else if (chatbot) {
        setShowUserForm(true);
      }
    };

    if (chatbot) {
      checkUserSession();
    }
  }, [chatbot, chatbotId]);

  // Load message history from Supabase
  const loadMessageHistory = async (convId: string) => {
    setIsLoadingHistory(true);
    try {
      const { data: messageHistory, error } = await supabase
        .from("mensajes")
        .select("*")
        .eq("conversacion_id", convId)
        .order("created_at", { ascending: true });
      
      if (error) {
        console.error("Error loading message history:", error);
        throw error;
      }
      
      if (messageHistory && messageHistory.length > 0) {
        console.log("Message history loaded:", messageHistory);
        
        const formattedMessages: Message[] = messageHistory.map(msg => ({
          id: msg.id,
          content: msg.contenido,
          sender: getSenderType(msg.origen, msg.metadata),
          timestamp: new Date(msg.created_at)
        }));
        
        setMessages(formattedMessages);
      } else {
        // If no messages, add welcome message
        setMessages([
          {
            id: "welcome",
            content: chatbot 
              ? `¡Hola! Soy ${chatbot.nombre}. ¿En qué puedo ayudarte hoy?`
              : "¡Hola! ¿En qué puedo ayudarte hoy?",
            sender: "bot",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching message history:", error);
      toast.error("No se pudieron cargar los mensajes anteriores.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Helper function to determine the sender type
  const getSenderType = (origen: string, metadata: any): "user" | "bot" | "agent" => {
    console.log("Determining sender type for:", origen, metadata);
    if (origen === "usuario") return "user";
    if (origen === "agente" || (metadata && (metadata.origin === "agent" || metadata.agent_id))) return "agent";
    return "bot";
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set up real-time messaging
  useEffect(() => {
    if (!conversationId) return;
    
    console.log("Setting up realtime subscription for conversation:", conversationId);
    
    // Subscribe to new messages in this conversation
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
          filter: `conversacion_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new;
          
          // We should display all messages that arrive in this conversation
          const messageExists = messages.some(msg => msg.id === newMessage.id);
            
          if (!messageExists) {
            console.log("New real-time message received:", newMessage);
            
            const message: Message = {
              id: newMessage.id,
              content: newMessage.contenido,
              sender: getSenderType(newMessage.origen, newMessage.metadata),
              timestamp: new Date(newMessage.created_at)
            };
            
            console.log("Adding message to UI:", message);
            setMessages(prev => [...prev, message]);
          }
        }
      )
      .subscribe((status) => {
        console.log("Supabase realtime subscription status:", status);
      });
      
    return () => {
      console.log("Removing realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [conversationId, leadId, messages]);

  const handleSendMessage = async () => {
    if (!userMessage.trim() || !leadId || !conversationId || !chatbot) return;
    
    const userMsg = {
      id: Date.now().toString(),
      content: userMessage,
      sender: "user" as const,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setUserMessage("");
    setIsSubmitting(true);
    
    try {
      // Guardar mensaje en Supabase
      const { data: msgData, error: msgError } = await supabase
        .from("mensajes")
        .insert({
          contenido: userMessage,
          conversacion_id: conversationId,
          origen: "usuario",
          remitente_id: leadId,
        })
        .select();
      
      if (msgError) {
        console.error("Error inserting message:", msgError);
        throw msgError;
      }
      
      console.log("Message saved to Supabase:", msgData);
      
      // Enviar mensaje al endpoint
      const response = await fetch('https://web-production-01457.up.railway.app/api/v1/channels/web', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          empresa_id: chatbot.empresa_id,
          chatbot_id: chatbot.id,
          mensaje: userMessage,
          session_id: sessionId,
          lead_id: leadId,
          metadata: {
            source: 'web_chat',
            browser: navigator.userAgent
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al enviar mensaje al API');
      }
      
      // The bot response should be handled by the real-time subscription now
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Error al enviar el mensaje. Por favor intente de nuevo.");
      
      // Mensaje de error como respuesta del bot
      const errorMsg = {
        id: Date.now().toString(),
        content: "Lo siento, hubo un problema al procesar tu mensaje. Por favor intenta de nuevo más tarde.",
        sender: "bot" as const,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserFormSubmit = async (values: UserFormValues) => {
    if (!chatbot) return;
    
    try {
      // First check if a lead with this phone number already exists for this company
      const { data: existingLeads, error: checkError } = await supabase
        .from("leads")
        .select("id")
        .eq("empresa_id", chatbot.empresa_id)
        .eq("telefono", values.telefono);
      
      if (checkError) throw checkError;
      
      let lead;
      
      if (existingLeads && existingLeads.length > 0) {
        // Use existing lead
        console.log("Using existing lead with id:", existingLeads[0].id);
        lead = existingLeads[0];
      } else {
        // Create new lead
        console.log("Creating new lead");
        const { data: newLead, error: leadError } = await supabase
          .from("leads")
          .insert({
            nombre: values.nombre,
            telefono: values.telefono,
            canal_origen: "chatbot_directo",
            empresa_id: chatbot.empresa_id,
          })
          .select()
          .single();
        
        if (leadError) throw leadError;
        lead = newLead;
      }
      
      // Check if an active conversation already exists for this lead with this chatbot
      const { data: existingConvs, error: convCheckError } = await supabase
        .from("conversaciones")
        .select("id")
        .eq("lead_id", lead.id)
        .eq("chatbot_id", chatbot.id)
        .eq("estado", "activa");
        
      if (convCheckError) throw convCheckError;
      
      let conversation;
      
      if (existingConvs && existingConvs.length > 0) {
        // Use existing conversation
        console.log("Using existing conversation with id:", existingConvs[0].id);
        conversation = existingConvs[0];
      } else {
        // Create new conversation
        console.log("Creating new conversation");
        const { data: newConv, error: convError } = await supabase
          .from("conversaciones")
          .insert({
            lead_id: lead.id,
            chatbot_id: chatbot.id,
            estado: "activa",
            canal_id: null, // This is a direct web chat
            metadata: {
              source: 'web_chat',
              user_agent: navigator.userAgent
            }
          })
          .select()
          .single();
        
        if (convError) throw convError;
        conversation = newConv;
      }
      
      localStorage.setItem(`lead_${chatbotId}`, lead.id);
      localStorage.setItem(`conversation_${chatbotId}`, conversation.id);
      
      setLeadId(lead.id);
      setConversationId(conversation.id);
      setShowUserForm(false);
      
      // Load messages if using existing conversation
      if (existingConvs && existingConvs.length > 0) {
        await loadMessageHistory(conversation.id);
      } else {
        // Set welcome message for new conversation
        setMessages([
          {
            id: "welcome-after-register",
            content: `¡Gracias ${values.nombre}! ¿En qué puedo ayudarte hoy?`,
            sender: "bot",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error registering user:", error);
      toast.error("Error al registrar tus datos. Por favor intente de nuevo.");
    }
  };

  if (isLoading || isLoadingHistory) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Cargando chatbot...</div>
      </div>
    );
  }

  if (isError || !chatbot) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background p-4">
        <h2 className="text-2xl font-bold mb-4">Chatbot no encontrado</h2>
        <p className="text-muted-foreground mb-6">
          No se pudo encontrar el chatbot solicitado. Puede que haya sido eliminado o que no tenga acceso a él.
        </p>
        <Button onClick={() => navigate(-1)}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="bg-card border-b px-4 py-3 flex items-center gap-3 z-10 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </Button>
        
        <div className="flex items-center gap-3">
          {chatbot.avatar_url ? (
            <img 
              src={chatbot.avatar_url} 
              alt={chatbot.nombre} 
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessagesSquare size={20} className="text-primary" />
            </div>
          )}
          
          <div>
            <h1 className="font-semibold text-lg">{chatbot.nombre}</h1>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">En línea</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.sender === "user"
                  ? "bg-primary text-primary-foreground rounded-br-none"
                  : message.sender === "agent"
                  ? "bg-secondary text-secondary-foreground rounded-bl-none"
                  : "bg-muted rounded-bl-none"
              }`}
            >
              <div className="text-xs mb-1 font-medium flex items-center">
                {message.sender === "user" ? (
                  <span>Tú</span>
                ) : message.sender === "agent" ? (
                  <>
                    <User className="h-3 w-3 mr-1" />
                    <span>Agente</span>
                  </>
                ) : (
                  <>
                    <Bot className="h-3 w-3 mr-1" />
                    <span>{chatbot.nombre}</span>
                  </>
                )}
              </div>
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
              <div
                className={`text-xs mt-1 ${
                  message.sender === "user"
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground"
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-card">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" type="button">
            <Smile size={20} />
          </Button>
          <Input
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={!leadId || !conversationId || isSubmitting}
          />
          <Button
            type="button"
            size="icon"
            onClick={handleSendMessage}
            disabled={!userMessage.trim() || !leadId || !conversationId || isSubmitting}
          >
            <Send size={18} />
          </Button>
        </div>
      </div>

      <Dialog open={showUserForm} onOpenChange={setShowUserForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Bienvenido al chat</DialogTitle>
            <DialogDescription>
              Antes de comenzar, por favor ingresa tus datos para poder asistirte mejor.
            </DialogDescription>
          </DialogHeader>

          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(handleUserFormSubmit)} className="space-y-4">
              <FormField
                control={userForm.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingresa tu nombre" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={userForm.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingresa tu número de teléfono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit">Comenzar chat</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatInterface;
