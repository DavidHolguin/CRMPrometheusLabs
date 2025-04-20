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
  ChevronRight,
  Sliders,
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
        return "from-emerald-500 to-teal-500";
      case 'anthropic':
        return "from-purple-500 to-violet-500";
      case 'mistral':
        return "from-blue-500 to-cyan-500";
      case 'gemini':
        return "from-orange-500 to-amber-500";
      default:
        return "from-slate-500 to-slate-600";
    }
  };

  // Gradiente para el borde de los iconos
  const getProviderBorderGradient = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai':
        return "from-emerald-500 to-teal-500";
      case 'anthropic':
        return "from-purple-500 to-violet-500";
      case 'mistral':
        return "from-blue-500 to-cyan-500";
      case 'gemini':
        return "from-orange-500 to-amber-500";
      default:
        return "from-slate-500 to-slate-600";
    }
  };

  // Calcular un valor de progreso basado en la temperatura
  const getTemperatureProgress = () => {
    const temp = config.configuracion?.temperature || 0.7;
    return (temp / 2) * 100; // Temperatura va de 0 a 2, convertimos a porcentaje
  };

  // Si es vista de fila (tabla)
  if (variant === "row") {
    return (
      <tr className={cn("transition-colors hover:bg-muted/50", !config.is_active && "opacity-60")}>
        <td className="p-4 align-middle">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={cn("absolute -inset-1 rounded-xl bg-gradient-to-r opacity-30 blur-sm", getProviderBorderGradient(config.proveedor))}></div>
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-card">
                <Cpu className={cn("h-5 w-5", config.is_active ? "text-primary" : "text-muted-foreground")} />
              </div>
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

  // Vista de tarjeta moderna
  return (
    <Card className={cn("group relative overflow-hidden shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl", !config.is_active && "opacity-80")}>
      <div className="absolute -left-16 -top-16 h-32 w-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/0 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-70"></div>
      <div className="absolute -right-16 -bottom-16 h-32 w-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/0 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-70"></div>

      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={cn("absolute -inset-1 rounded-xl bg-gradient-to-r opacity-30 blur-sm transition-opacity duration-300 group-hover:opacity-60", getProviderBorderGradient(config.proveedor))}></div>
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-card">
                <Cpu className={cn("h-6 w-6", config.is_active ? "text-primary" : "text-muted-foreground")} />
              </div>
            </div>

            <div>
              <h3 className="font-semibold">{config.nombre}</h3>
              <p className="text-sm text-muted-foreground">{config.proveedor} / {config.modelo}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-muted-foreground">{formattedDate}</span>
            {config.is_default && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                <span className="h-1 w-1 rounded-full bg-primary"></span>
                Predeterminado
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-xl bg-muted/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Sliders className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Temperatura: {config.configuracion?.temperature || 0.7}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">Tokens máximos</span>
              <span className="text-muted-foreground">{config.configuracion?.max_tokens || 2048}</span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full bg-gradient-to-r", getProviderColor(config.proveedor))} 
                   style={{ width: `${getTemperatureProgress()}%` }}>
                <div className="h-full w-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent"></div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Switch
              checked={config.is_active}
              onCheckedChange={(checked) => onToggleActive(config.id, checked)}
              className="mr-2"
            />
            <span className="text-xs text-muted-foreground flex-1">
              Estado: {config.is_active ? "Activo" : "Inactivo"}
            </span>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
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

          <Button 
            variant="outline" 
            onClick={() => onEdit(config)}
            className="w-full group/btn relative overflow-hidden bg-gradient-to-r from-primary/0 to-primary/0 p-px text-foreground shadow-sm transition-colors hover:shadow-md"
          >
            <div className="relative rounded-md px-4 py-2 transition-colors">
              <span className="flex items-center justify-center gap-2">
                Configurar
                <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </span>
            </div>
          </Button>
        </div>
      </div>
      
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