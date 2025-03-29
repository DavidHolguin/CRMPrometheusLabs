
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { ChatbotForm, ChatbotFormValues } from "./ChatbotForm";

interface CreateChatbotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateChatbotModal({ open, onOpenChange, onSuccess }: CreateChatbotModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

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
      
      onOpenChange(false);
      onSuccess();
      toast.success("Chatbot creado con éxito");
    } catch (error) {
      console.error("Error creando chatbot:", error);
      toast.error("Error al crear el chatbot. Inténtelo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-background dark:border-slate-700">
        <DialogHeader className="dark:border-b dark:border-slate-700 pb-4">
          <DialogTitle className="text-xl">Crear Chatbot</DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1 pr-2">
          <ChatbotForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
