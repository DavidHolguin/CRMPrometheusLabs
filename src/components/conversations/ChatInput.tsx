import React, { useState, useRef } from "react";
import { Send, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmojiPicker } from "./EmojiPicker";

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSendMessage = async () => {
    if (!message.trim() || disabled) return;
    
    try {
      await onSendMessage(message);
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