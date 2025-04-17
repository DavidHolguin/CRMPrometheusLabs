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
import { toast } from "sonner";
import { Copy, Edit, MoreHorizontal, Trash2, Wand2, Code, Check } from "lucide-react";

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

  if (variant === "row") {
    return (
      <TableRow>
        <TableCell>
          <div className="font-medium">{template.nombre}</div>
          <div className="text-sm text-muted-foreground line-clamp-1">
            {template.descripcion || "Sin descripción"}
          </div>
        </TableCell>
        <TableCell>
          {template.tipo_template ? (
            <Badge variant="outline">{template.tipo_template}</Badge>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          )}
        </TableCell>
        <TableCell className="hidden md:table-cell">
          {template.variables?.length || 0}
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
    <Card className="flex flex-col overflow-hidden h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <CardTitle className="truncate text-base">
                  {template.nombre}
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent>
                <p>{template.nombre}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
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
        <div className="flex flex-wrap gap-2 mt-1">
          {template.tipo_template && (
            <Badge variant="outline" className="self-start">
              {template.tipo_template}
            </Badge>
          )}
          {!template.is_active && (
            <Badge variant="secondary" className="self-start">
              Inactivo
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <p className="text-muted-foreground text-sm line-clamp-3">
          {template.descripcion || "Sin descripción"}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between p-4 pt-0 text-xs text-muted-foreground border-t">
        <div className="flex items-center">
          <Code className="mr-1 h-3 w-3" />
          <span>
            {template.variables?.length || 0} variables
          </span>
        </div>
        <div>
          {new Date(template.updated_at).toLocaleDateString()}
        </div>
      </CardFooter>
    </Card>
  );
}