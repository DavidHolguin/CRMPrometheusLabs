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
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { EmojiPicker } from "@/components/conversations/EmojiPicker";
import { useChatMessages, ChatMessage } from "@/hooks/useChatMessages";

const ChatInterface = () => {
  const { chatbotId } = useParams();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [leadId, setLeadId] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Use our custom hook for messages and real-time updates
  const { messages, addMessage } = useChatMessages(conversationId);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Generate or retrieve session ID
    let storedSessionId = localStorage.getItem(`chatbot_session_${chatbotId}`);
    if (!storedSessionId) {
      storedSessionId = uuidv4();
      localStorage.setItem(`chatbot_session_${chatbotId}`, storedSessionId);
    }
    setSessionId(storedSessionId);
    
    // Retrieve lead information
    const storedLeadId = localStorage.getItem(`chatbot_lead_${chatbotId}`);
    const storedName = localStorage.getItem(`chatbot_name_${chatbotId}`);
    const storedPhone = localStorage.getItem(`chatbot_phone_${chatbotId}`);
    
    if (storedLeadId) {
      setLeadId(storedLeadId);
      setUserFormSubmitted(true);
    }
    if (storedName) setUserName(storedName);
    if (storedPhone) setUserPhone(storedPhone);
    
    // Retrieve or create conversation
    const storedConversationId = localStorage.getItem(`chatbot_conversation_${chatbotId}`);
    if (storedConversationId) {
      setConversationId(storedConversationId);
    }
    
    // Get chatbot info
    fetchChatbotInfo();
    
    // Show user form if needed
    if (!storedLeadId && !storedName && !storedPhone) {
      setShowUserForm(true);
    }
    
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [chatbotId]);

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

  const submitUserForm = async () => {
    if (!userName.trim() || !userPhone.trim()) {
      toast.error("Por favor, ingresa tu nombre y número de teléfono");
      return;
    }
    
    try {
      // Store user information locally
      localStorage.setItem(`chatbot_name_${chatbotId}`, userName);
      localStorage.setItem(`chatbot_phone_${chatbotId}`, userPhone);
      
      setUserFormSubmitted(true);
      setShowUserForm(false);
      
      // Add welcome message
      const welcomeMessage = {
        id: uuidv4(),
        contenido: `Hola ${userName}, bienvenido/a a nuestro chat. ¿En qué podemos ayudarte hoy?`,
        origen: "chatbot",
        created_at: new Date().toISOString()
      };
      
      addMessage(welcomeMessage);
      
      // Initialize conversation with the API
      await startConversation();
    } catch (error) {
      console.error("Error al iniciar chat:", error);
      toast.error("Hubo un problema al iniciar el chat. Intente de nuevo.");
    }
  };

  const startConversation = async () => {
    try {
      const empresaId = chatbotInfo?.empresa_id;
      if (!empresaId) {
        throw new Error("No se pudo determinar la empresa del chatbot");
      }
      
      console.log("Starting conversation with API:", {
        empresa_id: empresaId,
        chatbot_id: chatbotId,
        session_id: sessionId,
        metadata: {
          browser: navigator.userAgent,
          page: window.location.pathname,
          name: userName || undefined,
          phone: userPhone || undefined
        }
      });
      
      const apiEndpoint = import.meta.env.VITE_API_BASE_URL || 'https://web-production-01457.up.railway.app';
      const response = await fetch(`${apiEndpoint}/api/v1/channels/web/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          empresa_id: empresaId,
          chatbot_id: chatbotId,
          session_id: sessionId,
          metadata: {
            browser: navigator.userAgent,
            page: window.location.pathname,
            name: userName || undefined,
            phone: userPhone || undefined
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error al iniciar conversación: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("API init response:", data);
      
      // Store conversation and lead IDs
      if (data.conversacion_id) {
        setConversationId(data.conversacion_id);
        localStorage.setItem(`chatbot_conversation_${chatbotId}`, data.conversacion_id);
      }
      
      if (data.lead_id) {
        setLeadId(data.lead_id);
        localStorage.setItem(`chatbot_lead_${chatbotId}`, data.lead_id);
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("No se pudo iniciar la conversación. Intente de nuevo.");
    }
  };

  const submitRating = async () => {
    if (userRating === 0) {
      toast.error("Por favor, seleccione una calificación");
      return;
    }
    
    try {
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
      const empresaId = chatbotInfo?.empresa_id;
      if (!empresaId) {
        throw new Error("No se pudo determinar la empresa del chatbot");
      }
      
      // Create optimistic message
      const optimisticId = uuidv4();
      const optimisticMsg: ChatMessage = {
        id: optimisticId,
        contenido: messageContent,
        origen: "usuario",
        created_at: new Date().toISOString()
      };
      
      // Add optimistic message to UI
      addMessage(optimisticMsg);
      
      // Clear input
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
        metadata: {
          browser: navigator.userAgent,
          page: window.location.pathname,
          name: userName || undefined,
          phone: userPhone || undefined
        }
      });
      
      // Send message to API
      const apiEndpoint = import.meta.env.VITE_API_BASE_URL || 'https://web-production-01457.up.railway.app';
      const response = await fetch(`${apiEndpoint}/api/v1/channels/web`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
      
      // Replace optimistic message with actual message
      addMessage({
        id: data.mensaje_id,
        contenido: messageContent,
        origen: "usuario",
        created_at: new Date().toISOString()
      });
      
      // Add chatbot response if available
      if (data.respuesta) {
        addMessage({
          id: uuidv4(), // Since response doesn't include ID for the bot message
          contenido: data.respuesta,
          origen: "chatbot",
          created_at: new Date().toISOString(),
          metadata: data.metadata
        });
      }
      
      // Update conversation ID if needed
      if (data.conversacion_id && data.conversacion_id !== conversationId) {
        setConversationId(data.conversacion_id);
        localStorage.setItem(`chatbot_conversation_${chatbotId}`, data.conversacion_id);
      }
      
      // Update lead ID if needed
      if (data.lead_id && data.lead_id !== leadId) {
        setLeadId(data.lead_id);
        localStorage.setItem(`chatbot_lead_${chatbotId}`, data.lead_id);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("No se pudo enviar el mensaje. Intente de nuevo.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    setShowEmojiPicker(false);
  };

  const toggleRecording = async () => {
    try {
      if (!isRecording) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true
        });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = event => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: 'audio/webm'
          });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Audio = reader.result?.toString().split(',')[1];
            toast.info("Audio recording feature coming soon!");
            setIsRecording(false);
            audioChunksRef.current = [];
          };
          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop());
        };
        mediaRecorder.start();
        setIsRecording(true);
        toast.info("Grabando... Toca de nuevo para detener.");
      } else {
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
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  };

  const getSenderType = (origen: string, metadata: any): "user" | "bot" | "agent" => {
    if (origen === 'usuario' || origen === 'lead' || origen === 'user') return "user";
    if (origen === 'chatbot' || origen === 'bot') return "bot";
    if (origen === 'agente' || origen === 'agent') return "agent";
    return origen === "agente" ? "agent" : origen === "chatbot" ? "bot" : "user";
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLastActiveTime = () => {
    if (messages.length === 0) return "Ahora";
    const lastMessage = messages[messages.length - 1];
    return formatTime(lastMessage.created_at);
  };

  const renderStars = () => {
    return Array.from({
      length: 5
    }).map((_, i) => <button key={i} className={`p-2 ${i < userRating ? 'text-yellow-400' : 'text-gray-300'}`} onClick={() => setUserRating(i + 1)}>
      <Star className="h-8 w-8" fill={i < userRating ? "currentColor" : "none"} />
    </button>);
  };

  const handleSendButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage();
    } else {
      toggleRecording();
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
        <p>Cargando chatbot...</p>
      </div>;
  }

  if (!chatbotInfo) {
    return <div className="flex items-center justify-center h-screen">
        <p>Chatbot no encontrado.</p>
      </div>;
  }

  return <div className="flex flex-col h-screen bg-[#0e1621]" ref={containerRef}>
      <header className="p-3 bg-[#1f2c34] shadow-sm flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="avatar-border">
            <Avatar className="h-10 w-10 border-2 border-transparent text-green-500">
              <AvatarImage src={chatbotInfo.avatar_url} />
              <AvatarFallback>
                <Bot className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <h1 className="text-base font-medium text-white">{chatbotInfo.nombre}</h1>
            <p className="text-xs text-gray-400">en línea</p>
          </div>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 bg-[#1f2c34] border-0 text-white" align="end">
            <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start text-gray-200 hover:bg-[#2a3942]" size="sm" onClick={() => setShowProfile(true)}>
                <User className="mr-2 h-4 w-4" />
                <span>Mi perfil</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-200 hover:bg-[#2a3942]" size="sm" onClick={() => setShowRatingDrawer(true)}>
                <Star className="mr-2 h-4 w-4" />
                <span>Calificar chatbot</span>
              </Button>
              <Separator className="my-2 bg-gray-700" />
              <Button variant="ghost" className="w-full justify-start text-xs text-gray-400 hover:bg-[#2a3942]" size="sm" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Políticas de privacidad</span>
                </a>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-xs text-gray-400 hover:bg-[#2a3942]" size="sm" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <Info className="mr-2 h-4 w-4" />
                  <span>Términos de uso</span>
                </a>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </header>

      <ScrollArea className="flex-1 chat-background">
        <div className="space-y-2 max-w-3xl mx-auto pb-2 p-4 chat-message-container">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto text-gray-500 mb-4 opacity-50" />
              <p className="text-gray-400 text-sm bg-[#1f2c34]/50 p-3 rounded-lg backdrop-blur-sm inline-block">
                Inicia una conversación con el chatbot.
              </p>
            </div>
          ) : (
            messages
              .filter(msg => !(msg.metadata && msg.metadata.is_system_message === true))
              .map(msg => {
                const senderType = getSenderType(msg.origen, msg.metadata);
                const isUser = senderType === "user";
                const isBot = senderType === "bot";
                const isAgent = senderType === "agent";
                
                return (
                  <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
                    <div className={`
                      relative px-3 py-2 shadow-sm
                      ${isUser ? 'user-bubble' : isBot ? 'bot-bubble' : 'agent-bubble'}
                    `}>
                      <p className="whitespace-pre-wrap break-words text-sm font-normal">{msg.contenido}</p>
                      <span className="chat-timestamp">
                        {formatTime(msg.created_at)}
                        {isUser && <Check className="ml-1 h-3 w-3" />}
                      </span>
                    </div>
                  </div>
                );
              })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-2 bg-[#0e1621] border-t border-[#1f2c34]">
        <div className="whatsapp-input-container" ref={inputContainerRef}>
          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="whatsapp-button">
            <Smile className="h-6 w-6" />
          </button>
          
          <input 
            ref={inputRef} 
            type="text" 
            value={message} 
            onChange={handleInputChange} 
            onKeyDown={handleKeyDown} 
            placeholder="Mensaje" 
            className="whatsapp-input" 
            disabled={sending || isRecording || showUserForm} 
          />
          
          <button 
            onClick={handleSendButtonClick} 
            className={`whatsapp-button ${message.trim() ? 'whatsapp-send-button' : ''}`} 
            disabled={sending || showUserForm}
          >
            {message.trim() ? <Send className="h-5 w-5" /> : <Mic className={`h-6 w-6 ${isRecording ? 'animate-pulse' : ''}`} />}
          </button>
        </div>
      </div>
      
      {showEmojiPicker && (
        <div className="absolute bottom-14 left-2 z-50">
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
        </div>
      )}

      {showUserForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-lg max-w-md w-full p-6 space-y-4 relative">
            <div className="text-center mb-4">
              <Avatar className="h-16 w-16 mx-auto mb-2 avatar-border">
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
                <input id="userName" type="text" value={userName} onChange={e => setUserName(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Ingresa tu nombre" />
              </div>
              <div className="space-y-1">
                <label htmlFor="userPhone" className="text-sm font-medium">
                  Número de teléfono
                </label>
                <input id="userPhone" type="tel" value={userPhone} onChange={e => setUserPhone(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Ingresa tu número de teléfono" />
              </div>
            </div>
            <Button className="w-full mt-4" onClick={submitUserForm} disabled={!userName.trim() || !userPhone.trim()}>
              Iniciar chat
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Al continuar, aceptas nuestras políticas de privacidad y términos de uso.
            </p>
          </div>
        </div>
      )}

      <Sheet open={showProfile} onOpenChange={setShowProfile}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader className="mb-4">
            <SheetTitle>Mi Perfil</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center py-6">
            <Avatar className="h-24 w-24 mb-4 avatar-border">
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
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setShowRatingDrawer(true)}>
                  <Star className="mr-2 h-4 w-4" />
                  <span>Calificar chatbot</span>
                </Button>
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">Legal</h4>
              <div className="space-y-2">
                <Button variant="link" size="sm" className="w-full justify-start p-0 h-auto" asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Políticas de privacidad</span>
                    <ExternalLink className="ml-auto h-3 w-3" />
                  </a>
                </Button>
                <Button variant="link" size="sm" className="w-full justify-start p-0 h-auto" asChild>
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
            <Textarea placeholder="Comentarios (opcional)" value={userFeedback} onChange={e => setUserFeedback(e.target.value)} className="min-h-[80px]" />
          </div>
          <DrawerFooter>
            <Button onClick={submitRating} disabled={userRating === 0}>
              Enviar calificación
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>;
};

export default ChatInterface;
