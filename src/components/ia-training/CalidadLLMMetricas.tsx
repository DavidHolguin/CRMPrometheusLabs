import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { Calendar, ChevronLeft, ChevronRight, HelpCircle, Star, BarChart3, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface CalidadLLMMetricasProps {
  chatbotId: string | null;
  chatbotNombre: string;
  metricas: {
    total_mensajes: number;
    mensajes_evaluados: number;
    promedio_puntuacion: number;
    distribucion_puntuaciones: {
      puntuacion: number;
      cantidad: number;
      porcentaje: number;
    }[];
    temas_problematicos: {
      tema: string;
      menciones: number;
      puntuacion_promedio: number;
    }[];
    tendencia_tiempo?: {
      fecha: string;
      promedio: number;
      total_evaluaciones: number;
    }[];
    ultima_actualizacion: string;
  };
  periodo: string;
  onPeriodoChange: (periodo: string) => void;
  isLoading: boolean;
}

const getStarLabel = (rating: number) => {
  switch(rating) {
    case 1: return "Deficiente";
    case 2: return "Regular";
    case 3: return "Bueno";
    case 4: return "Muy bueno";
    case 5: return "Excelente";
    default: return "";
  }
};

const COLORS = ['#FF8042', '#FFBB28', '#00C49F', '#0088FE', '#8884d8'];

export function CalidadLLMMetricas({ 
  chatbotId, 
  chatbotNombre, 
  metricas,
  periodo,
  onPeriodoChange,
  isLoading 
}: CalidadLLMMetricasProps) {
  const [activeTab, setActiveTab] = useState("distribucion");

  if (isLoading) {
    return (
      <Card className="h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Cargando métricas...</p>
        </div>
      </Card>
    );
  }

  if (!chatbotId) {
    return (
      <Card className="h-[400px]">
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-6">
            <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <h3 className="mt-4 text-lg font-medium">No hay métricas disponibles</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Selecciona un chatbot para ver sus métricas de calidad
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const renderDistribucion = () => {
    const data = metricas.distribucion_puntuaciones.map(item => ({
      name: `${item.puntuacion} ${getStarLabel(item.puntuacion)}`,
      value: item.cantidad,
      puntuacion: item.puntuacion,
      porcentaje: item.porcentaje,
    }));

    return (
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 30 }}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background p-3 border rounded-md shadow-sm text-sm">
                      <p className="font-medium">{payload[0].payload.name}</p>
                      <p>Cantidad: {payload[0].value}</p>
                      <p>Porcentaje: {payload[0].payload.porcentaje.toFixed(1)}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value">
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.puntuacion - 1]} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderTemas = () => {
    if (!metricas.temas_problematicos || metricas.temas_problematicos.length === 0) {
      return (
        <div className="h-[280px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No hay temas problemáticos identificados</p>
        </div>
      );
    }

    return (
      <div className="space-y-4 h-[280px] overflow-y-auto p-2">
        {metricas.temas_problematicos.map((tema, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <p className="font-medium text-sm">{tema.tema}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {tema.menciones} menciones
                </Badge>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-amber-500" />
                  <span className="text-xs">{tema.puntuacion_promedio.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTendencia = () => {
    if (!metricas.tendencia_tiempo || metricas.tendencia_tiempo.length < 2) {
      return (
        <div className="h-[280px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No hay suficientes datos para mostrar tendencias</p>
        </div>
      );
    }

    const data = metricas.tendencia_tiempo.map(item => ({
      fecha: new Date(item.fecha).toLocaleDateString('es-ES', {day: '2-digit', month: 'short'}),
      promedio: item.promedio,
      evaluaciones: item.total_evaluaciones
    }));

    return (
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 30 }}>
            <XAxis dataKey="fecha" />
            <YAxis />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background p-3 border rounded-md shadow-sm text-sm">
                      <p className="font-medium">{payload[0].payload.fecha}</p>
                      <p>Calificación promedio: {payload[0].payload.promedio.toFixed(1)}</p>
                      <p>Evaluaciones: {payload[0].payload.evaluaciones}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="promedio" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Calidad del LLM
            </CardTitle>
            <CardDescription>
              Métricas de calidad de respuesta para {chatbotNombre}
            </CardDescription>
          </div>
          <Select value={periodo} onValueChange={onPeriodoChange}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <SelectValue placeholder="Período" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
              <SelectItem value="all">Todo el tiempo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between py-3 text-sm">
          <div className="grid grid-cols-3 gap-4 w-full">
            <div className="flex flex-col items-center border rounded-lg p-3">
              <span className="text-muted-foreground text-xs">Total mensajes</span>
              <span className="text-2xl font-semibold mt-1">{metricas.total_mensajes}</span>
            </div>
            <div className="flex flex-col items-center border rounded-lg p-3">
              <span className="text-muted-foreground text-xs">Evaluados</span>
              <span className="text-2xl font-semibold mt-1">
                {metricas.mensajes_evaluados} 
                <span className="text-xs text-muted-foreground ml-1">
                  ({((metricas.mensajes_evaluados / metricas.total_mensajes) * 100).toFixed(1)}%)
                </span>
              </span>
            </div>
            <div className="flex flex-col items-center border rounded-lg p-3">
              <span className="text-muted-foreground text-xs">Calificación</span>
              <div className="flex items-center mt-1 gap-1">
                <span className="text-2xl font-semibold">{metricas.promedio_puntuacion.toFixed(1)}</span>
                <Star className="h-5 w-5 text-amber-500 mt-0.5" />
              </div>
            </div>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-3 grid grid-cols-3">
            <TabsTrigger value="distribucion" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span>Distribución</span>
            </TabsTrigger>
            <TabsTrigger value="temas" className="flex items-center gap-1">
              <HelpCircle className="h-4 w-4" />
              <span>Temas</span>
            </TabsTrigger>
            <TabsTrigger value="tendencia" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Tendencia</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="distribucion">
            {renderDistribucion()}
          </TabsContent>
          
          <TabsContent value="temas">
            {renderTemas()}
          </TabsContent>
          
          <TabsContent value="tendencia">
            {renderTendencia()}
          </TabsContent>
        </Tabs>
        
        <div className="text-xs text-muted-foreground text-center mt-4">
          Última actualización: {formatDistanceToNow(new Date(metricas.ultima_actualizacion), { locale: es, addSuffix: true })}
        </div>
      </CardContent>
    </Card>
  );
}