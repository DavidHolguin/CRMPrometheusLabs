
import { useState, useEffect, useRef } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Upload, UserCircle, MessageSquare, Bot, Settings, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// Steps for the form
type Step = "basic" | "personality" | "context" | "keypoints" | "examples";

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
  key_points: z.array(z.string()).default([]),
  qa_examples: z.array(z.object({
    question: z.string(),
    answer: z.string()
  })).default([])
});

type FormValues = z.infer<typeof formSchema>;

interface EditChatbotDrawerProps {
  chatbot: Chatbot;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditChatbotDrawer({ chatbot, open, onOpenChange, onSuccess }: EditChatbotDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("basic");
  const [newKeyPoint, setNewKeyPoint] = useState("");
  const [newQAPair, setNewQAPair] = useState({ question: "", answer: "" });
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
      key_points: [],
      qa_examples: []
    },
  });

  // Update form values when chatbot changes
  useEffect(() => {
    if (open && chatbot) {
      console.log("Resetting form with chatbot data:", chatbot);
      
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
        key_points: chatbot.contexto?.keyPoints || [],
        qa_examples: chatbot.contexto?.qaExamples || []
      });
      
      // Set preview avatar if exists
      setPreviewAvatar(chatbot.avatar_url);
    }
  }, [chatbot, form, open]);

  const addKeyPoint = () => {
    if (newKeyPoint.trim()) {
      const currentKeyPoints = form.getValues().key_points || [];
      form.setValue('key_points', [...currentKeyPoints, newKeyPoint]);
      setNewKeyPoint("");
    }
  };

  const removeKeyPoint = (index: number) => {
    const currentKeyPoints = form.getValues().key_points || [];
    form.setValue('key_points', currentKeyPoints.filter((_, i) => i !== index));
  };

  const addQAPair = () => {
    if (newQAPair.question.trim() && newQAPair.answer.trim()) {
      const currentQAPairs = form.getValues().qa_examples || [];
      form.setValue('qa_examples', [...currentQAPairs, newQAPair]);
      setNewQAPair({ question: "", answer: "" });
    }
  };

  const removeQAPair = (index: number) => {
    const currentQAPairs = form.getValues().qa_examples || [];
    form.setValue('qa_examples', currentQAPairs.filter((_, i) => i !== index));
  };

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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
            key_points: values.key_points || [],
            qa_examples: values.qa_examples || [],
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
            key_points: values.key_points || [],
            qa_examples: values.qa_examples || []
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

  const goToNextStep = () => {
    const steps: Step[] = ["basic", "personality", "context", "keypoints", "examples"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    } else {
      form.handleSubmit(onSubmit)();
    }
  };

  const goToPreviousStep = () => {
    const steps: Step[] = ["basic", "personality", "context", "keypoints", "examples"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: "basic", label: "Básico" },
      { id: "personality", label: "Personalidad" },
      { id: "context", label: "Contexto" },
      { id: "keypoints", label: "Puntos Clave" },
      { id: "examples", label: "Ejemplos" },
    ];

    return (
      <div className="flex justify-center mb-6 overflow-x-auto py-2">
        <div className="inline-flex items-center space-x-1 md:space-x-2 flex-nowrap">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                type="button"
                className={`flex flex-col items-center ${
                  currentStep === step.id ? "" : "opacity-70"
                }`}
                onClick={() => setCurrentStep(step.id as Step)}
              >
                <div 
                  className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full border-2 ${
                    currentStep === step.id 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-muted text-muted-foreground border-muted-foreground/30"
                  }`}
                >
                  <span className="font-medium text-sm">{index + 1}</span>
                </div>
                <span className={`text-xs mt-1 ${currentStep === step.id ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div className="w-4 h-0.5 bg-muted mx-1 hidden md:block"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "basic":
        return (
          <>
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-base">Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} className="text-base" placeholder="Nombre visible para tus clientes" />
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
                <FormItem className="mb-4">
                  <FormLabel className="text-base">Descripción</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      value={field.value || ""}
                      className="min-h-[100px] text-base"
                      placeholder="Describe brevemente la función de este chatbot"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-base">Avatar del Chatbot</FormLabel>
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
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1"
                      >
                        <Upload size={16} />
                        <span className="hidden md:inline">Subir</span>
                      </Button>
                    </div>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />

                    <div className="flex items-center space-x-4">
                      {previewAvatar && (
                        <div className="relative w-16 h-16 md:w-20 md:h-20">
                          <Avatar className="w-16 h-16 md:w-20 md:h-20 border">
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
                      )}
                      
                      <p className="text-sm text-muted-foreground flex-1">
                        Sube una imagen o proporciona una URL para el avatar del chatbot.
                        El avatar se mostrará en el widget de chat.
                      </p>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mb-4 mt-6">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Activar chatbot</FormLabel>
                    <FormDescription>
                      El chatbot estará disponible para tus clientes
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-primary"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        );
      case "personality":
        return (
          <>
            <FormField
              control={form.control}
              name="personalidad"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-base">Personalidad</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      value={field.value || ""}
                      className="text-base"
                      placeholder="Ej: Amigable, profesional, formal, técnico..."
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
                <FormItem className="mb-4">
                  <FormLabel className="text-base">Tono</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      value={field.value || ""}
                      className="text-base"
                      placeholder="Ej: Formal, casual, entusiasta, serio..."
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
                <FormItem className="mb-4">
                  <FormLabel className="text-base">Instrucciones Especiales</FormLabel>
                  <FormControl>
                    <Textarea 
                      className="min-h-[150px] text-base"
                      {...field} 
                      value={field.value || ""}
                      placeholder="Instrucciones específicas sobre cómo debe comportarse el chatbot..."
                    />
                  </FormControl>
                  <FormDescription>
                    Instrucciones específicas sobre cómo debe comportarse
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      case "context":
        return (
          <>
            <FormField
              control={form.control}
              name="welcome_message"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-base">Mensaje de Bienvenida</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      value={field.value || ""}
                      className="min-h-[100px] text-base"
                      placeholder="Ej: ¡Hola! Soy el asistente virtual de [Empresa]. ¿En qué puedo ayudarte hoy?"
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
                <FormItem className="mb-4">
                  <FormLabel className="text-base">Propósito Principal</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      value={field.value || ""}
                      className="text-base"
                      placeholder="Ej: Asistir a clientes con información sobre productos"
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
                <FormItem className="mb-4">
                  <FormLabel className="text-base">Contexto General</FormLabel>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-primary/10">Información de empresa</Badge>
                    <Badge variant="outline" className="bg-primary/10">Productos y servicios</Badge>
                  </div>
                  <FormControl>
                    <Textarea 
                      className="min-h-[150px] text-base"
                      {...field} 
                      value={field.value || ""}
                      placeholder="Información general sobre tu empresa, productos, servicios..."
                    />
                  </FormControl>
                  <FormDescription>
                    Información general que el chatbot debe conocer. Incluye automáticamente datos de tu empresa y servicios.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="communication_tone"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-base">Tono de Comunicación</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      value={field.value || ""}
                      className="text-base"
                      placeholder="Ej: Profesional, formal, casual, técnico..."
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
                <FormItem className="mb-4">
                  <FormLabel className="text-base">Plantilla de Prompt <Badge variant="outline" className="ml-2">Avanzado</Badge></FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Plantilla personalizada para generar los prompts del chatbot" 
                      className="min-h-[120px] text-base font-mono text-sm"
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
          </>
        );
      case "keypoints":
        return (
          <>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Puntos Clave</h3>
                <Badge variant="outline">{form.getValues().key_points?.length || 0} puntos</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Agrega puntos clave que el chatbot debe conocer y enfatizar en sus respuestas
              </p>
              
              <div className="flex gap-2">
                <Input 
                  placeholder="Nuevo punto clave" 
                  value={newKeyPoint}
                  onChange={(e) => setNewKeyPoint(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addKeyPoint()}
                  className="flex-1 text-base"
                />
                <Button 
                  type="button" 
                  onClick={addKeyPoint}
                  className="whitespace-nowrap"
                >
                  Agregar
                </Button>
              </div>
              
              <ScrollArea className="h-[300px] border rounded-md p-2">
                <div className="space-y-2">
                  {form.getValues().key_points?.map((point, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <span className="text-sm mr-2">{point}</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeKeyPoint(index)}
                        className="shrink-0"
                      >
                        <Trash2 size={16} className="text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {(!form.getValues().key_points || form.getValues().key_points.length === 0) && (
                    <p className="text-sm text-muted-foreground italic p-3">No hay puntos clave añadidos</p>
                  )}
                </div>
              </ScrollArea>

              <div className="bg-muted/30 rounded-md p-3 text-sm">
                <p className="font-medium">Consejos para puntos clave efectivos:</p>
                <ul className="list-disc list-inside mt-1 text-muted-foreground">
                  <li>Incluye información específica que el chatbot debe destacar</li>
                  <li>Añade datos importantes sobre tus productos o servicios</li>
                  <li>Incluye elementos diferenciadores de tu empresa</li>
                </ul>
              </div>
            </div>
          </>
        );
      case "examples":
        return (
          <>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Ejemplos de Preguntas y Respuestas</h3>
                <Badge variant="outline">{form.getValues().qa_examples?.length || 0} ejemplos</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Agrega ejemplos de preguntas y respuestas que ayuden al chatbot a entender cómo debe interactuar
              </p>
              
              <div className="p-4 border rounded-md space-y-3">
                <Input 
                  placeholder="Pregunta de ejemplo" 
                  value={newQAPair.question}
                  onChange={(e) => setNewQAPair({...newQAPair, question: e.target.value})}
                  className="text-base"
                />
                <Textarea 
                  placeholder="Respuesta de ejemplo" 
                  value={newQAPair.answer}
                  onChange={(e) => setNewQAPair({...newQAPair, answer: e.target.value})}
                  className="min-h-[100px] text-base"
                />
                <Button 
                  type="button" 
                  onClick={addQAPair} 
                  className="w-full"
                  variant="outline"
                >
                  Agregar Ejemplo
                </Button>
              </div>
              
              <ScrollArea className="h-[300px] border rounded-md p-2">
                <div className="space-y-4">
                  {form.getValues().qa_examples?.map((pair, index) => (
                    <div key={index} className="p-4 bg-muted rounded-md space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Pregunta {index + 1}</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeQAPair(index)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 size={14} className="text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                      <p className="text-sm font-medium bg-background p-2 rounded border">{pair.question}</p>
                      <Separator />
                      <div className="pt-1">
                        <span className="font-medium text-sm">Respuesta:</span>
                        <p className="text-sm mt-1 bg-background p-2 rounded border">{pair.answer}</p>
                      </div>
                    </div>
                  ))}
                  {(!form.getValues().qa_examples || form.getValues().qa_examples.length === 0) && (
                    <p className="text-sm text-muted-foreground italic p-3">No hay ejemplos añadidos</p>
                  )}
                </div>
              </ScrollArea>
              
              <div className="bg-muted/30 rounded-md p-3 text-sm">
                <p className="font-medium">Consejos para ejemplos efectivos:</p>
                <ul className="list-disc list-inside mt-1 text-muted-foreground">
                  <li>Incluye preguntas frecuentes de tus clientes</li>
                  <li>Proporciona respuestas claras y concisas</li>
                  <li>Añade ejemplos específicos para tu sector</li>
                </ul>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90dvh] h-[95dvh]">
        <DrawerHeader className="text-center border-b pb-4 pt-4">
          <DrawerTitle className="text-xl font-bold">Editar Chatbot</DrawerTitle>
          <DrawerDescription>
            Modifica la configuración del chatbot "{chatbot.nombre}"
          </DrawerDescription>
        </DrawerHeader>

        {renderStepIndicator()}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <ScrollArea className="px-6 flex-1 overflow-y-auto">
              <div className="space-y-6 py-4 pr-4 pb-16">
                {renderStepContent()}
              </div>
            </ScrollArea>

            <DrawerFooter className="border-t pt-4 mt-auto">
              <div className="flex justify-between w-full">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={currentStep === "basic" ? () => onOpenChange(false) : goToPreviousStep}
                >
                  {currentStep === "basic" ? "Cancelar" : "Anterior"}
                </Button>
                <Button 
                  type="button" 
                  onClick={goToNextStep}
                  disabled={isSubmitting}
                >
                  {currentStep === "examples" ? (isSubmitting ? "Guardando..." : "Guardar Cambios") : "Siguiente"}
                </Button>
              </div>
            </DrawerFooter>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  );
}
