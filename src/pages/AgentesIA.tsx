import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AgenteIACard } from "@/components/agentes/AgenteIACard";
import { AgenteIAEditDialog } from "@/components/agentes/AgenteIAEditDialog";
import { AgenteIADetailDrawer } from "@/components/agentes/AgenteIADetailDrawer";
import { AgenteWizard } from "@/components/agentes/AgenteWizard";
import { Button } from "@/components/ui/button";
import { Plus, Search, Grid3x3, List, UserPlus, Bot } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAgentesIA, AgenteIA } from "@/hooks/useAgentesIA";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AgentesIA = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTipo, setSelectedTipo] = useState("all");
  const [activeView, setActiveView] = useState<"grid" | "list">("grid");
  const [showWizard, setShowWizard] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [wizardCompleted, setWizardCompleted] = useState(false);
  const [selectedAgente, setSelectedAgente] = useState<AgenteIA | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [agenteToDelete, setAgenteToDelete] = useState<string | null>(null);

  const {
    agentesIA,
    isLoading,
    createAgenteIA,
    updateAgenteIA,
    deleteAgenteIA,
  } = useAgentesIA();

  const handleActivate = async (id: string, active: boolean) => {
    try {
      await updateAgenteIA.mutateAsync({
        id,
        is_active: active,
      });
      toast.success(`Agente ${active ? "activado" : "desactivado"} correctamente`);
    } catch (error) {
      console.error("Error al cambiar el estado del agente:", error);
      toast.error(`Error al ${active ? "activar" : "desactivar"} el agente`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!agenteToDelete) return;
    
    try {
      await deleteAgenteIA.mutateAsync(agenteToDelete);
      setShowDeleteDialog(false);
      setAgenteToDelete(null);
    } catch (error) {
      console.error("Error al eliminar el agente:", error);
      toast.error("Error al eliminar el agente");
    }
  };

  const handleOpenEdit = (agente?: AgenteIA) => {
    setSelectedAgente(agente || null);
    setIsEditDialogOpen(true);
  };

  const handleOpenDetail = (agente: AgenteIA) => {
    setSelectedAgente(agente);
    setIsDetailDrawerOpen(true);
  };

  const handleSaveAgente = async (values: any) => {
    try {
      if (selectedAgente) {
        await updateAgenteIA.mutateAsync({
          id: selectedAgente.id,
          ...values,
        });
        setIsEditDialogOpen(false);
      } else {
        await createAgenteIA.mutateAsync({
          ...values,
        });
        setIsEditDialogOpen(false);
      }
    } catch (error) {
      console.error("Error al guardar el agente:", error);
      toast.error("Error al guardar el agente");
    }
  };

  const handleWizardComplete = (agentData: any) => {
    // Marcar que el asistente se completó exitosamente
    setWizardCompleted(true);
    // Ocultar el asistente
    setShowWizard(false);
    // Recargar la lista de agentes después de un breve retraso
    toast.success("¡Agente creado exitosamente!");
  };

  const handleWizardCancel = () => {
    // Solo mostrar el diálogo de confirmación si se cancela manualmente
    // antes de completar el proceso
    setShowConfirmDialog(true);
  };

  const handleConfirmCancel = () => {
    setShowConfirmDialog(false);
    setShowWizard(false);
  };

  const handleContinueWizard = () => {
    setShowConfirmDialog(false);
    setShowWizard(true);
  };

  const handleDelete = (id: string) => {
    setAgenteToDelete(id);
    setShowDeleteDialog(true);
  };

  const filteredAgentes = agentesIA.filter((agente) => {
    // Filtrar por término de búsqueda
    const matchesSearch = 
      agente.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
      agente.descripcion.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filtrar por tipo
    const matchesTipo = selectedTipo === "all" || agente.tipo.toLowerCase() === selectedTipo.toLowerCase();
    
    return matchesSearch && matchesTipo;
  });

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
        {/* Header con barra de búsqueda */}
        <div className="flex-none p-6 pb-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Agentes IA</h1>
              <p className="text-muted-foreground">
                Gestiona y configura tus agentes de inteligencia artificial
              </p>
            </div>
            <Button onClick={() => setShowWizard(true)} size="default">
              <Plus className="mr-2 h-4 w-4" />
              Crear agente
            </Button>
          </div>

          <div className="flex flex-wrap md:flex-nowrap items-center gap-4 mt-4">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar agentes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={selectedTipo} onValueChange={setSelectedTipo}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="asistente">Asistentes</SelectItem>
                <SelectItem value="analista">Analistas</SelectItem>
                <SelectItem value="automatizacion">Automatización</SelectItem>
              </SelectContent>
            </Select>

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
        </div>

        {/* Contenido principal */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <div className="animate-pulse text-muted-foreground">
                  Cargando agentes...
                </div>
              </div>
            ) : filteredAgentes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <Bot className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
                <h3 className="text-lg font-medium">No se encontraron agentes</h3>
                <p className="text-muted-foreground mt-1 mb-4">
                  {searchQuery || selectedTipo !== "all"
                    ? "Prueba a cambiar los filtros de búsqueda"
                    : "Comienza creando un nuevo agente de IA"}
                </p>
                {(searchQuery || selectedTipo !== "all") && (
                  <Button
                    variant="outline"
                    className="mb-4"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedTipo("all");
                    }}
                  >
                    Limpiar filtros
                  </Button>
                )}
                <Button onClick={() => setShowWizard(true)} variant="default">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear tu primer agente
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredAgentes?.map((agente) => (
                  <div key={agente.id} onClick={() => handleOpenDetail(agente)} className="cursor-pointer">
                    <AgenteIACard
                      agente={agente}
                      onView={(a) => {
                        handleOpenDetail(a);
                        // Evitar que se active el click del div contenedor
                        event?.stopPropagation();
                      }}
                      onEdit={(a) => {
                        handleOpenEdit(a);
                        // Evitar que se active el click del div contenedor
                        event?.stopPropagation();
                      }}
                      onDelete={(id) => {
                        handleDelete(id);
                        // Evitar que se active el click del div contenedor
                        event?.stopPropagation();
                      }}
                      onActivate={handleActivate}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showWizard && (
        <AgenteWizard 
          onComplete={handleWizardComplete}
          onCancel={handleWizardCancel}
        />
      )}

      {/* Solo mostrar el diálogo de confirmación si el asistente no se ha completado */}
      <AlertDialog open={showConfirmDialog && !wizardCompleted} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desea cancelar la creación del agente?</AlertDialogTitle>
            <AlertDialogDescription>
              Si cancela ahora, perderá el progreso realizado. ¿Desea continuar con la creación o cancelar el proceso?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleConfirmCancel}>
              Cancelar creación
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleContinueWizard}>
              Continuar editando
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmación para eliminar agente */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar agente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente este agente y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Componentes para edición y visualización de detalles */}
      <AgenteIAEditDialog
        agente={selectedAgente || undefined}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveAgente}
        isLoading={createAgenteIA.isPending || updateAgenteIA.isPending}
      />

      <AgenteIADetailDrawer
        agente={selectedAgente}
        open={isDetailDrawerOpen}
        onOpenChange={setIsDetailDrawerOpen}
        onEdit={handleOpenEdit}
        onActivate={handleActivate}
        onDelete={handleDelete}
      />
    </>
  );
}

export default AgentesIA;