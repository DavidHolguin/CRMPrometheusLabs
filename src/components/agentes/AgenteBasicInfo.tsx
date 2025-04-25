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
import { Upload, X } from "lucide-react";
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
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <Form {...form}>
          <form className="space-y-6">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del agente</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Asistente de Ventas" {...field} />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="correo@empresa.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Este email se usará para identificar al agente en el sistema
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
                  <FormDescription>
                    URL del sitio web donde se implementará el agente
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Avatar del agente</FormLabel>
              <div className="mt-2 flex items-center gap-4">
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
            </div>
          </form>
        </Form>
      </div>

      {/* Preview en tiempo real */}
      <Card className="relative overflow-hidden bg-muted/50">
        <div className="absolute inset-0 bg-grid-black/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-white/5" />
        <CardContent className="p-6 relative">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarPreview || undefined} />
              <AvatarFallback className="text-2xl">
                {getInitials(formValues.nombre || "NA")}
              </AvatarFallback>
            </Avatar>
            
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

            <div className="w-full max-w-xs bg-background rounded-lg p-4 shadow-sm">
              <p className="text-xs text-center text-muted-foreground">
                Vista previa de cómo se verá tu agente en el chat
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}