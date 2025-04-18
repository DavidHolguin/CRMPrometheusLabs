import { useNavigate } from "react-router-dom";
import {
  Bot, BotOff, ChevronDown, CircleDollarSign, Clock,
  FileEdit, FileSpreadsheet, Forward, Loader2, Mail, MessageCircle,
  MessageSquare, MoreHorizontal, Phone, Star, Tag, User, UserCheck, UserX
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from "@/components/ui/tooltip";
import { Lead } from "@/hooks/useLeads";
import { Conversation } from "@/hooks/useConversations";

interface ChatHeaderProps {
  selectedLead: Lead | null;
  selectedConversation: Conversation | null;
  toggleChatbot: () => void;
  toggleChatbotLoading: boolean;
  formatDate: (date: string) => string;
}

const ChatHeader = ({
  selectedLead,
  selectedConversation,
  toggleChatbot,
  toggleChatbotLoading,
  formatDate,
}: ChatHeaderProps) => {
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="p-4 border-b bg-card shadow-sm z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-grow min-w-0">
          {selectedLead && (
            <>
              <Avatar className="h-10 w-10 mr-3 flex-shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(`${selectedLead.nombre || ''} ${selectedLead.apellido || ''}`)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-grow min-w-0">
                <h3 className="font-medium truncate">
                  {`${selectedLead.nombre || ''} ${selectedLead.apellido || ''}`.trim() || 'Sin nombre'}
                </h3>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0 text-xs text-muted-foreground">
                  {selectedLead.email && (
                    <div className="flex items-center truncate">
                      <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{selectedLead.email}</span>
                    </div>
                  )}
                  {selectedLead.telefono && (
                    <div className="flex items-center truncate">
                      <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{selectedLead.telefono}</span>
                    </div>
                  )}
                  {selectedConversation?.ultimo_mensaje && (
                    <div className="flex items-center flex-shrink-0">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{formatDate(selectedConversation.ultimo_mensaje)}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          {!selectedLead && (
            <div className="text-muted-foreground">Cargando detalles...</div>
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {selectedConversation && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleChatbot}
                    disabled={toggleChatbotLoading}
                    className="h-8 w-8"
                  >
                    {toggleChatbotLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : selectedConversation.chatbot_activo ? (
                      <BotOff className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {selectedConversation.chatbot_activo ? 'Desactivar Chatbot' : 'Activar Chatbot'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;