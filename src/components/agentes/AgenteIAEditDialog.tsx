import React, { useEffect, useState } from "react";
import { AgenteIA } from "@/hooks/useAgentesIA";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Info } from "lucide-react";

// Esquema de validación para el formulario
const formSchema = z.object({
  nombre: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  descripcion: z.string().optional(),
  tipo: z.string().min(1, {
    message: "Selecciona un tipo de agente.",
  }),
  nivel_autonomia: z.coerce.number().min(1).max(5),
  status: z.string().min(1, {
    message: "Selecciona un estado.",
  }),
});

type FormData = z.infer<typeof formSchema>;

interface AgenteIAEditDialogProps {
  agente?: AgenteIA;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: FormData) => void;
  isLoading?: boolean;
}

export function AgenteIAEditDialog({
  agente,
  open,
  onOpenChange,
  onSave,
  isLoading = false,
}: AgenteIAEditDialogProps) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: agente?.nombre || "",
      descripcion: agente?.descripcion || "",
      tipo: agente?.tipo || "asistente",
      nivel_autonomia: agente?.nivel_autonomia || 1,
      status: agente?.status || "entrenamiento",
    },
  });

  useEffect(() => {
    if (agente) {
      form.reset({
        nombre: agente.nombre || "",
        descripcion: agente.descripcion || "",
        tipo: agente.tipo || "asistente",
        nivel_autonomia: agente.nivel_autonomia || 1,
        status: agente.status || "entrenamiento",
      });
      setAvatarPreview(agente.avatar_url);
    } else {
      form.reset({
        nombre: "",
        descripcion: "",
        tipo: "asistente",
        nivel_autonomia: 1,
        status: "entrenamiento",
      });
      setAvatarPreview(null);
    }
  }, [agente, form]);

  const getInitials = (name: string) => {
    if (!name) return "AI";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSubmit = (values: FormData) => {
    onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {agente ? "Editar agente IA" : "Crear nuevo agente IA"}
          </DialogTitle>
          <DialogDescription>
            {agente
              ? "Actualiza la información del agente de inteligencia artificial."
              : "Crea un nuevo agente de inteligencia artificial para tu empresa."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6 pt-2"
          >
            <div className="flex justify-center">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={avatarPreview || undefined}
                  alt={form.watch("nombre")}
                />
                <AvatarFallback className="text-xl">
                  {getInitials(form.watch("nombre") || "AI")}
                </AvatarFallback>
              </Avatar>
            </div>

            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del agente</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Asistente de Ventas" {...field} />
                  </FormControl>
                  <FormDescription>
                    El nombre que se mostrará en la interfaz.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe brevemente qué hace este agente..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Tipo
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Define la función principal del agente</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="asistente">Asistente</SelectItem>
                        <SelectItem value="analista">Analista</SelectItem>
                        <SelectItem value="automatizacion">
                          Automatización
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nivel_autonomia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Nivel de autonomía
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Del 1 al 5, qué tan autónomo es el agente</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar nivel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Nivel 1 - Básico</SelectItem>
                        <SelectItem value="2">Nivel 2 - Limitado</SelectItem>
                        <SelectItem value="3">Nivel 3 - Moderado</SelectItem>
                        <SelectItem value="4">Nivel 4 - Alto</SelectItem>
                        <SelectItem value="5">Nivel 5 - Completo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="entrenamiento">
                        En entrenamiento
                      </SelectItem>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    El estado actual del agente en la plataforma.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}