import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

// Componentes UI
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Iconos
import {
  Building,
  Check,
  Loader2,
  Mail,
  Map,
  Phone,
  Save,
  UploadCloud,
  Sword,
} from "lucide-react";

// Validación del formulario con zod
const formSchema = z.object({
  nombre: z.string().min(1, "El nombre de la empresa es obligatorio"),
  descripcion: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono: z.string().optional(),
  sitio_web: z.string().optional(),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  pais: z.string().optional(),
  codigo_postal: z.string().optional(),
  logo_url: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function PerfilEmpresa() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [empresa, setEmpresa] = useState<any>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formulario con react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      email: "",
      telefono: "",
      sitio_web: "",
      direccion: "",
      ciudad: "",
      pais: "",
      codigo_postal: "",
      logo_url: "",
    },
  });

  // Cargar datos de la empresa al inicio
  useEffect(() => {
    const fetchEmpresaInfo = async () => {
      if (!user?.companyId) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("empresas")
          .select("*")
          .eq("id", user.companyId)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setEmpresa(data);
          // Poblar formulario con datos existentes
          form.reset({
            nombre: data.nombre || "",
            descripcion: data.descripcion || "",
            email: data.email || "",
            telefono: data.telefono || "",
            sitio_web: data.sitio_web || "",
            direccion: data.direccion || "",
            ciudad: data.ciudad || "",
            pais: data.pais || "",
            codigo_postal: data.codigo_postal || "",
            logo_url: data.logo_url || "",
          });
          setLogoPreview(data.logo_url);
        }
      } catch (error) {
        console.error("Error al cargar información de empresa:", error);
        toast.error("No se pudo cargar la información de la empresa");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmpresaInfo();
  }, [user?.companyId]);

  // Manejar la carga del logo
  const handleLogoUpload = async (file: File) => {
    if (!user?.companyId) {
      toast.error("No hay empresa asociada a tu cuenta");
      return;
    }

    try {
      setIsUploading(true);
      
      // Validar tamaño y tipo de archivo
      if (file.size > 5 * 1024 * 1024) {
        toast.error("El logo no puede superar 5MB");
        return;
      }

      // Obtener extensión del archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${user.companyId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Obtener URL pública
      const { data: publicUrlData } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      // Actualizar el preview y el formulario
      setLogoPreview(publicUrlData.publicUrl);
      form.setValue('logo_url', publicUrlData.publicUrl);
      
      toast.success("Logo subido correctamente");
    } catch (error) {
      console.error("Error al subir logo:", error);
      toast.error("Error al subir el logo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleLogoUpload(file);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!user?.companyId) {
      toast.error("No hay empresa asociada a tu cuenta");
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from("empresas")
        .update({
          nombre: values.nombre,
          descripcion: values.descripcion,
          email: values.email,
          telefono: values.telefono,
          sitio_web: values.sitio_web,
          direccion: values.direccion,
          ciudad: values.ciudad,
          pais: values.pais,
          codigo_postal: values.codigo_postal,
          logo_url: values.logo_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.companyId);
        
      if (error) throw error;
      
      toast.success("Información de empresa actualizada correctamente");
    } catch (error) {
      console.error("Error al actualizar empresa:", error);
      toast.error("Error al guardar los cambios");
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar mensaje de carga mientras se obtienen los datos
  if (isLoading && !empresa) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando información de la empresa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Perfil de Empresa</h1>
          <p className="text-muted-foreground mt-1">
            Administra la información de tu empresa
          </p>
        </div>

        <Tabs defaultValue="informacion" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="informacion">Información General</TabsTrigger>
            <TabsTrigger value="apariencia">Apariencia</TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <TabsContent value="informacion" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Información de la Empresa</CardTitle>
                    <CardDescription>
                      Datos principales de la empresa.
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="nombre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre de la empresa</FormLabel>
                            <FormControl>
                              <Input placeholder="Tu Empresa S.L." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Correo electrónico</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="contacto@tuempresa.com" 
                                type="email" 
                                {...field}
                                value={field.value || ""} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="descripcion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe brevemente a qué se dedica tu empresa..." 
                              {...field} 
                              value={field.value || ""}
                              className="min-h-[100px]" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="telefono"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="+34 123 456 789" 
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
                        name="sitio_web"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sitio web</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://www.tuempresa.com" 
                                {...field} 
                                value={field.value || ""} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ubicación</CardTitle>
                    <CardDescription>
                      Datos de ubicación de la empresa.
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="direccion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Calle Principal 123" 
                              {...field} 
                              value={field.value || ""} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="ciudad"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ciudad</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Madrid" 
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
                        name="codigo_postal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código postal</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="28001" 
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
                        name="pais"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>País</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="España" 
                                {...field} 
                                value={field.value || ""} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="apariencia" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Logo e Imagen</CardTitle>
                    <CardDescription>
                      Personaliza la apariencia de tu empresa.
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="logo_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo de la empresa</FormLabel>
                          <FormControl>
                            <div className="flex flex-col items-center gap-4 sm:flex-row">
                              <div className="flex items-center justify-center">
                                <Avatar className="h-36 w-36 border-2 border-muted">
                                  <AvatarImage src={logoPreview || ""} />
                                  <AvatarFallback>
                                    <Building className="h-12 w-12 text-muted-foreground" />
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                              
                              <div className="flex-1 space-y-4">
                                <div className="flex flex-col gap-3">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full sm:w-auto gap-2"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                  >
                                    {isUploading ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <UploadCloud className="h-4 w-4" />
                                    )}
                                    {isUploading ? "Subiendo..." : "Subir logo"}
                                  </Button>
                                  
                                  <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    disabled={isUploading}
                                  />
                                  
                                  <Input
                                    placeholder="O ingresa la URL del logo"
                                    value={field.value || ""}
                                    onChange={(e) => {
                                      field.onChange(e.target.value);
                                      setLogoPreview(e.target.value);
                                    }}
                                  />
                                </div>
                                
                                <p className="text-xs text-muted-foreground">
                                  El logo se mostrará en chatbots, widgets y correos electrónicos.
                                  <br />Tamaño recomendado: 512x512 píxeles. Formato: JPG, PNG o GIF. Máximo 5MB.
                                </p>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isLoading || isUploading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isLoading ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </div>
    </div>
  );
}