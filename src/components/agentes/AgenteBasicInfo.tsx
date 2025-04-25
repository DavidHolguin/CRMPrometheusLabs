import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Ingresa un email válido"),
  sitioWeb: z.string().url("Ingresa una URL válida").optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AgenteBasicInfoProps {
  onDataChange: (data: FormData & { avatar?: File | null }) => void;
  initialData?: Partial<FormData & { avatar?: File | null }>;
}

export function AgenteBasicInfo({ onDataChange, initialData }: AgenteBasicInfoProps) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUrlValid, setIsUrlValid] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: initialData?.nombre || "",
      email: initialData?.email || "",
      sitioWeb: initialData?.sitioWeb || "",
    },
  });

  const { watch } = form;
  const formValues = watch();

  useEffect(() => {
    // Validar URL al cambiar
    const validateUrl = async () => {
      const url = formValues.sitioWeb;
      if (!url) {
        setIsUrlValid(true);
        return;
      }
      
      try {
        const response = await fetch(url);
        setIsUrlValid(response.ok);
      } catch (error) {
        setIsUrlValid(false);
      }
    };

    validateUrl();
  }, [formValues.sitioWeb]);

  useEffect(() => {
    // Notificar cambios al componente padre
    const subscription = watch((value) => {
      if (value) {
        onDataChange({ ...value, avatar: avatarFile });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, onDataChange, avatarFile]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Columna del formulario */}
      <Card className="p-6">
        <Form {...form}>
          <form className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del agente</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Asistente de Ventas" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Elige un nombre descriptivo que refleje la función del agente
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="correo@empresa.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Se usará para identificar al agente y las notificaciones
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sitioWeb"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sitio web</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="https://www.ejemplo.com" 
                          {...field}
                          className={cn(
                            field.value && !isUrlValid && "border-red-500 focus-visible:ring-red-500"
                          )}
                        />
                        {field.value && (
                          <div 
                            className={cn(
                              "absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full",
                              isUrlValid ? "bg-green-500" : "bg-red-500"
                            )}
                          />
                        )}
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      URL del sitio donde se implementará el chatbot
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormLabel>Avatar del agente</FormLabel>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarPreview || undefined} />
                  <AvatarFallback className="text-lg">
                    {getInitials(formValues.nombre || "NA")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="relative"
                    asChild
                  >
                    <label>
                      <Upload className="h-4 w-4 mr-2" />
                      Subir imagen
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleAvatarChange}
                      />
                    </label>
                  </Button>

                  {avatarPreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeAvatar}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  )}
                </div>
              </div>
              <FormDescription className="text-xs">
                Un avatar personalizado ayuda a humanizar la experiencia
              </FormDescription>
            </div>
          </form>
        </Form>
      </Card>

      {/* Columna de recomendaciones */}
      <Card className="bg-muted/50 border-dashed p-6">
        <h4 className="font-medium mb-4">Consejos para configurar tu chatbot</h4>
        <div className="space-y-6">
          <div>
            <h5 className="font-medium text-sm mb-2">Nombre efectivo</h5>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Sea descriptivo:</span>{" "}
                Elige un nombre que refleje claramente la función del chatbot
              </li>
              <li>
                <span className="font-medium text-foreground">Sea memorable:</span>{" "}
                Usa nombres fáciles de recordar y pronunciar
              </li>
              <li>
                <span className="font-medium text-foreground">Sea profesional:</span>{" "}
                Evita nombres demasiado informales o poco serios
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-medium text-sm mb-2">Email y comunicación</h5>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Email corporativo:</span>{" "}
                Usa un email profesional relacionado con tu empresa
              </li>
              <li>
                <span className="font-medium text-foreground">Dominio propio:</span>{" "}
                Evita usar emails genéricos o personales
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-medium text-sm mb-2">Sitio web</h5>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">URL completa:</span>{" "}
                Incluye https:// en la dirección web
              </li>
              <li>
                <span className="font-medium text-foreground">Accesibilidad:</span>{" "}
                Asegúrate que la página sea accesible públicamente
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Columna de preview */}
      <Card className="p-6">
        <h4 className="font-medium mb-6 text-center">Vista previa del chatbot</h4>
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarPreview || undefined} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {getInitials(formValues.nombre || "NA")}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
          </div>
          
          <div className="text-center space-y-1.5">
            <h3 className="font-semibold text-lg">
              {formValues.nombre || "Nombre del agente"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {formValues.email || "correo@empresa.com"}
            </p>
            {formValues.sitioWeb && (
              <p className="text-xs text-muted-foreground">
                {formValues.sitioWeb}
              </p>
            )}
          </div>

          {/* Preview del chat */}
          <div className="w-full max-w-sm bg-background rounded-lg border p-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarPreview || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(formValues.nombre || "NA")}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-primary/10 text-primary rounded-lg p-3 text-sm">
                  ¡Hola! Soy {formValues.nombre || "tu asistente"}, ¿en qué puedo ayudarte?
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Vista previa de cómo se verá tu chatbot en la interfaz de chat
          </p>
        </div>
      </Card>
    </div>
  );
}