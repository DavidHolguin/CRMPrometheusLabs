import React from "react";
import { Forward, Loader2, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LeadInfoProps {
  selectedLead: any;
  leadConversations: any[];
  user: any;
  isAssigning: boolean;
  isReleasing: boolean;
  handleAssignToMe: () => void;
  handleReleaseAssignment: () => void;
  openTransferDialog: () => void;
}

const LeadInfo: React.FC<LeadInfoProps> = ({
  selectedLead,
  leadConversations,
  user,
  isAssigning,
  isReleasing,
  handleAssignToMe,
  handleReleaseAssignment,
  openTransferDialog
}) => {
  // Simplificar: usar prioritariamente los campos de la vista vista_leads_detalle_empresa
  const hasAgentName = Boolean(
    selectedLead?.nombre_asignado || 
    selectedLead?.agente_nombre
  );

  const isAssignedToCurrentUser = selectedLead?.asignado_a === user?.id;
  const isAssignedToOtherAgent = Boolean(selectedLead?.asignado_a && selectedLead?.asignado_a !== user?.id);
  const isUnassigned = !selectedLead?.asignado_a;

  // Función simplificada para obtener la información del agente
  // Usa principalmente la información de nombre_asignado, email_asignado y avatar_asignado
  const getAssignedAgentInfo = () => {
    if (!selectedLead?.asignado_a && !hasAgentName) return null;
    
    return {
      nombre: selectedLead?.nombre_asignado || selectedLead?.agente_nombre || `Agente (${selectedLead?.asignado_a?.substring(0, 6) || 'N/A'})`,
      email: selectedLead?.email_asignado || selectedLead?.agente_email || '',
      avatar_url: selectedLead?.avatar_asignado || selectedLead?.agente_avatar || ''
    };
  };
  
  const assignedAgent = getAssignedAgentInfo();
  
  // Función para obtener las iniciales del agente
  const getAgentInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {/* Información básica */}
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Información del Lead</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Nombre</span>
              <span className="font-medium">
                {selectedLead?.nombre_lead ? `${selectedLead.nombre_lead} ${selectedLead.apellido_lead || ''}`.trim() : 'N/A'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Email</span>
              <span className="font-medium">{selectedLead?.email_lead || 'N/A'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Teléfono</span>
              <span className="font-medium">{selectedLead?.telefono_lead || 'N/A'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Score</span>
              <div className="flex items-center">
                <Badge 
                  variant={selectedLead?.lead_score && selectedLead.lead_score > 70 ? "default" : 
                        (selectedLead?.lead_score && selectedLead.lead_score > 40 ? "secondary" : "outline")}
                  className="px-1.5 py-0 h-5"
                >
                  {selectedLead?.lead_score || 0}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Información adicional y métricas */}
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Métricas</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/20 p-3 rounded-md">
              <div className="text-xs text-muted-foreground mb-1">Total mensajes</div>
              <div className="text-2xl font-semibold">
                {leadConversations.reduce((acc, conv) => acc + (conv.message_count || 0), 0)}
              </div>
            </div>
            
            <div className="bg-muted/20 p-3 rounded-md">
              <div className="text-xs text-muted-foreground mb-1">Conversaciones</div>
              <div className="text-2xl font-semibold">
                {leadConversations.length}
              </div>
            </div>
          </div>
        </Card>

        {/* Asignación de lead */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Asignación</h3>
            {isAssignedToOtherAgent ? (
              <Badge variant="outline" className="text-xs">Asignado a otro agente</Badge>
            ) : isAssignedToCurrentUser ? (
              <Badge variant="secondary" className="text-xs">Asignado a ti</Badge>
            ) : (
              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/20">Sin asignar</Badge>
            )}
          </div>
          
          {isUnassigned ? (
            <Button 
              size="sm" 
              className="w-full" 
              variant="outline"
              onClick={handleAssignToMe}
              disabled={isAssigning}
            >
              {isAssigning ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <User className="h-3.5 w-3.5 mr-1.5" />
              )}
              Asignarme este lead
            </Button>
          ) : selectedLead?.asignado_a === user?.id ? (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="flex-1" 
                variant="outline"
                onClick={handleReleaseAssignment}
                disabled={isReleasing}
              >
                {isReleasing ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : "Liberar asignación"}
              </Button>
              <Button 
                size="sm" 
                className="flex-1" 
                variant="outline"
                onClick={openTransferDialog}
              >
                <Forward className="h-3.5 w-3.5 mr-1.5" />
                Transferir
              </Button>
            </div>
          ) : isAssignedToOtherAgent && assignedAgent ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-8 w-8">
                  {assignedAgent.avatar_url ? (
                    <AvatarImage src={assignedAgent.avatar_url} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getAgentInitials(assignedAgent.nombre)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{assignedAgent.nombre}</p>
                  {assignedAgent.email && (
                    <p className="text-xs text-muted-foreground">{assignedAgent.email}</p>
                  )}
                </div>
              </div>
              <Button 
                size="sm" 
                className="w-full" 
                variant="outline" 
                disabled
              >
                Lead asignado a otro agente
              </Button>
            </div>
          ) : (
            <Button 
              size="sm" 
              className="w-full" 
              variant="outline" 
              disabled
            >
              Lead asignado a otro agente
            </Button>
          )}
        </Card>
      </div>
    </ScrollArea>
  );
};

export default LeadInfo;