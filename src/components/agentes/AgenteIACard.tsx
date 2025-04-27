import { useState } from "react";
import { AgenteIA } from "@/hooks/useAgentesIA";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { 
  Edit, 
  Eye, 
  MoreHorizontal, 
  Trash2, 
  Power, 
  PowerOff,
  MessageSquare,
  Code,
  Share2,
  Bot,
  Brain,
  Settings,
  Zap
} from "lucide-react";

export interface AgenteIACardProps {
  agente: AgenteIA;
  onView: (agente: AgenteIA) => void;
  onEdit: (agente: AgenteIA) => void;
  onDelete: (id: string) => void;
  onActivate: (id: string, active: boolean) => void;
}

export function AgenteIACard({
  agente,
  onView,
  onEdit,
  onDelete,
  onActivate,
}: AgenteIACardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "AI";
    
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case "asistente":
        return <Badge variant="outline" className="text-blue-500 border-blue-500 bg-blue-500/10">
          <Bot className="h-3 w-3 mr-1" />
          Asistente
        </Badge>;
      case "analista":
        return <Badge variant="outline" className="text-purple-500 border-purple-500 bg-purple-500/10">
          <Brain className="h-3 w-3 mr-1" />
          Analista
        </Badge>;
      case "automatizacion":
        return <Badge variant="outline" className="text-amber-500 border-amber-500 bg-amber-500/10">
          <Settings className="h-3 w-3 mr-1" />
          Automatización
        </Badge>;
      default:
        return <Badge variant="secondary">
          <Bot className="h-3 w-3 mr-1" />
          {tipo || "Agente"}
        </Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "activo":
        return <Badge className="bg-green-500">Activo</Badge>;
      case "entrenamiento":
        return <Badge className="bg-amber-500">Entrenamiento</Badge>;
      case "inactivo":
        return <Badge className="bg-slate-500">Inactivo</Badge>;
      default:
        return <Badge variant="outline">{status || "Sin estado"}</Badge>;
    }
  };

  const getNivelAutonomia = (nivel: number) => {
    const maxNivel = 5;
    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: maxNivel }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-3 rounded-full ${
              i < nivel ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-200 hover:shadow-md",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {isHovered && (
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-muted/80 hover:bg-muted">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Acciones</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(agente)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver detalles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(agente)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar agente
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onActivate(agente.id, !agente.is_active)}
                  className={agente.is_active ? "text-amber-500 focus:text-amber-500" : "text-green-500 focus:text-green-500"}
                >
                  {agente.is_active ? (
                    <>
                      <PowerOff className="h-4 w-4 mr-2" />
                      Desactivar
                    </>
                  ) : (
                    <>
                      <Power className="h-4 w-4 mr-2" />
                      Activar
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(agente.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        
        <CardContent className="p-6 pt-8">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={agente.avatar_url || undefined} alt={agente.nombre} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                  {getInitials(agente.nombre)}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-background ${
                agente.is_active ? "bg-green-500" : "bg-slate-400"
              }`} />
            </div>

            <div className="space-y-1">
              <h3 className="font-semibold text-lg line-clamp-1">{agente.nombre}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{agente.descripcion || "Sin descripción"}</p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {getTipoBadge(agente.tipo)}
              {getStatusBadge(agente.status)}
            </div>

            <div className="w-full space-y-2">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Nivel de autonomía</span>
                <span>{agente.nivel_autonomia}/5</span>
              </div>
              {getNivelAutonomia(agente.nivel_autonomia)}
            </div>

            <div className="text-xs text-muted-foreground">
              Creado {formatDistanceToNow(new Date(agente.created_at), {
                addSuffix: true,
                locale: es,
              })}
            </div>
          </div>
        </CardContent>
      </div>

      <CardFooter className="flex justify-between border-t px-6 py-4 bg-muted/50">
        <Button variant="outline" size="sm" onClick={() => onView(agente)} className="flex-1">
          <Eye className="h-4 w-4 mr-2" />
          Ver
        </Button>
        <Button variant="default" size="sm" onClick={() => onEdit(agente)} className="flex-1 ml-2">
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </CardFooter>
    </Card>
  );
}