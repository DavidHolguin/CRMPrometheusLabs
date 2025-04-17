import { useState, useEffect } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { CanalIcon } from "./CanalIcon";
import { useCanales, Canal } from "@/hooks/useCanales";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Upload, X, Loader2, Plus, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const canalTipos = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "messenger", label: "Messenger" },
  { value: "instagram", label: "Instagram" },
  { value: "telegram", label: "Telegram" },
  { value: "sms", label: "SMS" },
  { value: "web", label: "Web" },
  { value: "email", label: "Email" },
  { value: "custom", label: "Personalizado" },
];

const parametrosPredefinidos = {
  whatsapp: [
    { key: "phone_number_id", label: "ID de número de teléfono", type: "text", required: true },
    { key: "access_token", label: "Token de acceso", type: "password", required: true },
    { key: "business_account_id", label: "ID de cuenta de negocio", type: "text", required: false }
  ],
  messenger: [
    { key: "page_id", label: "ID de página", type: "text", required: true },
    { key: "access_token", label: "Token de acceso", type: "password", required: true }
  ],
  telegram: [
    { key: "bot_token", label: "Token del bot", type: "password", required: true }
  ],
  web: [
    { key: "embed_code", label: "Código de inserción", type: "textarea", required: false },
    { key: "allowed_origins", label: "Orígenes permitidos", type: "text", required: false }
  ],
  email: [
    { key: "smtp_server", label: "Servidor SMTP", type: "text", required: true },
    { key: "smtp_port", label: "Puerto SMTP", type: "text", required: true },
    { key: "smtp_user", label: "Usuario SMTP", type: "text", required: true },
    { key: "smtp_password", label: "Contraseña SMTP", type: "password", required: true }
  ],
  sms: [
    { key: "api_key", label: "Clave API", type: "password", required: true },
    { key: "sender_id", label: "ID de remitente", type: "text", required: false }
  ]
};

const formSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  tipo: z.string().min(1, "Selecciona un tipo de canal"),
  descripcion: z.string().optional(),
  tipo_personalizado: z.string().optional(),
  color: z.string().optional(),
  is_active: z.boolean().optional(),
  configuracion_requerida: z.record(z.any()).optional(),
});

type CreateCanalDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  editingCanal?: Canal | null;
  onUpdate?: (data: any) => void;
};

export default function CreateCanalDrawer({ 
  open, 
  onOpenChange, 
  onSave, 
  editingCanal = null,
  onUpdate 
}: CreateCanalDrawerProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [svgCode, setSvgCode] = useState<string>("");
  const [parametros, setParametros] = useState<Array<{key: string, label: string, type: string, required: boolean}>>([]);
  const [nuevoParametro, setNuevoParametro] = useState({
    key: '',
    label: '',
    type: 'text',
    required: false
  });

  const { uploadCanalLogo } = useCanales();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      tipo: "",
      descripcion: "",
      tipo_personalizado: "",
      color: "#3b82f6", // Color azul por defecto
      is_active: true,
      configuracion_requerida: {},
    },
  });

  useEffect(() => {
    if (editingCanal) {
      form.reset({
        nombre: editingCanal.nombre,
        tipo: editingCanal.tipo,
        descripcion: editingCanal.descripcion || "",
        tipo_personalizado: editingCanal.tipo === "custom" ? editingCanal.tipo : "",
        color: editingCanal.color || "#3b82f6",
        is_active: editingCanal.is_active,
        configuracion_requerida: editingCanal.configuracion_requerida || {},
      });

      if (editingCanal.logo_url) {
        setLogoPreview(editingCanal.logo_url);
      }
      
      if (editingCanal.configuracion_requerida) {
        const params = Object.entries(editingCanal.configuracion_requerida).map(([key, config]) => ({
          key,
          label: config.label || key,
          type: config.type || 'text',
          required: config.required || false
        }));
        setParametros(params);
      } else {
        setParametros([]);
      }
    }
  }, [editingCanal, form]);

  useEffect(() => {
    const tipo = form.watch("tipo");
    if (tipo && tipo !== 'custom' && !editingCanal) {
      const predefinidos = parametrosPredefinidos[tipo as keyof typeof parametrosPredefinidos] || [];
      setParametros(predefinidos);
    }
  }, [form.watch("tipo"), editingCanal]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLogoFile(file);
    
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSvgCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const code = e.target.value;
    setSvgCode(code);
    
    if (code.trim().startsWith("<svg")) {
      const blob = new Blob([code], { type: "image/svg+xml" });
      setLogoFile(new File([blob], "logo.svg", { type: "image/svg+xml" }));
      setLogoPreview(URL.createObjectURL(blob));
    }
  };
  
  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setSvgCode("");
  };

  const handleAddParametro = () => {
    if (!nuevoParametro.key.trim() || !nuevoParametro.label.trim()) {
      toast.error("La clave y la etiqueta son requeridas");
      return;
    }
    
    if (parametros.some(p => p.key === nuevoParametro.key)) {
      toast.error("Ya existe un parámetro con esa clave");
      return;
    }
    
    setParametros([...parametros, nuevoParametro]);
    
    setNuevoParametro({
      key: '',
      label: '',
      type: 'text',
      required: false
    });
  };
  
  const handleRemoveParametro = (key: string) => {
    setParametros(parametros.filter(p => p.key !== key));
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsUploading(true);
      
      let logoUrl = null;
      if (logoFile) {
        logoUrl = await uploadCanalLogo(logoFile);
      }
      
      const configuracionRequerida: Record<string, any> = {};
      parametros.forEach(param => {
        configuracionRequerida[param.key] = {
          label: param.label,
          type: param.type,
          required: param.required
        };
      });
      
      const saveData = {
        ...data,
        logo_url: logoUrl || (editingCanal && editingCanal.logo_url) || null,
        tipo: data.tipo === "custom" && data.tipo_personalizado ? data.tipo_personalizado : data.tipo,
        configuracion_requerida: configuracionRequerida
      };
      
      if (editingCanal && onUpdate) {
        onUpdate(saveData);
      } else {
        onSave(saveData);
      }
      
      resetForm();
      onOpenChange(false);
      
    } catch (error) {
      console.error("Error al guardar canal:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    form.reset({
      nombre: "",
      tipo: "",
      descripcion: "",
      tipo_personalizado: "",
      color: "#3b82f6",
      is_active: true,
      configuracion_requerida: {},
    });
    setLogoFile(null);
    setLogoPreview(null);
    setSvgCode("");
    setParametros([]);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl" side="right">
        <SheetHeader>
          <SheetTitle>{editingCanal ? "Editar canal" : "Crear nuevo canal"}</SheetTitle>
          <SheetDescription>
            {editingCanal 
              ? "Actualiza la información del canal existente." 
              : "Configura un nuevo canal de comunicación para tus chatbots."}
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-180px)] my-4 pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label>Logo del canal</Label>
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-4 items-center">
                      <div 
                        className="h-16 w-16 bg-muted rounded-md flex items-center justify-center overflow-hidden border"
                        style={{ backgroundColor: form.watch("color") ? `${form.watch("color")}20` : undefined }}
                      >
                        {logoPreview ? (
                          <img 
                            src={logoPreview} 
                            alt="Logo preview" 
                            className="h-12 w-12 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>';
                            }}
                          />
                        ) : (
                          <div className="text-muted-foreground">
                            <CanalIcon 
                              tipo={form.watch("tipo") || "default"} 
                              size={32}
                              className="opacity-70" 
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            asChild
                          >
                            <label>
                              <Upload className="h-4 w-4" />
                              Subir logo
                              <input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={handleLogoChange}
                              />
                            </label>
                          </Button>
                          
                          {logoPreview && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleRemoveLogo}
                              title="Eliminar logo"
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Sube una imagen o SVG para tu canal (recomendado 64x64px)
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="svg-code">Código SVG (opcional)</Label>
                      <Textarea
                        id="svg-code"
                        placeholder='<svg width="64" height="64" ...>'
                        className="font-mono text-xs"
                        value={svgCode}
                        onChange={handleSvgCodeChange}
                        rows={5}
                      />
                      <p className="text-xs text-muted-foreground">
                        Pega el código SVG del ícono para tu canal
                      </p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del canal</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. WhatsApp Business" {...field} />
                      </FormControl>
                      <FormDescription>
                        Nombre descriptivo para identificar este canal
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de canal</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un tipo de canal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {canalTipos.map((tipo) => (
                            <SelectItem key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        El tipo de canal determina su comportamiento y configuración
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("tipo") === "custom" && (
                  <FormField
                    control={form.control}
                    name="tipo_personalizado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del tipo personalizado</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. Discord" {...field} />
                        </FormControl>
                        <FormDescription>
                          Ingresa un nombre único para este tipo de canal
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe brevemente para qué se usa este canal"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color del canal</FormLabel>
                      <div className="flex gap-2 items-center">
                        <FormControl>
                          <Input
                            type="color"
                            {...field}
                            className="w-12 h-12 p-1 cursor-pointer"
                          />
                        </FormControl>
                        <Input
                          type="text"
                          value={field.value}
                          onChange={field.onChange}
                          className="font-mono w-28"
                          maxLength={7}
                        />
                        
                        <div 
                          className="flex-1 h-10 rounded-md border"
                          style={{ 
                            background: `linear-gradient(to right, ${field.value}20, ${field.value})`,
                          }}
                        />
                      </div>
                      <FormDescription>
                        Este color se usará para identificar visualmente el canal
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Parámetros requeridos</h3>
                    <Badge variant="outline" className="font-mono bg-muted/50">
                      {parametros.length} parámetros
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Define los campos que se pedirán al conectar este canal a un chatbot.
                    Si agregas un campo como "requerido", será obligatorio completarlo.
                  </p>

                  {parametros.length > 0 ? (
                    <div className="space-y-3 mt-2">
                      {parametros.map(param => (
                        <div 
                          key={param.key} 
                          className="flex items-center justify-between p-3 border rounded-md bg-muted/30"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{param.label}</p>
                              {param.required && (
                                <Badge className="text-xs">Requerido</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground font-mono mt-1">
                              {param.key} - {param.type}
                            </p>
                          </div>
                          
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveParametro(param.key)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-8 border rounded-md bg-muted/20">
                      <p className="text-muted-foreground">
                        No se han configurado parámetros para este canal.
                      </p>
                    </div>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Agregar nuevo parámetro</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="param-key">Clave</Label>
                          <Input
                            id="param-key"
                            placeholder="api_key"
                            value={nuevoParametro.key}
                            onChange={e => setNuevoParametro({...nuevoParametro, key: e.target.value})}
                            className="font-mono"
                          />
                          <p className="text-xs text-muted-foreground">
                            Identificador único del parámetro
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="param-label">Etiqueta</Label>
                          <Input
                            id="param-label"
                            placeholder="API Key"
                            value={nuevoParametro.label}
                            onChange={e => setNuevoParametro({...nuevoParametro, label: e.target.value})}
                          />
                          <p className="text-xs text-muted-foreground">
                            Nombre visible del parámetro
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="param-type">Tipo</Label>
                          <Select
                            value={nuevoParametro.type}
                            onValueChange={value => setNuevoParametro({...nuevoParametro, type: value})}
                          >
                            <SelectTrigger id="param-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Texto</SelectItem>
                              <SelectItem value="password">Contraseña</SelectItem>
                              <SelectItem value="textarea">Área de texto</SelectItem>
                              <SelectItem value="select">Selector</SelectItem>
                              <SelectItem value="checkbox">Casilla</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Tipo de campo para este parámetro
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>¿Es requerido?</Label>
                            <Switch
                              checked={nuevoParametro.required}
                              onCheckedChange={checked => 
                                setNuevoParametro({...nuevoParametro, required: checked})
                              }
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Si es requerido, el usuario deberá completarlo
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        type="button"
                        onClick={handleAddParametro}
                        className="gap-2 w-full"
                      >
                        <Plus className="h-4 w-4" />
                        Agregar parámetro
                      </Button>
                    </CardFooter>
                  </Card>
                </div>

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Estado del canal</FormLabel>
                        <FormDescription>
                          Establece si este canal estará disponible para ser conectado con chatbots
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

              <SheetFooter className="gap-2 sm:space-x-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingCanal ? "Actualizando..." : "Creando..."}
                    </>
                  ) : (
                    editingCanal ? "Actualizar canal" : "Crear canal"
                  )}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}