
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, Mic, MicOff, Smile, ChevronLeft, MoreVertical, Check, Star, Phone, Users, Info, Shield, ExternalLink } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { EmojiPicker } from "@/components/conversations/EmojiPicker";

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
  const [isRecording, setIsRecording] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [showUserForm, setShowUserForm] = useState(false);
  const [userFormSubmitted, setUserFormSubmitted] = useState(false);
  const [showRatingDrawer, setShowRatingDrawer] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userFeedback, setUserFeedback] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

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
    const storedName = localStorage.getItem(`chatbot_name_${chatbotId}`);
    const storedPhone = localStorage.getItem(`chatbot_phone_${chatbotId}`);
    
    if (storedLeadId) {
      setLeadId(storedLeadId);
      setUserFormSubmitted(true);
    }
    
    if (storedName) setUserName(storedName);
    if (storedPhone) setUserPhone(storedPhone);

    // Get conversation_id from localStorage if it exists
    const storedConversationId = localStorage.getItem(`chatbot_conversation_${chatbotId}`);
    if (storedConversationId) {
      setConversationId(storedConversationId);
      fetchMessages(storedConversationId);
    }

    fetchChatbotInfo();

    // Check if user info needs to be collected
    if (!storedLeadId && !storedName && !storedPhone) {
      setShowUserForm(true);
    }

    return () => {
      if (channelRef.current) {
        console.log(`Removing realtime subscription for conversation: ${conversationId}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      // Clean up audio recording if active
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
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
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
          filter: `conversacion_id=eq.${convoId} AND origen=eq.agente`
        },
        (payload) => {
          console.log("Realtime message event received:", payload);
          
          if (payload.eventType === 'INSERT') {
            console.log("New agent message received:", payload.new);
            
            const newMsg = payload.new as Message;
            if (newMsg.metadata && newMsg.metadata.is_system_message === true) {
              console.log("Skipping system message:", newMsg);
              return;
            }
            
            setMessages(currentMessages => {
              const messageExists = currentMessages.some(msg => msg.id === payload.new.id);
              
              if (messageExists) {
                return currentMessages;
              }
              
              return [...currentMessages, newMsg];
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status: ${status}`);
      });
    
    channelRef.current = channel;
  };

  const submitUserForm = async () => {
    if (!userName.trim() || !userPhone.trim()) {
      toast.error("Por favor, ingresa tu nombre y número de teléfono");
      return;
    }

    try {
      // Save user info in localStorage
      localStorage.setItem(`chatbot_name_${chatbotId}`, userName);
      localStorage.setItem(`chatbot_phone_${chatbotId}`, userPhone);
      
      setUserFormSubmitted(true);
      setShowUserForm(false);
      
      // Initialize chat with welcome message
      const welcomeMessage = `Hola ${userName}, bienvenido/a a nuestro chat. ¿En qué podemos ayudarte hoy?`;
      
      // Add chatbot welcome message to UI
      const welcomeMsgObj = {
        id: uuidv4(),
        contenido: welcomeMessage,
        origen: "chatbot",
        created_at: new Date().toISOString(),
      };
      
      setMessages([welcomeMsgObj]);
      
      // This will be processed by the backend to create a lead
      await sendMessage(`Nombre: ${userName}, Teléfono: ${userPhone}`);
      
    } catch (error) {
      console.error("Error al iniciar chat:", error);
      toast.error("Hubo un problema al iniciar el chat. Intente de nuevo.");
    }
  };

  const submitRating = async () => {
    if (userRating === 0) {
      toast.error("Por favor, seleccione una calificación");
      return;
    }

    try {
      // Here you would send the rating to your backend
      toast.success("¡Gracias por tu opinión!");
      setShowRatingDrawer(false);
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("No se pudo enviar la calificación. Intente de nuevo.");
    }
  };

  const sendMessage = async (customContent?: string) => {
    const messageContent = customContent || message.trim();
    
    if (!messageContent && !isRecording && audioChunksRef.current.length === 0) return;
    
    setSending(true);
    
    try {
      // Get empresa_id from the chatbot info
      const empresaId = chatbotInfo?.empresa_id;
      
      if (!empresaId) {
        throw new Error("No se pudo determinar la empresa del chatbot");
      }
      
      // Optimistically add message to UI
      const optimisticId = uuidv4();
      const optimisticMsg = {
        id: optimisticId,
        contenido: messageContent,
        origen: "usuario",
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, optimisticMsg]);
      
      // Reset textarea
      if (!customContent) {
        setMessage("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }
      
      console.log("Sending message to API:", {
        empresa_id: empresaId,
        chatbot_id: chatbotId,
        mensaje: messageContent,
        session_id: sessionId,
        lead_id: leadId || undefined,
      });
      
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
          mensaje: messageContent,
          session_id: sessionId,
          lead_id: leadId || undefined,
          metadata: {
            browser: navigator.userAgent,
            page: window.location.pathname,
            name: userName || undefined,
            phone: userPhone || undefined
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
            contenido: messageContent,
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
      setMessages(prev => prev.filter(msg => msg.contenido !== messageContent || msg.origen !== "usuario"));
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
      textareaRef.current.style.height = `${Math.min(120, textareaRef.current.scrollHeight)}px`;
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const toggleRecording = async () => {
    try {
      if (!isRecording) {
        // Start recording
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          // Recording stopped, create audio blob
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Convert to base64 and send, or save for later
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Audio = reader.result?.toString().split(',')[1];
            // We would send the base64Audio to an endpoint
            toast.info("Audio recording feature coming soon!");
            
            // Reset recording state
            setIsRecording(false);
            audioChunksRef.current = [];
          };
          
          // Release microphone
          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        setIsRecording(true);
        toast.info("Grabando... Toca de nuevo para detener.");
      } else {
        // Stop recording
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.stop();
        }
      }
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("No se pudo acceder al micrófono. Verifique los permisos.");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getSenderType = (origen: string, metadata: any): "user" | "bot" | "agent" => {
    if (origen === 'usuario' || origen === 'lead' || origen === 'user') return "user";
    if (origen === 'chatbot' || origen === 'bot') return "bot";
    if (origen === 'agente' || origen === 'agent') return "agent";
    
    // Fallback
    return origen === "agente" ? "agent" : (origen === "chatbot" ? "bot" : "user");
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getLastActiveTime = () => {
    if (messages.length === 0) return "Ahora";
    const lastMessage = messages[messages.length - 1];
    return formatTime(lastMessage.created_at);
  };

  const renderStars = () => {
    return Array.from({ length: 5 }).map((_, i) => (
      <button 
        key={i} 
        className={`p-2 ${i < userRating ? 'text-yellow-400' : 'text-gray-300'}`}
        onClick={() => setUserRating(i + 1)}
      >
        <Star className="h-8 w-8" fill={i < userRating ? "currentColor" : "none"} />
      </button>
    ));
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
    <div 
      className="flex flex-col h-screen bg-background"
      ref={containerRef}
    >
      {/* WhatsApp-like header */}
      <header className="p-3 bg-card shadow-sm flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-background">
              <AvatarImage src={chatbotInfo.avatar_url} />
              <AvatarFallback>
                <Bot className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            {/* Online indicator */}
            <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-background"></div>
          </div>
          <div>
            <h1 className="text-base font-medium">{chatbotInfo.nombre}</h1>
            <p className="text-xs text-muted-foreground">{getLastActiveTime()}</p>
          </div>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="end">
            <div className="space-y-1">
              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                size="sm"
                onClick={() => setShowProfile(true)}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Mi perfil</span>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                size="sm"
                onClick={() => setShowRatingDrawer(true)}
              >
                <Star className="mr-2 h-4 w-4" />
                <span>Calificar chatbot</span>
              </Button>
              <Separator className="my-2" />
              <Button 
                variant="ghost" 
                className="w-full justify-start text-xs" 
                size="sm"
                asChild
              >
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Políticas de privacidad</span>
                </a>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-xs" 
                size="sm"
                asChild
              >
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <Info className="mr-2 h-4 w-4" />
                  <span>Términos de uso</span>
                </a>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </header>

      {/* Chat messages with whatsapp-like background */}
      <ScrollArea 
        className="flex-1 p-4 bg-[#E5DDD5] dark:bg-gray-900 relative overflow-y-auto"
        style={{
          backgroundImage: 'url(https://static.whatsapp.net/rsrc.php/v4/yl/r/gi_DckOUM5a.png)',
          backgroundRepeat: 'repeat',
          backgroundSize: '210px'
        }}
      >
        <div className="space-y-2 max-w-3xl mx-auto pb-2">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground text-sm bg-white/80 p-3 rounded-lg backdrop-blur-sm inline-block">
                Inicia una conversación con el chatbot.
              </p>
            </div>
          ) : (
            messages.filter(msg => !(msg.metadata && msg.metadata.is_system_message === true)).map((msg) => {
              const senderType = getSenderType(msg.origen, msg.metadata);
              const isUser = senderType === "user";
              const isBot = senderType === "bot";
              const isAgent = senderType === "agent";
              
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`
                      max-w-[80%] px-3 py-2 rounded-lg relative shadow-sm
                      ${isUser 
                        ? 'bg-[#d9fdd3] text-gray-800 rounded-tr-none' 
                        : isBot 
                          ? 'bg-white text-gray-800 rounded-tl-none' 
                          : 'bg-[#e2f7fd] text-gray-800 rounded-tl-none'
                      }
                    `}
                  >
                    {!isUser && (
                      <div className="text-xs mb-1 font-medium flex items-center">
                        {isBot ? (
                          <>
                            <Bot className="h-3 w-3 mr-1 text-primary" />
                            <span className="text-primary font-semibold">{chatbotInfo.nombre}</span>
                          </>
                        ) : (
                          <>
                            <User className="h-3 w-3 mr-1 text-blue-500" />
                            <span className="text-blue-500 font-semibold">{msg.metadata?.agent_name || 'Agente'}</span>
                          </>
                        )}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap break-words text-sm font-normal">{msg.contenido}</p>
                    <span className="text-[10px] text-gray-500 float-right mt-1 ml-2 flex items-center gap-1">
                      {formatTime(msg.created_at)}
                      {isUser && <Check className="h-3 w-3" />}
                    </span>
                    
                    {/* Message tail */}
                    <div 
                      className={`absolute top-0 w-2 h-2 overflow-hidden
                        ${isUser 
                          ? 'right-[-8px] border-t-8 border-t-[#d9fdd3] border-l-8 border-l-transparent' 
                          : 'left-[-8px] border-t-8 border-t-white border-r-8 border-r-transparent'
                        }
                      `}
                      style={{
                        borderTopColor: isUser ? '#d9fdd3' : isBot ? 'white' : '#e2f7fd'
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* WhatsApp-like input */}
      <div className="p-2 border-t bg-card">
        <div className="flex items-end gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full shrink-0">
                <Smile className="h-5 w-5 text-gray-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            </PopoverContent>
          </Popover>
          
          <div className="flex-1 bg-background rounded-full border relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              className="min-h-[40px] max-h-[120px] resize-none border-none rounded-full py-2 pr-12 focus-visible:ring-0 focus-visible:ring-offset-0 overflow-hidden"
              disabled={sending || isRecording || showUserForm}
            />
            <Button 
              onClick={message.trim() ? sendMessage : toggleRecording}
              className="absolute right-1 bottom-1 h-8 w-8 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center"
              disabled={sending || showUserForm}
            >
              {message.trim() ? (
                <Send className="h-4 w-4 text-white" />
              ) : (
                <Mic className={`h-4 w-4 text-white ${isRecording ? 'animate-pulse' : ''}`} />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* User info collection modal for first interaction */}
      {showUserForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-lg max-w-md w-full p-6 space-y-4 relative">
            <div className="text-center mb-4">
              <Avatar className="h-16 w-16 mx-auto mb-2">
                <AvatarImage src={chatbotInfo.avatar_url} />
                <AvatarFallback>
                  <Bot className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">{chatbotInfo.nombre}</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Para iniciar la conversación, por favor comparte tus datos:
              </p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="userName" className="text-sm font-medium">
                  Nombre completo
                </label>
                <input
                  id="userName"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Ingresa tu nombre"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="userPhone" className="text-sm font-medium">
                  Número de teléfono
                </label>
                <input
                  id="userPhone"
                  type="tel"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Ingresa tu número de teléfono"
                />
              </div>
            </div>
            <Button 
              className="w-full mt-4" 
              onClick={submitUserForm}
              disabled={!userName.trim() || !userPhone.trim()}
            >
              Iniciar chat
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Al continuar, aceptas nuestras políticas de privacidad y términos de uso.
            </p>
          </div>
        </div>
      )}

      {/* Sidebar for user profile */}
      <Sheet open={showProfile} onOpenChange={setShowProfile}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader className="mb-4">
            <SheetTitle>Mi Perfil</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center py-6">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarFallback className="text-2xl">
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-semibold">{userName || "Usuario"}</h3>
            <div className="flex items-center text-muted-foreground mt-1">
              <Phone className="h-4 w-4 mr-2" />
              <span>{userPhone || "No disponible"}</span>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Datos de contacto</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nombre:</span>
                  <span>{userName || "No disponible"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Teléfono:</span>
                  <span>{userPhone || "No disponible"}</span>
                </div>
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">Acciones</h4>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setShowRatingDrawer(true)}
                >
                  <Star className="mr-2 h-4 w-4" />
                  <span>Calificar chatbot</span>
                </Button>
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">Legal</h4>
              <div className="space-y-2">
                <Button 
                  variant="link" 
                  size="sm" 
                  className="w-full justify-start p-0 h-auto"
                  asChild
                >
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Políticas de privacidad</span>
                    <ExternalLink className="ml-auto h-3 w-3" />
                  </a>
                </Button>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="w-full justify-start p-0 h-auto"
                  asChild
                >
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    <Info className="mr-2 h-4 w-4" />
                    <span>Términos de uso</span>
                    <ExternalLink className="ml-auto h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Rating drawer */}
      <Drawer open={showRatingDrawer} onOpenChange={setShowRatingDrawer}>
        <DrawerContent className="max-w-md mx-auto">
          <DrawerHeader>
            <DrawerTitle className="text-center">Calificar chatbot</DrawerTitle>
            <DrawerDescription className="text-center">
              ¿Cómo calificarías tu experiencia con {chatbotInfo.nombre}?
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex justify-center p-4">
            <div className="flex items-center">
              {renderStars()}
            </div>
          </div>
          <div className="p-4 pt-0">
            <Textarea
              placeholder="Comentarios (opcional)"
              value={userFeedback}
              onChange={(e) => setUserFeedback(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <DrawerFooter>
            <Button onClick={submitRating} disabled={userRating === 0}>
              Enviar calificación
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default ChatInterface;
