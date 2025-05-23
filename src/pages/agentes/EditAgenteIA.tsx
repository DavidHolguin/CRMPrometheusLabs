import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAgentesIA } from "@/hooks/useAgentesIA";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft,
  Settings,
  Database,
  UserRound,
  Target,
  Sparkles,
  Brain,
  Save,
  Loader2
} from "lucide-react";
import { AgenteBasicInfo } from "@/components/agentes/AgenteBasicInfo";
import { AgenteKnowledgeSource } from "@/components/agentes/AgenteKnowledgeSource";
import { AgentePersonality } from "@/components/agentes/AgentePersonality";
import { AgenteGoalsExamples } from "@/components/agentes/AgenteGoalsExamples";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const EditAgenteIA = () => {
  const { agenteId } = useParams<{ agenteId: string }>();
  const navigate = useNavigate();
  const { agentesIA, updateAgenteIA, isLoading } = useAgentesIA();

  // Estados para los datos de cada pestaña
  const [activeTab, setActiveTab] = useState("basic");
  const [basicData, setBasicData] = useState<any>({});
  const [knowledgeData, setKnowledgeData] = useState<any>({});
  const [personalityData, setPersonalityData] = useState<any>({});
  const [goalsData, setGoalsData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [pendingTabChange, setPendingTabChange] = useState<string | null>(null);

  // Estado para cambios sin guardar
  const [unsavedChanges, setUnsavedChanges] = useState<Record<string, boolean>>({
    basic: false,
    knowledge: false,
    personality: false,
    goals: false
  });

  // Cargar datos del agente
  useEffect(() => {
    if (agenteId) {
      const agente = agentesIA.find(a => a.id === agenteId);
      if (agente) {
        setBasicData({
          nombre: agente.nombre,
          descripcion: agente.descripcion,
          tipo: agente.tipo,
          nivel_autonomia: agente.nivel_autonomia
        });
        // Aquí cargaríamos los datos de las otras pestañas desde sus respectivas tablas
      }
    }
  }, [agenteId, agentesIA]);

  // Manejadores de cambios para cada pestaña
  const handleBasicChange = (data: any) => {
    setBasicData(data);
    setUnsavedChanges(prev => ({ ...prev, basic: true }));
  };

  const handleKnowledgeChange = (data: any) => {
    setKnowledgeData(data);
    setUnsavedChanges(prev => ({ ...prev, knowledge: true }));
  };

  const handlePersonalityChange = (data: any) => {
    setPersonalityData(data);
    setUnsavedChanges(prev => ({ ...prev, personality: true }));
  };

  const handleGoalsChange = (data: any) => {
    setGoalsData(data);
    setUnsavedChanges(prev => ({ ...prev, goals: true }));
  };

  // Guardar cambios
  const handleSave = async () => {
    if (!agenteId) return;
    
    setIsSaving(true);
    try {
      // Guardar datos básicos del agente
      await updateAgenteIA.mutateAsync({
        id: agenteId,
        ...basicData,
      });

      // Aquí iría la lógica para guardar los datos de las otras pestañas
      // en sus respectivas tablas

      setUnsavedChanges({
        basic: false,
        knowledge: false,
        personality: false,
        goals: false
      });

      toast.success("Cambios guardados correctamente");
    } catch (error) {
      console.error("Error al guardar los cambios:", error);
      toast.error("Error al guardar los cambios");
    } finally {
      setIsSaving(false);
    }
  };

  const hasUnsavedChanges = Object.values(unsavedChanges).some(Boolean);

  const handleTabChange = (value: string) => {
    // Verificar si hay cambios sin guardar
    if (Object.values(unsavedChanges).some(Boolean)) {
      setPendingTabChange(value);
      setIsAlertOpen(true);
      return;
    }
    setActiveTab(value);
  };

  const handleContinueChange = () => {
    if (pendingTabChange) {
      setActiveTab(pendingTabChange);
      setPendingTabChange(null);
    }
    setIsAlertOpen(false);
  };

  return (
    <div className="flex-1 overflow-hidden">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container h-14 flex items-center gap-4 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/agentes-ia")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{basicData.nombre || "Editar Agente IA"}</h1>
            <p className="text-sm text-muted-foreground">
              Configura todos los aspectos de tu agente de inteligencia artificial
            </p>
          </div>
          <div className="ml-auto">
            <Button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {hasUnsavedChanges ? "Guardar cambios" : "Guardado"}
            </Button>
          </div>
        </div>
      </div>

      {/* Navegación entre pestañas */}
      <div className="border-b px-4">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="h-12 w-full justify-start gap-6 rounded-none border-b bg-transparent p-0">
            <TabsTrigger
              value="basic"
              className="relative h-12 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground"
            >
              <Settings className="h-4 w-4 mr-2" />
              <span>Información básica</span>
            </TabsTrigger>
            <TabsTrigger
              value="knowledge"
              className="relative h-12 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground"
            >
              <Database className="h-4 w-4 mr-2" />
              <span>Conocimiento</span>
            </TabsTrigger>
            <TabsTrigger
              value="personality"
              className="relative h-12 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground"
            >
              <UserRound className="h-4 w-4 mr-2" />
              <span>Personalidad</span>
            </TabsTrigger>
            <TabsTrigger
              value="goals"
              className="relative h-12 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground"
            >
              <Target className="h-4 w-4 mr-2" />
              <span>Objetivos</span>
            </TabsTrigger>
          </TabsList>

          {/* Contenido de las pestañas */}
          <div className="flex-1 space-y-4 p-6 overflow-y-auto">
            <TabsContent value="basic" className="mt-0 border-none">
              <Card className="p-6">
                <AgenteBasicInfo
                  onDataChange={handleBasicChange}
                  initialData={basicData}
                />
              </Card>
            </TabsContent>

            <TabsContent value="knowledge" className="mt-0 border-none">
              <Card className="p-6">
                <AgenteKnowledgeSource
                  onDataChange={handleKnowledgeChange}
                  initialData={knowledgeData}
                  agenteId={agenteId}
                />
              </Card>
            </TabsContent>

            <TabsContent value="personality" className="mt-0 border-none">
              <Card className="p-6">
                <AgentePersonality
                  onDataChange={handlePersonalityChange}
                  initialData={personalityData}
                />
              </Card>
            </TabsContent>

            <TabsContent value="goals" className="mt-0 border-none">
              <Card className="p-6">
                <AgenteGoalsExamples
                  onDataChange={handleGoalsChange}
                  initialData={goalsData}
                />
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desea continuar?</AlertDialogTitle>
            <AlertDialogDescription>
              Hay cambios sin guardar. Si continúa, perderá los cambios realizados en esta sección.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsAlertOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleContinueChange}>
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EditAgenteIA;