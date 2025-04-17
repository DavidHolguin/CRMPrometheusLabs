
import { useState, useEffect } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  descripcion: z.string().optional(),
  is_active: z.boolean().default(true),
  personalidad: z.string().optional(),
  tono: z.string().optional(),
  instrucciones: z.string().optional(),
  avatar_url: z.string().optional(),
  general_context: z.string().optional(),
  welcome_message: z.string().optional(),
  main_purpose: z.string().optional(),
  communication_tone: z.string().optional(),
  prompt_template: z.string().optional(),
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
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("basic");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      is_active: true,
      personalidad: "",
      tono: "",
      instrucciones: "",
      avatar_url: "",
      general_context: "",
      welcome_message: "",
      main_purpose: "",
      communication_tone: "",
      prompt_template: "",
    },
  });

  // Update form values when chatbot changes
  useEffect(() => {
    if (open && chatbot) {
      // Reset the form with the chatbot data
      form.reset({
        nombre: chatbot.nombre || "",
        descripcion: chatbot.descripcion || "",
        is_active: chatbot.is_active,
        personalidad: chatbot.personalidad || "",
        tono: chatbot.tono || "",
        instrucciones: chatbot.instrucciones || "",
        avatar_url: chatbot.avatar_url || "",
        general_context: chatbot.contexto?.generalContext || "",
        welcome_message: chatbot.contexto?.welcomeMessage || "",
        main_purpose: chatbot.contexto?.mainPurpose || "",
        communication_tone: chatbot.contexto?.communicationTone || "",
        prompt_template: chatbot.contexto?.promptTemplate || "",
      });
      
      // Set preview avatar if exists
      setPreviewAvatar(chatbot.avatar_url);
    }
  }, [chatbot, form, open]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen es demasiado grande. Máximo 5MB.");
      return;
    }

    try {
      // Mostrar vista previa
      const fileUrl = URL.createObjectURL(file);
      setPreviewAvatar(fileUrl);

      // Si hay una empresa ID, intentamos subir el archivo a Supabase
      if (chatbot.empresa_id) {
        const fileName = `chatbot-avatar-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(`chatbots/${chatbot.empresa_id}/${fileName}`, file);

        if (error) {
          throw error;
        }

        if (data) {
          const { data: urlData } = await supabase.storage
            .from('avatars')
            .getPublicUrl(`chatbots/${chatbot.empresa_id}/${fileName}`);

          form.setValue('avatar_url', urlData.publicUrl);
          toast.success("Imagen subida exitosamente");
        }
      } else {
        // Si no hay ID de empresa, solo usamos la URL para el formulario
        form.setValue('avatar_url', fileUrl);
      }
    } catch (error) {
      console.error("Error al subir la imagen:", error);
      toast.error("Error al subir la imagen. Intente de nuevo.");
    }
  };

  const handleAvatarUrlChange = (url: string) => {
    form.setValue('avatar_url', url);
    if (url) {
      setPreviewAvatar(url);
    } else {
      setPreviewAvatar(null);
    }
  };

  const clearAvatar = () => {
    form.setValue('avatar_url', '');
    setPreviewAvatar(null);
  };

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      // Update the chatbot
      const { error: chatbotError } = await supabase
        .from("chatbots")
        .update({
          nombre: values.nombre,
          descripcion: values.descripcion,
          is_active: values.is_active,
          personalidad: values.personalidad,
          tono: values.tono,
          instrucciones: values.instrucciones,
          avatar_url: values.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", chatbot.id);

      if (chatbotError) throw chatbotError;
      
      // Get the context ID or create a new one if it doesn't exist
      const { data: contextData, error: contextQueryError } = await supabase
        .from("chatbot_contextos")
        .select("id")
        .eq("chatbot_id", chatbot.id)
        .maybeSingle();
      
      if (contextQueryError) throw contextQueryError;
      
      if (contextData) {
        // Update existing context
        const { error: updateContextError } = await supabase
          .from("chatbot_contextos")
          .update({
            general_context: values.general_context || "",
            welcome_message: values.welcome_message || "",
            personality: values.personalidad || "",
            communication_tone: values.communication_tone || values.tono || "",
            main_purpose: values.main_purpose || "",
            special_instructions: values.instrucciones || "",
            prompt_template: values.prompt_template || "",
            updated_at: new Date().toISOString(),
          })
          .eq("id", contextData.id);
        
        if (updateContextError) throw updateContextError;
      } else {
        // Create new context
        const { error: createContextError } = await supabase
          .from("chatbot_contextos")
          .insert({
            chatbot_id: chatbot.id,
            tipo: "principal",
            contenido: "Contexto principal",
            general_context: values.general_context || "",
            welcome_message: values.welcome_message || "",
            personality: values.personalidad || "",
            communication_tone: values.communication_tone || values.tono || "",
            main_purpose: values.main_purpose || "",
            special_instructions: values.instrucciones || "",
            prompt_template: values.prompt_template || "",
          });
        
        if (createContextError) throw createContextError;
      }
      
      onOpenChange(false);
      onSuccess();
      toast.success("Chatbot actualizado con éxito");
    } catch (error) {
      console.error("Error actualizando chatbot:", error);
      toast.error("Error al actualizar el chatbot. Inténtelo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Editar chatbot</DialogTitle>
          <DialogDescription>
            Modifica la configuración de tu chatbot
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="personality">Personalidad</TabsTrigger>
            <TabsTrigger value="context">Contexto</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <ScrollArea className="pr-4 h-[400px]">
                <TabsContent value="basic" className="space-y-4 mt-0">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input {...field} className="text-base" />
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
                          <Textarea {...field} value={field.value || ""} className="text-base min-h-[100px]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="avatar_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avatar del Chatbot</FormLabel>
                        <div className="space-y-3">
                          <div className="flex gap-2 items-center">
                            <Input 
                              placeholder="URL de la imagen del avatar" 
                              value={field.value || ""}
                              onChange={(e) => handleAvatarUrlChange(e.target.value)}
                              className="flex-1 text-base"
                            />
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={() => document.getElementById('avatar-upload')?.click()}
                              className="flex items-center gap-1"
                            >
                              <Upload size={16} />
                              <span className="hidden sm:inline">Subir</span>
                            </Button>
                          </div>
                          
                          <input
                            id="avatar-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                          />

                          {previewAvatar && (
                            <div className="flex items-center space-x-4">
                              <div className="relative w-16 h-16">
                                <Avatar className="w-16 h-16 border">
                                  <AvatarImage src={previewAvatar} alt="Avatar preview" />
                                  <AvatarFallback className="text-xl">
                                    {form.getValues().nombre?.charAt(0) || "A"}
                                  </AvatarFallback>
                                </Avatar>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="destructive"
                                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                  onClick={clearAvatar}
                                >
                                  <Trash2 size={12} />
                                </Button>
                              </div>
                              
                              <p className="text-sm text-muted-foreground">
                                Avatar actual del chatbot
                              </p>
                            </div>
                          )}
                        </div>
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
                </TabsContent>

                <TabsContent value="personality" className="space-y-4 mt-0">
                  <FormField
                    control={form.control}
                    name="personalidad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personalidad</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} className="text-base" />
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
                          <Input {...field} value={field.value || ""} className="text-base" />
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
                            className="min-h-[120px] text-base"
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
                </TabsContent>

                <TabsContent value="context" className="space-y-4 mt-0">
                  <FormField
                    control={form.control}
                    name="welcome_message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mensaje de Bienvenida</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            value={field.value || ""}
                            className="min-h-[100px] text-base"
                          />
                        </FormControl>
                        <FormDescription>
                          Mensaje que se mostrará al iniciar la conversación
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="main_purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Propósito Principal</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            value={field.value || ""}
                            className="text-base"
                          />
                        </FormControl>
                        <FormDescription>
                          Propósito principal del chatbot
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="general_context"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contexto General</FormLabel>
                        <FormControl>
                          <Textarea 
                            className="min-h-[120px] text-base"
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Información general que el chatbot debe conocer
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="communication_tone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tono de Comunicación</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            value={field.value || ""}
                            className="text-base"
                          />
                        </FormControl>
                        <FormDescription>
                          Tono específico de comunicación del chatbot
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="prompt_template"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plantilla de Prompt</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Plantilla personalizada para generar los prompts del chatbot" 
                            className="min-h-[120px] font-mono text-sm"
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Plantilla avanzada para personalizar cómo se generan los prompts (opcional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </ScrollArea>

              <DialogFooter className="pt-2 border-t mt-6">
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
