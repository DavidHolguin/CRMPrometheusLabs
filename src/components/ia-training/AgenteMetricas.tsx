import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, UserRound, BarChart3, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface AgenteMetricasProps {
  agenteId: string | null;
  agenteNombre: string;
  metricas: {
    total_evaluaciones: number;
    promedio_tiempo_respuesta: number;
    tasa_respuesta: number;
    tasa_resolucion: number;
    evolucion_tiempo: {
      fecha: string;
      total_evaluaciones: number;
      promedio_calificacion: number;
      tasa_respuesta: number;
    }[];
    comparacion_periodo_anterior: {
      promedio_calificacion_cambio: number;
      tasa_respuesta_cambio: number;
      tasa_resolucion_cambio: number;
    };
    ultima_actualizacion: string;
  };
  periodo: string;
  onPeriodoChange: (periodo: string) => void;
  isLoading: boolean;
}

const TendenciaIndicador = ({ valor }: { valor: number }) => {
  if (valor > 0) {
    return <ArrowUp className="h-3 w-3 text-green-500" />;
  } else if (valor < 0) {
    return <ArrowDown className="h-3 w-3 text-red-500" />;
  }
  return <Minus className="h-3 w-3 text-muted-foreground" />;
};

export function AgenteMetricas({
  agenteId,
  agenteNombre,
  metricas,
  periodo,
  onPeriodoChange,
  isLoading
}: AgenteMetricasProps) {
  // Formato para número de milisegundos a formato mm:ss
  const formatTiempoRespuesta = (ms: number) => {
    const segundos = Math.floor(ms / 1000);
    const minutos = Math.floor(segundos / 60);
    const segsRestantes = segundos % 60;
    return `${minutos}:${segsRestantes.toString().padStart(2, '0')}`;
  };

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

  if (!agenteId) {
    return (
      <Card className="h-[400px]">
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-6">
            <UserRound className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <h3 className="mt-4 text-lg font-medium">No hay métricas disponibles</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Selecciona un agente para ver sus métricas de desempeño
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const renderTendencia = () => {
    if (!metricas.evolucion_tiempo || metricas.evolucion_tiempo.length < 2) {
      return (
        <div className="h-[280px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No hay suficientes datos para mostrar tendencias</p>
        </div>
      );
    }

    const data = metricas.evolucion_tiempo.map(item => ({
      fecha: new Date(item.fecha).toLocaleDateString('es-ES', {day: '2-digit', month: 'short'}),
      calificacion: item.promedio_calificacion,
      tasa_respuesta: item.tasa_respuesta * 100, // Convertir a porcentaje para la gráfica
      evaluaciones: item.total_evaluaciones
    }));

    return (
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
            <XAxis dataKey="fecha" />
            <YAxis yAxisId="left" domain={[0, 5]} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
            <RechartsTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background p-3 border rounded-md shadow-sm text-sm">
                      <p className="font-medium">{payload[0].payload.fecha}</p>
                      <p>Calificación: {typeof payload[0].value === 'number' ? payload[0].value.toFixed(1) : payload[0].value}</p>
                      <p>Tasa de respuesta: {typeof payload[1].value === 'number' ? payload[1].value.toFixed(1) : payload[1].value}%</p>
                      <p>Evaluaciones: {payload[0].payload.evaluaciones}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="calificacion"
              stroke="#8884d8"
              strokeWidth={2}
              yAxisId="left"
              name="Calificación"
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="tasa_respuesta"
              stroke="#82ca9d"
              strokeWidth={2}
              yAxisId="right"
              name="Tasa de respuesta"
            />
          </LineChart>
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
              <UserRound className="h-5 w-5 text-primary" />
              Rendimiento del Agente
            </CardTitle>
            <CardDescription>
              Métricas de desempeño para {agenteNombre}
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
        <div className="flex items-center justify-between py-3">
          <div className="grid grid-cols-4 gap-4 w-full">
            <div className="flex flex-col items-center border rounded-lg p-3">
              <span className="text-muted-foreground text-xs">Total evaluaciones</span>
              <span className="text-2xl font-semibold mt-1">{metricas.total_evaluaciones}</span>
            </div>
            <div className="flex flex-col items-center border rounded-lg p-3">
              <span className="text-muted-foreground text-xs">Tiempo respuesta</span>
              <span className="text-2xl font-semibold mt-1">
                {formatTiempoRespuesta(metricas.promedio_tiempo_respuesta)}
              </span>
            </div>
            <div className="flex flex-col items-center border rounded-lg p-3">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-xs">Tasa respuesta</span>
                <div className="flex items-center">
                  <TendenciaIndicador valor={metricas.comparacion_periodo_anterior.tasa_respuesta_cambio} />
                  <Badge 
                    variant="outline" 
                    className="text-[10px] h-4 ml-1"
                  >
                    {metricas.comparacion_periodo_anterior.tasa_respuesta_cambio > 0 ? "+" : ""}
                    {metricas.comparacion_periodo_anterior.tasa_respuesta_cambio.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <span className="text-2xl font-semibold mt-1">
                {(metricas.tasa_respuesta * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex flex-col items-center border rounded-lg p-3">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-xs">Tasa resolución</span>
                <div className="flex items-center">
                  <TendenciaIndicador valor={metricas.comparacion_periodo_anterior.tasa_resolucion_cambio} />
                  <Badge 
                    variant="outline" 
                    className="text-[10px] h-4 ml-1"
                  >
                    {metricas.comparacion_periodo_anterior.tasa_resolucion_cambio > 0 ? "+" : ""}
                    {metricas.comparacion_periodo_anterior.tasa_resolucion_cambio.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <span className="text-2xl font-semibold mt-1">
                {(metricas.tasa_resolucion * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          {renderTendencia()}
        </div>
        
        <div className="text-xs text-muted-foreground text-center mt-4">
          Última actualización: {formatDistanceToNow(new Date(metricas.ultima_actualizacion), { locale: es, addSuffix: true })}
        </div>
      </CardContent>
    </Card>
  );
}