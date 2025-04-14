import React from "react";
import { CheckCheck, Loader2 } from "lucide-react";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: any[];
  selectedAgentId: string;
  setSelectedAgentId: (id: string) => void;
  isTransferring: boolean;
  handleTransfer: () => void;
}

const TransferDialog: React.FC<TransferDialogProps> = ({
  open,
  onOpenChange,
  agents,
  selectedAgentId,
  setSelectedAgentId,
  isTransferring,
  handleTransfer
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transferir lead a otro agente</DialogTitle>
          <DialogDescription>
            Selecciona a qué agente quieres transferir este lead.
          </DialogDescription>
        </DialogHeader>
        
        {agents.length === 0 ? (
          <div className="text-center py-6">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando agentes disponibles...</p>
          </div>
        ) : (
          <div className="space-y-3 my-2 max-h-[300px] overflow-y-auto">
            {agents.map(agent => (
              <div
                key={agent.id}
                className={`
                  flex items-center p-2 rounded-md cursor-pointer
                  ${selectedAgentId === agent.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'}
                `}
                onClick={() => setSelectedAgentId(agent.id)}
              >
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src={agent.avatar_url} />
                  <AvatarFallback>
                    {agent.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{agent.full_name}</p>
                  <p className="text-xs text-muted-foreground">{agent.role || 'Agente'}</p>
                </div>
                {selectedAgentId === agent.id && (
                  <div className="ml-auto">
                    <CheckCheck className="h-4 w-4 text-primary" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleTransfer} 
            disabled={isTransferring || !selectedAgentId}
          >
            {isTransferring ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Transfiriendo
              </>
            ) : 'Transferir lead'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransferDialog;