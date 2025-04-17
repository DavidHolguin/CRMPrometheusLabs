import { useState } from "react";
import { useCanales, ChatbotCanal, Canal } from "@/hooks/useCanales";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CanalCard from "@/components/canales/CanalCard";
import CanalRow from "@/components/canales/CanalRow";
import AddCanalDialog from "@/components/canales/AddCanalDialog";
import EditCanalDialog from "@/components/canales/EditCanalDialog";
import DeleteCanalDialog from "@/components/canales/DeleteCanalDialog";
// Importación directa con ruta absoluta para evitar problemas de caché
import CreateCanalDrawer from "../components/canales/CreateCanalDrawer";
import CanalPreviewDrawer from "../components/canales/CanalPreviewDrawer";
import { useChatbots } from "@/hooks/useChatbots";
import { CanalIcon, getCanalColor } from "@/components/canales/CanalIcon"; // Importación corregida con getCanalColor
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LayoutGrid, List, Search, Filter, Info, Loader2, Plus, MessageSquare, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

export default function Canales() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterChatbot, setFilterChatbot] = useState<string>("");
  const [editingCanal, setEditingCanal] = useState<ChatbotCanal | null>(null);
  const [deletingCanal, setDeletingCanal] = useState<ChatbotCanal | null>(null);
  const [isCreatingCanal, setIsCreatingCanal] = useState(false);
  const [currentTab, setCurrentTab] = useState<"activos" | "disponibles">("activos");
  const [selectedCanalToEdit, setSelectedCanalToEdit] = useState<Canal | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const {
    useCanalesQuery,
    useChatbotCanalesQuery,
    useAddChatbotCanalMutation,
    useUpdateChatbotCanalMutation,
    useDeleteChatbotCanalMutation,
    useAddCanalMutation,
    useUpdateCanalMutation
  } = useCanales();

  const {
    data: chatbots = []
  } = useChatbots();

  const {
    data: canales = [],
    isLoading: isLoadingCanales
  } = useCanalesQuery();

  const {
    data: chatbotCanales = [],
    isLoading: isLoadingChatbotCanales
  } = useChatbotCanalesQuery();

  const {
    mutate: addChatbotCanal
  } = useAddChatbotCanalMutation();

  const {
    mutate: updateChatbotCanal
  } = useUpdateChatbotCanalMutation();

  const {
    mutate: deleteChatbotCanal
  } = useDeleteChatbotCanalMutation();

  const {
    mutate: addCanal
  } = useAddCanalMutation();

  const {
    mutate: updateCanal
  } = useUpdateCanalMutation();

  // Filtrar canales activos y disponibles
  const filteredChatbotCanales = chatbotCanales.filter(canal => {
    if (!canal.canal) return false;

    // Filtrar por búsqueda
    const matchesSearch = searchQuery === "" || 
      canal.canal.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (canal.canal.descripcion && canal.canal.descripcion.toLowerCase().includes(searchQuery.toLowerCase()));

    // Filtrar por chatbot
    const matchesChatbot = filterChatbot === "all" || filterChatbot === "" || canal.chatbot_id === filterChatbot;
    return matchesSearch && matchesChatbot;
  });

  // Filtrar canales disponibles para gestión
  const filteredCanales = canales.filter(canal => 
    searchQuery === "" || 
    canal.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (canal.descripcion && canal.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Manejar agregar canal a chatbot
  const handleAddCanal = (canalId: string, chatbotId: string) => {
    addChatbotCanal({
      canalId,
      chatbotId,
      configuracion: {}
    });
  };

  // Manejar actualizar configuración
  const handleUpdateCanal = (id: string, configuracion: Record<string, any>) => {
    updateChatbotCanal({
      id,
      configuracion
    });
  };

  // Manejar activar/desactivar canal
  const handleToggleActive = (id: string, isActive: boolean) => {
    updateChatbotCanal({
      id,
      is_active: isActive
    });
  };

  // Manejar eliminar canal
  const handleDeleteCanal = () => {
    if (deletingCanal) {
      deleteChatbotCanal(deletingCanal.id);
      setDeletingCanal(null);
    }
  };

  // Crear un nuevo canal
  const handleCreateCanal = (canalData: any) => {
    addCanal(canalData);
    setIsCreatingCanal(false);
  };

  // Actualizar un canal existente
  const handleUpdateCanalInfo = (canalData: any) => {
    if (selectedCanalToEdit) {
      updateCanal({
        id: selectedCanalToEdit.id,
        ...canalData
      });
      setSelectedCanalToEdit(null);
    }
  };

  // Encontrar nombre de chatbot
  const getChatbotName = (id: string) => {
    const chatbot = chatbots.find(c => c.id === id);
    return chatbot ? chatbot.nombre : 'Desconocido';
  };

  return (
    <div className="space-y-6 px-[20px] py-[20px]">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Canales de comunicación</h1>
          <p className="text-muted-foreground">
            Conecta tus chatbots a diferentes canales de comunicación para interactuar con tus clientes.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {currentTab === "activos" ? (
            <AddCanalDialog canales={canales} onAdd={handleAddCanal} />
          ) : (
            <Button onClick={() => setIsCreatingCanal(true)} className="gap-2">
              <Plus size={16} />
              Crear nuevo canal
            </Button>
          )}
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="activos" className="w-full" onValueChange={(value) => setCurrentTab(value as "activos" | "disponibles")}>
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
          <TabsList className="mb-2 sm:mb-0">
            <TabsTrigger value="activos" className="px-6">Canales Activos</TabsTrigger>
            <TabsTrigger value="disponibles" className="px-6">Canales Disponibles</TabsTrigger>
          </TabsList>
          
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full sm:w-auto">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar canales..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                className="pl-9" 
              />
            </div>
            
            {currentTab === "activos" && (
              <div className="flex gap-2 items-center">
                <Select value={filterChatbot} onValueChange={setFilterChatbot}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Todos los chatbots" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los chatbots</SelectItem>
                    {chatbots.map(chatbot => (
                      <SelectItem key={chatbot.id} value={chatbot.id}>
                        {chatbot.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex items-center border rounded-md overflow-hidden h-9">
                  <Button 
                    variant={viewMode === "grid" ? "default" : "ghost"} 
                    size="sm" 
                    className="rounded-none h-9" 
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={viewMode === "list" ? "default" : "ghost"} 
                    size="sm" 
                    className="rounded-none h-9" 
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contenido de Canales Activos */}
        <TabsContent value="activos" className="mt-0">
          {/* Estado de carga */}
          {(isLoadingChatbotCanales) && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Cargando canales activos...</span>
            </div>
          )}

          {/* Sin resultados */}
          {!isLoadingChatbotCanales && filteredChatbotCanales.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>No hay canales conectados</CardTitle>
                <CardDescription>
                  {searchQuery || filterChatbot 
                    ? "No se encontraron canales con los filtros aplicados." 
                    : "Conecta un nuevo canal para empezar a interactuar con tus clientes."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pb-6">
                <Button 
                  onClick={() => {
                    setSearchQuery("");
                    setFilterChatbot("");
                  }} 
                  variant="outline"
                >
                  {searchQuery || filterChatbot ? "Limpiar filtros" : "Conectar nuevo canal"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Vista de canales activos */}
          {!isLoadingChatbotCanales && filteredChatbotCanales.length > 0 && (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredChatbotCanales.map(canal => (
                    <div key={canal.id}>
                      {filterChatbot === "" && (
                        <div className="mb-1 px-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            {getChatbotName(canal.chatbot_id)}
                          </span>
                        </div>
                      )}
                      <CanalCard 
                        canal={canal} 
                        onEdit={setEditingCanal} 
                        onDelete={id => setDeletingCanal(canal)} 
                        onToggleActive={handleToggleActive} 
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6 px-2 sm:px-6">
                    {filteredChatbotCanales.map(canal => (
                      <div key={canal.id}>
                        {filterChatbot === "" && (
                          <div className="mb-1 mt-2 first:mt-0">
                            <span className="text-sm font-medium">
                              {getChatbotName(canal.chatbot_id)}
                            </span>
                          </div>
                        )}
                        <CanalRow 
                          canal={canal} 
                          onEdit={setEditingCanal} 
                          onDelete={id => setDeletingCanal(canal)} 
                          onToggleActive={handleToggleActive} 
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Contenido de Canales Disponibles */}
        <TabsContent value="disponibles" className="mt-0">
          {/* Estado de carga */}
          {isLoadingCanales && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Cargando canales disponibles...</span>
            </div>
          )}

          {/* Sin resultados */}
          {!isLoadingCanales && filteredCanales.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>No hay canales disponibles</CardTitle>
                <CardDescription>
                  {searchQuery 
                    ? "No se encontraron canales con los filtros aplicados." 
                    : "Crea un nuevo canal para empezar."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pb-6">
                {searchQuery ? (
                  <Button 
                    onClick={() => setSearchQuery("")} 
                    variant="outline"
                  >
                    Limpiar filtros
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setIsCreatingCanal(true)}
                    className="gap-2"
                  >
                    <Plus size={16} />
                    Crear nuevo canal
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Vista de canales disponibles */}
          {!isLoadingCanales && filteredCanales.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCanales.map(canal => {
                // Obtener colores con transparencia para un estilo más profesional
                const bgColorWithOpacity = getCanalColor(canal.tipo, canal.color, 0.125);
                const solidColor = canal.color || getCanalColor(canal.tipo, null, 1.0).replace('rgba', 'rgb').replace(/,\s*[\d.]+\)/, ')');
                
                // Estilo para el badge
                const badgeStyle = canal.is_active ? {
                  backgroundColor: bgColorWithOpacity,
                  color: solidColor,
                  borderColor: solidColor
                } : {};

                return (
                  <Card key={canal.id} className="overflow-hidden group hover:shadow-md transition-all border-muted">
                    <div 
                      className="h-3 w-full transition-colors" 
                      style={{ backgroundColor: bgColorWithOpacity }} 
                    />
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          {canal.logo_url ? (
                            <div 
                              className="h-12 w-12 rounded-lg flex items-center justify-center overflow-hidden shadow-sm"
                              style={{ backgroundColor: bgColorWithOpacity }}
                            >
                              <img 
                                src={canal.logo_url} 
                                alt={canal.nombre} 
                                className="h-8 w-8 object-contain"
                              />
                            </div>
                          ) : (
                            <div 
                              className="h-12 w-12 rounded-lg flex items-center justify-center shadow-sm"
                              style={{ backgroundColor: bgColorWithOpacity }}
                            >
                              <CanalIcon 
                                tipo={canal.tipo} 
                                size={20}
                                color={solidColor}
                              />
                            </div>
                          )}
                          <div>
                            <CardTitle className="text-lg font-medium leading-tight">{canal.nombre}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">{canal.tipo}</p>
                          </div>
                        </div>
                        <Badge 
                          variant={canal.is_active ? "default" : "outline"}
                          className={canal.is_active ? "" : "text-muted-foreground"}
                          style={canal.is_active ? badgeStyle : {}}
                        >
                          {canal.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                        {canal.descripcion || "Sin descripción"}
                      </p>
                    </CardContent>
                    <div className="px-4 pb-4 pt-0 flex justify-between items-center">
                      <div className="flex flex-wrap gap-2">
                        {/* Información técnica */}
                        {canal.configuracion_requerida && Object.keys(canal.configuracion_requerida).length > 0 && (
                          <Badge variant="secondary" className="bg-background text-xs">
                            {Object.keys(canal.configuracion_requerida).length} parámetros
                          </Badge>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedCanalToEdit(canal);
                          setIsCreatingCanal(true);
                        }}
                        className="gap-1 transition-all group-hover:border-primary group-hover:text-primary"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs y Drawers */}
      <EditCanalDialog 
        canal={editingCanal} 
        open={!!editingCanal} 
        onOpenChange={open => !open && setEditingCanal(null)} 
        onSave={handleUpdateCanal} 
      />
      
      <DeleteCanalDialog 
        open={!!deletingCanal} 
        onOpenChange={open => !open && setDeletingCanal(null)} 
        onConfirm={handleDeleteCanal} 
        canalName={deletingCanal?.canal?.nombre} 
      />

      <CreateCanalDrawer 
        open={isCreatingCanal}
        onOpenChange={setIsCreatingCanal}
        onSave={handleCreateCanal}
        editingCanal={selectedCanalToEdit}
        onUpdate={handleUpdateCanalInfo}
      />

      <CanalPreviewDrawer
        canal={selectedCanalToEdit}
        open={isPreviewMode && !!selectedCanalToEdit}
        onOpenChange={(open) => {
          if (!open) {
            setIsPreviewMode(false);
            // Pequeña pausa antes de limpiar el canal seleccionado para evitar parpadeos visuales
            setTimeout(() => {
              if (!isCreatingCanal) setSelectedCanalToEdit(null);
            }, 200);
          }
        }}
      />
    </div>
  );
}