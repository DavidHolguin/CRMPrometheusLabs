
import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CanalIcon } from "./CanalIcon";
import { ChatbotCanal } from "@/hooks/useCanales";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type EditCanalDialogProps = {
  canal: ChatbotCanal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: Record<string, any>) => void;
};

// Esquemas de validación por tipo de canal
const WhatsAppSchema = z.object({
  phone_number_id: z.string().min(1, "El ID de número de teléfono es requerido"),
  access_token: z.string().min(1, "El token de acceso es requerido"),
});

const MessengerSchema = z.object({
  page_id: z.string().min(1, "El ID de página es requerido"),
  access_token: z.string().min(1, "El token de acceso es requerido"),
});

const TelegramSchema = z.object({
  bot_token: z.string().min(1, "El token del bot es requerido"),
});

const WebSchema = z.object({
  embed_code: z.string().optional(),
});

const DefaultSchema = z.object({});

export default function EditCanalDialog({ canal, open, onOpenChange, onSave }: EditCanalDialogProps) {
  // Determinar el esquema basado en el tipo de canal
  const getSchema = (tipo?: string) => {
    if (!tipo) return DefaultSchema;
    
    switch (tipo.toLowerCase()) {
      case "whatsapp":
        return WhatsAppSchema;
      case "messenger":
        return MessengerSchema;
      case "telegram":
        return TelegramSchema;
      case "web":
        return WebSchema;
      default:
        return DefaultSchema;
    }
  };

  const form = useForm<Record<string, any>>({
    resolver: zodResolver(getSchema(canal?.canal?.tipo)),
    defaultValues: canal?.configuracion || {},
  });

  // Actualizar valores cuando cambia el canal
  useEffect(() => {
    if (canal) {
      form.reset(canal.configuracion || {});
    }
  }, [canal, form]);

  // Manejar guardar
  const handleSave = (data: Record<string, any>) => {
    if (canal) {
      onSave(canal.id, data);
      onOpenChange(false);
    }
  };

  // Renderizar campos específicos según el tipo de canal
  const renderFields = () => {
    if (!canal?.canal) return null;
    
    const tipo = canal.canal.tipo.toLowerCase();
    
    switch (tipo) {
      case "whatsapp":
        return (
          <>
            <FormField
              control={form.control}
              name="phone_number_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID de número de teléfono</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    El ID del número de teléfono de WhatsApp Business.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="access_token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token de acceso</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormDescription>
                    El token de acceso de la API de WhatsApp Business.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
        
      case "messenger":
        return (
          <>
            <FormField
              control={form.control}
              name="page_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID de página</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    El ID de tu página de Facebook.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="access_token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token de acceso</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormDescription>
                    El token de acceso de la página de Facebook.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
        
      case "telegram":
        return (
          <FormField
            control={form.control}
            name="bot_token"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Token del bot</FormLabel>
                <FormControl>
                  <Input {...field} type="password" />
                </FormControl>
                <FormDescription>
                  El token que recibiste de BotFather.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );
        
      case "web":
        return (
          <FormField
            control={form.control}
            name="embed_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código de inserción (opcional)</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={4} />
                </FormControl>
                <FormDescription>
                  Código HTML para insertar el chat en tu sitio web.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );
        
      default:
        return (
          <div className="text-center py-4 text-muted-foreground">
            Este canal no requiere configuración adicional.
          </div>
        );
    }
  };

  if (!canal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {canal.canal && <CanalIcon tipo={canal.canal.tipo} size={24} />}
            <DialogTitle>Configurar {canal.canal?.nombre}</DialogTitle>
          </div>
          <DialogDescription>
            Configura los detalles de conexión para este canal.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            {renderFields()}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar configuración</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
