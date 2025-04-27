import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AgenteCard } from "@/components/agentes/AgenteCard";
import { AgenteWizard } from "@/components/agentes/AgenteWizard";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAgentes } from "@/hooks/useAgentes";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const AgentesIA = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [wizardCompleted, setWizardCompleted] = useState(false);
  const { agentes = [], isLoading, updateAgente, resetPassword } = useAgentes();

  const handleActivate = async (id: string, active: boolean) => {
    await updateAgente.mutate({
      id,
      is_active: active
    });
  };

  const handleResetPassword = async (email: string) => {
    await resetPassword.mutate(email);
  };

  const handleWizardComplete = (agentData: any) => {
    // Marcar que el asistente se completó exitosamente
    setWizardCompleted(true);
    // Ocultar el asistente
    setShowWizard(false);
    // Recargar la lista de agentes después de un breve retraso
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
    toast.success("¡Agente creado exitosamente! La página se actualizará en breve.");
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

  const filteredAgentes = agentes.filter((agente) => 
    agente?.full_name?.toLowerCase().includes(searchQuery?.toLowerCase() || "") || 
    agente?.email?.toLowerCase().includes(searchQuery?.toLowerCase() || "")
  );

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

          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar agentes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
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
                <p className="text-muted-foreground mb-4">
                  No se encontraron agentes
                </p>
                <Button onClick={() => setShowWizard(true)} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear tu primer agente
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredAgentes?.map((agente) => (
                  <AgenteCard 
                    key={agente.id} 
                    agente={agente}
                    onEdit={() => {}} 
                    onActivate={handleActivate}
                    onResetPassword={handleResetPassword}
                  />
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
            <Button variant="outline" onClick={handleConfirmCancel}>
              Cancelar creación
            </Button>
            <Button onClick={handleContinueWizard}>
              Continuar editando
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default AgentesIA;