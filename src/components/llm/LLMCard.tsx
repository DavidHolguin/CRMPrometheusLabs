import { useState } from "react";
import { LLMConfig } from "@/hooks/useLLMConfigs";
import { cn } from "@/lib/utils";
import {
  Cpu,
  Check,
  MoreVertical,
  Edit,
  Trash2,
  Star,
  Power,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface LLMCardProps {
  config: LLMConfig;
  onEdit: (config: LLMConfig) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
  variant?: "card" | "row";
}

export function LLMCard({
  config,
  onEdit,
  onDelete,
  onSetDefault,
  onToggleActive,
  variant = "card",
}: LLMCardProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  
  // Obtenemos la fecha formateada
  const formattedDate = formatDistanceToNow(new Date(config.updated_at || config.created_at), {
    addSuffix: true,
    locale: es,
  });

  // Color basado en el proveedor
  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai':
        return "bg-gradient-to-r from-green-500 to-emerald-600";
      case 'anthropic':
        return "bg-gradient-to-r from-purple-500 to-violet-600";
      case 'mistral':
        return "bg-gradient-to-r from-blue-500 to-cyan-600";
      case 'gemini':
        return "bg-gradient-to-r from-orange-500 to-amber-600";
      default:
        return "bg-gradient-to-r from-slate-500 to-slate-600";
    }
  };

  // Si es vista de fila (tabla)
  if (variant === "row") {
    return (
      <tr className={cn("transition-colors hover:bg-muted/50", !config.is_active && "opacity-60")}>
        <td className="p-4 align-middle">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", getProviderColor(config.proveedor))}>
              <Cpu className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-medium">{config.nombre}</div>
              <div className="text-xs text-muted-foreground">
                {config.proveedor} / {config.modelo}
              </div>
            </div>
          </div>
        </td>
        <td className="p-4 align-middle hidden md:table-cell">
          <Badge variant={config.is_default ? "default" : "outline"}>
            {config.is_default ? "Predeterminado" : "Secundario"}
          </Badge>
        </td>
        <td className="p-4 align-middle">
          <Switch
            checked={config.is_active}
            onCheckedChange={(checked) => onToggleActive(config.id, checked)}
          />
        </td>
        <td className="p-4 align-middle hidden lg:table-cell">
          <div className="text-sm text-muted-foreground">
            {formattedDate}
          </div>
        </td>
        <td className="p-4 align-middle text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(config)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              {!config.is_default && (
                <DropdownMenuItem onClick={() => onSetDefault(config.id)}>
                  <Star className="mr-2 h-4 w-4" />
                  Establecer como predeterminado
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onToggleActive(config.id, !config.is_active)}>
                <Power className="mr-2 h-4 w-4" />
                {config.is_active ? "Desactivar" : "Activar"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setIsConfirmingDelete(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isConfirmingDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="max-w-md rounded-lg border bg-card p-6 shadow-lg">
                <h3 className="mb-4 text-lg font-medium">¿Eliminar esta configuración?</h3>
                <p className="mb-4 text-muted-foreground">
                  Esta acción no se puede deshacer. Esta configuración se eliminará permanentemente.
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setIsConfirmingDelete(false)}>
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      onDelete(config.id);
                      setIsConfirmingDelete(false);
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </td>
      </tr>
    );
  }

  // Vista de tarjeta
  return (
    <Card className={cn("overflow-hidden", !config.is_active && "opacity-60")}>
      <div
        className={cn("h-2", getProviderColor(config.proveedor))}
      />
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>{config.nombre}</CardTitle>
            {config.is_default && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Badge variant="secondary" className="gap-1 items-center">
                      <Star className="h-3 w-3" />
                      <span>Predeterminado</span>
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Configuración predeterminada para todos los chatbots</TooltipContent>
              </Tooltip>
            )}
          </div>
          <CardDescription>
            {config.proveedor} / {config.modelo}
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Switch
                  checked={config.is_active}
                  onCheckedChange={(checked) => onToggleActive(config.id, checked)}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>{config.is_active ? "Desactivar" : "Activar"}</TooltipContent>
          </Tooltip>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(config)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              {!config.is_default && (
                <DropdownMenuItem onClick={() => onSetDefault(config.id)}>
                  <Star className="mr-2 h-4 w-4" />
                  Establecer como predeterminado
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setIsConfirmingDelete(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="text-sm text-muted-foreground">
        <div className="flex flex-col gap-2">
          <div>
            <span className="font-medium text-foreground">Temperatura:</span>{" "}
            {config.configuracion?.temperature ?? "No especificada"}
          </div>
          <div>
            <span className="font-medium text-foreground">Tokens máximos:</span>{" "}
            {config.configuracion?.max_tokens ?? "No especificados"}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between border-t px-6 py-4">
        <div className="text-xs text-muted-foreground">
          Actualizado {formattedDate}
        </div>
        <Button variant="outline" size="sm" onClick={() => onEdit(config)}>
          <Edit className="mr-2 h-3 w-3" />
          Configurar
        </Button>
      </CardFooter>

      {isConfirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="max-w-md rounded-lg border bg-card p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-medium">¿Eliminar esta configuración?</h3>
            <p className="mb-4 text-muted-foreground">
              Esta acción no se puede deshacer. Esta configuración se eliminará permanentemente.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsConfirmingDelete(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(config.id);
                  setIsConfirmingDelete(false);
                }}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}