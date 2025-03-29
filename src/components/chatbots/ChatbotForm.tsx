import { useState, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Bot, MessageSquare, Settings, Trash2, Upload, User, PlusCircle, X } from "lucide-react";
import { Chatbot } from "@/hooks/useChatbots";
import { Label } from "@/components/ui/label";

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
  })).default([]),
});

export type ChatbotFormValues = z.infer<typeof formSchema>;

interface ChatbotFormProps {
  chatbot?: Chatbot;
  onSubmit: (values: ChatbotFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function ChatbotForm({ chatbot, onSubmit, isSubmitting }: ChatbotFormProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [newKeyPoint, setNewKeyPoint] = useState("");
  const [newQAPair, setNewQAPair] = useState({ question: "", answer: "" });
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(chatbot?.avatar_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const defaultValues: ChatbotFormValues = {
    nombre: chatbot?.nombre || "",
    descripcion: chatbot?.descripcion || "",
    is_active: chatbot?.is_active ?? true,
    personalidad: chatbot?.personalidad || chatbot?.contexto?.personality || "amigable y servicial",
    tono: chatbot?.tono || chatbot?.contexto?.communicationTone || "profesional",
    instrucciones: chatbot?.instrucciones || chatbot?.contexto?.specialInstructions || "",
    avatar_url: chatbot?.avatar_url || "",
    general_context: chatbot?.contexto?.generalContext || "",
    welcome_message: chatbot?.contexto?.welcomeMessage || "¡Hola! Soy el asistente virtual. ¿En qué puedo ayudarte hoy?",
    main_purpose: chatbot?.contexto?.mainPurpose || "Asistir a los clientes",
    communication_tone: chatbot?.contexto?.communicationTone || chatbot?.tono || "profesional",
    prompt_template: chatbot?.contexto?.promptTemplate || "",
    key_points: chatbot?.contexto?.keyPoints || [],
    qa_examples: chatbot?.contexto?.qaExamples || [],
  };

  const form = useForm<ChatbotFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
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
      const fileUrl = URL.createObjectURL(file);
      setPreviewAvatar(fileUrl);

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
        form.setValue('avatar_url', fileUrl);
      }
    } catch (error) {
      console.error("Error al subir la imagen:", error);
      toast.error("Error al subir la imagen. Intente de nuevo.");
    }
  };

  const clearAvatar = () => {
    form.setValue('avatar_url', '');
    setPreviewAvatar(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFormSubmit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values);
      setActiveTab("basic");
    } catch (error) {
      console.error("Error en el envío del formulario:", error);
    }
  });

  const nextTab = () => {
    if (activeTab === "basic") setActiveTab("personality");
    else if (activeTab === "personality") setActiveTab("context");
    else if (activeTab === "context") setActiveTab("keypoints");
    else if (activeTab === "keypoints") setActiveTab("examples");
    else handleFormSubmit();
  };

  const prevTab = () => {
    if (activeTab === "examples") setActiveTab("keypoints");
    else if (activeTab === "keypoints") setActiveTab("context");
    else if (activeTab === "context") setActiveTab("personality");
    else if (activeTab === "personality") setActiveTab("basic");
  };

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div className="text-xl font-bold">
            {chatbot ? "Editar chatbot" : "Crear nuevo chatbot"}
          </div>
          
          <div className="inline-flex items-center space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={prevTab}
              disabled={activeTab === "basic"}
            >
              Atrás
            </Button>
            <Button 
              type="button" 
              size="sm"
              onClick={nextTab}
            >
              {activeTab === "examples" ? "Guardar" : "Siguiente"}
            </Button>
          </div>
        </div>

        <div className="w-full overflow-x-auto py-2 mb-6">
          <ul className="w-full flex space-x-1 relative">
            <div className="absolute h-0.5 bg-slate-200 top-5 left-0 right-8 z-0"></div>
            
            <li 
              className={`z-10 flex flex-col items-center cursor-pointer`}
              onClick={() => setActiveTab("basic")}
            >
              <div className={`w-10 h-10 flex items-center justify-center rounded-full ${activeTab === "basic" ? "bg-primary text-white" : "bg-slate-200"}`}>
                <Bot size={18} />
              </div>
              <span className={`text-xs mt-1 ${activeTab === "basic" ? "text-primary font-medium" : ""}`}>Básico</span>
            </li>
            <li 
              className={`z-10 flex flex-col items-center cursor-pointer`}
              onClick={() => setActiveTab("personality")}
            >
              <div className={`w-10 h-10 flex items-center justify-center rounded-full ${activeTab === "personality" ? "bg-primary text-white" : "bg-slate-200"}`}>
                <User size={18} />
              </div>
              <span className={`text-xs mt-1 ${activeTab === "personality" ? "text-primary font-medium" : ""}`}>Personalidad</span>
            </li>
            <li 
              className={`z-10 flex flex-col items-center cursor-pointer`}
              onClick={() => setActiveTab("context")}
            >
              <div className={`w-10 h-10 flex items-center justify-center rounded-full ${activeTab === "context" ? "bg-primary text-white" : "bg-slate-200"}`}>
                <MessageSquare size={18} />
              </div>
              <span className={`text-xs mt-1 ${activeTab === "context" ? "text-primary font-medium" : ""}`}>Contexto</span>
            </li>
            <li 
              className={`z-10 flex flex-col items-center cursor-pointer`}
              onClick={() => setActiveTab("keypoints")}
            >
              <div className={`w-10 h-10 flex items-center justify-center rounded-full ${activeTab === "keypoints" ? "bg-primary text-white" : "bg-slate-200"}`}>
                <Settings size={18} />
              </div>
              <span className={`text-xs mt-1 ${activeTab === "keypoints" ? "text-primary font-medium" : ""}`}>Puntos Clave</span>
            </li>
            <li 
              className={`z-10 flex flex-col items-center cursor-pointer`}
              onClick={() => setActiveTab("examples")}
            >
              <div className={`w-10 h-10 flex items-center justify-center rounded-full ${activeTab === "examples" ? "bg-primary text-white" : "bg-slate-200"}`}>
                <MessageSquare size={18} />
              </div>
              <span className={`text-xs mt-1 ${activeTab === "examples" ? "text-primary font-medium" : ""}`}>Ejemplos</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="basic">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
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
                        <FormDescription>
                          Una breve descripción del propósito del chatbot
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mt-6">
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
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="avatar_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avatar del Chatbot</FormLabel>
                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg bg-slate-50">
                          {previewAvatar ? (
                            <div className="relative">
                              <Avatar className="w-32 h-32">
                                <AvatarImage src={previewAvatar} alt="Avatar preview" />
                                <AvatarFallback className="text-3xl">
                                  {form.getValues().nombre?.charAt(0) || "A"}
                                </AvatarFallback>
                              </Avatar>
                              <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                                onClick={clearAvatar}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center cursor-pointer" 
                                onClick={() => fileInputRef.current?.click()}>
                              <div className="w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center mb-4">
                                <Bot size={48} className="text-slate-500" />
                              </div>
                              <Button
                                type="button" 
                                variant="outline"
                                className="gap-2"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <Upload size={16} />
                                Subir imagen
                              </Button>
                            </div>
                          )}
                          
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                          />
                          
                          <p className="text-xs text-muted-foreground mt-4 text-center">
                            Sube una imagen para personalizar el avatar de tu chatbot.<br />
                            Formatos: JPG, PNG o GIF. Máximo 5MB.
                          </p>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="personality">
              <div className="space-y-6">
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
                        Instrucciones específicas sobre cómo debe comportarse el chatbot.
                        Por ejemplo: "Intenta obtener el correo electrónico del cliente", "No prometas plazos exactos", etc.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="context">
              <div className="space-y-6">
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
                          className="min-h-[100px]"
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
                          placeholder="Ej: Asistir a los clientes con información sobre productos" 
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
                      <FormControl>
                        <Textarea 
                          placeholder="Información general sobre tu empresa, productos o servicios" 
                          className="min-h-[150px]"
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Información general que el chatbot debe conocer para responder adecuadamente
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
                          placeholder="Ej: profesional y conciso" 
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
              </div>
            </TabsContent>

            <TabsContent value="keypoints">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Puntos Clave</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Agrega puntos importantes sobre tu empresa o servicios que el chatbot debe mencionar o conocer.
                  </p>
                </div>

                <div className="flex items-end gap-3 mb-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Añade un punto clave..."
                      value={newKeyPoint}
                      onChange={(e) => setNewKeyPoint(e.target.value)}
                    />
                  </div>
                  <Button 
                    type="button" 
                    onClick={addKeyPoint}
                    disabled={!newKeyPoint.trim()}
                    className="gap-2"
                  >
                    <PlusCircle size={16} />
                    Añadir
                  </Button>
                </div>

                <div className="space-y-3 mt-4">
                  {form.getValues().key_points?.length === 0 && (
                    <div className="text-center p-6 border rounded-lg bg-slate-50">
                      <p className="text-muted-foreground">No hay puntos clave añadidos</p>
                      <p className="text-xs mt-1">Añade puntos importantes que el chatbot debe conocer</p>
                    </div>
                  )}

                  {form.getValues().key_points?.map((point, index) => (
                    <Card key={index} className="p-3 pr-2 flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-sm">{point}</p>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeKeyPoint(index)}
                      >
                        <X size={16} />
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="examples">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Ejemplos de Conversación</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Agrega ejemplos de preguntas y respuestas para enseñar al chatbot cómo debe responder.
                  </p>
                </div>

                <Card className="p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="new-question">Pregunta</Label>
                      <Input
                        id="new-question"
                        placeholder="Ej: ¿Cuáles son sus horarios de atención?"
                        value={newQAPair.question}
                        onChange={(e) => setNewQAPair({...newQAPair, question: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-answer">Respuesta</Label>
                      <Input
                        id="new-answer"
                        placeholder="Ej: Nuestro horario es de 9am a 6pm de lunes a viernes."
                        value={newQAPair.answer}
                        onChange={(e) => setNewQAPair({...newQAPair, answer: e.target.value})}
                      />
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    onClick={addQAPair}
                    disabled={!newQAPair.question.trim() || !newQAPair.answer.trim()}
                    className="w-full mt-1 gap-2"
                  >
                    <PlusCircle size={16} />
                    Añadir Ejemplo
                  </Button>
                </Card>

                <div className="space-y-4 mt-4">
                  {form.getValues().qa_examples?.length === 0 && (
                    <div className="text-center p-6 border rounded-lg bg-slate-50">
                      <p className="text-muted-foreground">No hay ejemplos añadidos</p>
                      <p className="text-xs mt-1">Añade ejemplos para mejorar las respuestas del chatbot</p>
                    </div>
                  )}

                  {form.getValues().qa_examples?.map((pair, index) => (
                    <Card key={index} className="p-4 space-y-3">
                      <div className="flex justify-between">
                        <h4 className="font-medium">Ejemplo {index + 1}</h4>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeQAPair(index)}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-sm font-medium mb-1">Pregunta:</p>
                        <p className="text-sm mb-3">{pair.question}</p>
                        <p className="text-sm font-medium mb-1">Respuesta:</p>
                        <p className="text-sm">{pair.answer}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-between pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={prevTab}
            disabled={activeTab === "basic"}
          >
            Atrás
          </Button>
          
          {activeTab === "examples" ? (
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? "Guardando..." : chatbot ? "Guardar cambios" : "Crear chatbot"}
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={nextTab}
            >
              Siguiente
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
