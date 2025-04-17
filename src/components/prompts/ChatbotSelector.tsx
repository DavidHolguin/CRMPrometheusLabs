import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Bot, Check, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

// Tipos
interface Chatbot {
  id: string;
  nombre: string;
  descripcion: string;
  avatar_url: string;
  empresa_id: string;
}

interface ChatbotSelectorProps {
  templateId: string;
  onAssign: (chatbotId: string, params?: Record<string, any>) => void;
  onCancel: () => void;
}

// Esquema de validación para los parametros personalizados
const assignmentSchema = z.object({
  chatbotId: z.string().min(1, "Debes seleccionar un chatbot"),
  orden: z.coerce.number().int().positive().default(1),
  parametros: z.record(z.string(), z.any()).optional(),
  is_active: z.boolean().default(true),
});

export function ChatbotSelector({ templateId, onAssign, onCancel }: ChatbotSelectorProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateVariables, setTemplateVariables] = useState<any[]>([]);

  // Configurar formulario
  const form = useForm({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      chatbotId: '',
      orden: 1,
      parametros: {},
      is_active: true,
    },
  });

  // Cargar chatbots disponibles
  useEffect(() => {
    const fetchChatbots = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('chatbots')
          .select('id, nombre, descripcion, avatar_url, empresa_id')
          .order('nombre');

        if (error) throw error;
        setChatbots(data || []);
      } catch (err) {
        console.error('Error al cargar chatbots:', err);
        toast.error('Error al cargar la lista de chatbots');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatbots();
  }, []);

  // Cargar variables del template
  useEffect(() => {
    const fetchTemplateVariables = async () => {
      if (!templateId) return;

      try {
        const { data, error } = await supabase
          .from('prompt_templates')
          .select('variables')
          .eq('id', templateId)
          .single();

        if (error) throw error;
        setTemplateVariables(data?.variables || []);
      } catch (err) {
        console.error('Error al cargar variables del template:', err);
      }
    };

    fetchTemplateVariables();
  }, [templateId]);

  // Seleccionar chatbot
  const handleSelectChatbot = (chatbot: Chatbot) => {
    setSelectedChatbot(chatbot);
    form.setValue('chatbotId', chatbot.id);
    setOpen(false);
  };

  // Manejar envío del formulario
  const handleSubmit = async (values: z.infer<typeof assignmentSchema>) => {
    setIsSubmitting(true);
    try {
      const parametros: Record<string, any> = {};
      
      // Recolectar valores personalizados de los parámetros
      templateVariables.forEach(variable => {
        const fieldName = `param_${variable.name}`;
        const value = form.getValues(fieldName as any);
        if (value !== undefined && value !== '') {
          parametros[variable.name] = value;
        }
      });
      
      // Llamar a la función de asignación
      await onAssign(values.chatbotId, parametros);
      toast.success('Plantilla asignada al chatbot correctamente');
    } catch (error) {
      console.error('Error al asignar plantilla:', error);
      toast.error('Error al asignar la plantilla al chatbot');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="chatbotId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Chatbot</FormLabel>
              <div className="relative">
                {selectedChatbot ? (
                  <div className="flex items-center justify-between border rounded-md p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedChatbot.avatar_url} alt={selectedChatbot.nombre} />
                        <AvatarFallback className="bg-primary/10">
                          <Bot className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{selectedChatbot.nombre}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {selectedChatbot.descripcion || "Sin descripción"}
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedChatbot(null);
                        form.setValue('chatbotId', '');
                      }}
                    >
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full justify-between"
                      onClick={() => setOpen(true)}
                    >
                      <span className="text-muted-foreground">Seleccionar un chatbot</span>
                    </Button>
                    {open && (
                      <div className="absolute z-10 w-full mt-1 rounded-md border bg-popover shadow-md">
                        <Command>
                          <CommandInput placeholder="Buscar chatbot..." />
                          <CommandList>
                            <CommandEmpty>No se encontraron chatbots</CommandEmpty>
                            <ScrollArea className="h-72">
                              <CommandGroup>
                                {isLoading ? (
                                  <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                  </div>
                                ) : (
                                  chatbots.map((chatbot) => (
                                    <CommandItem
                                      key={chatbot.id}
                                      onSelect={() => handleSelectChatbot(chatbot)}
                                      className="flex items-center gap-2 px-2"
                                    >
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={chatbot.avatar_url} alt={chatbot.nombre} />
                                        <AvatarFallback className="bg-primary/10">
                                          <Bot className="h-4 w-4" />
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 truncate">
                                        <p className="text-sm font-medium">{chatbot.nombre}</p>
                                      </div>
                                      {field.value === chatbot.id && (
                                        <Check className="h-4 w-4" />
                                      )}
                                    </CommandItem>
                                  ))
                                )}
                              </CommandGroup>
                            </ScrollArea>
                          </CommandList>
                        </Command>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedChatbot && templateVariables.length > 0 && (
          <div className="space-y-4">
            <div className="font-medium text-sm">Parámetros personalizados</div>
            <div className="rounded-md border p-4 space-y-4">
              {templateVariables.map((variable, index) => (
                <div key={variable.name} className="grid gap-2">
                  <label
                    htmlFor={`param_${variable.name}`}
                    className="text-sm font-medium flex gap-1 items-center"
                  >
                    {variable.name}
                    {variable.required && (
                      <span className="text-destructive">*</span>
                    )}
                  </label>
                  <Input
                    id={`param_${variable.name}`}
                    placeholder={variable.description || `Valor para ${variable.name}`}
                    defaultValue={variable.defaultValue || ''}
                    {...form.register(`param_${variable.name}` as any)}
                  />
                  {variable.description && (
                    <p className="text-xs text-muted-foreground">
                      {variable.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4">
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
            disabled={!selectedChatbot || isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? "Asignando..." : "Asignar plantilla"}
          </Button>
        </div>
      </form>
    </Form>
  );
}