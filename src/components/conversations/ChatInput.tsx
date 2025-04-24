import React, { useState, useRef, useEffect } from "react";
import { Send, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmojiPicker } from "./EmojiPicker";
import { supabase } from "@/integrations/supabase/client";

interface ChatInputProps {
  onSendMessage: (message: string, chatbotCanalId?: string) => Promise<void>;
  chatbotId?: string;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, chatbotId, disabled }) => {
  const [message, setMessage] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [chatbotCanalId, setChatbotCanalId] = useState<string | undefined>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ID del canal web
  const CANAL_WEB_ID = "13956803-a8ca-4087-8050-e3c98eafa4bd";

  useEffect(() => {
    if (chatbotId) {
      fetchChatbotCanalId();
    }
  }, [chatbotId]);

  const fetchChatbotCanalId = async () => {
    if (!chatbotId) return;

    try {
      // Consulta para obtener el ID específico de la relación entre el chatbot y el canal web
      const { data, error } = await supabase
        .from("chatbot_canales")
        .select("id")
        .eq("chatbot_id", chatbotId)
        .eq("canal_id", CANAL_WEB_ID)
        .maybeSingle();

      if (error) {
        console.error("Error al obtener chatbot_canal_id:", error);
      } else if (data) {
        console.log(`Chatbot canal ID encontrado: ${data.id}`);
        setChatbotCanalId(data.id);
      } else {
        console.log("No se encontró una relación de canal web para este chatbot");
      }
    } catch (err) {
      console.error("Error en la consulta de chatbot_canal_id:", err);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || disabled) return;
    
    try {
      await onSendMessage(message, chatbotCanalId);
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setEmojiPickerOpen(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="p-4 border-t bg-[#020817] shadow-md w-full sticky bottom-0 left-0 right-0">
      <div className="relative">
        <div className="flex">
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              className="min-h-[60px] max-h-[200px] pr-20 resize-none py-3"
              disabled={disabled}
            />
            <div className="absolute right-3 bottom-3 flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                      disabled={disabled}
                    >
                      <Smile className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Emojis
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={handleSendMessage}
                      disabled={disabled || !message.trim()}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Enviar mensaje
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        {emojiPickerOpen && (
          <div className="absolute bottom-full right-0 mb-2 z-10">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          </div>
        )}
      </div>
      <div className="text-xs text-muted-foreground mt-2">
        <span>Pro tip: </span>
        <span>Puedes usar Markdown para dar formato a tu mensaje</span>
      </div>
    </div>
  );
};

export default ChatInput;