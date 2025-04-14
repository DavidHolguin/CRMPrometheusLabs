import React from "react";
import { Forward, Loader2, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
                {selectedLead?.nombre ? `${selectedLead.nombre} ${selectedLead.apellido || ''}`.trim() : 'N/A'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Email</span>
              <span className="font-medium">{selectedLead?.email || 'N/A'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Teléfono</span>
              <span className="font-medium">{selectedLead?.telefono || 'N/A'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Score</span>
              <div className="flex items-center">
                <Badge 
                  variant={selectedLead?.score && selectedLead.score > 70 ? "default" : 
                        (selectedLead?.score && selectedLead.score > 40 ? "secondary" : "outline")}
                  className="px-1.5 py-0 h-5"
                >
                  {selectedLead?.score || 0}
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
            {selectedLead?.asignado_a && selectedLead.asignado_a !== user?.id ? (
              <Badge variant="outline" className="text-xs">Asignado a otro agente</Badge>
            ) : selectedLead?.asignado_a && selectedLead.asignado_a === user?.id ? (
              <Badge variant="secondary" className="text-xs">Asignado a ti</Badge>
            ) : (
              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/20">Sin asignar</Badge>
            )}
          </div>
          
          {!selectedLead?.asignado_a ? (
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
          ) : selectedLead.asignado_a === user?.id ? (
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