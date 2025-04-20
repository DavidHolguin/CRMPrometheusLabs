import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  Copy, 
  Edit, 
  MoreHorizontal, 
  Trash2, 
  Wand2, 
  Code, 
  Check, 
  FileCode2, 
  BookText,
  ChevronRight,
  FileText,
  Tag
} from "lucide-react";

// Tipos
interface PromptTemplate {
  id: string;
  empresa_id: string;
  nombre: string;
  descripcion: string;
  tipo_template: string;
  contenido: string;
  variables: any[];
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Props {
  template: PromptTemplate;
  onEdit: (template: PromptTemplate) => void;
  onDelete: (id: string) => void;
  onAssign: (id: string) => void;
  variant?: "card" | "row";
}

export function PromptTemplateCard({ 
  template, 
  onEdit, 
  onDelete,
  onAssign,
  variant = "card" 
}: Props) {
  const [copied, setCopied] = useState(false);

  // Copiar contenido al portapapeles
  const handleCopyContent = () => {
    navigator.clipboard.writeText(template.contenido);
    setCopied(true);
    toast.info("Contenido copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  // Obtener color basado en el tipo de plantilla
  const getTypeColor = (type: string = '') => {
    switch (type.toLowerCase()) {
      case 'contexto':
        return "from-blue-500 to-cyan-500";
      case 'sistema':
        return "from-purple-500 to-violet-500";
      case 'instrucciones':
        return "from-emerald-500 to-teal-500";
      case 'qa':
        return "from-orange-500 to-amber-500";
      case 'personalidad':
        return "from-pink-500 to-rose-500";
      default:
        return "from-slate-500 to-slate-600";
    }
  };

  // Obtener icono basado en el tipo de plantilla
  const getTypeIcon = (type: string = '') => {
    switch (type.toLowerCase()) {
      case 'contexto':
        return <BookText className="h-4 w-4" />;
      case 'sistema':
        return <FileCode2 className="h-4 w-4" />;
      case 'instrucciones':
        return <FileText className="h-4 w-4" />;
      case 'qa':
        return <Code className="h-4 w-4" />;
      case 'personalidad':
        return <Tag className="h-4 w-4" />;
      default:
        return <FileCode2 className="h-4 w-4" />;
    }
  };

  if (variant === "row") {
    return (
      <TableRow className="transition-colors hover:bg-muted/50">
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={cn("absolute -inset-1 rounded-xl bg-gradient-to-r opacity-30 blur-sm", getTypeColor(template.tipo_template))}></div>
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-card">
                {getTypeIcon(template.tipo_template)}
              </div>
            </div>
            <div>
              <div className="font-medium">{template.nombre}</div>
              <div className="text-sm text-muted-foreground line-clamp-1">
                {template.descripcion || "Sin descripción"}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          {template.tipo_template ? (
            <Badge 
              variant="outline" 
              className={cn("bg-gradient-to-r bg-clip-text text-transparent", getTypeColor(template.tipo_template))}
            >
              {template.tipo_template}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          )}
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <div className="flex items-center gap-1">
            <Code className="h-3 w-3 text-muted-foreground" />
            <span>{template.variables?.length || 0}</span>
          </div>
        </TableCell>
        <TableCell className="hidden lg:table-cell">
          {new Date(template.updated_at).toLocaleDateString()}
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Acciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(template)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAssign(template.id)}>
                <Wand2 className="mr-2 h-4 w-4" />
                Asignar a chatbot
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyContent}>
                {copied ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                Copiar contenido
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive" 
                onClick={() => onDelete(template.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <Card className={cn(
      "group relative overflow-hidden shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col h-full",
      !template.is_active && "opacity-80"
    )}>
      {/* Efectos de fondo */}
      <div className="absolute -left-16 -top-16 h-32 w-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/0 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-70"></div>
      <div className="absolute -right-16 -bottom-16 h-32 w-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/0 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-70"></div>

      <div className={cn("h-1.5 bg-gradient-to-r", getTypeColor(template.tipo_template))}></div>
      
      <div className="flex flex-col p-6 flex-grow">
        {/* Encabezado con título y acciones */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={cn("absolute -inset-1 rounded-xl bg-gradient-to-r opacity-30 blur-sm transition-opacity duration-300 group-hover:opacity-60", getTypeColor(template.tipo_template))}></div>
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-card">
                {getTypeIcon(template.tipo_template)}
              </div>
            </div>
            <div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h3 className="font-semibold truncate max-w-[180px]">{template.nombre}</h3>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{template.nombre}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex mt-0.5">
                {template.tipo_template && (
                  <Badge 
                    variant="outline" 
                    className={cn("bg-gradient-to-r bg-clip-text text-transparent", getTypeColor(template.tipo_template))}
                  >
                    {template.tipo_template}
                  </Badge>
                )}
                {!template.is_active && (
                  <Badge variant="secondary" className="ml-2">
                    Inactivo
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted/80">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(template)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAssign(template.id)}>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Asignar a chatbot
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyContent}>
                  {copied ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  Copiar contenido
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive" 
                  onClick={() => onDelete(template.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-grow mt-2">
          <div className="rounded-xl bg-muted/50 p-4 mb-4">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {template.descripcion || "Sin descripción"}
            </p>
          </div>

          {/* Información adicional */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Code className="h-3 w-3 text-primary" />
              </div>
              <span>
                {template.variables?.length || 0} variables
              </span>
            </div>
            <span>
              {new Date(template.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopyContent} 
            className="flex-1"
          >
            {copied ? <Check className="mr-2 h-3 w-3" /> : <Copy className="mr-2 h-3 w-3" />}
            Copiar
          </Button>
          
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => onEdit(template)}
            className="flex-1 group/btn relative overflow-hidden"
          >
            <div className="relative rounded-md transition-colors">
              <span className="flex items-center justify-center gap-2">
                Editar
                <ChevronRight className="h-3 w-3 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </span>
            </div>
          </Button>
        </div>
      </div>
    </Card>
  );
}