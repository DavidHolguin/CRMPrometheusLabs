
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { ChatbotForm, ChatbotFormValues } from "./ChatbotForm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Clipboard, Check } from "lucide-react";

interface CreateChatbotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateChatbotModal({ open, onOpenChange, onSuccess }: CreateChatbotModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdChatbotId, setCreatedChatbotId] = useState<string | null>(null);
  const [embedCode, setEmbedCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();

  const generateEmbedCode = (chatbotId: string) => {
    // Obtiene el dominio actual para el script
    const domain = window.location.origin;
    return `<!-- Chatbot Widget -->
<div id="prometheus-chatbot-widget" data-chatbot-id="${chatbotId}"></div>
<script src="${domain}/widget.js"></script>
<style>
  #prometheus-chatbot-widget {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
  }
</style>
<!-- End Chatbot Widget -->`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetModal = () => {
    setCreatedChatbotId(null);
    setEmbedCode("");
    setCopied(false);
  };

  const handleClose = () => {
    if (createdChatbotId) {
      resetModal();
    }
    onOpenChange(false);
  };

  async function handleSubmit(values: ChatbotFormValues) {
    if (!user?.companyId) {
      toast.error("No se puede crear el chatbot. No hay empresa asociada a tu cuenta.");
      return;
    }

    setIsSubmitting(true);
    try {
      // First create the chatbot
      const { data: chatbot, error: chatbotError } = await supabase
        .from("chatbots")
        .insert({
          nombre: values.nombre,
          descripcion: values.descripcion || "",
          is_active: values.is_active,
          personalidad: values.personalidad || "amigable y servicial",
          tono: values.tono || "profesional",
          instrucciones: values.instrucciones || "",
          empresa_id: user.companyId,
          avatar_url: values.avatar_url || null
        })
        .select("*")
        .single();

      if (chatbotError) throw chatbotError;
      
      // Then create the context
      const { error: contextError } = await supabase
        .from("chatbot_contextos")
        .insert({
          chatbot_id: chatbot.id,
          tipo: "principal",
          contenido: "Contexto principal",
          general_context: values.general_context || "",
          welcome_message: values.welcome_message || "¡Hola! Soy el asistente virtual. ¿En qué puedo ayudarte hoy?",
          personality: values.personalidad || "amigable y servicial",
          communication_tone: values.communication_tone || values.tono || "profesional",
          main_purpose: values.main_purpose || "Asistir a los clientes",
          special_instructions: values.instrucciones || "",
          prompt_template: values.prompt_template || "",
          key_points: values.key_points || [],
          qa_examples: values.qa_examples || []
        });

      if (contextError) throw contextError;
      
      // Generar código embebido
      setCreatedChatbotId(chatbot.id);
      setEmbedCode(generateEmbedCode(chatbot.id));
      
      toast.success("Chatbot creado con éxito");
      onSuccess();
    } catch (error) {
      console.error("Error creando chatbot:", error);
      toast.error("Error al crear el chatbot. Inténtelo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-background dark:border-slate-700">
        <DialogHeader className="dark:border-b dark:border-slate-700 pb-4">
          <DialogTitle className="text-xl">
            {createdChatbotId ? "Chatbot creado exitosamente" : "Crear Chatbot"}
          </DialogTitle>
        </DialogHeader>
        
        {createdChatbotId ? (
          <div className="flex flex-col gap-4 py-4">
            <p className="text-base">
              Tu chatbot ha sido creado exitosamente. Usa el siguiente código para embeber el chatbot en tu sitio web:
            </p>
            
            <div className="relative">
              <Textarea
                value={embedCode}
                readOnly
                className="font-mono text-sm h-40 bg-muted/50"
              />
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={copyToClipboard}
              >
                {copied ? <Check size={16} /> : <Clipboard size={16} />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Inserta este código en la sección donde quieres que aparezca el botón de chat en tu sitio web.
            </p>
            
            <DialogFooter className="pt-4">
              <Button onClick={handleClose}>Cerrar</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 pr-2">
            <ChatbotForm
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
