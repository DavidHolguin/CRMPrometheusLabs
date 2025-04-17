import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock, Search, LineChart, UsersRound, BarChart4, Activity } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useChatbots } from "@/hooks/useChatbots";
import { useConversations } from "@/hooks/useConversations";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import { useEvaluaciones } from "@/hooks/useEvaluaciones";
import { useLeads } from "@/hooks/useLeads";
import { useAgentes } from "@/hooks/useAgentes";
import { useCalidadLLMMetricas } from "@/hooks/useCalidadLLMMetricas";
import { useAgenteMetricas } from "@/hooks/useAgenteMetricas";
import { LeadConversationsList } from "@/components/ia-training/LeadConversationsList";
import { QAPairCard } from "@/components/ia-training/QAPairCard";
import { CalidadLLMMetricas } from "@/components/ia-training/CalidadLLMMetricas";
import { AgenteMetricas } from "@/components/ia-training/AgenteMetricas";

export default function EntrenamientoIA() {
  const { user } = useAuth();
  const { data: chatbots = [] } = useChatbots();
  const { agentes = [] } = useAgentes();
  const [selectedChatbotId, setSelectedChatbotId] = useState<string | null>(null);
  const [selectedAgenteId, setSelectedAgenteId] = useState<string | null>(null);
  const { data: conversations = [], isLoading: isLoadingConversations } = useConversations(selectedChatbotId || undefined);
  const { data: leads = [], isLoading: isLoadingLeads } = useLeads(selectedChatbotId || undefined);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const { qaPairs, isLoading: isLoadingMessages } = useConversationMessages(selectedConversationId);
  const { guardarEvaluacion, obtenerEvaluaciones, isLoading: isLoadingEvaluaciones } = useEvaluaciones();
  const [evaluaciones, setEvaluaciones] = useState<Record<string, { rating?: number; feedback?: string }>>({});
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoadingRatings, setIsLoadingRatings] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("evaluacion");
  const [metricasPeriodo, setMetricasPeriodo] = useState<string>("30d");

  // Obtener métricas de calidad del LLM
  const {
    data: metricasLLM,
    isLoading: isLoadingMetricasLLM
  } = useCalidadLLMMetricas(selectedChatbotId, metricasPeriodo);

  // Obtener métricas del agente
  const {
    data: metricasAgente,
    isLoading: isLoadingMetricasAgente
  } = useAgenteMetricas(selectedAgenteId, metricasPeriodo);

  useEffect(() => {
    // Obtener el último chatbot seleccionado del localStorage
    const lastSelectedChatbot = localStorage.getItem("lastSelectedChatbot");
    if (chatbots.length > 0) {
      const defaultChatbot = lastSelectedChatbot 
        ? chatbots.find(c => c.id === lastSelectedChatbot) 
        : chatbots[0];
      setSelectedChatbotId(defaultChatbot?.id || chatbots[0].id);
    }
    
    // Obtener el último agente seleccionado del localStorage
    const lastSelectedAgente = localStorage.getItem("lastSelectedAgente");
    if (agentes.length > 0) {
      const defaultAgente = lastSelectedAgente 
        ? agentes.find(a => a.id === lastSelectedAgente) 
        : agentes[0];
      setSelectedAgenteId(defaultAgente?.id || agentes[0].id);
    }
  }, [chatbots, agentes]);

  // Optimizamos la carga de evaluaciones para evitar el congelamiento de la interfaz
  const loadEvaluaciones = useCallback(async () => {
    if (!qaPairs.length) return;
    
    // Mostramos loading solo cuando no tenemos evaluaciones previas
    const shouldShowLoading = Object.keys(evaluaciones).length === 0;
    if (shouldShowLoading) {
      setIsLoadingRatings(true);
    }
    
    const newEvaluaciones: Record<string, { rating?: number; feedback?: string }> = {};
    
    try {
      // Creamos un array de promesas para cargar las evaluaciones en paralelo
      const promises = qaPairs.map(async (pair) => {
        try {
          // Obtener evaluaciones para este mensaje
          const evaluacionesMensaje = await obtenerEvaluaciones(pair.question.id);
          
          if (evaluacionesMensaje && evaluacionesMensaje.length > 0) {
            // Usar la evaluación más reciente
            const ultima = evaluacionesMensaje[0];
            return {
              pairId: pair.id,
              data: {
                rating: ultima.puntuacion,
                feedback: ultima.retroalimentacion || ''
              }
            };
          }
          return null;
        } catch (error) {
          console.error(`Error al cargar evaluaciones para mensaje ${pair.question.id}:`, error);
          return null;
        }
      });
      
      // Ejecutamos todas las promesas en paralelo
      const results = await Promise.all(promises);
      
      // Procesamos los resultados
      results.forEach(result => {
        if (result) {
          newEvaluaciones[result.pairId] = result.data;
        }
      });
      
      setEvaluaciones(prevEvals => ({...prevEvals, ...newEvaluaciones}));
    } catch (error) {
      console.error("Error al cargar las evaluaciones:", error);
    } finally {
      if (shouldShowLoading) {
        setIsLoadingRatings(false);
      }
    }
  }, [qaPairs, obtenerEvaluaciones]);

  // Usamos useEffect para llamar a loadEvaluaciones cuando cambian los qaPairs
  useEffect(() => {
    if (qaPairs.length > 0) {
      // Utilizamos setTimeout para evitar el bloqueo de la interfaz
      const timer = setTimeout(() => {
        loadEvaluaciones();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [qaPairs, loadEvaluaciones]);

  const handleChatbotChange = (value: string) => {
    setSelectedChatbotId(value);
    localStorage.setItem("lastSelectedChatbot", value);
    setSelectedConversationId(null); // Reset conversation selection
    setEvaluaciones({}); // Limpiar evaluaciones al cambiar de chatbot
  };

  const handleAgenteChange = (value: string) => {
    setSelectedAgenteId(value);
    localStorage.setItem("lastSelectedAgente", value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleRate = async (pairId: string, questionId: string, answerId: string, rating: number) => {
    if (!user?.id) return; // Usamos el ID del usuario

    try {
      await guardarEvaluacion({
        mensaje_id: questionId,
        respuesta_id: answerId,
        evaluador_id: user.id, // Usamos el ID del usuario
        puntuacion: rating
      });

      setEvaluaciones(prev => ({
        ...prev,
        [pairId]: {
          ...prev[pairId],
          rating
        }
      }));
    } catch (error) {
      console.error("Error al guardar la evaluación:", error);
    }
  };

  const handleFeedback = async (pairId: string, questionId: string, answerId: string, feedback: string) => {
    if (!user?.id) return; // Usamos el ID del usuario

    try {
      await guardarEvaluacion({
        mensaje_id: questionId,
        respuesta_id: answerId,
        evaluador_id: user.id, // Usamos el ID del usuario
        puntuacion: evaluaciones[pairId]?.rating || 0,
        retroalimentacion: feedback
      });

      setEvaluaciones(prev => ({
        ...prev,
        [pairId]: {
          ...prev[pairId],
          feedback
        }
      }));
    } catch (error) {
      console.error("Error al guardar la retroalimentación:", error);
    }
  };

  // Obtener el nombre del chatbot seleccionado
  const selectedChatbotNombre = selectedChatbotId 
    ? chatbots.find(c => c.id === selectedChatbotId)?.nombre || "Chatbot"
    : "Chatbot";
    
  // Obtener el nombre del agente seleccionado
  const selectedAgenteNombre = selectedAgenteId 
    ? agentes.find(a => a.id === selectedAgenteId)?.full_name || agentes.find(a => a.id === selectedAgenteId)?.email || "Agente"
    : "Agente";

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Entrenamiento IA</h1>
            <p className="text-muted-foreground">
              Evalúa la calidad de las respuestas y monitorea el rendimiento del sistema
            </p>
          </div>
          
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="evaluacion" className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              <span>Evaluación</span>
            </TabsTrigger>
            <TabsTrigger value="metricas-llm" className="flex items-center gap-1">
              <BarChart4 className="h-4 w-4" />
              <span>Chatbot</span>
            </TabsTrigger>
            <TabsTrigger value="metricas-agente" className="flex items-center gap-1">
              <UsersRound className="h-4 w-4" />
              <span>Agente</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="evaluacion" className="space-y-6 mt-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Select value={selectedChatbotId || ""} onValueChange={handleChatbotChange}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Selecciona un chatbot para evaluar" />
              </SelectTrigger>
              <SelectContent>
                {chatbots.map((chatbot) => (
                  <SelectItem key={chatbot.id} value={chatbot.id}>
                    <div className="flex items-center gap-2">
                      <img 
                        src={chatbot.avatar_url || "/placeholder.svg"} 
                        alt={chatbot.nombre}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span>{chatbot.nombre}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar conversación o lead..." 
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="h-[calc(100vh-12rem)] lg:col-span-4 flex flex-col">
              <div className="p-4 border-b">
                <div className="flex gap-2">
                  <Button 
                    variant={filterStatus === "all" ? "default" : "outline"}
                    onClick={() => setFilterStatus("all")}
                    size="sm"
                    className="flex-1"
                  >
                    Todos
                  </Button>
                  <Button 
                    variant={filterStatus === "rated" ? "default" : "outline"}
                    onClick={() => setFilterStatus("rated")}
                    size="sm"
                    className="flex-1"
                  >
                    Calificados
                  </Button>
                  <Button 
                    variant={filterStatus === "unrated" ? "default" : "outline"}
                    onClick={() => setFilterStatus("unrated")}
                    size="sm"
                    className="flex-1"
                  >
                    Sin calificar
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    {(isLoadingConversations || isLoadingLeads) ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <LeadConversationsList 
                        leads={leads}
                        conversations={conversations.filter(conv => 
                          searchQuery === "" || 
                          conv.ultimo_mensaje?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          leads.some(lead => 
                            lead.id === conv.lead_id && 
                            ((lead.nombre || "").toLowerCase() + " " + (lead.apellido || "").toLowerCase()).includes(searchQuery.toLowerCase())
                          )
                        )}
                        onSelectConversation={setSelectedConversationId}
                        selectedConversationId={selectedConversationId}
                        filterStatus={filterStatus}
                      />
                    )}
                  </div>
                </ScrollArea>
              </div>
            </Card>

            <Card className="h-[calc(100vh-12rem)] lg:col-span-8 flex flex-col">
              {selectedConversationId ? (
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-lg">
                    Evaluación de conversación
                  </CardTitle>
                </CardHeader>
              ) : null}
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-6 space-y-6">
                    {isLoadingMessages ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : qaPairs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground space-y-2">
                        {selectedConversationId 
                          ? "No hay mensajes en esta conversación"
                          : selectedChatbotId 
                            ? conversations.length === 0 
                              ? "No hay conversaciones para este chatbot" 
                              : "Selecciona una conversación para ver los mensajes"
                            : "Selecciona un chatbot para comenzar"}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {qaPairs.map((pair) => (
                          <QAPairCard
                            key={pair.id}
                            pair={{
                              id: pair.id,
                              question: pair.question.content,
                              answer: pair.answer.content,
                              rating: evaluaciones[pair.id]?.rating,
                              feedback: evaluaciones[pair.id]?.feedback,
                            }}
                            onRate={(rating) => handleRate(pair.id, pair.question.id, pair.answer.id, rating)}
                            onFeedback={(feedback) => handleFeedback(pair.id, pair.question.id, pair.answer.id, feedback)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metricas-llm" className="space-y-6 mt-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Select value={selectedChatbotId || ""} onValueChange={handleChatbotChange}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Selecciona un chatbot para ver métricas" />
              </SelectTrigger>
              <SelectContent>
                {chatbots.map((chatbot) => (
                  <SelectItem key={chatbot.id} value={chatbot.id}>
                    <div className="flex items-center gap-2">
                      <img 
                        src={chatbot.avatar_url || "/placeholder.svg"} 
                        alt={chatbot.nombre}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span>{chatbot.nombre}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <CalidadLLMMetricas
            chatbotId={selectedChatbotId}
            chatbotNombre={selectedChatbotNombre}
            metricas={metricasLLM || {
              total_mensajes: 0,
              mensajes_evaluados: 0,
              promedio_puntuacion: 0,
              distribucion_puntuaciones: [],
              temas_problematicos: [],
              ultima_actualizacion: new Date().toISOString(),
            }}
            periodo={metricasPeriodo}
            onPeriodoChange={setMetricasPeriodo}
            isLoading={isLoadingMetricasLLM}
          />
        </TabsContent>

        <TabsContent value="metricas-agente" className="space-y-6 mt-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Select value={selectedAgenteId || ""} onValueChange={handleAgenteChange}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Selecciona un agente para ver métricas" />
              </SelectTrigger>
              <SelectContent>
                {agentes.map((agente) => (
                  <SelectItem key={agente.id} value={agente.id}>
                    <div className="flex items-center gap-2">
                      <img 
                        src={agente.avatar_url || "/placeholder.svg"} 
                        alt={agente.full_name || ""}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span>{agente.full_name || agente.email}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <AgenteMetricas
            agenteId={selectedAgenteId}
            agenteNombre={selectedAgenteNombre}
            metricas={metricasAgente || {
              total_evaluaciones: 0,
              promedio_tiempo_respuesta: 0,
              tasa_respuesta: 0,
              tasa_resolucion: 0,
              evolucion_tiempo: [],
              comparacion_periodo_anterior: {
                promedio_calificacion_cambio: 0,
                tasa_respuesta_cambio: 0,
                tasa_resolucion_cambio: 0
              },
              ultima_actualizacion: new Date().toISOString()
            }}
            periodo={metricasPeriodo}
            onPeriodoChange={setMetricasPeriodo}
            isLoading={isLoadingMetricasAgente}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}