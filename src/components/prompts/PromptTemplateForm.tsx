import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { X, PlusCircle, Save, Code, Wand2, Variable } from "lucide-react";
import { toast } from "sonner";

// Tipos
interface PromptTemplate {
  id: string;
  empresa_id: string;
  nombre: string;
  descripcion: string;
  tipo_template: string;
  contenido: string;
  variables: any[];
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PromptVariable {
  name: string;
  description?: string;
  defaultValue?: string;
  required?: boolean;
}

// Esquema de validación para el formulario
const templateSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  descripcion: z.string().optional(),
  tipo_template: z.string().min(1, "Selecciona un tipo de template"),
  contenido: z.string().min(10, "El contenido debe tener al menos 10 caracteres"),
  tags: z.array(z.string()).optional(),
  is_active: z.boolean().default(true),
  variables: z.array(z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    description: z.string().optional(),
    defaultValue: z.string().optional(),
    required: z.boolean().default(false),
  })).optional(),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

interface Props {
  template?: PromptTemplate;
  onSubmit: (values: TemplateFormValues) => void;
  onCancel: () => void;
}

export function PromptTemplateForm({ template, onSubmit, onCancel }: Props) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [templateTypes, setTemplateTypes] = useState<string[]>([
    "Sistema", "Usuario", "Asistente", "Contexto", "Evaluación", "Personalizado"
  ]);

  // Configurar formulario
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      nombre: template?.nombre || "",
      descripcion: template?.descripcion || "",
      tipo_template: template?.tipo_template || "",
      contenido: template?.contenido || "",
      tags: template?.tags || [],
      is_active: template?.is_active ?? true,
      variables: template?.variables || [],
    },
  });

  // Cargar tipos de templates únicos
  useEffect(() => {
    const fetchTemplateTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('prompt_templates')
          .select('tipo_template')
          .order('tipo_template');

        if (error) throw error;

        if (data) {
          const types = new Set<string>(templateTypes);
          data.forEach(item => {
            if (item.tipo_template) {
              types.add(item.tipo_template);
            }
          });
          setTemplateTypes(Array.from(types));
        }
      } catch (err) {
        console.error("Error al cargar tipos de templates:", err);
      }
    };

    fetchTemplateTypes();
  }, []);

  // Agregar una nueva variable
  const addVariable = () => {
    const currentVariables = form.getValues("variables") || [];
    form.setValue("variables", [
      ...currentVariables,
      { name: "", description: "", defaultValue: "", required: false }
    ]);
  };

  // Eliminar una variable
  const removeVariable = (index: number) => {
    const currentVariables = form.getValues("variables") || [];
    form.setValue("variables", currentVariables.filter((_, i) => i !== index));
  };

  // Agregar un nuevo tag
  const addTag = () => {
    if (!tagInput.trim()) return;
    const currentTags = form.getValues("tags") || [];
    if (!currentTags.includes(tagInput.trim())) {
      form.setValue("tags", [...currentTags, tagInput.trim()]);
    }
    setTagInput("");
  };

  // Eliminar un tag
  const removeTag = (tag: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue("tags", currentTags.filter(t => t !== tag));
  };

  // Procesar envío del formulario
  const handleSubmit = async (values: TemplateFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      console.error("Error al guardar la plantilla:", error);
      toast.error("Hubo un problema al guardar la plantilla");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Variables detectadas en el contenido
  const detectedVariables = form.watch("contenido", "").match(/\{\{([^}]+)\}\}/g) || [];
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre de la plantilla" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tipo_template"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de plantilla</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {templateTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  placeholder="Describe brevemente esta plantilla..." 
                  {...field} 
                  className="resize-none h-20"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contenido"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contenido del Prompt</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Escribe aquí tu plantilla de prompt. Usa {{variable}} para las variables." 
                  {...field} 
                  className="resize-none h-48 font-mono text-sm"
                />
              </FormControl>
              <FormDescription>
                {detectedVariables.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs mb-1">Variables detectadas:</div>
                    <div className="flex flex-wrap gap-1">
                      {[...new Set(detectedVariables.map(v => v.replace(/\{\{|\}\}/g, '')))].map((variable) => (
                        <Badge key={variable} variant="outline" className="font-mono text-xs">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="variables">
            <AccordionTrigger className="text-sm font-medium">
              <div className="flex items-center">
                <Variable className="h-4 w-4 mr-2" />
                Variables y parámetros
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm">Define las variables que se pueden usar en esta plantilla</div>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="outline" 
                    onClick={addVariable}
                  >
                    <PlusCircle className="h-4 w-4 mr-1" /> Añadir variable
                  </Button>
                </div>
                
                {form.watch("variables")?.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No hay variables definidas
                  </div>
                ) : (
                  <div className="space-y-4">
                    {form.watch("variables")?.map((_, index) => (
                      <Card key={index} className="border border-muted">
                        <CardHeader className="p-3 flex flex-row items-center justify-between">
                          <div className="font-medium text-sm">Variable {index + 1}</div>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => removeVariable(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </CardHeader>
                        <CardContent className="p-3 grid gap-3">
                          <FormField
                            control={form.control}
                            name={`variables.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Nombre</FormLabel>
                                <FormControl>
                                  <Input placeholder="nombre_variable" {...field} className="h-8" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <FormField
                              control={form.control}
                              name={`variables.${index}.defaultValue`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Valor por defecto</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Valor predeterminado" {...field} className="h-8" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`variables.${index}.required`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-end space-x-2">
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-xs">Obligatorio</FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name={`variables.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Descripción</FormLabel>
                                <FormControl>
                                  <Input placeholder="Descripción de la variable" {...field} className="h-8" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="tags">
            <AccordionTrigger className="text-sm font-medium">
              <div className="flex items-center">
                <Code className="h-4 w-4 mr-2" />
                Etiquetas
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Nueva etiqueta"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={addTag} size="sm">
                    Añadir
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {form.watch("tags")?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="px-2 py-1">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                  {form.watch("tags")?.length === 0 && (
                    <div className="text-sm text-muted-foreground w-full text-center py-2">
                      Sin etiquetas
                    </div>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Estado activo</FormLabel>
                <FormDescription>
                  Las plantillas inactivas no se pueden asignar a chatbots
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

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="min-w-[120px]"
          >
            {isSubmitting ? "Guardando..." : "Guardar plantilla"}
          </Button>
        </div>
      </form>
    </Form>
  );
}