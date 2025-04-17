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
import { Upload, X, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  // Actualizar formulario cuando se está editando un canal
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
    }
  }, [editingCanal, form]);

  // Manejar el cambio de archivo de logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLogoFile(file);
    
    // Crear preview
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Manejar el cambio de código SVG
  const handleSvgCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const code = e.target.value;
    setSvgCode(code);
    
    // Crear preview desde código SVG
    if (code.trim().startsWith("<svg")) {
      const blob = new Blob([code], { type: "image/svg+xml" });
      setLogoFile(new File([blob], "logo.svg", { type: "image/svg+xml" }));
      setLogoPreview(URL.createObjectURL(blob));
    }
  };
  
  // Eliminar logo
  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setSvgCode("");
  };

  // Manejar guardar
  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsUploading(true);
      
      // Si hay un archivo de logo para subir
      let logoUrl = null;
      if (logoFile) {
        logoUrl = await uploadCanalLogo(logoFile);
      }
      
      // Preparar datos para guardar
      const saveData = {
        ...data,
        logo_url: logoUrl || (editingCanal && editingCanal.logo_url) || null,
        tipo: data.tipo === "custom" && data.tipo_personalizado ? data.tipo_personalizado : data.tipo,
      };
      
      // Si estamos editando o creando
      if (editingCanal && onUpdate) {
        onUpdate(saveData);
      } else {
        onSave(saveData);
      }
      
      // Limpiar formulario y cerrar
      resetForm();
      onOpenChange(false);
      
    } catch (error) {
      console.error("Error al guardar canal:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Resetear formulario
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
                {/* Logo y vista previa */}
                <div className="space-y-2">
                  <Label>Logo del canal</Label>
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-4 items-center">
                      {/* Vista previa */}
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
                              // En caso de error al cargar el SVG
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
                      
                      {/* Botones de acción */}
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
                    
                    {/* Área para código SVG */}
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
                
                {/* Información básica */}
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
                        
                        {/* Vista previa del color */}
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