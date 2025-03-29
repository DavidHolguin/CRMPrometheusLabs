
import { useState, useRef } from "react";
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
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Upload, UserCircle, MessageSquare, Bot, Settings, Trash2, Image } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

interface CreateChatbotDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateChatbotDrawer({ open, onOpenChange, onSuccess }: CreateChatbotDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("basic");
  const [newKeyPoint, setNewKeyPoint] = useState("");
  const [newQAPair, setNewQAPair] = useState({ question: "", answer: "" });
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      avatar_url: "",
      general_context: "",
      welcome_message: "¡Hola! Soy el asistente virtual. ¿En qué puedo ayudarte hoy?",
      main_purpose: "Asistir a los clientes",
      communication_tone: "profesional",
      prompt_template: "",
      key_points: [],
      qa_examples: []
    },
  });

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
      if (user?.companyId) {
        const fileName = `chatbot-avatar-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(`chatbots/${user.companyId}/${fileName}`, file);

        if (error) {
          throw error;
        }

        if (data) {
          const { data: urlData } = await supabase.storage
            .from('avatars')
            .getPublicUrl(`chatbots/${user.companyId}/${fileName}`);

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
    if (!user?.companyId) {
      toast.error("No se puede crear el chatbot. No hay empresa asociada a tu cuenta.");
      return;
    }

    setIsSubmitting(true);
    try {
      // First create the chatbot
      const { data: chatbot, error: chatbotError } = await supabase
        .from("chatbots")
        .insert({
          nombre: values.nombre,
          descripcion: values.descripcion || "",
          is_active: values.is_active,
          personalidad: values.personalidad || "amigable y servicial",
          tono: values.tono || "profesional",
          instrucciones: values.instrucciones || "",
          empresa_id: user.companyId,
          avatar_url: values.avatar_url || null
        })
        .select("*")
        .single();

      if (chatbotError) throw chatbotError;
      
      // Then create the context
      const { error: contextError } = await supabase
        .from("chatbot_contextos")
        .insert({
          chatbot_id: chatbot.id,
          tipo: "principal",
          contenido: "Contexto principal",
          general_context: values.general_context || "",
          welcome_message: values.welcome_message || "¡Hola! Soy el asistente virtual. ¿En qué puedo ayudarte hoy?",
          personality: values.personalidad || "amigable y servicial",
          communication_tone: values.communication_tone || values.tono || "profesional",
          main_purpose: values.main_purpose || "Asistir a los clientes",
          special_instructions: values.instrucciones || "",
          prompt_template: values.prompt_template || "",
          key_points: values.key_points || [],
          qa_examples: values.qa_examples || []
        });

      if (contextError) throw contextError;
      
      form.reset();
      setPreviewAvatar(null);
      onOpenChange(false);
      onSuccess();
      toast.success("Chatbot creado con éxito");
    } catch (error) {
      console.error("Error creando chatbot:", error);
      toast.error("Error al crear el chatbot. Inténtelo de nuevo.");
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
      { id: "basic", icon: <Bot size={16} />, label: "Básico" },
      { id: "personality", icon: <UserCircle size={16} />, label: "Personalidad" },
      { id: "context", icon: <MessageSquare size={16} />, label: "Contexto" },
      { id: "keypoints", icon: <Settings size={16} />, label: "Puntos Clave" },
      { id: "examples", icon: <MessageSquare size={16} />, label: "Ejemplos" },
    ];

    return (
      <div className="flex justify-center mb-6 overflow-x-auto py-2">
        <div className="inline-flex items-center space-x-2 flex-nowrap">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div 
                className={`flex items-center justify-center w-10 h-10 rounded-full border ${
                  currentStep === step.id 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-muted text-muted-foreground border-muted-foreground"
                } cursor-pointer`}
                onClick={() => setCurrentStep(step.id as Step)}
              >
                <span className="font-medium text-sm">{index + 1}</span>
              </div>
              <span className={`mx-1 text-xs ${currentStep === step.id ? "text-primary font-medium" : "text-muted-foreground"}`}>
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className="w-4 h-0.5 bg-muted mx-1"></div>
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
              name="avatar_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar del Chatbot</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input 
                          placeholder="URL de la imagen del avatar" 
                          value={field.value || ""}
                          onChange={(e) => handleAvatarUrlChange(e.target.value)}
                        />
                        <Button 
                          type="button" 
                          size="icon" 
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload size={16} />
                        </Button>
                      </div>
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />

                      {previewAvatar && (
                        <div className="relative w-20 h-20">
                          <Avatar className="w-20 h-20">
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

                      <p className="text-xs text-muted-foreground">
                        Sube una imagen o proporciona una URL para el avatar del chatbot
                      </p>
                    </div>
                  </FormControl>
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
          </>
        );
      case "personality":
        return (
          <>
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
                  <FormLabel>Instrucciones Especiales</FormLabel>
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
          </>
        );
      case "context":
        return (
          <>
            <FormField
              control={form.control}
              name="welcome_message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensaje de Bienvenida</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ej: ¡Hola! Soy el asistente virtual. ¿En qué puedo ayudarte hoy?" 
                      {...field} 
                      value={field.value || ""}
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
                      placeholder="Ej: Asistir a los clientes" 
                      {...field} 
                      value={field.value || ""}
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
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-primary/10">Información de empresa</Badge>
                    <Badge variant="outline" className="bg-primary/10">Productos y servicios</Badge>
                  </div>
                  <FormControl>
                    <Textarea 
                      placeholder="Contexto general sobre la empresa, productos, servicios, etc." 
                      className="min-h-[150px]"
                      {...field} 
                      value={field.value || ""}
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
                <FormItem>
                  <FormLabel>Tono de Comunicación</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: profesional, amigable, etc." 
                      {...field} 
                      value={field.value || ""}
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
                      className="min-h-[120px]"
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
              <h3 className="text-lg font-medium">Puntos Clave</h3>
              <p className="text-sm text-muted-foreground">
                Agrega puntos clave que el chatbot debe conocer y enfatizar
              </p>
              
              <div className="flex gap-2">
                <Input 
                  placeholder="Nuevo punto clave" 
                  value={newKeyPoint}
                  onChange={(e) => setNewKeyPoint(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addKeyPoint()}
                />
                <Button type="button" onClick={addKeyPoint}>Agregar</Button>
              </div>
              
              <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto">
                {form.getValues().key_points?.map((point, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <span className="text-sm">{point}</span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeKeyPoint(index)}
                    >
                      Eliminar
                    </Button>
                  </div>
                ))}
                {form.getValues().key_points?.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No hay puntos clave añadidos</p>
                )}
              </div>
            </div>
          </>
        );
      case "examples":
        return (
          <>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Ejemplos de Preguntas y Respuestas</h3>
              <p className="text-sm text-muted-foreground">
                Agrega ejemplos de preguntas y respuestas que ayuden al chatbot a entender cómo debe interactuar
              </p>
              
              <div className="space-y-2">
                <Input 
                  placeholder="Pregunta" 
                  value={newQAPair.question}
                  onChange={(e) => setNewQAPair({...newQAPair, question: e.target.value})}
                />
                <Textarea 
                  placeholder="Respuesta" 
                  value={newQAPair.answer}
                  onChange={(e) => setNewQAPair({...newQAPair, answer: e.target.value})}
                  className="min-h-[100px]"
                />
                <Button type="button" onClick={addQAPair} className="w-full">Agregar Par Q&A</Button>
              </div>
              
              <div className="space-y-4 mt-4 max-h-[300px] overflow-y-auto">
                {form.getValues().qa_examples?.map((pair, index) => (
                  <div key={index} className="p-4 bg-muted rounded-md space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Pregunta {index + 1}</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeQAPair(index)}
                      >
                        Eliminar
                      </Button>
                    </div>
                    <p className="text-sm">{pair.question}</p>
                    <div className="pt-2">
                      <span className="font-medium">Respuesta:</span>
                      <p className="text-sm mt-1">{pair.answer}</p>
                    </div>
                  </div>
                ))}
                {form.getValues().qa_examples?.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No hay ejemplos añadidos</p>
                )}
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
      <DrawerContent className="max-h-[90vh] h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="text-xl font-bold text-center">Crear Nuevo Chatbot</DrawerTitle>
          <DrawerDescription className="text-center">
            Configura el asistente virtual para tu empresa
          </DrawerDescription>
        </DrawerHeader>

        {renderStepIndicator()}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <ScrollArea className="px-6 flex-1 overflow-y-auto">
              <div className="space-y-6 py-2 pr-4 pb-16">
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
                  {currentStep === "examples" ? (isSubmitting ? "Creando..." : "Crear Chatbot") : "Siguiente"}
                </Button>
              </div>
            </DrawerFooter>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  );
}
