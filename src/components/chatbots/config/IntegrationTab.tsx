import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Code, Copy, Paintbrush, Bot, MessageSquare } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TagsInput } from "@/components/ui/tags-input";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";

interface IntegrationTabProps {
  value: {
    messages: string[];
    avatarUrl: string;
    primaryColor: string;
    widgetPosition: "left" | "right";
    initialMessage: string;
    borderRadius: number;
    hiddenOnMobile: boolean;
    headerText: string;
    sendButtonColor: string;
  };
  onChange: (value: IntegrationTabProps["value"]) => void;
  chatbotId: string;
}

export function IntegrationTab({ value, onChange, chatbotId }: IntegrationTabProps) {
  const [embedCode, setEmbedCode] = useState("");
  const [activeTab, setActiveTab] = useState("widget");
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Generar el código de embebido basado en el chatbotId
    const code = `<!-- Chatbot Widget --> 
<div id="chatbot-widget"> 
  <!-- Contenedor Principal para el Widget Minimizado --> 
  <div id="chatbot-minimized" style=" 
      position: fixed; 
      bottom: 20px; 
      ${value.widgetPosition}: 20px; 
      display: flex; 
      flex-direction: ${value.widgetPosition === "right" ? "row-reverse" : "row"}; 
      align-items: center; 
      z-index: 9998; 
    "> 
  </div> 
  
  <!-- Botón de Cerrar para Móvil --> 
  <div id="close-button" style=" 
      display: none; 
      position: fixed; 
      top: 12px; 
      right: 12px; 
      width: 32px; 
      height: 32px; 
      border-radius: 50%; 
      background: rgba(0, 0, 0, 0.25); 
      backdrop-filter: blur(4px); 
      z-index: 10000; 
      cursor: pointer; 
      transition: all 0.2s ease; 
      align-items: center; 
      justify-content: center; 
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); 
    "> 
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"> 
      <path d="M1 1L13 13M1 13L13 1" stroke="white" stroke-width="2" stroke-linecap="round"/> 
    </svg> 
  </div> 
  
  <!-- Iframe del Chat --> 
  <iframe id="chatbot-frame" 
    src="https://www.prometheuslabs.com.co/chat/${chatbotId}" 
    style=" 
      position: fixed; 
      bottom: 0; 
      ${value.widgetPosition}: 0; 
      width: 300px; 
      height: 90vh; 
      border: none; 
      border-radius: ${value.borderRadius}px; 
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12); 
      background: transparent; 
      z-index: 9999; 
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
      transform: translateY(calc(100% + 20px)); 
      opacity: 0; 
      display: none; 
      max-width: 400px; 
      max-height: 95vh; 
    " 
    allow="microphone" 
  ></iframe> 
</div> 

<script>
  document.addEventListener('DOMContentLoaded', function() {
    const chatbotMinimized = document.getElementById('chatbot-minimized');
    const frame = document.getElementById('chatbot-frame');
    const closeButton = document.getElementById('close-button');
    let isOpen = false;
    const messages = ${JSON.stringify(value.messages)};
    let currentMessageIndex = 0;
    
    // Crear avatar
    const avatar = document.createElement('div');
    avatar.id = 'chatbot-avatar';
    avatar.style.width = '50px';
    avatar.style.height = '50px';
    avatar.style.borderRadius = '50%';
    avatar.style.backgroundColor = '${value.primaryColor || "#00C999"}';
    avatar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    avatar.style.cursor = 'pointer';
    avatar.style.transition = 'all 0.3s ease';
    avatar.style.display = 'flex';
    avatar.style.justifyContent = 'center';
    avatar.style.alignItems = 'center';
    avatar.style.zIndex = '9999';
    
    // Icono dentro del avatar
    const avatarIcon = document.createElement('div');
    ${value.avatarUrl ? 
      `avatar.style.backgroundImage = 'url("${value.avatarUrl}")';
       avatar.style.backgroundSize = 'cover';
       avatar.style.backgroundPosition = 'center';` : 
      `avatarIcon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22Z" stroke="white" stroke-width="2" stroke-linejoin="round"></path><path d="M8 12H8.01" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 12H12.01" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M16 12H16.01" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
       avatar.appendChild(avatarIcon);`
    }
    
    chatbotMinimized.appendChild(avatar);
    
    // Crear contenedor de mensaje (si hay mensajes configurados)
    if(messages && messages.length > 0) {
      const messageContainer = document.createElement('div');
      messageContainer.id = 'message-container';
      messageContainer.style.backgroundColor = 'white';
      messageContainer.style.borderRadius = '12px';
      messageContainer.style.padding = '10px 14px';
      messageContainer.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
      messageContainer.style.marginRight = '${value.widgetPosition === "right" ? "12px" : "0"}';
      messageContainer.style.marginLeft = '${value.widgetPosition === "left" ? "12px" : "0"}';
      messageContainer.style.maxWidth = '250px';
      messageContainer.style.transition = 'all 0.3s ease';
      messageContainer.style.cursor = 'pointer';
      messageContainer.style.transform = '${value.widgetPosition === "right" ? "translateX(20px)" : "translateX(-20px)"}';
      messageContainer.style.opacity = '0';
      
      const animatedText = document.createElement('div');
      animatedText.id = 'animated-text';
      animatedText.style.fontSize = '14px';
      
      messageContainer.appendChild(animatedText);
      chatbotMinimized.appendChild(messageContainer);
      
      // Función para cambiar entre mensajes
      function typeEffect() {
        if(!messages.length) return;
        
        const currentMessage = messages[currentMessageIndex];
        animatedText.textContent = currentMessage;
        
        // Cambiar al siguiente mensaje después de 5 segundos
        setTimeout(() => {
          currentMessageIndex = (currentMessageIndex + 1) % messages.length;
          typeEffect();
        }, 5000);
      }
      
      // Mostrar el mensaje después de un retraso
      setTimeout(() => {
        messageContainer.style.maxWidth = '250px';
        messageContainer.style.opacity = '1';
        messageContainer.style.transform = 'translateX(0)';
        
        // Comenzar la animación de tipeo después de que aparezca el contenedor
        setTimeout(() => {
          typeEffect();
        }, 500);
      }, 2000);
      
      messageContainer.addEventListener('click', openChat);
    }
    
    function openChat() {
      isOpen = true;
      chatbotMinimized.style.display = 'none';
      frame.style.display = 'block';
      
      // Mostrar el botón de cerrar en móviles
      if (window.innerWidth <= 768) {
        closeButton.style.display = 'flex';
      }
      
      requestAnimationFrame(() => {
        frame.style.transform = 'translateY(0)';
        frame.style.opacity = '1';
      });
    }
    
    function closeChat() {
      isOpen = false;
      frame.style.transform = 'translateY(calc(100% + 20px))';
      frame.style.opacity = '0';
      closeButton.style.display = 'none';
      
      setTimeout(() => {
        frame.style.display = 'none';
        chatbotMinimized.style.display = 'flex';
      }, 300);
    }
    
    function adjustSize() {
      if (window.innerWidth <= 768) {
        ${value.hiddenOnMobile ? 
          `chatbotMinimized.style.display = 'none';` : 
          `chatbotMinimized.style.display = isOpen ? 'none' : 'flex';`
        }
        
        // Móvil: pantalla completa
        frame.style.width = '100%';
        frame.style.height = '100%';
        frame.style.top = '0';
        frame.style.left = '0';
        frame.style.bottom = '0';
        frame.style.right = '0';
        frame.style.borderRadius = '0';
        frame.style.maxWidth = 'none';
        frame.style.maxHeight = 'none';
        
        // Mostrar el botón de cerrar si está abierto
        if (isOpen) {
          closeButton.style.display = 'flex';
        }
      } else {
        // Desktop: tamaño controlado con máximos
        chatbotMinimized.style.display = isOpen ? 'none' : 'flex';
        frame.style.width = '350px';
        frame.style.height = '95vh';
        frame.style.top = 'auto';
        frame.style.left = 'auto';
        frame.style.bottom = '20px';
        frame.style.right = '${value.widgetPosition === "right" ? "20px" : "auto"}';
        frame.style.left = '${value.widgetPosition === "left" ? "20px" : "auto"}';
        frame.style.borderRadius = '${value.borderRadius}px';
        frame.style.maxWidth = '400px';
        frame.style.maxHeight = '95vh';
        
        // Ocultar el botón de cerrar en desktop
        closeButton.style.display = 'none';
      }
    }
    
    avatar.addEventListener('click', openChat);
    closeButton.addEventListener('click', closeChat);
    window.addEventListener('resize', adjustSize);
    adjustSize();
  });
</script>

<style>
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(${parseInt(value.primaryColor.slice(1, 3), 16)}, ${parseInt(value.primaryColor.slice(3, 5), 16)}, ${parseInt(value.primaryColor.slice(5, 7), 16)}, 0.5); }
    70% { box-shadow: 0 0 0 8px rgba(${parseInt(value.primaryColor.slice(1, 3), 16)}, ${parseInt(value.primaryColor.slice(3, 5), 16)}, ${parseInt(value.primaryColor.slice(5, 7), 16)}, 0); }
    100% { box-shadow: 0 0 0 0 rgba(${parseInt(value.primaryColor.slice(1, 3), 16)}, ${parseInt(value.primaryColor.slice(3, 5), 16)}, ${parseInt(value.primaryColor.slice(5, 7), 16)}, 0); }
  }
  
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-4px); }
    100% { transform: translateY(0px); }
  }
  
  #chatbot-avatar {
    animation: float 3s ease-in-out infinite;
  }
  
  #chatbot-avatar:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 20px rgba(${parseInt(value.primaryColor.slice(1, 3), 16)}, ${parseInt(value.primaryColor.slice(3, 5), 16)}, ${parseInt(value.primaryColor.slice(5, 7), 16)}, 0.25);
  }
  
  #close-button:hover {
    background: rgba(0, 0, 0, 0.4);
    transform: scale(1.1);
  }
</style>`;
    
    setEmbedCode(code);
  }, [value, chatbotId]);

  const handleChange = (field: keyof IntegrationTabProps["value"], newValue: any) => {
    onChange({
      ...value,
      [field]: newValue,
    });
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    toast.success("Código copiado al portapapeles");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="mt-1 bg-primary/10 p-2 rounded-md">
              <Code className="text-primary h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-lg mb-1">Integrar chatbot en tu sitio web</h3>
              <p className="text-sm text-muted-foreground">
                Personaliza y configura cómo se mostrará tu chatbot en tu sitio web.
                Una vez configurado, copia el código y pégalo antes del cierre del tag {'</body>'} en tu sitio.
              </p>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="widget">Apariencia</TabsTrigger>
              <TabsTrigger value="messages">Mensajes</TabsTrigger>
              <TabsTrigger value="code">Código</TabsTrigger>
            </TabsList>
            
            <TabsContent value="widget" className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="position">Posición del widget</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={`cursor-pointer border rounded-md p-3 text-center ${
                        value.widgetPosition === "right" ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => handleChange("widgetPosition", "right")}
                    >
                      <div className="flex justify-end mb-2">
                        <div className="bg-primary/20 h-8 w-8 rounded-full"></div>
                      </div>
                      <span className="text-sm">Derecha</span>
                    </div>
                    <div
                      className={`cursor-pointer border rounded-md p-3 text-center ${
                        value.widgetPosition === "left" ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => handleChange("widgetPosition", "left")}
                    >
                      <div className="flex justify-start mb-2">
                        <div className="bg-primary/20 h-8 w-8 rounded-full"></div>
                      </div>
                      <span className="text-sm">Izquierda</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="primaryColor">Color principal</Label>
                  <Input
                    type="color"
                    id="primaryColor"
                    value={value.primaryColor}
                    onChange={(e) => handleChange("primaryColor", e.target.value)}
                    className="h-10 min-w-[100px] w-full"
                  />
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="avatarUrl">URL del avatar (opcional)</Label>
                  <Input
                    id="avatarUrl"
                    placeholder="https://ejemplo.com/imagen.png"
                    value={value.avatarUrl}
                    onChange={(e) => handleChange("avatarUrl", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    URL de imagen para personalizar el avatar del chat
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="headerText">Texto de cabecera (opcional)</Label>
                  <Input
                    id="headerText"
                    placeholder="Ej: Chat de soporte"
                    value={value.headerText}
                    onChange={(e) => handleChange("headerText", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Texto que aparecerá en la cabecera del chat
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>Redondez de bordes: {value.borderRadius}px</Label>
                <Slider
                  value={[value.borderRadius]}
                  min={0}
                  max={24}
                  step={1}
                  onValueChange={(vals) => handleChange("borderRadius", vals[0])}
                  className="w-full"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="hiddenOnMobile" className="flex-1 text-sm">
                  Ocultar en dispositivos móviles
                </Label>
                <Switch
                  id="hiddenOnMobile"
                  checked={value.hiddenOnMobile}
                  onCheckedChange={(checked) => handleChange("hiddenOnMobile", checked)}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="messages" className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="initialMessage">Mensaje inicial</Label>
                <Input
                  id="initialMessage"
                  placeholder="Ej: ¡Hola! ¿En qué puedo ayudarte hoy?"
                  value={value.initialMessage}
                  onChange={(e) => handleChange("initialMessage", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Este mensaje se mostrará cuando el usuario abra el chat
                </p>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="messages">Mensajes de burbuja (aparecerán rotando)</Label>
                <TagsInput
                  value={value.messages || []}
                  onChange={(newMessages) => handleChange("messages", newMessages)}
                  placeholder="Escribe mensaje y presiona Enter"
                  maxTags={8}
                />
                <p className="text-xs text-muted-foreground">
                  Estos mensajes aparecerán en una burbuja junto al ícono del chatbot
                </p>
              </div>
              
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Sugerencia:</span>{" "}
                      Agrega mensajes atractivos que inviten a la conversación. Ejemplos:
                      "¿Necesitas ayuda con tu compra?", "¡Hola! ¿Tienes alguna pregunta?",
                      "Estamos aquí para ayudarte 24/7"
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="code">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <Label>Código para insertar en tu sitio web</Label>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setPreviewMode(previewMode === "light" ? "dark" : "light")}
                    >
                      <Paintbrush size={14} className="mr-1" />
                      {previewMode === "light" ? "Tema oscuro" : "Tema claro"}
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={copyEmbedCode}
                    >
                      <Copy size={14} className="mr-1" />
                      Copiar código
                    </Button>
                  </div>
                </div>
                
                <Textarea
                  value={embedCode}
                  readOnly
                  className={`font-mono text-xs min-h-[300px] ${
                    previewMode === "dark" ? "bg-zinc-900 text-zinc-100" : ""
                  }`}
                />
                
                <p className="text-sm text-muted-foreground">
                  Copia este código y pégalo justo antes del cierre del tag {'</body>'} en tu sitio web.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 bg-primary/10 p-2 rounded-md">
              <Bot className="text-primary h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-lg mb-1">Previsualización</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Así se verá el chatbot en tu sitio web:
              </p>
              
              <div className="h-80 bg-muted/30 rounded-lg border border-dashed flex items-center justify-center p-4 relative">
                {/* Simular el botón del chat */}
                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                  {value.messages.length > 0 && (
                    <div className="bg-white p-2 rounded-lg shadow-md text-sm max-w-[200px]">
                      {value.messages[0]}
                    </div>
                  )}
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg" 
                    style={{backgroundColor: value.primaryColor}}>
                    {value.avatarUrl ? (
                      <img src={value.avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <MessageSquare className="h-6 w-6 text-white" />
                    )}
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground max-w-md">
                    Esta es una previsualización simplificada. El aspecto final puede variar ligeramente 
                    dependiendo del sitio web donde lo integres.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}