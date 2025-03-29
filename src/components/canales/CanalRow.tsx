
import React from "react";
import { CanalIcon } from "./CanalIcon";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { ChatbotCanal } from "@/hooks/useCanales";
import { Switch } from "@/components/ui/switch";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type CanalRowProps = {
  canal: ChatbotCanal;
  onEdit: (canal: ChatbotCanal) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
};

export default function CanalRow({ canal, onEdit, onDelete, onToggleActive }: CanalRowProps) {
  if (!canal.canal) return null;
  
  return (
    <div className="flex items-center justify-between py-4 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        <CanalIcon tipo={canal.canal.tipo} size={24} />
        <div>
          <h3 className="font-medium">{canal.canal.nombre}</h3>
          <p className="text-sm text-muted-foreground">{canal.canal.descripcion || 'Sin descripción'}</p>
        </div>
      </div>
      
      <div className="hidden md:flex items-center gap-4">
        <div className="text-sm">
          <p className="text-muted-foreground">Configurado hace:</p>
          <p>{formatDistanceToNow(new Date(canal.created_at), { addSuffix: true, locale: es })}</p>
        </div>
        
        {canal.webhook_url && (
          <div className="text-sm max-w-[200px]">
            <p className="text-muted-foreground">Webhook:</p>
            <p className="truncate">{canal.webhook_url}</p>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch 
            checked={canal.is_active} 
            onCheckedChange={(checked) => onToggleActive(canal.id, checked)}
            aria-label="Toggle canal active state"
          />
          <span className="text-sm text-muted-foreground hidden md:inline">
            {canal.is_active ? "Activado" : "Desactivado"}
          </span>
        </div>
        
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(canal)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(canal.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}
