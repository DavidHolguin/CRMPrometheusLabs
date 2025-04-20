import { useEffect, useState, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Bot, RefreshCw, User } from "lucide-react";
import { useCreateTestLead } from "@/hooks/useChatbotConfig";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatPreviewProps {
  chatbotId: string;
  empresaId: string;
  chatbotName?: string;
  avatarUrl?: string;
}

export function ChatPreview({ chatbotId, empresaId, chatbotName = "Chatbot", avatarUrl }: ChatPreviewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const { createTestLead, isCreating, testLead } = useCreateTestLead();
  const [leadId, setLeadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // ID de canal para Web Chat (UUID válido existente en la base de datos)
  const CANAL_ID = "13956803-a8ca-4087-8050-e3c98eafa4bd";
  
  // Generar un session_id único cuando se monta el componente
  useEffect(() => {
    setSessionId(`test_session_${Date.now()}_${Math.random().toString(36).substring(2)}`);
  }, []);
  
  // Crear un lead de prueba si no hay uno
  useEffect(() => {
    // Crear una clave única para este chatbot en localStorage
    const storageKey = `chatbot_preview_lead_${chatbotId}`;
    
    // Intentar recuperar el lead_id de localStorage primero
    const savedLeadId = localStorage.getItem(storageKey);
    
    if (savedLeadId) {
      // Si ya tenemos un lead guardado para este chatbot, lo utilizamos
      setLeadId(savedLeadId);
      console.log("Lead recuperado del almacenamiento local:", savedLeadId);
    } else if (!leadId && !testLead && !isCreating) {
      // Si no hay un lead guardado ni uno activo, creamos uno nuevo
      createTestLead(undefined, {
        onSuccess: (data) => {
          // Guardar el nuevo lead_id en localStorage para este chatbot
          localStorage.setItem(storageKey, data.id);
          setLeadId(data.id);
          toast.success("Lead de prueba creado para chatear");
        },
        onError: () => {
          toast.error("Error al crear lead de prueba");
        }
      });
    } else if (testLead) {
      // Si ya hay un lead de prueba recién creado, lo guardamos en localStorage
      setLeadId(testLead.id);
      localStorage.setItem(storageKey, testLead.id);
    }
  }, [testLead, isCreating, leadId, chatbotId, createTestLead]);
  
  // Hacer scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Función para enviar mensaje
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !leadId) return;
    
    // Agregar mensaje del usuario a la interfaz
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    
    try {
      const response = await fetch('https://web-production-01457.up.railway.app/api/v1/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          empresa_id: empresaId,
          chatbot_id: chatbotId,
          lead_id: leadId,
          mensaje: inputMessage,
          session_id: sessionId,
          canal_id: CANAL_ID, // Canal ID en formato UUID válido
          canal_identificador: "config_preview", // Identificador del canal
          metadata: {
            browser: navigator.userAgent,
            page: 'config-test',
            preview: true
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error del servidor:", errorData);
        throw new Error('Error en la petición al chatbot');
      }
      
      const data = await response.json();
      
      // Agregar respuesta del chatbot a la interfaz
      const botMessage: Message = {
        id: data.mensaje_id || `bot_${Date.now()}`,
        content: data.respuesta,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      toast.error("Error al enviar mensaje al chatbot");
      
      // Agregar mensaje de error como respuesta del bot
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        content: "Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo.",
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Focus en el input después de enviar
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };
  
  // Reiniciar conversación
  const handleResetChat = () => {
    setMessages([]);
    setSessionId(`test_session_${Date.now()}_${Math.random().toString(36).substring(2)}`);
    toast.success("Conversación reiniciada");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="flex flex-col h-full border rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-primary/10 p-3 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} />
            ) : (
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot size={16} />
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <h3 className="text-sm font-medium">{chatbotName}</h3>
            <p className="text-xs text-muted-foreground">Vista previa</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleResetChat}
          title="Reiniciar conversación"
        >
          <RefreshCw size={14} />
        </Button>
      </div>
      
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Bot size={40} className="text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-medium">Prueba tu chatbot</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Envía un mensaje para interactuar con tu chatbot y probar su configuración actual.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : ''}`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} />
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot size={16} />
                      </AvatarFallback>
                    )}
                  </Avatar>
                )}
                <div
                  className={`rounded-lg p-3 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  <div className="text-xs mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary/30 text-primary">
                      <User size={16} />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      
      {/* Input */}
      <div className="p-3 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            placeholder="Escribe tu mensaje..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading || !leadId}
            className="flex-1"
            autoFocus
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!inputMessage.trim() || isLoading || !leadId}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </Button>
        </form>
      </div>
    </div>
  );
}