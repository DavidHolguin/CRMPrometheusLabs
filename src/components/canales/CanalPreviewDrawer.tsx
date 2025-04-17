import { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Canal } from "@/hooks/useCanales";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { CanalIcon } from "./CanalIcon";
import { Badge } from "@/components/ui/badge";
import { 
  Smartphone,
  Computer,
  MessageCircle,
  ExternalLink,
  Copy,
  Check,
  QrCode
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

type CanalPreviewDrawerProps = {
  canal: Canal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function CanalPreviewDrawer({ 
  canal,
  open, 
  onOpenChange
}: CanalPreviewDrawerProps) {
  const [activeView, setActiveView] = useState<"movil" | "web">("movil");
  const [copied, setCopied] = useState(false);

  // Generar URL de webhook de ejemplo
  const webhookUrl = canal ? `https://api.prometeo.tech/webhooks/${canal.tipo.toLowerCase()}/${canal.id}` : '';

  // Manejo de copiar al portapapeles
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copiado al portapapeles");
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // Render del contenido del preview según el tipo de canal
  const renderPreviewContent = () => {
    if (!canal) return null;

    const isWebChat = canal.tipo.toLowerCase() === 'web';
    const isWhatsApp = canal.tipo.toLowerCase() === 'whatsapp';
    
    return (
      <div className="space-y-6">
        {/* Vista móvil de chat */}
        {activeView === "movil" && (
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[320px] h-[520px] border rounded-xl overflow-hidden bg-[#f0f0f0] flex flex-col">
              {/* Header del chat */}
              <div className="bg-primary text-primary-foreground p-3">
                <div className="flex items-center gap-2">
                  {canal.logo_url ? (
                    <div className="h-10 w-10 rounded-full overflow-hidden">
                      <img 
                        src={canal.logo_url} 
                        alt={canal.nombre} 
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                      <CanalIcon tipo={canal.tipo} size={24} className="text-primary-foreground" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-sm">{canal.nombre}</h3>
                    <p className="text-xs opacity-80">En línea</p>
                  </div>
                </div>
              </div>
              
              {/* Contenido del chat */}
              <div className="flex-1 p-3 overflow-y-auto bg-gray-100 space-y-3">
                {/* Mensaje del bot */}
                <div className="flex flex-col max-w-[85%]">
                  <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm">
                    <p className="text-sm">👋 ¡Hola! Soy el asistente virtual de {canal.nombre}. ¿En qué puedo ayudarte hoy?</p>
                  </div>
                  <span className="text-xs text-gray-500 mt-1">11:45 AM</span>
                </div>
              </div>
              
              {/* Input del chat */}
              <div className="p-3 border-t bg-white flex gap-2">
                <input 
                  type="text" 
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm"
                  disabled
                />
                <button 
                  className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground"
                  disabled
                >
                  <MessageCircle size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Vista web del chat */}
        {activeView === "web" && (
          <div className="flex flex-col items-center">
            <div className="w-full border rounded-lg overflow-hidden shadow-sm">
              <div className="p-4 bg-[#f8f9fb] border-b">
                <img 
                  src="https://placehold.co/800x400?text=Vista+Web+de+Sitio" 
                  alt="Vista web de ejemplo"
                  className="w-full h-48 object-cover rounded-md"
                />
                
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    Así es como se verá tu widget de chat en un sitio web
                  </p>
                </div>
              </div>
              
              <div className="p-4">
                <div className="border rounded-lg h-96 w-full relative">
                  {/* Contenido simulado del sitio web */}
                  <div className="absolute bottom-4 right-4">
                    <div className="bg-white rounded-lg shadow-lg w-64 h-96 border overflow-hidden">
                      {/* Header del chat */}
                      <div 
                        className="p-3 text-white"
                        style={{ backgroundColor: canal.color || '#3b82f6' }}
                      >
                        <div className="flex items-center gap-2">
                          {canal.logo_url ? (
                            <div className="h-8 w-8 rounded-full overflow-hidden bg-white p-1">
                              <img 
                                src={canal.logo_url} 
                                alt={canal.nombre} 
                                className="h-full w-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                              <CanalIcon tipo={canal.tipo} size={16} className="text-white" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-medium text-sm">{canal.nombre}</h3>
                          </div>
                        </div>
                      </div>
                      
                      {/* Contenido del chat */}
                      <div className="p-2 h-[calc(100%-96px)] bg-gray-50 overflow-y-auto">
                        <div className="bg-primary/10 p-2 rounded-lg mb-2">
                          <p className="text-xs">👋 ¡Hola! ¿En qué puedo ayudarte?</p>
                        </div>
                      </div>
                      
                      {/* Input del chat */}
                      <div className="border-t p-2 bg-white">
                        <input 
                          type="text" 
                          placeholder="Escribe un mensaje..."
                          className="w-full bg-gray-100 rounded-full px-3 py-2 text-xs"
                          disabled
                        />
                      </div>
                    </div>
                    
                    {/* Botón flotante */}
                    {!isWebChat && (
                      <div 
                        className="h-12 w-12 rounded-full shadow-lg flex items-center justify-center absolute -bottom-6 -right-6"
                        style={{ backgroundColor: canal.color || '#3b82f6' }}
                      >
                        <MessageCircle size={24} className="text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <Separator />
        
        {/* Información de conexión */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Información de conexión</h3>
          
          {isWhatsApp && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <QrCode size={16} />
                  Código QR para WhatsApp
                </h4>
                <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                  {/* QR Code placeholder */}
                  <div className="h-48 w-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-xs text-gray-500">Código QR de ejemplo</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Escanea este código con tu WhatsApp para conectar este canal.
                </p>
              </CardContent>
            </Card>
          )}
          
          {/* Información de webhook */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <ExternalLink size={16} />
                URL del webhook
              </h4>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 p-2 rounded text-xs flex-1 overflow-x-auto">
                  {webhookUrl}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleCopyToClipboard(webhookUrl)}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Usa esta URL para configurar los webhooks en la plataforma del proveedor.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl" side="right">
        {canal && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                {canal.logo_url ? (
                  <div 
                    className="h-8 w-8 rounded-md overflow-hidden flex items-center justify-center"
                    style={{ backgroundColor: canal.color ? `${canal.color}20` : undefined }}
                  >
                    <img 
                      src={canal.logo_url} 
                      alt={canal.nombre}
                      className="h-6 w-6 object-contain"
                    />
                  </div>
                ) : (
                  <div 
                    className="h-8 w-8 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: canal.color ? `${canal.color}20` : undefined }}
                  >
                    <CanalIcon tipo={canal.tipo} size={18} />
                  </div>
                )}
                <SheetTitle>{canal.nombre}</SheetTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={canal.is_active ? "default" : "outline"}>
                  {canal.is_active ? "Activo" : "Inactivo"}
                </Badge>
                <Badge variant="outline" className="bg-background">
                  {canal.tipo}
                </Badge>
              </div>
              <SheetDescription>
                {canal.descripcion || "Sin descripción"}
              </SheetDescription>
            </SheetHeader>
            
            <Tabs 
              defaultValue="movil" 
              className="mt-6"
              onValueChange={(value) => setActiveView(value as "movil" | "web")}
            >
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="movil" className="flex items-center gap-1">
                  <Smartphone className="h-4 w-4" />
                  <span>Vista móvil</span>
                </TabsTrigger>
                <TabsTrigger value="web" className="flex items-center gap-1">
                  <Computer className="h-4 w-4" />
                  <span>Vista web</span>
                </TabsTrigger>
              </TabsList>
              
              <ScrollArea className="h-[calc(100vh-200px)] pr-4">
                <TabsContent value="movil" className="m-0">
                  {renderPreviewContent()}
                </TabsContent>
                <TabsContent value="web" className="m-0">
                  {renderPreviewContent()}
                </TabsContent>
              </ScrollArea>
            </Tabs>
            
            <SheetFooter className="mt-6">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="w-full"
              >
                Cerrar
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}