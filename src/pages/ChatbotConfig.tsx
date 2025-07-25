import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Bot, 
  ArrowLeft, 
  Loader2, 
  Settings, 
  MessageSquare, 
  UserRound, 
  BookOpen,
  Lightbulb,
  FileQuestion,
  Code,
  Save,
  ExternalLink
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useChatbot } from "@/hooks/useChatbots";
import { useChatbotUpdate } from "@/hooks/useChatbotConfig";
import { ChatPreview } from "@/components/chatbots/ChatPreview";
import { useAuth } from "@/context/AuthContext";

// Tabs de configuración
import { BasicConfigTab } from "../components/chatbots/config/BasicConfigTab";
import { PersonalityTab } from "../components/chatbots/config/PersonalityTab";
import { ContextTab } from "../components/chatbots/config/ContextTab";
import { KeyPointsTab } from "../components/chatbots/config/KeyPointsTab";
import { QATab } from "../components/chatbots/config/QATab";
import { IntegrationTab } from "../components/chatbots/config/IntegrationTab";

const ChatbotConfig = () => {
  const { chatbotId: id } = useParams<{ chatbotId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: chatbot, isLoading, error } = useChatbot(id);
  const { updateChatbot, updateChatbotContext, isUpdating } = useChatbotUpdate(id || '');
  
  // Estado para cada pestaña
  const [activeTab, setActiveTab] = useState("basic");
  const [isSaving, setIsSaving] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState<Record<string, boolean>>({
    basic: false,
    personality: false,
    context: false,
    keypoints: false,
    qa: false,
    integration: false,
  });

  // Estados para los datos del formulario
  const [basicData, setBasicData] = useState({
    nombre: "",
    descripcion: "",
    avatar_url: "",
    llm_configuracion_id: "",
    pipeline_id: "",
    stage_id: ""
  });
  
  const [personalityData, setPersonalityData] = useState({
    personality: "",
    communication_tone: "",
  });

  const [contextData, setContextData] = useState({
    main_purpose: "",
    welcome_message: "",
    general_context: "",
    special_instructions: "",
  });

  const [keyPointsData, setKeyPointsData] = useState<string[]>([]);
  
  const [qaExamplesData, setQAExamplesData] = useState<Array<{question: string, answer: string}>>([]);
  
  const [integrationData, setIntegrationData] = useState({
    messages: [] as string[],
    avatarUrl: "",
    primaryColor: "#00C999",
    widgetPosition: "right" as "left" | "right",
    initialMessage: "",
    borderRadius: 16,
    hiddenOnMobile: false,
    headerText: "",
    sendButtonColor: "#00C999"
  });

  // Cargar datos del chatbot
  useEffect(() => {
    if (chatbot) {
      // Datos básicos
      setBasicData({
        nombre: chatbot.nombre || "",
        descripcion: chatbot.descripcion || "",
        avatar_url: chatbot.avatar_url || "",
        llm_configuracion_id: chatbot.llm_configuracion_id || "",
        pipeline_id: chatbot.pipeline_id || "",
        stage_id: "" // Esto se cargará en el componente con los stages
      });
      
      // Datos de personalidad
      setPersonalityData({
        personality: chatbot.contexto?.personality || "",
        communication_tone: chatbot.contexto?.communicationTone || "",
      });

      // Datos de contexto
      setContextData({
        main_purpose: chatbot.contexto?.mainPurpose || "",
        welcome_message: chatbot.contexto?.welcomeMessage || "",
        general_context: chatbot.contexto?.generalContext || "",
        special_instructions: chatbot.contexto?.specialInstructions || "",
      });

      // Puntos clave
      setKeyPointsData(chatbot.contexto?.keyPoints || []);
      
      // Ejemplos de Q&A
      setQAExamplesData(chatbot.contexto?.qaExamples || []);
      
      // Datos de integración (se cargarían desde chatbot_canales)
      // Por ahora usamos valores por defecto, esto se debe implementar 
      // obteniendo la config real desde chatbot_canales para el canal web
    }
  }, [chatbot]);

  // Funciones para marcar cambios en cada tab
  const handleBasicChange = (data: typeof basicData) => {
    setBasicData(data);
    setUnsavedChanges(prev => ({ ...prev, basic: true }));
  };

  const handlePersonalityChange = (data: typeof personalityData) => {
    setPersonalityData(data);
    setUnsavedChanges(prev => ({ ...prev, personality: true }));
  };

  const handleContextChange = (data: typeof contextData) => {
    setContextData(data);
    setUnsavedChanges(prev => ({ ...prev, context: true }));
  };

  const handleKeyPointsChange = (data: string[]) => {
    setKeyPointsData(data);
    setUnsavedChanges(prev => ({ ...prev, keypoints: true }));
  };

  const handleQAExamplesChange = (data: typeof qaExamplesData) => {
    setQAExamplesData(data);
    setUnsavedChanges(prev => ({ ...prev, qa: true }));
  };

  const handleIntegrationChange = (data: typeof integrationData) => {
    setIntegrationData(data);
    setUnsavedChanges(prev => ({ ...prev, integration: true }));
  };

  // Función para guardar todos los cambios
  const handleSaveChanges = async () => {
    if (!id) return;
    
    setIsSaving(true);
    
    try {
      // Guardar datos básicos si hay cambios
      if (unsavedChanges.basic) {
        await updateChatbot({
          nombre: basicData.nombre,
          descripcion: basicData.descripcion,
          avatar_url: basicData.avatar_url,
          llm_configuracion_id: basicData.llm_configuracion_id || null,
          pipeline_id: basicData.pipeline_id || null
        });
      }
      
      // Guardar datos de contexto si hay cambios en cualquiera de las pestañas relacionadas
      if (
        unsavedChanges.personality || 
        unsavedChanges.context || 
        unsavedChanges.keypoints || 
        unsavedChanges.qa
      ) {
        await updateChatbotContext({
          personality: personalityData.personality,
          communication_tone: personalityData.communication_tone,
          main_purpose: contextData.main_purpose,
          welcome_message: contextData.welcome_message,
          general_context: contextData.general_context,
          special_instructions: contextData.special_instructions,
          key_points: keyPointsData,
          qa_examples: qaExamplesData
        });
      }
      
      // Actualizar estado de cambios
      setUnsavedChanges({
        basic: false,
        personality: false,
        context: false,
        keypoints: false,
        qa: false,
        integration: false,
      });
      
      toast.success("Configuración guardada correctamente");
    } catch (error) {
      console.error("Error guardando configuración:", error);
      toast.error("Error al guardar la configuración");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Cargando configuración del chatbot...</p>
        </div>
      </div>
    );
  }

  if (error || !chatbot) {
    return (
      <div className="px-6 py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Error al cargar el chatbot</h2>
          <p className="text-muted-foreground mb-4">
            No se pudo encontrar el chatbot solicitado o ocurrió un error al cargar la información.
          </p>
          <Button onClick={() => navigate('/dashboard/chatbots')}>
            Volver a Chatbots
          </Button>
        </div>
      </div>
    );
  }

  // Verificar si hay cambios sin guardar en cualquier pestaña
  const hasUnsavedChanges = Object.values(unsavedChanges).some(Boolean);

  return (
    <div className="px-6 py-6">
      {/* Header más compacto pegado al header principal */}
      <div className="flex items-center justify-between py-3 border-b sticky top-0 bg-background z-10">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/dashboard/chatbots')}
          >
            <ArrowLeft size={16} />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
              {chatbot.avatar_url ? (
                <img 
                  src={chatbot.avatar_url} 
                  alt={chatbot.nombre} 
                  className="h-6 w-6 rounded-md object-cover"
                />
              ) : (
                <Bot className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">{chatbot.nombre}</h1>
              <p className="text-xs text-muted-foreground">
                Configuración avanzada
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => window.open(`/chat/${id}`, '_blank')}
            className="h-8"
          >
            <ExternalLink size={14} className="mr-1" />
            Vista previa
          </Button>
          
          <Button 
            onClick={handleSaveChanges}
            disabled={!hasUnsavedChanges || isSaving || isUpdating}
            className="gap-1 h-8"
            size="sm"
          >
            {(isSaving || isUpdating) ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {hasUnsavedChanges 
              ? "Guardar cambios" 
              : "Guardado"}
          </Button>
        </div>
      </div>
      
      {/* Main content - Cambiando proporciones a 25% 50% 25% */}
      <div className="grid grid-cols-12 gap-4 mt-4">
        {/* First column - Navigation menu - 25% */}
        <div className="col-span-3">
          <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 border-b">
              <h3 className="font-medium">Configuración</h3>
            </div>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              orientation="vertical"
              className="w-full"
            >
              <TabsList className="flex flex-col h-auto bg-transparent p-2 gap-2 w-full">
                <TabsTrigger 
                  value="basic" 
                  className="justify-start px-3 py-2.5 data-[state=active]:bg-muted rounded-md w-full border data-[state=active]:border-primary/20 shadow-sm"
                >
                  <div className="flex flex-col items-start w-full">
                    <div className="flex items-center w-full">
                      <Settings size={16} className="mr-2 text-muted-foreground" />
                      <span className="font-medium">Básico</span>
                    </div>
                    <span className="text-xs text-muted-foreground pl-6 mt-0.5">Configuración general</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="personality" 
                  className="justify-start px-3 py-2.5 data-[state=active]:bg-muted rounded-md w-full border data-[state=active]:border-primary/20 shadow-sm"
                >
                  <div className="flex flex-col items-start w-full">
                    <div className="flex items-center w-full">
                      <UserRound size={16} className="mr-2 text-muted-foreground" />
                      <span className="font-medium">Personalidad</span>
                    </div>
                    <span className="text-xs text-muted-foreground pl-6 mt-0.5">Tono y estilo</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="context" 
                  className="justify-start px-3 py-2.5 data-[state=active]:bg-muted rounded-md w-full border data-[state=active]:border-primary/20 shadow-sm"
                >
                  <div className="flex flex-col items-start w-full">
                    <div className="flex items-center w-full">
                      <BookOpen size={16} className="mr-2 text-muted-foreground" />
                      <span className="font-medium">Contexto</span>
                    </div>
                    <span className="text-xs text-muted-foreground pl-6 mt-0.5">Propósito y conocimiento</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="keypoints" 
                  className="justify-start px-3 py-2.5 data-[state=active]:bg-muted rounded-md w-full border data-[state=active]:border-primary/20 shadow-sm"
                >
                  <div className="flex flex-col items-start w-full">
                    <div className="flex items-center w-full">
                      <Lightbulb size={16} className="mr-2 text-muted-foreground" />
                      <span className="font-medium">Puntos Clave</span>
                    </div>
                    <span className="text-xs text-muted-foreground pl-6 mt-0.5">Aspectos importantes</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="qa" 
                  className="justify-start px-3 py-2.5 data-[state=active]:bg-muted rounded-md w-full border data-[state=active]:border-primary/20 shadow-sm"
                >
                  <div className="flex flex-col items-start w-full">
                    <div className="flex items-center w-full">
                      <FileQuestion size={16} className="mr-2 text-muted-foreground" />
                      <span className="font-medium">Preguntas y Respuestas</span>
                    </div>
                    <span className="text-xs text-muted-foreground pl-6 mt-0.5">Ejemplos de respuestas</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="integration" 
                  className="justify-start px-3 py-2.5 data-[state=active]:bg-muted rounded-md w-full border data-[state=active]:border-primary/20 shadow-sm"
                >
                  <div className="flex flex-col items-start w-full">
                    <div className="flex items-center w-full">
                      <Code size={16} className="mr-2 text-muted-foreground" />
                      <span className="font-medium">Integración</span>
                    </div>
                    <span className="text-xs text-muted-foreground pl-6 mt-0.5">Integrar en tu web</span>
                  </div>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        {/* Second column - Active config section - 50% */}
        <div className="col-span-6">
          <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 border-b">
              <h3 className="font-medium">
                {activeTab === "basic" && "Configuración básica"}
                {activeTab === "personality" && "Personalidad del chatbot"}
                {activeTab === "context" && "Contexto y propósito"}
                {activeTab === "keypoints" && "Puntos clave"}
                {activeTab === "qa" && "Ejemplo de preguntas y respuestas"}
                {activeTab === "integration" && "Integración en tu sitio web"}
              </h3>
            </div>
            
            <ScrollArea className="h-[calc(100vh-150px)] p-4">
              <Tabs value={activeTab} className="w-full">
                <TabsContent value="basic" className="m-0">
                  <BasicConfigTab
                    value={basicData}
                    onChange={handleBasicChange}
                  />
                </TabsContent>
                
                <TabsContent value="personality" className="m-0">
                  <PersonalityTab
                    value={personalityData}
                    onChange={handlePersonalityChange}
                  />
                </TabsContent>
                
                <TabsContent value="context" className="m-0">
                  <ContextTab
                    value={contextData}
                    onChange={handleContextChange}
                  />
                </TabsContent>
                
                <TabsContent value="keypoints" className="m-0">
                  <KeyPointsTab
                    value={keyPointsData}
                    onChange={handleKeyPointsChange}
                  />
                </TabsContent>
                
                <TabsContent value="qa" className="m-0">
                  <QATab
                    value={qaExamplesData}
                    onChange={handleQAExamplesChange}
                  />
                </TabsContent>
                
                <TabsContent value="integration" className="m-0">
                  <IntegrationTab
                    value={integrationData}
                    onChange={handleIntegrationChange}
                    chatbotId={id || ''}
                  />
                </TabsContent>
              </Tabs>
            </ScrollArea>
          </div>
        </div>
        
        {/* Third column - Chat preview - 25% */}
        <div className="col-span-3">
          <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 border-b">
              <h3 className="font-medium">Vista previa</h3>
            </div>
            
            <div className="p-3 h-[calc(100vh-150px)]">
              <ChatPreview 
                chatbotId={id || ''} 
                empresaId={user?.companyId || ''}
                chatbotName={chatbot.nombre}
                avatarUrl={chatbot.avatar_url || undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotConfig;