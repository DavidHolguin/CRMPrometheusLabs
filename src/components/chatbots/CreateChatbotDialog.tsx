
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const formSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  descripcion: z.string().optional(),
  is_active: z.boolean().default(true),
  personalidad: z.string().optional(),
  tono: z.string().optional(),
  instrucciones: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateChatbotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateChatbotDialog({ open, onOpenChange, onSuccess }: CreateChatbotDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      is_active: true,
      personalidad: "amigable y servicial",
      tono: "profesional",
      instrucciones: "",
    },
  });

  async function onSubmit(values: FormValues) {
    if (!user?.companyId) {
      toast.error("No se puede crear el chatbot. No hay empresa asociada a tu cuenta.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("chatbots")
        .insert({
          nombre: values.nombre,
          descripcion: values.descripcion || "",
          is_active: values.is_active,
          personalidad: values.personalidad || "amigable y servicial",
          tono: values.tono || "profesional",
          instrucciones: values.instrucciones || "",
          empresa_id: user.companyId,
        })
        .select("*")
        .single();

      if (error) throw error;
      
      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error creando chatbot:", error);
      toast.error("Error al crear el chatbot. Inténtelo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear nuevo chatbot</DialogTitle>
          <DialogDescription>
            Configura los detalles de tu nuevo asistente virtual
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Asistente de Ventas" {...field} />
                  </FormControl>
                  <FormDescription>
                    El nombre visible para tus clientes
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
                      placeholder="Describe el propósito de este chatbot" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personalidad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personalidad</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: amigable y servicial" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Define la personalidad con la que responderá el chatbot
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tono</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: profesional" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Define el tono de comunicación del chatbot
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instrucciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instrucciones</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Instrucciones adicionales para el comportamiento del chatbot" 
                      className="min-h-[120px]"
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Instrucciones específicas sobre cómo debe comportarse
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Activar chatbot</FormLabel>
                    <FormDescription>
                      El chatbot estará disponible inmediatamente
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creando..." : "Crear chatbot"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
