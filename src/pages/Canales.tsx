import { useState } from "react";
import { useCanales, ChatbotCanal } from "@/hooks/useCanales";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CanalCard from "@/components/canales/CanalCard";
import CanalRow from "@/components/canales/CanalRow";
import AddCanalDialog from "@/components/canales/AddCanalDialog";
import EditCanalDialog from "@/components/canales/EditCanalDialog";
import DeleteCanalDialog from "@/components/canales/DeleteCanalDialog";
import { useChatbots } from "@/hooks/useChatbots";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  LayoutGrid, 
  List, 
  Search, 
  Filter, 
  Info,
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Canales() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterChatbot, setFilterChatbot] = useState<string>("");
  const [editingCanal, setEditingCanal] = useState<ChatbotCanal | null>(null);
  const [deletingCanal, setDeletingCanal] = useState<ChatbotCanal | null>(null);
  
  const { 
    useCanalesQuery, 
    useChatbotCanalesQuery,
    useAddChatbotCanalMutation,
    useUpdateChatbotCanalMutation,
    useDeleteChatbotCanalMutation
  } = useCanales();
  
  const { data: chatbots = [] } = useChatbots();
  
  const { data: canales = [], isLoading: isLoadingCanales } = useCanalesQuery();
  const { data: chatbotCanales = [], isLoading: isLoadingChatbotCanales } = useChatbotCanalesQuery();
  
  const { mutate: addChatbotCanal } = useAddChatbotCanalMutation();
  const { mutate: updateChatbotCanal } = useUpdateChatbotCanalMutation();
  const { mutate: deleteChatbotCanal } = useDeleteChatbotCanalMutation();

  // Filtrar canales
  const filteredCanales = chatbotCanales.filter(canal => {
    if (!canal.canal) return false;
    
    // Filtrar por búsqueda
    const matchesSearch = 
      searchQuery === "" || 
      canal.canal.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (canal.canal.descripcion && canal.canal.descripcion.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filtrar por chatbot
    const matchesChatbot = filterChatbot === "" || canal.chatbot_id === filterChatbot;
    
    return matchesSearch && matchesChatbot;
  });

  // Manejar agregar canal
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

  // Encontrar nombre de chatbot
  const getChatbotName = (id: string) => {
    const chatbot = chatbots.find(c => c.id === id);
    return chatbot ? chatbot.nombre : 'Desconocido';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Canales de comunicación</h1>
          <p className="text-muted-foreground">
            Conecta tus chatbots a diferentes canales de comunicación para interactuar con tus clientes.
          </p>
        </div>
        
        <AddCanalDialog 
          canales={canales} 
          onAdd={handleAddCanal} 
        />
      </div>

      <Separator />

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar canales..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap justify-between w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Select value={filterChatbot} onValueChange={setFilterChatbot}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Todos los chatbots" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los chatbots</SelectItem>
                {chatbots.map((chatbot) => (
                  <SelectItem key={chatbot.id} value={chatbot.id}>
                    {chatbot.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Puedes conectar múltiples canales de comunicación para interactuar con tus clientes.
                    Cada canal requiere una configuración específica.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex items-center border rounded-md overflow-hidden">
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
      </div>

      {/* Estado de carga */}
      {(isLoadingCanales || isLoadingChatbotCanales) && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Cargando canales...</span>
        </div>
      )}

      {/* Sin resultados */}
      {!isLoadingChatbotCanales && filteredCanales.length === 0 && (
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
            <Button onClick={() => {
              setSearchQuery("");
              setFilterChatbot("");
            }} variant="outline">
              {searchQuery || filterChatbot 
                ? "Limpiar filtros" 
                : "Conectar nuevo canal"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Vista de canales */}
      {!isLoadingChatbotCanales && filteredCanales.length > 0 && (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCanales.map((canal) => (
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
                    onDelete={(id) => setDeletingCanal(canal)}
                    onToggleActive={handleToggleActive}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 px-2 sm:px-6">
                {filteredCanales.map((canal) => (
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
                      onDelete={(id) => setDeletingCanal(canal)}
                      onToggleActive={handleToggleActive}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Dialogs */}
      <EditCanalDialog
        canal={editingCanal}
        open={!!editingCanal}
        onOpenChange={(open) => !open && setEditingCanal(null)}
        onSave={handleUpdateCanal}
      />
      
      <DeleteCanalDialog
        open={!!deletingCanal}
        onOpenChange={(open) => !open && setDeletingCanal(null)}
        onConfirm={handleDeleteCanal}
        canalName={deletingCanal?.canal?.nombre}
      />
    </div>
  );
}
