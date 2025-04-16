import { useNavigate } from "react-router-dom";
import {
  Bot, BotOff, ChevronDown, ChevronRight, CircleDollarSign, Clock,
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
  handleAssignToMe: () => void;
  handleReleaseAssignment: () => void;
  isAssigning: boolean;
  isReleasing: boolean;
  openTransferDialog: () => void;
  currentUserId: string | undefined;
  userProfiles?: any[];
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
  setActiveTab,
  handleAssignToMe,
  handleReleaseAssignment,
  isAssigning,
  isReleasing,
  openTransferDialog,
  currentUserId,
  userProfiles = []
}: ChatHeaderProps) => {
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Detectar si hay un nombre de agente incluso si no hay asignado_a
  const hasAgentName = Boolean(
    selectedLead?.agente_nombre || 
    selectedLead?.usuario_asignado?.nombre || 
    selectedLead?.profile_full_name
  );

  const isAssignedToCurrentUser = selectedLead?.asignado_a === currentUserId;
  // Modificado: También consideramos que está asignado si hay un nombre de agente
  const isAssignedToOtherUser = (selectedLead?.asignado_a && selectedLead.asignado_a !== currentUserId) || 
                               (!selectedLead?.asignado_a && hasAgentName);
  // Un lead está sin asignar solo si no tiene asignado_a Y tampoco tiene nombre de agente
  const isUnassigned = !selectedLead?.asignado_a && !hasAgentName;

  const getAssignedAgentName = () => {
    // Si hay nombre de agente, lo usamos incluso si no hay asignado_a
    if (selectedLead?.agente_nombre) {
      return selectedLead.agente_nombre;
    }
    
    if (!selectedLead?.asignado_a && !hasAgentName) return null;
    
    // Probar todos los posibles lugares donde podría estar el nombre del agente
    if (selectedLead?.usuario_asignado?.nombre) {
      return selectedLead.usuario_asignado.nombre;
    }
    
    if (selectedLead?.profile_full_name) {
      return selectedLead.profile_full_name;
    }
    
    if (selectedLead?.profile?.full_name) {
      return selectedLead.profile.full_name;
    }
    
    // Si hay userProfiles disponibles, buscar el agente ahí
    if (selectedLead?.asignado_a) {
      const agentProfile = userProfiles.find(profile => profile.id === selectedLead.asignado_a);
      if (agentProfile) {
        return agentProfile.full_name || agentProfile.nombre;
      }
      
      // Si tenemos el ID pero no el nombre, usar un texto genérico
      return `Agente (ID: ${selectedLead.asignado_a.substring(0, 6)}...)`;
    }
    
    return 'Agente asignado';
  };

  const assignedAgentName = getAssignedAgentName();

  // Agregar un log para depuración
  console.log("Información del agente asignado:", {
    leadId: selectedLead?.id,
    asignadoA: selectedLead?.asignado_a,
    agenteName: assignedAgentName,
    originalAgenteNombre: selectedLead?.agente_nombre,
    usuarioAsignado: selectedLead?.usuario_asignado,
    hasAgentName,
    isAssignedToOtherUser,
    isUnassigned
  });

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
            <div className="flex items-center gap-2">
              <h3 className="font-medium">
                {selectedLead?.nombre 
                  ? `${selectedLead.nombre} ${selectedLead.apellido || ''}`.trim() || 'Sin nombre'
                  : 'Sin nombre'}
              </h3>
              {isAssignedToCurrentUser && (
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                  <UserCheck className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Asignado a mí</span>
                </Badge>
              )}
              {isAssignedToOtherUser && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-500 border-orange-500/20">
                      <User className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Asignado</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Asignado a: {assignedAgentName || 'Otro agente'}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {isUnassigned && (
                <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/20">
                  <UserX className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Sin asignar</span>
                </Badge>
              )}
            </div>
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
              {isAssignedToOtherUser && assignedAgentName && (
                <div className="flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  <span>{assignedAgentName}</span>
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
                      <User className="h-4 w-4 mr-2" />
                      <span>Asignación de lead</span>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Asignar lead</h4>
                        
                        {isUnassigned && (
                          <Button 
                            variant="secondary"
                            className="w-full justify-start text-sm h-8 mb-2"
                            onClick={handleAssignToMe}
                            disabled={isAssigning}
                          >
                            {isAssigning ? (
                              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                            ) : (
                              <UserCheck className="h-3.5 w-3.5 mr-2" />
                            )}
                            Asignar a mí
                          </Button>
                        )}
                        
                        {isAssignedToCurrentUser && (
                          <Button 
                            variant="outline"
                            className="w-full justify-start text-sm h-8 mb-2"
                            onClick={handleReleaseAssignment}
                            disabled={isReleasing}
                          >
                            {isReleasing ? (
                              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                            ) : (
                              <UserX className="h-3.5 w-3.5 mr-2" />
                            )}
                            Liberar asignación
                          </Button>
                        )}
                        
                        {(isAssignedToCurrentUser) && (
                          <Button 
                            variant="outline"
                            className="w-full justify-start text-sm h-8 mb-2"
                            onClick={openTransferDialog}
                          >
                            <Forward className="h-3.5 w-3.5 mr-2" />
                            Transferir lead
                          </Button>
                        )}
                        
                        {isAssignedToOtherUser && (
                          <div className="text-xs px-2 py-1">
                            <p className="text-muted-foreground">Este lead está asignado a:</p>
                            <p className="font-medium text-sm mt-1">{assignedAgentName}</p>
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
                                disabled={isAssignedToOtherUser}
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
                              disabled={isAssignedToOtherUser}
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
              
              <DropdownMenuItem 
                className="cursor-pointer"
                disabled={isAssignedToOtherUser}
              >
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
              <DropdownMenuItem 
                onClick={openTransferDialog}
                disabled={isAssignedToOtherUser || !isAssignedToCurrentUser}
              >
                <Forward className="h-4 w-4 mr-2" />
                Transferir conversación
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
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