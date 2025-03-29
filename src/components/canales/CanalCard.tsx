
import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CanalIcon, getCanalColor } from "./CanalIcon";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Power } from "lucide-react";
import { ChatbotCanal } from "@/hooks/useCanales";
import { Switch } from "@/components/ui/switch";

type CanalCardProps = {
  canal: ChatbotCanal;
  onEdit: (canal: ChatbotCanal) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
};

export default function CanalCard({ canal, onEdit, onDelete, onToggleActive }: CanalCardProps) {
  if (!canal.canal) return null;
  
  const bgColor = getCanalColor(canal.canal.tipo);
  
  return (
    <Card className="overflow-hidden">
      <div className={`h-2 w-full ${bgColor}`} />
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center mb-1">
          <CanalIcon tipo={canal.canal.tipo} size={28} />
          <Badge variant={canal.is_active ? "default" : "outline"}>
            {canal.is_active ? "Activo" : "Inactivo"}
          </Badge>
        </div>
        <CardTitle className="text-lg font-medium">{canal.canal.nombre}</CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {canal.canal.descripcion || "Sin descripción"}
        </p>
        
        {canal.webhook_url && (
          <div className="mt-2">
            <p className="text-xs font-medium text-muted-foreground">Webhook:</p>
            <p className="text-xs truncate">{canal.webhook_url}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-0">
        <div className="flex items-center gap-2">
          <Switch 
            checked={canal.is_active} 
            onCheckedChange={(checked) => onToggleActive(canal.id, checked)}
            aria-label="Toggle canal active state"
          />
          <span className="text-xs text-muted-foreground">
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
      </CardFooter>
    </Card>
  );
}
