import { useNavigate } from "react-router-dom";
import {
  Bot, BotOff, ChevronDown, ChevronRight, CircleDollarSign, Clock,
  FileEdit, FileSpreadsheet, Forward, Loader2, Mail, MessageCircle,
  MessageSquare, MoreHorizontal, Phone, Star, Tag, User
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from "@/components/ui/tooltip";

interface ChatHeaderProps {
  selectedLead: any;
  selectedConversation: any;
  toggleChatbot: () => void;
  toggleChatbotLoading: boolean;
  commentDialogOpen: boolean;
  setCommentDialogOpen: (open: boolean) => void;
  leadConversations: any[];
  formatDate: (date: string) => string;
  leadComments: any[];
  navigate: ReturnType<typeof useNavigate>;
  updateLeadStage: (stageId: string) => void;
  updateLeadScore: (score: number) => void;
  stages: any[];
  stagesLoading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ChatHeader = ({
  selectedLead,
  selectedConversation,
  toggleChatbot,
  toggleChatbotLoading,
  commentDialogOpen,
  setCommentDialogOpen,
  leadConversations,
  formatDate,
  leadComments,
  navigate,
  updateLeadStage,
  updateLeadScore,
  stages,
  stagesLoading,
  activeTab,
  setActiveTab
}: ChatHeaderProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="p-4 border-b bg-[#020817] shadow-sm z-10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarFallback className="bg-primary/10 text-primary">
              {selectedLead?.nombre 
                ? getInitials(`${selectedLead.nombre} ${selectedLead.apellido || ''}`)
                : 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">
              {selectedLead?.nombre 
                ? `${selectedLead.nombre} ${selectedLead.apellido || ''}`.trim() || 'Sin nombre'
                : 'Sin nombre'}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {selectedLead?.email && (
                <div className="flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  <span>{selectedLead.email}</span>
                </div>
              )}
              {selectedLead?.telefono && (
                <div className="flex items-center">
                  <Phone className="h-3 w-3 mr-1" />
                  <span>{selectedLead.telefono}</span>
                </div>
              )}
              {selectedConversation?.ultimo_mensaje && (
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{formatDate(selectedConversation.ultimo_mensaje)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleChatbot()}
                  disabled={toggleChatbotLoading}
                  className="gap-2"
                >
                  {toggleChatbotLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : selectedConversation?.chatbot_activo ? (
                    <BotOff className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {selectedConversation?.chatbot_activo ? 'Desactivar Chatbot' : 'Activar Chatbot'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <MessageCircle className="h-4 w-4 mr-1" />
                <span className="sm:inline hidden">Comentario</span>
              </Button>
            </DialogTrigger>
          </Dialog>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-shrink-0">
                <Tag className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Categorizar</span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Acciones de Lead</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem className="cursor-pointer">
                <FileEdit className="h-4 w-4 mr-2" />
                Editar datos de lead
              </DropdownMenuItem>
              
              <DropdownMenuItem className="cursor-pointer">
                <Tag className="h-4 w-4 mr-2" />
                Asignar etiquetas
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem asChild>
                <div className="w-full">
                  <Popover>
                    <PopoverTrigger className="w-full flex items-center px-2 py-1.5 cursor-pointer">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      <span>Cambiar etapa</span>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Seleccionar etapa</h4>
                        {stagesLoading ? (
                          <div className="flex justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {stages.map(stage => (
                              <Button 
                                key={stage.id}
                                variant="ghost"
                                className="w-full justify-start text-sm h-8"
                                onClick={() => updateLeadStage(stage.id)}
                              >
                                <div
                                  className="w-3 h-3 rounded-full mr-2"
                                  style={{ backgroundColor: stage.color || '#888' }}
                                />
                                {stage.nombre}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <div className="w-full">
                  <Popover>
                    <PopoverTrigger className="w-full flex items-center px-2 py-1.5 cursor-pointer">
                      <Star className="h-4 w-4 mr-2" />
                      <span>Cambiar puntuación</span>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Puntuación (0-100)</h4>
                        <div className="grid grid-cols-2 gap-1">
                          {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(score => (
                            <Button 
                              key={score}
                              variant={score > 70 ? "default" : (score > 40 ? "secondary" : "outline")}
                              className="text-sm"
                              onClick={() => updateLeadScore(score)}
                            >
                              {score}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem className="cursor-pointer">
                <CircleDollarSign className="h-4 w-4 mr-2" />
                Añadir oportunidad
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                if (selectedLead?.pipeline_id) {
                  navigate(`/dashboard/leads/${selectedLead.id}`);
                }
              }}>
                <ChevronRight className="h-4 w-4 mr-2" />
                Ver ficha completa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                if (leadConversations.length > 1) {
                  // Lógica para mostrar todas las conversaciones
                }
              }}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Ver todas las conversaciones
                <Badge variant="secondary" className="ml-2 px-1 text-xs">
                  {leadConversations.length}
                </Badge>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Forward className="h-4 w-4 mr-2" />
                Transferir conversación
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Pestañas para alternar entre mensajes y otros datos */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
        <TabsList className="grid grid-cols-3 h-8">
          <TabsTrigger value="mensajes" className="text-xs">Mensajes</TabsTrigger>
          <TabsTrigger value="comentarios" className="text-xs">
            Comentarios
            {leadComments.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 px-1 py-0 text-xs">
                {leadComments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="info" className="text-xs">Información</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default ChatHeader;