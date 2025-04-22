import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Copy,
  Download,
  Link,
  Check,
  QrCode,
  ExternalLink,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  CreateMarketingUTMInput,
  useMarketingUTMs,
  MarketingUTM
} from "@/hooks/marketing/useMarketingUTMs";
import { useMarketingCampanias } from "@/hooks/marketing/useMarketingCampanias";

interface MarketingUTMBuilderProps {
  initialValues?: MarketingUTM;
  onSave?: (utmData: MarketingUTM) => void;
  onCancel?: () => void;
}

const MarketingUTMBuilder: React.FC<MarketingUTMBuilderProps> = ({
  initialValues,
  onSave,
  onCancel
}) => {
  const { toast } = useToast();
  const { buildCompleteUrl, createUTM, updateUTM, getUtmSources, getUtmMediums } = useMarketingUTMs();
  const { campanias } = useMarketingCampanias();
  
  const [formData, setFormData] = useState<CreateMarketingUTMInput>({
    campania_id: initialValues?.campania_id || "",
    utm_source: initialValues?.utm_source || "",
    utm_medium: initialValues?.utm_medium || "",
    utm_campaign: initialValues?.utm_campaign || "",
    utm_term: initialValues?.utm_term || "",
    utm_content: initialValues?.utm_content || "",
    url_destino: initialValues?.url_destino || "",
    descripcion: initialValues?.descripcion || ""
  });

  const [utmUrl, setUtmUrl] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [sourceOptions, setSourceOptions] = useState<string[]>([]);
  const [mediumOptions, setMediumOptions] = useState<string[]>([]);
  
  // Cargar opciones de fuentes y medios
  useEffect(() => {
    const loadOptions = async () => {
      const sources = await getUtmSources();
      const mediums = await getUtmMediums();
      
      setSourceOptions(sources);
      setMediumOptions(mediums);
    };
    
    loadOptions();
  }, []);

  // Generar URL con UTMs cuando cambia el formulario
  useEffect(() => {
    if (formData.url_destino && formData.utm_source && formData.utm_medium && formData.utm_campaign) {
      try {
        const url = buildCompleteUrl(formData);
        setUtmUrl(url);
      } catch (error) {
        console.error("Error building URL:", error);
      }
    } else {
      setUtmUrl("");
    }
  }, [formData]);

  // Manejo de cambios en el formulario
  const handleInputChange = (field: keyof CreateMarketingUTMInput, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validar URL
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Validar que los campos requeridos estén presentes
  const isFormValid = (): boolean => {
    return Boolean(
      formData.url_destino &&
      isValidUrl(formData.url_destino) &&
      formData.utm_source &&
      formData.utm_medium &&
      formData.utm_campaign
    );
  };

  // Copiar URL al portapapeles
  const handleCopyUrl = () => {
    if (!utmUrl) return;
    
    navigator.clipboard.writeText(utmUrl).then(() => {
      setIsCopied(true);
      toast({
        title: "URL copiada",
        description: "La URL con los parámetros UTM ha sido copiada al portapapeles.",
      });
      
      setTimeout(() => {
        setIsCopied(false);
      }, 3000);
    }).catch(err => {
      toast({
        title: "Error al copiar",
        description: "No se pudo copiar la URL. Inténtalo manualmente.",
        variant: "destructive",
      });
    });
  };

  // Guardar UTM
  const handleSave = () => {
    if (!isFormValid()) {
      setShowValidation(true);
      return;
    }

    if (initialValues?.id) {
      // Actualizar UTM existente
      updateUTM.mutate({
        id: initialValues.id,
        ...formData
      }, {
        onSuccess: (data) => {
          toast({
            title: "UTM actualizado",
            description: "El enlace UTM ha sido actualizado exitosamente",
          });
          onSave?.(data);
        }
      });
    } else {
      // Crear nuevo UTM
      createUTM.mutate(formData, {
        onSuccess: (data) => {
          toast({
            title: "UTM creado",
            description: "El enlace UTM ha sido creado exitosamente",
          });
          onSave?.(data);
        }
      });
    }
  };

  // Reiniciar formulario
  const handleReset = () => {
    setFormData({
      campania_id: "",
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      utm_term: "",
      utm_content: "",
      url_destino: "",
      descripcion: ""
    });
    setShowValidation(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Constructor de URLs con UTM</CardTitle>
        <CardDescription>
          Crea y gestiona URLs con parámetros de seguimiento UTM para tus campañas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="builder">
          <TabsList className="mb-4">
            <TabsTrigger value="builder">Constructor</TabsTrigger>
            <TabsTrigger value="advanced">Avanzado</TabsTrigger>
            <TabsTrigger value="preview">Vista previa</TabsTrigger>
          </TabsList>
          
          <TabsContent value="builder" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* URL de destino */}
              <div className="space-y-2">
                <Label htmlFor="url_destino">URL de destino <span className="text-red-500">*</span></Label>
                <Input
                  id="url_destino"
                  placeholder="https://ejemplo.com/pagina"
                  value={formData.url_destino}
                  onChange={(e) => handleInputChange("url_destino", e.target.value)}
                  className={showValidation && (!formData.url_destino || !isValidUrl(formData.url_destino)) ? "border-red-500 focus:ring-red-500" : ""}
                />
                {showValidation && !formData.url_destino && (
                  <p className="text-xs text-red-500">La URL de destino es obligatoria.</p>
                )}
                {showValidation && formData.url_destino && !isValidUrl(formData.url_destino) && (
                  <p className="text-xs text-red-500">Introduce una URL válida.</p>
                )}
              </div>
              
              {/* Campaña asociada */}
              <div className="space-y-2">
                <Label htmlFor="campania_id">Campaña asociada</Label>
                <Select
                  value={formData.campania_id}
                  onValueChange={(value) => handleInputChange("campania_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una campaña (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="">Ninguna</SelectItem>
                      {campanias?.map(campania => (
                        <SelectItem key={campania.id} value={campania.id}>
                          {campania.nombre}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* UTM Source */}
              <div className="space-y-2">
                <Label htmlFor="utm_source">UTM Source <span className="text-red-500">*</span></Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.utm_source}
                    onValueChange={(value) => handleInputChange("utm_source", value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecciona una fuente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {sourceOptions.map(source => (
                          <SelectItem key={source} value={source}>
                            {source}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="O introduce tu propia fuente"
                    value={!sourceOptions.includes(formData.utm_source) ? formData.utm_source : ""}
                    onChange={(e) => handleInputChange("utm_source", e.target.value)}
                    className="flex-1"
                  />
                </div>
                {showValidation && !formData.utm_source && (
                  <p className="text-xs text-red-500">La fuente (source) es obligatoria.</p>
                )}
                <p className="text-xs text-muted-foreground">Ejemplo: google, facebook, newsletter</p>
              </div>
              
              {/* UTM Medium */}
              <div className="space-y-2">
                <Label htmlFor="utm_medium">UTM Medium <span className="text-red-500">*</span></Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.utm_medium}
                    onValueChange={(value) => handleInputChange("utm_medium", value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecciona un medio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {mediumOptions.map(medium => (
                          <SelectItem key={medium} value={medium}>
                            {medium}
                          </SelectItem>
                        ))}
                        {!mediumOptions.includes("cpc") && <SelectItem value="cpc">cpc</SelectItem>}
                        {!mediumOptions.includes("email") && <SelectItem value="email">email</SelectItem>}
                        {!mediumOptions.includes("social") && <SelectItem value="social">social</SelectItem>}
                        {!mediumOptions.includes("banner") && <SelectItem value="banner">banner</SelectItem>}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="O introduce tu propio medio"
                    value={!mediumOptions.includes(formData.utm_medium) ? formData.utm_medium : ""}
                    onChange={(e) => handleInputChange("utm_medium", e.target.value)}
                    className="flex-1"
                  />
                </div>
                {showValidation && !formData.utm_medium && (
                  <p className="text-xs text-red-500">El medio (medium) es obligatorio.</p>
                )}
                <p className="text-xs text-muted-foreground">Ejemplo: cpc, social, email, banner</p>
              </div>
              
              {/* UTM Campaign */}
              <div className="space-y-2">
                <Label htmlFor="utm_campaign">UTM Campaign <span className="text-red-500">*</span></Label>
                <Input
                  id="utm_campaign"
                  placeholder="Nombre de la campaña"
                  value={formData.utm_campaign}
                  onChange={(e) => handleInputChange("utm_campaign", e.target.value)}
                  className={showValidation && !formData.utm_campaign ? "border-red-500 focus:ring-red-500" : ""}
                />
                {showValidation && !formData.utm_campaign && (
                  <p className="text-xs text-red-500">El nombre de campaña es obligatorio.</p>
                )}
                <p className="text-xs text-muted-foreground">Ejemplo: blackfriday2025, lanzamiento_producto</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* UTM Term */}
              <div className="space-y-2">
                <Label htmlFor="utm_term">UTM Term (opcional)</Label>
                <Input
                  id="utm_term"
                  placeholder="Términos pagados o palabras clave"
                  value={formData.utm_term || ""}
                  onChange={(e) => handleInputChange("utm_term", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Ejemplo: marketing+crm, software+ventas</p>
              </div>
              
              {/* UTM Content */}
              <div className="space-y-2">
                <Label htmlFor="utm_content">UTM Content (opcional)</Label>
                <Input
                  id="utm_content"
                  placeholder="Para diferenciar anuncios o enlaces"
                  value={formData.utm_content || ""}
                  onChange={(e) => handleInputChange("utm_content", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Ejemplo: banner_top, cta_footer, textlink</p>
              </div>
              
              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción (opcional)</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Añade una descripción para este enlace UTM"
                  value={formData.descripcion || ""}
                  onChange={(e) => handleInputChange("descripcion", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4">
            <div className="relative">
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm font-medium mb-2">URL final con parámetros UTM:</p>
                {utmUrl ? (
                  <div className="relative bg-background border rounded-md p-3 overflow-x-auto">
                    <code className="text-sm whitespace-pre-wrap break-all font-mono">
                      {utmUrl}
                    </code>
                    <div className="absolute top-2 right-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleCopyUrl}
                        className="h-8 w-8"
                      >
                        {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-6 border rounded-md bg-background">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <p>Completa los campos requeridos para generar la URL</p>
                    </div>
                  </div>
                )}
              </div>
              
              {utmUrl && (
                <>
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Vista previa:</p>
                    <div className="border rounded-md p-4">
                      <div className="flex gap-2 mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(utmUrl, "_blank")}
                          className="gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Abrir en nueva pestaña
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                        >
                          <QrCode className="h-3 w-3" />
                          Generar código QR
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground">UTM Source:</p>
                          <p className="text-sm font-medium">{formData.utm_source}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">UTM Medium:</p>
                          <p className="text-sm font-medium">{formData.utm_medium}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">UTM Campaign:</p>
                          <p className="text-sm font-medium">{formData.utm_campaign}</p>
                        </div>
                        {formData.utm_term && (
                          <div>
                            <p className="text-xs text-muted-foreground">UTM Term:</p>
                            <p className="text-sm font-medium">{formData.utm_term}</p>
                          </div>
                        )}
                        {formData.utm_content && (
                          <div>
                            <p className="text-xs text-muted-foreground">UTM Content:</p>
                            <p className="text-sm font-medium">{formData.utm_content}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>
          <Button variant="outline" onClick={handleReset} className="gap-1">
            <RefreshCw className="h-4 w-4" />
            Reiniciar
          </Button>
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button onClick={handleSave} disabled={!isFormValid()}>
            {initialValues?.id ? "Actualizar UTM" : "Guardar UTM"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default MarketingUTMBuilder;