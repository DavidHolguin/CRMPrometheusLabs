import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAgentesIA, AgenteIA } from "@/hooks/useAgentesIA";
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

interface Source {
  id: string;
  type: 'pdf' | 'url' | 'excel';
  name: string;
  status: 'processing' | 'completed' | 'error';
  progress: number;
  file?: File;
  url?: string;
  response?: any;
}

interface BasicData {
  nombre: string;
  descripcion: string;
  tipo: string;
  nivel_autonomia: number;
  avatar?: File | null;
}

interface KnowledgeData {
  sources: Source[];
}

interface PersonalityData {
  preset: string;
  tone: number;
  instructions: string;
}

interface GoalsData {
  objectives: string;
  keyPoints: string[];
  examples: Array<{
    id: string;
    type: 'positive' | 'negative';
    text: string;
  }>;
}

export default function EditAgenteIA() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { agentesIA, updateAgenteIA } = useAgentesIA();
  const [activeTab, setActiveTab] = useState("basic");
  const [basicData, setBasicData] = useState<BasicData>({
    nombre: "",
    descripcion: "",
    tipo: "asistente",
    nivel_autonomia: 1
  });
  const [knowledgeData, setKnowledgeData] = useState<KnowledgeData>({ sources: [] });
  const [personalityData, setPersonalityData] = useState<PersonalityData>({
    preset: "formal",
    tone: 50,
    instructions: ""
  });
  const [goalsData, setGoalsData] = useState<GoalsData>({
    objectives: "",
    keyPoints: [],
    examples: []
  });
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
    if (id) {
      const agente = agentesIA.find(a => a.id === id);
      if (agente) {
        setBasicData({
          nombre: agente.nombre,
          descripcion: agente.descripcion,
          tipo: agente.tipo,
          nivel_autonomia: agente.nivel_autonomia
        });
        // Cargar datos de personalidad si existen
        if (agente.configuracion_evolutiva) {
          setPersonalityData({
            preset: agente.configuracion_evolutiva.preset || "formal",
            tone: agente.configuracion_evolutiva.tone || 50,
            instructions: agente.configuracion_evolutiva.instructions || ""
          });
        }
      }
    }
  }, [id, agentesIA]);

  const handleDataChange = (section: string, data: any) => {
    switch (section) {
      case "basic":
        setBasicData(prev => ({ ...prev, ...data }));
        break;
      case "knowledge":
        setKnowledgeData(prev => ({ ...prev, ...data }));
        break;
      case "personality":
        setPersonalityData(prev => ({ ...prev, ...data }));
        break;
      case "goals":
        setGoalsData(prev => ({ ...prev, ...data }));
        break;
    }
    setUnsavedChanges(prev => ({ ...prev, [section]: true }));
  };

  const handleSave = async () => {
    if (!id) return;
    
    setIsSaving(true);
    try {
      await updateAgenteIA.mutateAsync({
        id,
        nombre: basicData.nombre,
        descripcion: basicData.descripcion,
        tipo: basicData.tipo,
        nivel_autonomia: basicData.nivel_autonomia,
        configuracion_evolutiva: personalityData
      });

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

  if (!id) return null;

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="gap-2" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Editar Agente IA</h2>
            <p className="text-muted-foreground">
              Personaliza y configura las capacidades del agente
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={updateAgenteIA.isPending || isSaving}>
          {updateAgenteIA.isPending || isSaving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 gap-4 bg-transparent">
          <TabsTrigger
            value="basic"
            className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <UserRound className="h-4 w-4 mr-2" />
            Información básica
          </TabsTrigger>
          <TabsTrigger
            value="knowledge"
            className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Database className="h-4 w-4 mr-2" />
            Conocimiento
          </TabsTrigger>
          <TabsTrigger
            value="personality"
            className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Settings className="h-4 w-4 mr-2" />
            Personalidad
          </TabsTrigger>
          <TabsTrigger
            value="goals"
            className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Target className="h-4 w-4 mr-2" />
            Objetivos
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 p-4">
          <TabsContent value="basic" className="mt-6">
            <Card>
              <AgenteBasicInfo 
                onDataChange={(data) => handleDataChange("basic", data)}
                initialData={basicData}
              />
            </Card>
          </TabsContent>

          <TabsContent value="knowledge" className="mt-6">
            <Card>
              <AgenteKnowledgeSource 
                onDataChange={(data) => handleDataChange("knowledge", data)}
                initialData={knowledgeData}
                agenteId={id}
              />
            </Card>
          </TabsContent>

          <TabsContent value="personality" className="mt-6">
            <Card>
              <AgentePersonality 
                onDataChange={(data) => handleDataChange("personality", data)}
                initialData={personalityData}
              />
            </Card>
          </TabsContent>

          <TabsContent value="goals" className="mt-6">
            <Card>
              <AgenteGoalsExamples 
                onDataChange={(data) => handleDataChange("goals", data)}
                initialData={goalsData}
              />
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}