import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon, 
  BarChart as BarChartIcon,
  TrendingUp,
  Waves,
  LayoutDashboard
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { EventoDataPoint, TimelineDataPoint } from "@/hooks/useDashboardData";

interface AnalyticsPanelProps {
  isLoading: boolean;
  timeRange: string;
  onTimeRangeChange?: (range: string) => void;
  tipoEventos: EventoDataPoint[];
  timelineData: TimelineDataPoint[];
  rendimientoCanales: EventoDataPoint[];
  rendimientoChatbots: EventoDataPoint[];
}

export function AnalyticsPanel({
  isLoading,
  timeRange,
  onTimeRangeChange,
  tipoEventos,
  timelineData,
  rendimientoCanales,
  rendimientoChatbots
}: AnalyticsPanelProps) {
  const [activeVisType, setActiveVisType] = useState<"linea" | "area" | "barras">("area");
  const [selectedMetric, setSelectedMetric] = useState<"eventos" | "leads" | "conversaciones">("eventos");

  // Configuración para el gráfico de línea temporal
  const timelineConfig = {
    eventos: {
      label: "Eventos",
      color: "hsl(var(--chart-1))",
    },
    leads: {
      label: "Leads",
      color: "hsl(var(--chart-2))",
    },
    conversaciones: {
      label: "Conversaciones",
      color: "hsl(var(--chart-3))",
    },
  } as ChartConfig;

  // Datos para el panel de resumen
  const totalEventos = tipoEventos.reduce((acc, item) => acc + item.valor, 0);
  const totalLeads = timelineData.reduce((acc, item) => acc + item.leads, 0);
  const totalConversaciones = timelineData.reduce((acc, item) => acc + item.conversaciones, 0);

  // Calcular indicadores de tendencia
  const calcularTendencia = (data: TimelineDataPoint[], key: keyof TimelineDataPoint) => {
    if (data.length < 2) return { valor: 0, tendencia: "neutral" as "up" | "down" | "neutral" };
    
    const mitad = Math.floor(data.length / 2);
    const primeraMitad = data.slice(0, mitad);
    const segundaMitad = data.slice(mitad);
    
    const promedioPrimera = primeraMitad.reduce((acc, item) => acc + Number(item[key]), 0) / primeraMitad.length;
    const promedioSegunda = segundaMitad.reduce((acc, item) => acc + Number(item[key]), 0) / segundaMitad.length;
    
    if (promedioPrimera === 0) return { valor: 100, tendencia: "up" as "up" | "down" | "neutral" };
    
    const porcentajeCambio = ((promedioSegunda - promedioPrimera) / promedioPrimera) * 100;
    const tendencia = porcentajeCambio >= 0 ? "up" : "down";
    
    return {
      valor: Math.abs(Math.round(porcentajeCambio * 10) / 10),
      tendencia
    };
  };

  const tendenciaEventos = calcularTendencia(timelineData, "eventos");
  const tendenciaLeads = calcularTendencia(timelineData, "leads");
  const tendenciaConversaciones = calcularTendencia(timelineData, "conversaciones");

  // Formatear datos para la visualización temporal
  const formatearFecha = (fecha: string) => {
    try {
      return format(new Date(fecha), "dd MMM", { locale: es });
    } catch (e) {
      return fecha;
    }
  };

  // Renderizar el gráfico según el tipo seleccionado
  const renderizarGraficoTemporal = () => {
    // Formatear los datos para el gráfico
    const dataFormateada = timelineData.map(item => ({
      fecha: formatearFecha(item.fecha),
      eventos: item.eventos,
      leads: item.leads,
      conversaciones: item.conversaciones
    }));

    if (isLoading || dataFormateada.length === 0) {
      return (
        <div className="flex items-center justify-center h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Cargando datos analíticos...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <LayoutDashboard className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No hay datos disponibles para el período seleccionado</p>
            </div>
          )}
        </div>
      );
    }

    switch (activeVisType) {
      case "linea":
        return (
          <ChartContainer config={timelineConfig} className="h-[300px] w-full">
            <LineChart data={dataFormateada}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="fecha" 
                axisLine={false}
                tickLine={false}
                tickMargin={8}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent />
                }
              />
              <Line 
                type="monotone" 
                dataKey={selectedMetric} 
                stroke={`var(--color-${selectedMetric})`}
                strokeWidth={2}
                dot={{ fill: `var(--color-${selectedMetric})`, strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ChartContainer>
        );
      
      case "area":
        return (
          <ChartContainer config={timelineConfig} className="h-[300px] w-full">
            <AreaChart data={dataFormateada}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={`var(--color-${selectedMetric})`} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={`var(--color-${selectedMetric})`} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="fecha" 
                axisLine={false}
                tickLine={false}
                tickMargin={8}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent />
                }
              />
              <Area
                type="monotone"
                dataKey={selectedMetric}
                stroke={`var(--color-${selectedMetric})`}
                fill="url(#colorGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        );
      
      case "barras":
      default:
        return (
          <ChartContainer config={timelineConfig} className="h-[300px] w-full">
            <BarChart data={dataFormateada}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="fecha" 
                axisLine={false}
                tickLine={false}
                tickMargin={8}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent />
                }
              />
              <Bar 
                dataKey={selectedMetric} 
                fill={`var(--color-${selectedMetric})`}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        );
    }
  };

  // Renderizar el gráfico de distribución por canal
  const renderizarGraficoDistribucion = () => {
    if (isLoading || rendimientoCanales.length === 0) {
      return (
        <div className="flex items-center justify-center h-[200px]">
          {isLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
          )}
        </div>
      );
    }

    // Limitamos a los 5 principales canales
    const topCanales = rendimientoCanales.slice(0, 5);
    
    return (
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={topCanales}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="valor"
            nameKey="categoria"
          >
            {topCanales.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || `hsl(var(--chart-${index + 1}))`} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => {
              return [`${value} (${(Number(value) / totalEventos * 100).toFixed(1)}%)`, name];
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Renderizar gráfico para chatbots
  const renderizarGraficoChatbots = () => {
    if (isLoading || rendimientoChatbots.length === 0) {
      return (
        <div className="flex items-center justify-center h-[200px]">
          {isLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
          )}
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          layout="vertical"
          data={rendimientoChatbots.slice(0, 5)}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
          <XAxis type="number" />
          <YAxis 
            dataKey="categoria" 
            type="category" 
            scale="point" 
            width={100}
            tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 12)}...` : value}
          />
          <Tooltip
            formatter={(value, name, props) => {
              return [`${value} (${props.payload.porcentaje}%)`, "Interacciones"];
            }}
          />
          <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
            {rendimientoChatbots.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || `hsl(var(--chart-${index + 1}))`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Renderizar gráfico de radar para tipos de eventos
  const renderizarGraficoEventos = () => {
    if (isLoading || tipoEventos.length === 0) {
      return (
        <div className="flex items-center justify-center h-[200px]">
          {isLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
          )}
        </div>
      );
    }

    // Si hay muchos tipos, limitamos a los 6 principales para el radar
    const topEventos = tipoEventos.slice(0, 6);

    return (
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart cx="50%" cy="50%" outerRadius={80} data={topEventos}>
          <PolarGrid stroke="rgba(255,255,255,0.2)" />
          <PolarAngleAxis dataKey="categoria" />
          <Radar
            name="Eventos"
            dataKey="valor"
            stroke="hsl(var(--chart-1))"
            fill="hsl(var(--chart-1))"
            fillOpacity={0.6}
          />
          <Tooltip
            formatter={(value, name, props) => {
              return [`${value} (${props.payload.porcentaje}%)`, name];
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="text-primary h-6 w-6" /> 
            Analítica Avanzada
          </h2>
          <p className="text-muted-foreground">
            Análisis dimensional con datos del data warehouse
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={val => onTimeRangeChange && onTimeRangeChange(val)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
              <SelectItem value="6m">Últimos 6 meses</SelectItem>
              <SelectItem value="1y">Último año</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tarjetas de métricas clave */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Total de eventos
                </p>
                {isLoading ? 
                  <Skeleton className="h-8 w-16" /> : 
                  <p className="text-2xl font-bold">{totalEventos.toLocaleString()}</p>
                }
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${tendenciaEventos.tendencia === "up" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                <BarChart3 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              {tendenciaEventos.tendencia === "up" ? 
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" /> : 
                <TrendingUp className="h-3 w-3 text-red-500 mr-1 transform rotate-180" />
              }
              <span className={tendenciaEventos.tendencia === "up" ? "text-green-500" : "text-red-500"}>
                {tendenciaEventos.valor > 0 ? `+${tendenciaEventos.valor}%` : `${tendenciaEventos.valor}%`}
              </span>
              <span className="text-muted-foreground ml-1">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Leads generados
                </p>
                {isLoading ? 
                  <Skeleton className="h-8 w-16" /> : 
                  <p className="text-2xl font-bold">{totalLeads.toLocaleString()}</p>
                }
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${tendenciaLeads.tendencia === "up" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              {tendenciaLeads.tendencia === "up" ? 
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" /> : 
                <TrendingUp className="h-3 w-3 text-red-500 mr-1 transform rotate-180" />
              }
              <span className={tendenciaLeads.tendencia === "up" ? "text-green-500" : "text-red-500"}>
                {tendenciaLeads.valor > 0 ? `+${tendenciaLeads.valor}%` : `${tendenciaLeads.valor}%`}
              </span>
              <span className="text-muted-foreground ml-1">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Conversaciones
                </p>
                {isLoading ? 
                  <Skeleton className="h-8 w-16" /> : 
                  <p className="text-2xl font-bold">{totalConversaciones.toLocaleString()}</p>
                }
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${tendenciaConversaciones.tendencia === "up" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                <MessageSquare className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              {tendenciaConversaciones.tendencia === "up" ? 
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" /> : 
                <TrendingUp className="h-3 w-3 text-red-500 mr-1 transform rotate-180" />
              }
              <span className={tendenciaConversaciones.tendencia === "up" ? "text-green-500" : "text-red-500"}>
                {tendenciaConversaciones.valor > 0 ? `+${tendenciaConversaciones.valor}%` : `${tendenciaConversaciones.valor}%`}
              </span>
              <span className="text-muted-foreground ml-1">vs período anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico principal de evolución temporal */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-0 justify-between">
          <div>
            <CardTitle>Evolución Temporal</CardTitle>
            <CardDescription>Análisis de tendencias en el tiempo</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-md overflow-hidden border">
              <Button 
                variant={activeVisType === "linea" ? "default" : "ghost"} 
                size="sm" 
                onClick={() => setActiveVisType("linea")}
                className="h-8 px-2 rounded-none"
              >
                <LineChartIcon className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Línea</span>
              </Button>
              <Button 
                variant={activeVisType === "area" ? "default" : "ghost"} 
                size="sm" 
                onClick={() => setActiveVisType("area")}
                className="h-8 px-2 rounded-none"
              >
                <Waves className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Área</span>
              </Button>
              <Button 
                variant={activeVisType === "barras" ? "default" : "ghost"} 
                size="sm" 
                onClick={() => setActiveVisType("barras")}
                className="h-8 px-2 rounded-none"
              >
                <BarChartIcon className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Barras</span>
              </Button>
            </div>
            <Select
              value={selectedMetric}
              onValueChange={(val) => setSelectedMetric(val as any)}
            >
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eventos">Eventos</SelectItem>
                <SelectItem value="leads">Leads</SelectItem>
                <SelectItem value="conversaciones">Conversaciones</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {renderizarGraficoTemporal()}
        </CardContent>
      </Card>

      {/* Gráficos de distribución */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Distribución por canal */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Canal</CardTitle>
            <CardDescription>Eventos por canal de comunicación</CardDescription>
          </CardHeader>
          <CardContent>
            {renderizarGraficoDistribucion()}
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <PieChartIcon className="h-3.5 w-3.5" />
              <span>
                {rendimientoCanales[0]?.categoria || 'Sin datos'}: 
                {' '}{rendimientoCanales[0]?.porcentaje || 0}% del total
              </span>
            </div>
            <span>Total: {totalEventos.toLocaleString()} eventos</span>
          </CardFooter>
        </Card>

        {/* Rendimiento por chatbot */}
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento por Chatbot</CardTitle>
            <CardDescription>Interacciones por asistente virtual</CardDescription>
          </CardHeader>
          <CardContent>
            {renderizarGraficoChatbots()}
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <BotIcon className="h-3.5 w-3.5" />
              <span>
                {rendimientoChatbots[0]?.categoria || 'Sin datos'}: 
                {' '}{rendimientoChatbots[0]?.valor.toLocaleString() || 0} interacciones
              </span>
            </div>
          </CardFooter>
        </Card>

        {/* Tipos de eventos */}
        <Card>
          <CardHeader>
            <CardTitle>Tipos de Eventos</CardTitle>
            <CardDescription>Distribución por categoría de evento</CardDescription>
          </CardHeader>
          <CardContent>
            {renderizarGraficoEventos()}
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-1 text-xs text-muted-foreground">
            {tipoEventos.slice(0, 2).map((tipo, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tipo.color || `hsl(var(--chart-${idx + 1}))` }}></span>
                <span>{tipo.categoria}: {tipo.porcentaje}%</span>
              </div>
            ))}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// Importaciones para asegurar que los iconos están disponibles
import { Users, MessageSquare, BotIcon } from "lucide-react";