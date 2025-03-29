import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Upload, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckIcon } from "lucide-react";
import { FAQ } from "@/types/chatbot";

const OnboardingChatbot = () => {
  const navigate = useNavigate();
  const { createChatbot, setOnboardingCompleted } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  
  const [chatbot, setChatbot] = useState({
    name: "",
    welcomeMessage: "¡Hola! Soy el asistente virtual. ¿En qué puedo ayudarte hoy?",
    persona: "helpful",
    channels: ["website"],
    customInstructions: "",
    generalContext: "",
    communicationTone: "professional",
    mainPurpose: "customer_support"
  });
  
  const [faqs, setFaqs] = useState<FAQ[]>([
    { id: crypto.randomUUID(), question: "", answer: "" }
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setChatbot(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setChatbot(prev => ({ ...prev, [field]: value }));
  };
  
  const addFaq = () => {
    setFaqs([...faqs, { id: crypto.randomUUID(), question: "", answer: "" }]);
  };
  
  const removeFaq = (id: string) => {
    if (faqs.length === 1) {
      toast({
        title: "Información",
        description: "Debe tener al menos una pregunta frecuente"
      });
      return;
    }
    setFaqs(faqs.filter(faq => faq.id !== id));
  };
  
  const updateFaq = (id: string, field: 'question' | 'answer', value: string) => {
    setFaqs(faqs.map(faq => 
      faq.id === id ? { ...faq, [field]: value } : faq
    ));
  };
  
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo es demasiado grande. Máximo 2MB.",
        variant: "destructive",
      });
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen.",
        variant: "destructive",
      });
      return;
    }
    
    setAvatarFile(file);
    
    const objectUrl = URL.createObjectURL(file);
    setAvatarUrl(objectUrl);
  };
  
  const removeAvatar = () => {
    setAvatarFile(null);
    if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    setAvatarUrl(null);
  };

  const personaDescriptions = {
    friendly: "Amigable y cercano, conversacional y empático",
    professional: "Profesional y formal, preciso y directo",
    helpful: "Servicial y útil, enfocado en soluciones prácticas",
    enthusiastic: "Entusiasta y enérgico, motivador y positivo"
  };

  const purposeOptions = [
    { value: "customer_support", label: "Soporte al cliente" },
    { value: "sales", label: "Ventas y conversión" },
    { value: "lead_generation", label: "Generación de leads" },
    { value: "information", label: "Información y FAQ" }
  ];

  const toneOptions = [
    { value: "casual", label: "Casual e informal" },
    { value: "professional", label: "Profesional y formal" },
    { value: "friendly", label: "Amigable y cercano" },
    { value: "technical", label: "Técnico y detallado" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chatbot.name) {
      toast({
        title: "Error",
        description: "Por favor, asigne un nombre a su chatbot",
        variant: "destructive",
      });
      return;
    }
    
    const invalidFaqs = faqs.filter(faq => !faq.question.trim() || !faq.answer.trim());
    if (faqs.some(faq => faq.question.trim() || faq.answer.trim()) && invalidFaqs.length > 0) {
      toast({
        title: "Error",
        description: "Todas las preguntas frecuentes deben tener pregunta y respuesta",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const validFaqs = faqs.filter(faq => faq.question.trim() && faq.answer.trim());
      
      // Create the chatbot with enhanced context data
      await createChatbot({
        ...chatbot,
        avatarFile: avatarFile,
        faqs: validFaqs
      });
      
      // Mark onboarding as completed
      await setOnboardingCompleted();
      
      // Short delay to ensure database updates are processed
      setTimeout(() => {
        toast({
          title: "¡Configuración completada!",
          description: "Su chatbot ha sido configurado con éxito. Redirigiendo al dashboard...",
        });
        
        // Explicitly redirect to dashboard
        navigate("/dashboard", { replace: true });
      }, 1000);
    } catch (error) {
      console.error("Error al configurar el chatbot:", error);
      toast({
        title: "Error",
        description: "No se pudo configurar el chatbot. Por favor, intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Configure su chatbot</h1>
        <p className="text-muted-foreground">
          Personalice el comportamiento y apariencia de su chatbot de IA
        </p>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Ejemplos de configuración</CardTitle>
          <CardDescription>
            Estos son ejemplos de cómo configurar su chatbot:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Nombre:</strong> AsistenteAI, VendedorVirtual, SoporteTécnico</p>
            <p><strong>Mensaje de bienvenida:</strong> "¡Hola! Soy el asistente virtual de [Empresa]. ¿En qué puedo ayudarte hoy?"</p>
            <p><strong>Preguntas frecuentes:</strong> "¿Cuáles son sus horarios de atención?", "¿Cómo puedo realizar un pedido?", "¿Qué formas de pago aceptan?"</p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre del chatbot <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={chatbot.name}
                  onChange={handleChange}
                  placeholder="Asistente Virtual"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="persona">Personalidad</Label>
                <Select
                  value={chatbot.persona}
                  onValueChange={(value) => handleSelectChange("persona", value)}
                >
                  <SelectTrigger id="persona">
                    <SelectValue placeholder="Seleccione una personalidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Amigable y cercano</SelectItem>
                    <SelectItem value="professional">Profesional y formal</SelectItem>
                    <SelectItem value="helpful">Servicial y útil</SelectItem>
                    <SelectItem value="enthusiastic">Entusiasta y enérgico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="welcomeMessage">Mensaje de bienvenida</Label>
              <Textarea
                id="welcomeMessage"
                name="welcomeMessage"
                value={chatbot.welcomeMessage}
                onChange={handleChange}
                placeholder="¡Hola! Soy el asistente virtual. ¿En qué puedo ayudarte hoy?"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Este mensaje se mostrará cuando un usuario inicie una conversación con su chatbot.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="generalContext">Contexto general</Label>
              <Textarea
                id="generalContext"
                name="generalContext"
                value={chatbot.generalContext}
                onChange={handleChange}
                placeholder="Información general sobre tu empresa, productos o servicios que el chatbot debe conocer."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Proporciona contexto general que el chatbot debe conocer sobre tu negocio.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="mainPurpose">Propósito principal</Label>
                <Select
                  value={chatbot.mainPurpose}
                  onValueChange={(value) => handleSelectChange("mainPurpose", value)}
                >
                  <SelectTrigger id="mainPurpose">
                    <SelectValue placeholder="Seleccione el propósito" />
                  </SelectTrigger>
                  <SelectContent>
                    {purposeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Define el objetivo principal de este chatbot.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="communicationTone">Tono de comunicación</Label>
                <Select
                  value={chatbot.communicationTone}
                  onValueChange={(value) => handleSelectChange("communicationTone", value)}
                >
                  <SelectTrigger id="communicationTone">
                    <SelectValue placeholder="Seleccione un tono" />
                  </SelectTrigger>
                  <SelectContent>
                    {toneOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Define cómo debe comunicarse el chatbot con los usuarios.
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Canales de integración</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                <div className="border rounded-md p-3 bg-primary/5 border-primary/20 flex items-center space-x-2">
                  <CheckIcon className="h-4 w-4 text-primary" />
                  <span>Sitio web (Widget)</span>
                </div>
                <div className="border rounded-md p-3 bg-muted/50 flex items-center space-x-2">
                  <span className="h-4 w-4 rounded-full border flex items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/30"></span>
                  </span>
                  <span className="text-muted-foreground">Facebook Messenger</span>
                </div>
                <div className="border rounded-md p-3 bg-muted/50 flex items-center space-x-2">
                  <span className="h-4 w-4 rounded-full border flex items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/30"></span>
                  </span>
                  <span className="text-muted-foreground">WhatsApp</span>
                </div>
                <div className="border rounded-md p-3 bg-muted/50 flex items-center space-x-2">
                  <span className="h-4 w-4 rounded-full border flex items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/30"></span>
                  </span>
                  <span className="text-muted-foreground">Telegram</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                El chatbot estará disponible en su sitio web. Podrá activar más canales después.
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar del chatbot</Label>
              <div className="border rounded-lg overflow-hidden">
                {avatarUrl ? (
                  <div className="relative">
                    <img 
                      src={avatarUrl} 
                      alt="Vista previa del avatar" 
                      className="w-full aspect-square object-contain p-2 bg-slate-50 dark:bg-slate-900"
                    />
                    <button 
                      type="button"
                      onClick={removeAvatar}
                      className="absolute top-2 right-2 p-1 rounded-full bg-destructive/90 text-white hover:bg-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label 
                    htmlFor="avatar-upload" 
                    className="flex flex-col items-center justify-center h-48 cursor-pointer bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                    <span className="text-sm font-medium">Subir avatar</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Formato JPG, PNG (máx. 2MB)
                    </span>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                      disabled={avatarUploading}
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Este avatar se mostrará en el widget del chatbot.
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4 mt-8">
          <div className="flex justify-between items-center">
            <Label>Preguntas frecuentes</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addFaq}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar pregunta
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Agregue las preguntas que los usuarios hacen con frecuencia para que el chatbot pueda responderlas automáticamente.
          </p>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={faq.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">Pregunta {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFaq(faq.id)}
                    disabled={faqs.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`faq-question-${faq.id}`}>Pregunta</Label>
                  <Input
                    id={`faq-question-${faq.id}`}
                    value={faq.question}
                    onChange={(e) => updateFaq(faq.id, 'question', e.target.value)}
                    placeholder="Ej: ¿Cuáles son sus horarios de atención?"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`faq-answer-${faq.id}`}>Respuesta</Label>
                  <Textarea
                    id={`faq-answer-${faq.id}`}
                    value={faq.answer}
                    onChange={(e) => updateFaq(faq.id, 'answer', e.target.value)}
                    placeholder="Ej: Nuestro horario de atención es de lunes a viernes de 9:00 AM a 6:00 PM."
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <Accordion type="single" collapsible>
          <AccordionItem value="custom-settings">
            <AccordionTrigger>Configuración avanzada</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="customInstructions">Instrucciones personalizadas</Label>
                  <Textarea
                    id="customInstructions"
                    name="customInstructions"
                    value={chatbot.customInstructions}
                    onChange={handleChange}
                    placeholder="Indique instrucciones específicas para su chatbot, como respuestas a preguntas frecuentes o cómo manejar situaciones específicas."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Estas instrucciones ayudan al chatbot a comprender mejor cómo debe interactuar con los usuarios.
                    Por ejemplo: "Trata de conseguir los datos de contacto de los usuarios interesados" o "Intenta proporcionar respuestas breves y concisas".
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => navigate("/onboarding/services")}>
            Anterior
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || avatarUploading}
          >
            {isLoading ? "Finalizando..." : "Finalizar configuración"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OnboardingChatbot;
