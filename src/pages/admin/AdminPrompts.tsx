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

interface ChatbotMapping {
  id: string;
  chatbot_id: string;
  prompt_template_id: string;
  orden: number;
  parametros: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Hook personalizado para los Prompt Templates
const usePromptTemplates = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [chatbotMappings, setChatbotMappings] = useState<ChatbotMapping[]>([]);
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

  // Obtener asignaciones de chatbot
  const fetchChatbotMappings = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbot_prompt_mapping')
        .select('*');

      if (error) throw error;
      setChatbotMappings(data || []);
    } catch (err: any) {
      console.error('Error al cargar asignaciones:', err);
    }
  };

  // Crear template
  const createTemplate = async (template: Omit<PromptTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Asegurarse de que empresa_id esté establecido
      if (!user?.companyId) {
        throw new Error('No hay ID de empresa asociada al usuario actual');
      }

      // El empresa_id debe ser un UUID, así que lo usamos directamente como string
      const templateWithEmpresaId = {
        ...template,
        empresa_id: user.companyId // Ya es un UUID, no intentamos convertirlo
      };

      const { data, error } = await supabase
        .from('prompt_templates')
        .insert([templateWithEmpresaId])
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
      // Asegurarse de que empresa_id esté establecido si se está actualizando
      if (updates.empresa_id === undefined && user?.companyId) {
        updates.empresa_id = user.companyId; // Ya es un UUID, no intentamos convertirlo
      }

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
  const assignTemplateToChatbot = async (mapping: Omit<ChatbotMapping, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('chatbot_prompt_mapping')
        .insert([mapping])
        .select();

      if (error) throw error;
      setChatbotMappings(prev => [...prev, ...data]);
      toast.success('Plantilla asignada al chatbot correctamente');
      return data;
    } catch (err: any) {
      toast.error('Error al asignar la plantilla');
      throw err;
    }
  };

  // Desasignar template de chatbot
  const unassignTemplateFromChatbot = async (mappingId: string) => {
    try {
      const { error } = await supabase
        .from('chatbot_prompt_mapping')
        .delete()
        .eq('id', mappingId);

      if (error) throw error;
      setChatbotMappings(prev => prev.filter(mapping => mapping.id !== mappingId));
      toast.success('Asignación eliminada correctamente');
    } catch (err: any) {
      toast.error('Error al eliminar la asignación');
      throw err;
    }
  };

  // Cargar datos al iniciar
  useEffect(() => {
    fetchTemplates();
    fetchChatbotMappings();
  }, [user?.id]);

  return {
    templates,
    chatbotMappings,
    isLoading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    assignTemplateToChatbot,
    unassignTemplateFromChatbot,
    refreshTemplates: fetchTemplates,
    refreshMappings: fetchChatbotMappings,
  };
};

// Componente principal
export default function AdminPrompts() {
  const {
    templates,
    chatbotMappings,
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
  const [templateForChatbot, setTemplateForChatbot] = useState<string | null>(null);

  // Filtrar templates según búsqueda y tipo seleccionado
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesQuery =
        searchQuery === "" ||
        template.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.descripcion.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType =
        selectedType === "all" ||
        template.tipo_template.toLowerCase() === selectedType.toLowerCase();

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
    setTemplateForChatbot(templateId);
    setIsChatbotSelectorOpen(true);
  };

  // Asignar template a chatbot
  const handleAssignToChatbot = async (chatbotId: string, parametros: Record<string, any> = {}) => {
    if (!templateForChatbot) return;
    
    try {
      await assignTemplateToChatbot({
        chatbot_id: chatbotId,
        prompt_template_id: templateForChatbot,
        orden: 1,
        parametros,
        is_active: true
      });
      setIsChatbotSelectorOpen(false);
    } catch (error) {
      console.error("Error al asignar template a chatbot:", error);
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Plantillas de Prompts</h2>
          <p className="text-muted-foreground">
            Crea y gestiona plantillas de prompt estratégicas para tus chatbots
          </p>
        </div>
        <Button onClick={() => handleOpenEditor()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva plantilla
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de plantillas
            </CardTitle>
            <FileCode2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {templates.filter(t => t.is_active).length} activas ·{" "}
              {templates.filter(t => !t.is_active).length} inactivas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Tipos de plantillas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {templateTypes.length > 0 ? (
                templateTypes.map((type) => (
                  <Badge key={type} variant="outline">
                    {type}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">Sin tipos definidos</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Chatbots con plantillas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(chatbotMappings.map(m => m.chatbot_id)).size}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {chatbotMappings.length} asignaciones totales
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[280px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar plantilla..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={selectedType}
            onValueChange={setSelectedType}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
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

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Cargando plantillas...</div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileCode2 className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
          <h3 className="text-lg font-medium">No se encontraron plantillas</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery || selectedType !== "all"
              ? "Prueba a cambiar los filtros de búsqueda"
              : "Comienza creando una nueva plantilla de prompt"}
          </p>
          {(searchQuery || selectedType !== "all") && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                setSelectedType("all");
              }}
            >
              Limpiar filtros
            </Button>
          )}
          {!searchQuery && selectedType === "all" && (
            <Button className="mt-4" onClick={() => handleOpenEditor()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear plantilla
            </Button>
          )}
        </div>
      ) : (
        <>
          {activeView === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="flex flex-col overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="truncate text-base">
                        {template.nombre}
                      </CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOpenEditor(template)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenChatbotSelector(template.id)}>
                            <Wand2 className="mr-2 h-4 w-4" />
                            Asignar a chatbot
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            navigator.clipboard.writeText(template.contenido);
                            toast.info("Contenido copiado al portapapeles");
                          }}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copiar contenido
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive" 
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {template.tipo_template && (
                      <Badge variant="outline" className="mt-1 self-start">
                        {template.tipo_template}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="flex-grow p-4">
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {template.descripcion || "Sin descripción"}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between p-4 pt-0 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Code className="mr-1 h-3 w-3" />
                      <span>
                        {template.variables?.length || 0} variables
                      </span>
                    </div>
                    <div>
                      {new Date(template.updated_at).toLocaleDateString()}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
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
                    <TableRow key={template.id}>
                      <TableCell>
                        <div className="font-medium">{template.nombre}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {template.descripcion || "Sin descripción"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {template.tipo_template && (
                          <Badge variant="outline">
                            {template.tipo_template}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {template.variables?.length || 0}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {new Date(template.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Acciones</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleOpenEditor(template)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenChatbotSelector(template.id)}>
                              <Wand2 className="mr-2 h-4 w-4" />
                              Asignar a chatbot
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              navigator.clipboard.writeText(template.contenido);
                              toast.info("Contenido copiado al portapapeles");
                            }}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copiar contenido
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive" 
                              onClick={() => handleDeleteTemplate(template.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
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
              templateId={templateForChatbot || ""}
              onAssign={handleAssignToChatbot}
              onCancel={() => setIsChatbotSelectorOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}