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

const AgentesIA = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
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

  const handleWizardComplete = () => {
    setShowConfirmDialog(true);
    setShowWizard(false);
  };

  const handleWizardCancel = () => {
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
    <div className="container py-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agentes IA</h1>
          <p className="text-muted-foreground">
            Gestiona y configura tus agentes de inteligencia artificial
          </p>
        </div>
        <Button onClick={() => setShowWizard(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Crear agente
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar agentes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>Cargando agentes...</CardTitle>
            <CardDescription>
              Por favor espera mientras se cargan los agentes disponibles.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgentes?.map((agente) => (
            <AgenteCard 
              key={agente.id} 
              agente={agente}
              onEdit={() => {}} // Implementar si es necesario
              onActivate={handleActivate}
              onResetPassword={handleResetPassword}
            />
          ))}
        </div>
      )}

      {showWizard && (
        <AgenteWizard 
          onComplete={handleWizardComplete}
          onCancel={handleWizardCancel}
        />
      )}

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desea continuar con la iteración?</AlertDialogTitle>
            <AlertDialogDescription>
              Puede continuar con la creación del agente o cancelar el proceso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={handleConfirmCancel}>
              Cancelar
            </Button>
            <Button onClick={handleContinueWizard}>
              Continuar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AgentesIA;