
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChatbotForm, ChatbotFormValues } from "./ChatbotForm";
import { Chatbot } from "@/hooks/useChatbots";

interface EditChatbotModalProps {
  chatbot: Chatbot;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditChatbotModal({ chatbot, open, onOpenChange, onSuccess }: EditChatbotModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(values: ChatbotFormValues) {
    setIsSubmitting(true);
    try {
      // Update the chatbot
      const { error: chatbotError } = await supabase
        .from("chatbots")
        .update({
          nombre: values.nombre,
          descripcion: values.descripcion,
          is_active: values.is_active,
          personalidad: values.personalidad,
          tono: values.tono,
          instrucciones: values.instrucciones,
          avatar_url: values.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", chatbot.id);

      if (chatbotError) throw chatbotError;
      
      // Get the context ID or create a new one if it doesn't exist
      const { data: contextData, error: contextQueryError } = await supabase
        .from("chatbot_contextos")
        .select("id")
        .eq("chatbot_id", chatbot.id)
        .maybeSingle();
      
      if (contextQueryError) throw contextQueryError;
      
      if (contextData) {
        // Update existing context
        const { error: updateContextError } = await supabase
          .from("chatbot_contextos")
          .update({
            general_context: values.general_context || "",
            welcome_message: values.welcome_message || "",
            personality: values.personalidad || "",
            communication_tone: values.communication_tone || values.tono || "",
            main_purpose: values.main_purpose || "",
            special_instructions: values.instrucciones || "",
            prompt_template: values.prompt_template || "",
            key_points: values.key_points || [],
            qa_examples: values.qa_examples || [],
            updated_at: new Date().toISOString(),
          })
          .eq("id", contextData.id);
        
        if (updateContextError) throw updateContextError;
      } else {
        // Create new context
        const { error: createContextError } = await supabase
          .from("chatbot_contextos")
          .insert({
            chatbot_id: chatbot.id,
            tipo: "principal",
            contenido: "Contexto principal",
            general_context: values.general_context || "",
            welcome_message: values.welcome_message || "",
            personality: values.personalidad || "",
            communication_tone: values.communication_tone || values.tono || "",
            main_purpose: values.main_purpose || "",
            special_instructions: values.instrucciones || "",
            prompt_template: values.prompt_template || "",
            key_points: values.key_points || [],
            qa_examples: values.qa_examples || []
          });
        
        if (createContextError) throw createContextError;
      }
      
      onOpenChange(false);
      onSuccess();
      toast.success("Chatbot actualizado con éxito");
    } catch (error) {
      console.error("Error actualizando chatbot:", error);
      toast.error("Error al actualizar el chatbot. Inténtelo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Editar Chatbot</DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1 pr-2">
          <ChatbotForm
            chatbot={chatbot}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
