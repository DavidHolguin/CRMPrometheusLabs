
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { Chatbot } from "@/hooks/useChatbots";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const formSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  descripcion: z.string().optional(),
  is_active: z.boolean().default(true),
  personalidad: z.string().optional(),
  tono: z.string().optional(),
  instrucciones: z.string().optional(),
  welcome_message: z.string().optional(),
  main_purpose: z.string().optional(),
  general_context: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditChatbotDialogProps {
  chatbot: Chatbot;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditChatbotDialog({ chatbot, open, onOpenChange, onSuccess }: EditChatbotDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatbotContext, setChatbotContext] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const purposeOptions = [
    { value: "customer_support", label: "Soporte al cliente" },
    { value: "sales", label: "Ventas y conversión" },
    { value: "lead_generation", label: "Generación de leads" },
    { value: "information", label: "Información y FAQ" }
  ];

  // Fetch the chatbot context when dialog opens
  useEffect(() => {
    if (open && chatbot) {
      setIsLoading(true);
      supabase
        .from("chatbot_contextos")
        .select("*")
        .eq("chatbot_id", chatbot.id)
        .eq("tipo", "primary")
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) {
            console.error("Error fetching chatbot context:", error);
          } else {
            setChatbotContext(data);
            
            // Update form values with context data if available
            if (data) {
              form.setValue("welcome_message", data.welcome_message || "");
              form.setValue("general_context", data.general_context || "");
              form.setValue("main_purpose", data.main_purpose || "customer_support");
            }
          }
          setIsLoading(false);
        });
    }
  }, [open, chatbot]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: chatbot.nombre,
      descripcion: chatbot.descripcion || "",
      is_active: chatbot.is_active,
      personalidad: chatbot.personalidad || "",
      tono: chatbot.tono || "",
      instrucciones: chatbot.instrucciones || "",
      welcome_message: "",
      main_purpose: "customer_support",
      general_context: "",
    },
  });

  // Update form values when chatbot changes
  useEffect(() => {
    if (chatbot) {
      form.setValue("nombre", chatbot.nombre);
      form.setValue("descripcion", chatbot.descripcion || "");
      form.setValue("is_active", chatbot.is_active);
      form.setValue("personalidad", chatbot.personalidad || "");
      form.setValue("tono", chatbot.tono || "");
      form.setValue("instrucciones", chatbot.instrucciones || "");
    }
  }, [chatbot, form]);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      // Update the chatbot
      const { error } = await supabase
        .from("chatbots")
        .update({
          nombre: values.nombre,
          descripcion: values.descripcion,
          is_active: values.is_active,
          personalidad: values.personalidad,
          tono: values.tono,
          instrucciones: values.instrucciones,
          updated_at: new Date().toISOString(),
        })
        .eq("id", chatbot.id);

      if (error) throw error;

      // Update or create the chatbot context
      if (chatbotContext) {
        // Update existing context
        const { error: contextError } = await supabase
          .from("chatbot_contextos")
          .update({
            contenido: values.instrucciones || "",
            welcome_message: values.welcome_message || "",
            personality: values.personalidad || "",
            communication_tone: values.tono || "",
            main_purpose: values.main_purpose || "customer_support",
            general_context: values.general_context || "",
            special_instructions: values.instrucciones || "",
            updated_at: new Date().toISOString(),
          })
          .eq("id", chatbotContext.id);

        if (contextError) {
          console.error("Error actualizando contexto del chatbot:", contextError);
        }
      } else {
        // Create new context if it doesn't exist
        const { error: contextError } = await supabase
          .from("chatbot_contextos")
          .insert({
            chatbot_id: chatbot.id,
            tipo: "primary",
            contenido: values.instrucciones || "",
            welcome_message: values.welcome_message || "",
            personality: values.personalidad || "",
            communication_tone: values.tono || "",
            main_purpose: values.main_purpose || "customer_support",
            general_context: values.general_context || "",
            special_instructions: values.instrucciones || "",
            key_points: [],
            qa_examples: [],
            orden: 0
          });

        if (contextError) {
          console.error("Error creando contexto del chatbot:", contextError);
        }
      }
      
      toast.success("Chatbot actualizado con éxito");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error actualizando chatbot:", error);
      toast.error("Error al actualizar el chatbot");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar chatbot</DialogTitle>
          <DialogDescription>
            Modifica la configuración de tu chatbot
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-6 text-center">
            <p className="text-muted-foreground animate-pulse">Cargando configuración...</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
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
                      <Textarea {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="welcome_message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensaje de bienvenida</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>
                      Este mensaje se mostrará cuando un usuario inicie una conversación
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="personalidad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personalidad</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormDescription>
                        Define la personalidad del chatbot
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
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormDescription>
                        Define el tono de comunicación
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="main_purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Propósito principal</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione el propósito principal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {purposeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Define el objetivo principal de este chatbot
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="advanced">
                  <AccordionTrigger>Configuración avanzada</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <FormField
                        control={form.control}
                        name="general_context"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contexto general</FormLabel>
                            <FormControl>
                              <Textarea 
                                className="min-h-[100px]"
                                {...field} 
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormDescription>
                              Proporciona contexto que el chatbot debe conocer
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
                            <FormLabel>Instrucciones especiales</FormLabel>
                            <FormControl>
                              <Textarea 
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
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Activar chatbot</FormLabel>
                      <FormDescription>
                        El chatbot estará disponible para tus clientes
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
                  {isSubmitting ? "Guardando..." : "Guardar cambios"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
