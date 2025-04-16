import { useState } from "react";
import { Agente } from "@/hooks/useAgentes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit, Key, MoreHorizontal, UserCheck, UserX } from "lucide-react";
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

export interface AgenteCardProps {
  agente: Agente;
  onEdit: (agente: Agente) => void;
  onActivate: (id: string, active: boolean) => void;
  onResetPassword: (email: string) => void;
  variant?: "card" | "row";
}

export function AgenteCard({ 
  agente, 
  onEdit, 
  onActivate, 
  onResetPassword,
  variant = "card"
}: AgenteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-rose-500">Administrador</Badge>;
      case "admin_empresa":
        return <Badge className="bg-amber-500">Admin Empresa</Badge>;
      default:
        return <Badge variant="secondary">Agente</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="outline" className="text-green-500 border-green-500 bg-green-500/10">
        <UserCheck className="h-3 w-3 mr-1" />
        Activo
      </Badge>
    ) : (
      <Badge variant="outline" className="text-rose-500 border-rose-500 bg-rose-500/10">
        <UserX className="h-3 w-3 mr-1" />
        Inactivo
      </Badge>
    );
  };

  if (variant === "row") {
    return (
      <tr className="border-b transition-colors hover:bg-muted/50">
        <td className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 md:h-10 md:w-10">
              <AvatarImage src={agente.avatar_url || undefined} alt={agente.full_name} />
              <AvatarFallback>{getInitials(agente.full_name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{agente.full_name}</p>
              <p className="text-xs text-muted-foreground">{agente.email}</p>
            </div>
          </div>
        </td>
        <td className="p-4 hidden md:table-cell">{getRoleBadge(agente.role)}</td>
        <td className="p-4">{getStatusBadge(agente.is_active)}</td>
        <td className="p-4 text-xs text-muted-foreground hidden lg:table-cell">
          {agente.last_sign_in
            ? `Último acceso ${formatDistanceToNow(new Date(agente.last_sign_in), {
                addSuffix: true,
                locale: es,
              })}`
            : "Sin accesos"}
        </td>
        <td className="p-4 text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Acciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(agente)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar agente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onResetPassword(agente.email)}>
                <Key className="h-4 w-4 mr-2" />
                Resetear contraseña
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onActivate(agente.id, !agente.is_active)}
                className={agente.is_active ? "text-rose-500 focus:text-rose-500" : "text-green-500 focus:text-green-500"}
              >
                {agente.is_active ? (
                  <>
                    <UserX className="h-4 w-4 mr-2" />
                    Desactivar cuenta
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Activar cuenta
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
    );
  }

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200", 
      isExpanded ? "h-auto" : "h-[260px]"
    )}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-16 w-16">
            <AvatarImage src={agente.avatar_url || undefined} alt={agente.full_name} />
            <AvatarFallback>{getInitials(agente.full_name)}</AvatarFallback>
          </Avatar>
          <h3 className="mt-3 font-medium">{agente.full_name}</h3>
          <p className="text-sm text-muted-foreground">{agente.email}</p>
          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {getRoleBadge(agente.role)}
            {getStatusBadge(agente.is_active)}
          </div>
          <div className="mt-4">
            <p className="text-xs text-muted-foreground">
              {agente.last_sign_in
                ? `Último acceso ${formatDistanceToNow(new Date(agente.last_sign_in), {
                    addSuffix: true,
                    locale: es,
                  })}`
                : "Sin accesos"}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t px-6 py-4 bg-muted/50">
        <Button variant="ghost" size="sm" onClick={() => onEdit(agente)}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4 mr-2" />
              Acciones
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onResetPassword(agente.email)}>
              <Key className="h-4 w-4 mr-2" />
              Resetear contraseña
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onActivate(agente.id, !agente.is_active)}
              className={agente.is_active ? "text-rose-500 focus:text-rose-500" : "text-green-500 focus:text-green-500"}
            >
              {agente.is_active ? (
                <>
                  <UserX className="h-4 w-4 mr-2" />
                  Desactivar cuenta
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Activar cuenta
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}