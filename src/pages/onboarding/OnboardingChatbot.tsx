
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
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
import { CheckIcon } from "lucide-react";

const OnboardingChatbot = () => {
  const navigate = useNavigate();
  const { setOnboardingCompleted } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const [chatbot, setChatbot] = useState({
    name: "",
    welcomeMessage: "¡Hola! Soy el asistente virtual. ¿En qué puedo ayudarte hoy?",
    persona: "helpful",
    channels: ["website"],
    customInstructions: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setChatbot(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setChatbot(prev => ({ ...prev, [field]: value }));
  };

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
    
    setIsLoading(true);
    
    try {
      // Simulamos guardado
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Marcamos el onboarding como completado
      setOnboardingCompleted();
      
      // Navegamos al dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudo configurar el chatbot",
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

      <form onSubmit={handleSubmit} className="space-y-6">
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
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => navigate("/onboarding/services")}>
            Anterior
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Finalizando..." : "Finalizar configuración"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OnboardingChatbot;
