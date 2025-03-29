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
import { Smile, Send, ArrowLeft, MessagesSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
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
    const checkUserSession = async () => {
      const storedLeadId = localStorage.getItem(`lead_${chatbotId}`);
      const storedConversationId = localStorage.getItem(`conversation_${chatbotId}`);
      
      if (storedLeadId && storedConversationId) {
        setLeadId(storedLeadId);
        setConversationId(storedConversationId);
      } else if (chatbot) {
        setShowUserForm(true);
      }
    };

    if (chatbot) {
      checkUserSession();
      
      if (messages.length === 0) {
        setMessages([
          {
            id: "welcome",
            content: `¡Hola! Soy ${chatbot.nombre}. ¿En qué puedo ayudarte hoy?`,
            sender: "bot",
            timestamp: new Date(),
          },
        ]);
      }
    }
  }, [chatbot, chatbotId, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      const { error: msgError } = await supabase
        .from("mensajes")
        .insert({
          contenido: userMessage,
          conversacion_id: conversationId,
          origen: "usuario",
          remitente_id: leadId,
        });
      
      if (msgError) throw msgError;
      
      setTimeout(() => {
        const botResponses = [
          "Gracias por tu mensaje. ¿En qué más puedo ayudarte?",
          "Entiendo, ¿hay algo más que necesites saber?",
          "Estoy procesando tu consulta. ¿Hay algún otro detalle que quieras compartir?",
          `Estoy aquí para ayudarte con cualquier duda sobre ${chatbot.nombre}.`
        ];
        
        const botResponse = botResponses[Math.floor(Math.random() * botResponses.length)];
        
        const botMsg = {
          id: Date.now().toString(),
          content: botResponse,
          sender: "bot" as const,
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, botMsg]);
        
        supabase
          .from("mensajes")
          .insert({
            contenido: botResponse,
            conversacion_id: conversationId,
            origen: "chatbot",
            remitente_id: chatbotId,
          })
          .then(({ error }) => {
            if (error) console.error("Error saving bot message:", error);
          });
      }, 1000);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Error al enviar el mensaje. Por favor intente de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserFormSubmit = async (values: UserFormValues) => {
    if (!chatbot) return;
    
    try {
      const { data: lead, error: leadError } = await supabase
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
      
      const { data: conversation, error: convError } = await supabase
        .from("conversaciones")
        .insert({
          lead_id: lead.id,
          chatbot_id: chatbot.id,
          estado: "activa",
        })
        .select()
        .single();
      
      if (convError) throw convError;
      
      localStorage.setItem(`lead_${chatbotId}`, lead.id);
      localStorage.setItem(`conversation_${chatbotId}`, conversation.id);
      
      setLeadId(lead.id);
      setConversationId(conversation.id);
      setShowUserForm(false);
      
      setMessages((prev) => [
        ...prev,
        {
          id: "welcome-after-register",
          content: `¡Gracias ${values.nombre}! ¿En qué puedo ayudarte hoy?`,
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Error registering user:", error);
      toast.error("Error al registrar tus datos. Por favor intente de nuevo.");
    }
  };

  if (isLoading) {
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
                  : "bg-muted rounded-bl-none"
              }`}
            >
              <p>{message.content}</p>
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
