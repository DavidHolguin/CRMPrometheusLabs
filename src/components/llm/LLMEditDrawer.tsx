import { useEffect, useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, KeyRound, Star } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LLMConfig, CreateLLMConfigInput, UpdateLLMConfigInput } from "@/hooks/useLLMConfigs";

const llmConfigSchema = z.object({
  nombre: z.string().min(1, {
    message: "El nombre es obligatorio",
  }),
  proveedor: z.string().min(1, {
    message: "El proveedor es obligatorio",
  }),
  modelo: z.string().min(1, {
    message: "El modelo es obligatorio",
  }),
  api_key: z.string().min(1, {
    message: "La clave API es obligatoria",
  }),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
  configuracion: z.object({
    temperature: z.number().min(0).max(2).optional(),
    max_tokens: z.number().int().positive().optional(),
    top_p: z.number().min(0).max(1).optional(),
    frequency_penalty: z.number().min(-2).max(2).optional(),
    presence_penalty: z.number().min(-2).max(2).optional(),
  }).optional(),
});

type LLMConfigFormValues = z.infer<typeof llmConfigSchema>;

interface LLMEditDrawerProps {
  config?: LLMConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CreateLLMConfigInput | UpdateLLMConfigInput) => void;
  providers: Array<{
    id: string;
    name: string;
    models: Array<{ id: string; name: string }>;
  }>;
  isLoading?: boolean;
}

export function LLMEditDrawer({
  config,
  open,
  onOpenChange,
  onSave,
  providers,
  isLoading = false,
}: LLMEditDrawerProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  
  // Crear formulario
  const form = useForm<LLMConfigFormValues>({
    resolver: zodResolver(llmConfigSchema),
    defaultValues: {
      nombre: config?.nombre || "",
      proveedor: config?.proveedor || "",
      modelo: config?.modelo || "",
      api_key: config?.api_key || "",
      is_default: config?.is_default || false,
      is_active: config?.is_active !== undefined ? config?.is_active : true,
      configuracion: {
        temperature: config?.configuracion?.temperature || 0.7,
        max_tokens: config?.configuracion?.max_tokens || 2048,
        top_p: config?.configuracion?.top_p || 1,
        frequency_penalty: config?.configuracion?.frequency_penalty || 0,
        presence_penalty: config?.configuracion?.presence_penalty || 0,
      },
    },
  });

  // Actualizar el formulario cuando cambia el config
  useEffect(() => {
    if (config) {
      form.reset({
        nombre: config.nombre,
        proveedor: config.proveedor,
        modelo: config.modelo,
        api_key: config.api_key,
        is_default: config.is_default,
        is_active: config.is_active !== undefined ? config.is_active : true,
        configuracion: {
          temperature: config.configuracion?.temperature || 0.7,
          max_tokens: config.configuracion?.max_tokens || 2048,
          top_p: config.configuracion?.top_p || 1,
          frequency_penalty: config.configuracion?.frequency_penalty || 0,
          presence_penalty: config.configuracion?.presence_penalty || 0,
        },
      });
      setSelectedProvider(config.proveedor);
    } else {
      form.reset({
        nombre: "",
        proveedor: "",
        modelo: "",
        api_key: "",
        is_default: false,
        is_active: true,
        configuracion: {
          temperature: 0.7,
          max_tokens: 2048,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        },
      });
      setSelectedProvider(null);
    }
  }, [config, form]);

  // Manejar cambio de proveedor
  const handleProviderChange = (value: string) => {
    setSelectedProvider(value);
    form.setValue("proveedor", value);
    form.setValue("modelo", ""); // Resetear modelo cuando cambia el proveedor
  };

  // Obtener modelos para el proveedor seleccionado
  const getModelsForProvider = () => {
    if (!selectedProvider) return [];
    const provider = providers.find(p => p.id === selectedProvider);
    return provider?.models || [];
  };

  // Manejar envío del formulario
  const onSubmit = (values: LLMConfigFormValues) => {
    if (config) {
      // Actualizar configuración existente
      onSave({
        id: config.id,
        ...values,
      });
    } else {
      // Crear nueva configuración
      onSave(values as CreateLLMConfigInput);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg lg:max-w-xl flex flex-col h-full p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <SheetHeader className="px-6 pt-6 pb-2">
              <SheetTitle>{config ? "Editar configuración LLM" : "Nueva configuración LLM"}</SheetTitle>
              <SheetDescription>
                {config
                  ? "Modifica los parámetros de la configuración LLM existente"
                  : "Define una nueva configuración de modelo de lenguaje"}
              </SheetDescription>
            </SheetHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
              <div className="px-6 pt-2">
                <TabsList className="w-full">
                  <TabsTrigger value="general" className="flex-1">
                    General
                  </TabsTrigger>
                  <TabsTrigger value="avanzado" className="flex-1">
                    Parámetros avanzados
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="general" className="flex-1 mt-0">
                <ScrollArea className="flex-1 px-6 py-4 h-[calc(100vh-220px)]">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de la configuración</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ej: GPT-4 Producción" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Nombre descriptivo para identificar esta configuración
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="proveedor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proveedor</FormLabel>
                          <Select
                            onValueChange={handleProviderChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un proveedor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {providers.map((provider) => (
                                <SelectItem key={provider.id} value={provider.id}>
                                  {provider.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Selecciona el proveedor del modelo de lenguaje
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="modelo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Modelo</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            disabled={!selectedProvider}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un modelo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getModelsForProvider().map((model) => (
                                <SelectItem key={model.id} value={model.id}>
                                  {model.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Selecciona el modelo específico a utilizar
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="api_key"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <div className="flex items-center gap-2">
                              <KeyRound className="h-4 w-4" />
                              Clave API
                            </div>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showApiKey ? "text" : "password"} 
                                placeholder="sk-..." 
                                {...field} 
                              />
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="sm" 
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowApiKey(!showApiKey)}
                              >
                                {showApiKey ? "Ocultar" : "Mostrar"}
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription>
                            <span className="flex items-center gap-1 text-amber-500">
                              <AlertTriangle className="h-3 w-3" />
                              Esta clave se almacena de forma segura y nunca se muestra completa
                            </span>
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-6 pt-2">
                      <FormField
                        control={form.control}
                        name="is_default"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between gap-2 space-y-0 rounded-md border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center gap-1">
                                <Star className="h-4 w-4" />
                                Establecer como predeterminado
                              </FormLabel>
                              <FormDescription>
                                Se usará como configuración predeterminada para todos los chatbots
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

                      <FormField
                        control={form.control}
                        name="is_active"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between gap-2 space-y-0 rounded-md border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Activo</FormLabel>
                              <FormDescription>
                                Habilita o deshabilita esta configuración
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
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="avanzado" className="flex-1 mt-0">
                <ScrollArea className="flex-1 px-6 py-4 h-[calc(100vh-220px)]">
                  <div className="space-y-6">
                    <Alert>
                      <AlertDescription>
                        Estos parámetros afectan directamente la calidad, creatividad y rendimiento de las respuestas generadas.
                      </AlertDescription>
                    </Alert>
                    
                    <FormField
                      control={form.control}
                      name="configuracion.temperature"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center">
                            <FormLabel>Temperatura</FormLabel>
                            <Badge variant="outline">
                              {field.value !== undefined ? field.value.toFixed(2) : "0.70"}
                            </Badge>
                          </div>
                          <FormControl>
                            <Slider
                              min={0}
                              max={2}
                              step={0.01}
                              defaultValue={[field.value !== undefined ? field.value : 0.7]}
                              onValueChange={(values) => field.onChange(values[0])}
                              className="py-4"
                            />
                          </FormControl>
                          <FormDescription>
                            Controla la aleatoriedad de las respuestas. Valores más bajos generan respuestas más deterministas y enfocadas, valores más altos producen respuestas más diversas y creativas.
                          </FormDescription>
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <div>Preciso (0)</div>
                            <div>Equilibrado (0.7)</div>
                            <div>Creativo (2)</div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator className="my-4" />

                    <FormField
                      control={form.control}
                      name="configuracion.max_tokens"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center">
                            <FormLabel>Tokens máximos</FormLabel>
                            <Badge variant="outline">
                              {field.value !== undefined ? field.value : "2048"}
                            </Badge>
                          </div>
                          <FormControl>
                            <Slider
                              min={256}
                              max={8192}
                              step={128}
                              defaultValue={[field.value !== undefined ? field.value : 2048]}
                              onValueChange={(values) => field.onChange(values[0])}
                              className="py-4"
                            />
                          </FormControl>
                          <FormDescription>
                            Límite máximo de tokens (palabras) en cada respuesta. Un valor mayor permite respuestas más extensas pero puede aumentar el costo y tiempo de generación.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator className="my-4" />

                    <FormField
                      control={form.control}
                      name="configuracion.top_p"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center">
                            <FormLabel>Top P (Nucleus Sampling)</FormLabel>
                            <Badge variant="outline">
                              {field.value !== undefined ? field.value.toFixed(2) : "1.00"}
                            </Badge>
                          </div>
                          <FormControl>
                            <Slider
                              min={0.01}
                              max={1}
                              step={0.01}
                              defaultValue={[field.value !== undefined ? field.value : 1]}
                              onValueChange={(values) => field.onChange(values[0])}
                              className="py-4"
                            />
                          </FormControl>
                          <FormDescription>
                            Controla la diversidad de palabras consideradas en cada paso. Valores más bajos consideran solo las palabras más probables, mientras que valores más altos permiten más variedad.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="configuracion.frequency_penalty"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between items-center">
                              <FormLabel>Penalización por frecuencia</FormLabel>
                              <Badge variant="outline">
                                {field.value !== undefined ? field.value.toFixed(2) : "0.00"}
                              </Badge>
                            </div>
                            <FormControl>
                              <Slider
                                min={-2}
                                max={2}
                                step={0.01}
                                defaultValue={[field.value !== undefined ? field.value : 0]}
                                onValueChange={(values) => field.onChange(values[0])}
                                className="py-4"
                              />
                            </FormControl>
                            <FormDescription>
                              Reduce la repetición de palabras frecuentes. Valores positivos reducen la repetición.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="configuracion.presence_penalty"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between items-center">
                              <FormLabel>Penalización por presencia</FormLabel>
                              <Badge variant="outline">
                                {field.value !== undefined ? field.value.toFixed(2) : "0.00"}
                              </Badge>
                            </div>
                            <FormControl>
                              <Slider
                                min={-2}
                                max={2}
                                step={0.01}
                                defaultValue={[field.value !== undefined ? field.value : 0]}
                                onValueChange={(values) => field.onChange(values[0])}
                                className="py-4"
                              />
                            </FormControl>
                            <FormDescription>
                              Fomenta hablar de nuevos temas. Valores positivos aumentan la diversidad temática.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            <SheetFooter className="border-t p-6">
              <div className="flex justify-between w-full">
                <Button
                  type="button"
                  variant="ghost" 
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {config ? "Actualizar configuración" : "Crear configuración"}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}