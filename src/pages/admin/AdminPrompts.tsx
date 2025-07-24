import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertCircle,
  BookText,
  Check,
  ChevronDown,
  Code,
  Copy,
  Edit,
  FileCode2,
  Grid3x3,
  List,
  MoreHorizontal,
  Plus,
  PlusCircle,
  Search,
  Trash2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

// Hooks y tipos
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PromptTemplateForm } from "@/components/prompts/PromptTemplateForm";
import { PromptTemplateCard } from "@/components/prompts/PromptTemplateCard";
import { ChatbotSelector } from "../../components/prompts/ChatbotSelector";

// Tipos
interface PromptTemplate {
  id: string;
  empresa_id: string; // Añadido para mantener compatibilidad con PromptTemplateCard y PromptTemplateForm
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

interface ChatbotContexto {
  id: string;
  chatbot_id: string;
  promt_templete: number; // Nota: este nombre tiene un error ortográfico en la BD
  tipo: string;
  contenido: string;
  orden: number;
}

// Hook personalizado para los Prompt Templates
const usePromptTemplates = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [chatbotContextos, setChatbotContextos] = useState<ChatbotContexto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener templates
  const fetchTemplates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('prompt_templates')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las plantillas de prompts');
      toast.error('Error al cargar las plantillas');
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener contextos de chatbot que tienen prompts asignados
  const fetchChatbotContextos = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbot_contextos')
        .select('*')
        .not('promt_templete', 'is', null);

      if (error) throw error;
      setChatbotContextos(data || []);
    } catch (err: any) {
      console.error('Error al cargar contextos de chatbot:', err);
    }
  };

  // Crear template
  const createTemplate = async (template: Omit<PromptTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Ya no necesitamos empresa_id
      const { data, error } = await supabase
        .from('prompt_templates')
        .insert([template])
        .select()
        .single();

      if (error) throw error;
      setTemplates(prev => [data, ...prev]);
      toast.success('Plantilla creada correctamente');
      return data;
    } catch (err: any) {
      toast.error('Error al crear la plantilla');
      throw err;
    }
  };

  // Actualizar template
  const updateTemplate = async (id: string, updates: Partial<PromptTemplate>) => {
    try {
      const { data, error } = await supabase
        .from('prompt_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setTemplates(prev =>
        prev.map(template => (template.id === id ? { ...template, ...data } : template))
      );
      toast.success('Plantilla actualizada correctamente');
      return data;
    } catch (err: any) {
      toast.error('Error al actualizar la plantilla');
      throw err;
    }
  };

  // Eliminar template
  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('prompt_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTemplates(prev => prev.filter(template => template.id !== id));
      toast.success('Plantilla eliminada correctamente');
    } catch (err: any) {
      toast.error('Error al eliminar la plantilla');
      throw err;
    }
  };

  // Asignar template a chatbot
  const assignTemplateToChatbot = async (chatbotId: string, templateId: number, tipo: string = 'prompt') => {
    try {
      // Verificamos si ya existe un registro con ese tipo para el chatbot
      const { data: existingContextos } = await supabase
        .from('chatbot_contextos')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .eq('tipo', tipo);
      
      if (existingContextos && existingContextos.length > 0) {
        // Si existe, actualizamos el promt_templete
        const { data, error } = await supabase
          .from('chatbot_contextos')
          .update({ promt_templete: templateId })
          .eq('id', existingContextos[0].id)
          .select();

        if (error) throw error;
        setChatbotContextos(prev => prev.map(ctx => 
          ctx.id === existingContextos[0].id 
            ? { ...ctx, promt_templete: templateId } 
            : ctx
        ));
      } else {
        // Si no existe, creamos un nuevo registro
        const { data, error } = await supabase
          .from('chatbot_contextos')
          .insert([{
            chatbot_id: chatbotId,
            promt_templete: templateId,
            tipo: tipo,
            contenido: '',
            orden: 1
          }])
          .select();

        if (error) throw error;
        if (data) setChatbotContextos(prev => [...prev, ...data]);
      }
      
      toast.success('Plantilla asignada al chatbot correctamente');
    } catch (err: any) {
      toast.error('Error al asignar la plantilla');
      throw err;
    }
  };

  // Desasignar template de chatbot
  const unassignTemplateFromChatbot = async (contextoId: string) => {
    try {
      const { error } = await supabase
        .from('chatbot_contextos')
        .update({ promt_templete: null })
        .eq('id', contextoId);

      if (error) throw error;
      setChatbotContextos(prev => prev.filter(ctx => ctx.id !== contextoId));
      toast.success('Asignación eliminada correctamente');
    } catch (err: any) {
      toast.error('Error al eliminar la asignación');
      throw err;
    }
  };

  // Cargar datos al iniciar
  useEffect(() => {
    fetchTemplates();
    fetchChatbotContextos();
  }, [user?.id]);

  return {
    templates,
    chatbotContextos, 
    isLoading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    assignTemplateToChatbot,
    unassignTemplateFromChatbot,
    refreshTemplates: fetchTemplates,
    refreshContextos: fetchChatbotContextos,
  };
};

// Componente principal
export default function AdminPrompts() {
  const {
    templates,
    chatbotContextos,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    assignTemplateToChatbot,
    unassignTemplateFromChatbot
  } = usePromptTemplates();

  // Estados para la interfaz
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [activeView, setActiveView] = useState<"grid" | "list">("grid");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [isChatbotSelectorOpen, setIsChatbotSelectorOpen] = useState(false);
  const [templateForChatbot, setTemplateForChatbot] = useState<number | null>(null);

  // Filtrar templates según búsqueda y tipo seleccionado
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesQuery =
        searchQuery === "" ||
        template.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.descripcion?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType =
        selectedType === "all" ||
        template.tipo_template?.toLowerCase() === selectedType.toLowerCase();

      return matchesQuery && matchesType;
    });
  }, [templates, searchQuery, selectedType]);

  // Tipos de templates disponibles
  const templateTypes = useMemo(() => {
    const types = new Set<string>();
    templates.forEach(template => {
      if (template.tipo_template) {
        types.add(template.tipo_template);
      }
    });
    return Array.from(types);
  }, [templates]);

  // Obtener el número de chatbots con plantillas asignadas
  const chatbotsWithTemplates = useMemo(() => {
    const chatbotIds = new Set(chatbotContextos.map(ctx => ctx.chatbot_id));
    return chatbotIds.size;
  }, [chatbotContextos]);

  // Gestionar apertura/cierre del editor
  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setTimeout(() => {
      setSelectedTemplate(null);
    }, 200);
  };

  // Abrir editor para editar o crear
  const handleOpenEditor = (template?: PromptTemplate) => {
    setSelectedTemplate(template || null);
    setIsEditorOpen(true);
  };

  // Manejar guardado de template
  const handleSaveTemplate = async (values: any) => {
    try {
      if (selectedTemplate) {
        // Actualizar template existente
        await updateTemplate(selectedTemplate.id, values);
      } else {
        // Crear nuevo template
        await createTemplate(values);
      }
      setIsEditorOpen(false);
    } catch (error) {
      console.error("Error al guardar template:", error);
    }
  };

  // Eliminar template
  const handleDeleteTemplate = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta plantilla? Esta acción no se puede deshacer.")) {
      try {
        await deleteTemplate(id);
      } catch (error) {
        console.error("Error al eliminar template:", error);
      }
    }
  };

  // Abrir selector de chatbot
  const handleOpenChatbotSelector = (templateId: string) => {
    // Convertir templateId a número ya que promt_templete es de tipo number
    setTemplateForChatbot(Number(templateId));
    setIsChatbotSelectorOpen(true);
  };

  // Asignar template a chatbot
  const handleAssignToChatbot = async (chatbotId: string, params: Record<string, any> = {}) => {
    if (!templateForChatbot) return;
    
    try {
      // Extraemos el tipo si viene en los parámetros o usamos 'prompt' como valor por defecto
      const tipo = params.tipo || "prompt";
      
      await assignTemplateToChatbot(chatbotId, templateForChatbot, tipo);
      setIsChatbotSelectorOpen(false);
    } catch (error) {
      console.error("Error al asignar template a chatbot:", error);
    }
  };

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Encabezado de página con título y botón de nueva plantilla */}
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Plantillas de Prompts</h2>
          <p className="text-muted-foreground">
            Crea y gestiona plantillas de prompt estratégicas para tus chatbots
          </p>
        </div>
        <Button onClick={() => handleOpenEditor()} className="relative overflow-hidden group">
          <div className="absolute inset-0 w-3 bg-gradient-to-r from-primary/80 via-primary/0 to-transparent transition-all duration-300 -translate-x-full group-hover:translate-x-[500%]"></div>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva plantilla
        </Button>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="overflow-hidden border border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
            <CardTitle className="text-sm font-medium">
              Total de plantillas
            </CardTitle>
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary/30 to-primary/20 opacity-70 blur-sm"></div>
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-background">
                <FileCode2 className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {templates.filter(t => t.is_active).length} activas ·{" "}
              {templates.filter(t => !t.is_active).length} inactivas
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
            <CardTitle className="text-sm font-medium">
              Tipos de plantillas
            </CardTitle>
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-blue-500/30 to-cyan-500/20 opacity-70 blur-sm"></div>
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-background">
                <Code className="h-4 w-4 text-blue-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-2">
              {templateTypes.length > 0 ? (
                templateTypes.map((type) => (
                  <Badge key={type} variant="outline" className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 transition-colors">
                    {type}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">Sin tipos definidos</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
            <CardTitle className="text-sm font-medium">
              Chatbots con plantillas
            </CardTitle>
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-purple-500/30 to-violet-500/20 opacity-70 blur-sm"></div>
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-background">
                <Wand2 className="h-4 w-4 text-purple-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {chatbotsWithTemplates}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {chatbotContextos.length} asignaciones totales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y controles de vista */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[280px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar plantilla..."
              className="pl-9 border-border/40 focus-visible:ring-primary/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={selectedType}
            onValueChange={setSelectedType}
          >
            <SelectTrigger className="w-full sm:w-[180px] border-border/40">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {templateTypes.map((type) => (
                <SelectItem key={type} value={type.toLowerCase()}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={activeView === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setActiveView("grid")}
            className="h-9 w-9"
          >
            <Grid3x3 className="h-4 w-4" />
            <span className="sr-only">Vista de tarjetas</span>
          </Button>
          <Button
            variant={activeView === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setActiveView("list")}
            className="h-9 w-9"
          >
            <List className="h-4 w-4" />
            <span className="sr-only">Vista de lista</span>
          </Button>
        </div>
      </div>

      {/* Estado de carga y mensajes de resultado vacío */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <FileCode2 className="h-6 w-6 text-primary animate-pulse" />
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Cargando plantillas...</p>
          </div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="relative mb-4">
            <div className="absolute -inset-4 rounded-full opacity-20 blur-lg bg-gradient-to-r from-primary/30 to-primary/20"></div>
            <FileCode2 className="h-12 w-12 text-primary opacity-80" />
          </div>
          <h3 className="text-lg font-medium">No se encontraron plantillas</h3>
          <p className="text-muted-foreground mt-1 max-w-md">
            {searchQuery || selectedType !== "all"
              ? "Prueba a cambiar los filtros de búsqueda"
              : "Comienza creando una nueva plantilla de prompt"}
          </p>
          {(searchQuery || selectedType !== "all") && (
            <Button
              variant="outline"
              className="mt-4 border-dashed"
              onClick={() => {
                setSearchQuery("");
                setSelectedType("all");
              }}
            >
              Limpiar filtros
            </Button>
          )}
          {!searchQuery && selectedType === "all" && (
            <Button className="mt-4 relative overflow-hidden group" onClick={() => handleOpenEditor()}>
              <div className="absolute inset-0 w-3 bg-gradient-to-r from-primary/80 via-primary/0 to-transparent transition-all duration-300 -translate-x-full group-hover:translate-x-[500%]"></div>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear plantilla
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Vista de tarjetas */}
          {activeView === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredTemplates.map((template) => (
                <PromptTemplateCard
                  key={template.id}
                  template={template}
                  onEdit={handleOpenEditor}
                  onDelete={handleDeleteTemplate}
                  onAssign={handleOpenChatbotSelector}
                  variant="card"
                />
              ))}
            </div>
          ) : (
            /* Vista de lista */
            <div className="rounded-md border border-border/40 shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="hidden md:table-cell">Variables</TableHead>
                    <TableHead className="hidden lg:table-cell">Actualizado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <PromptTemplateCard
                      key={template.id}
                      template={template}
                      onEdit={handleOpenEditor}
                      onDelete={handleDeleteTemplate}
                      onAssign={handleOpenChatbotSelector}
                      variant="row"
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      {/* Editor lateral para crear/editar plantillas */}
      <Sheet open={isEditorOpen} onOpenChange={(open) => !open && handleEditorClose()}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {selectedTemplate ? "Editar plantilla" : "Nueva plantilla"}
            </SheetTitle>
            <SheetDescription>
              {selectedTemplate
                ? "Modifica los detalles de la plantilla existente"
                : "Crea una nueva plantilla de prompt para tus chatbots"}
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <PromptTemplateForm
              template={selectedTemplate}
              onSubmit={handleSaveTemplate}
              onCancel={handleEditorClose}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Selector de chatbot para asignar plantillas */}
      <Sheet open={isChatbotSelectorOpen} onOpenChange={setIsChatbotSelectorOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Asignar a chatbot</SheetTitle>
            <SheetDescription>
              Selecciona un chatbot para asignarle esta plantilla de prompt
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <ChatbotSelector
              templateId={templateForChatbot?.toString() || ""}
              onAssign={handleAssignToChatbot}
              onCancel={() => setIsChatbotSelectorOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}