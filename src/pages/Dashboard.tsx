import { useState, useEffect, useMemo } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, addDays, startOfDay, endOfDay, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Download,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  MessageSquare,
  Timer,
  Clock,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface ConversacionesData {
  fecha: string;
  total_conversaciones: number;
  mensajes_por_conversacion: number;
  tiempo_respuesta_promedio_seg: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("conversaciones");
  
  // Estado para el panel de Conversaciones y mensajes
  const [conversacionesData, setConversacionesData] = useState<ConversacionesData[]>([]);
  const [isLoadingConversaciones, setIsLoadingConversaciones] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [predefinedRange, setPredefinedRange] = useState<string>("30d");
  const [chartView, setChartView] = useState<"barras" | "lineas">("barras");

  // Cargar datos de conversaciones
  useEffect(() => {
    const fetchConversacionesData = async () => {
      if (!user?.companyId) return;
      
      setIsLoadingConversaciones(true);
      
      try {
        let startDate: Date;
        let endDate: Date = new Date();
        
        if (dateRange.from && dateRange.to) {
          // Usar rango personalizado si está definido
          startDate = startOfDay(dateRange.from);
          endDate = endOfDay(dateRange.to || dateRange.from);
        } else {
          // Calcular rango basado en la selección predefinida
          switch (predefinedRange) {
            case "7d":
              startDate = subDays(new Date(), 7);
              break;
            case "14d":
              startDate = subDays(new Date(), 14);
              break;
            case "30d":
              startDate = subDays(new Date(), 30);
              break;
            case "90d":
              startDate = subDays(new Date(), 90);
              break;
            case "6m":
              startDate = subMonths(new Date(), 6);
              break;
            default:
              startDate = subDays(new Date(), 30);
          }
        }
        
        // Llamar a la función kpi_conversaciones_por_dia
        const { data, error } = await supabase.rpc('kpi_conversaciones_por_dia', {
          fecha_inicio: startDate.toISOString(),
          fecha_fin: endDate.toISOString()
        });
        
        if (error) {
          throw error;
        }
        
        // Formatear datos para el gráfico
        const formattedData = data.map(item => ({
          ...item,
          fecha: format(new Date(item.fecha), 'dd/MM/yy'),
          tiempo_respuesta_promedio_min: +(item.tiempo_respuesta_promedio_seg / 60).toFixed(1)
        }));
        
        setConversacionesData(formattedData);
      } catch (error) {
        console.error("Error al cargar datos de conversaciones:", error);
        toast.error("No se pudieron cargar los datos de conversaciones");
      } finally {
        setIsLoadingConversaciones(false);
      }
    };
    
    fetchConversacionesData();
  }, [user?.companyId, dateRange, predefinedRange]);

  // Calcular métricas generales
  const conversacionesMetricas = useMemo(() => {
    if (!conversacionesData || conversacionesData.length === 0) {
      return {
        totalConversaciones: 0,
        promedioMensajes: 0,
        tiempoRespuestaPromedio: 0
      };
    }
    
    const totalConversaciones = conversacionesData.reduce((sum, item) => sum + item.total_conversaciones, 0);
    const promedioMensajes = conversacionesData.reduce((sum, item) => sum + item.mensajes_por_conversacion, 0) / conversacionesData.length;
    const tiempoRespuestaPromedio = conversacionesData.reduce((sum, item) => sum + item.tiempo_respuesta_promedio_seg, 0) / conversacionesData.length;
    
    return {
      totalConversaciones,
      promedioMensajes: +promedioMensajes.toFixed(1),
      tiempoRespuestaPromedio: +(tiempoRespuestaPromedio / 60).toFixed(1) // Convertir a minutos
    };
  }, [conversacionesData]);

  // Calcular tendencias
  const conversacionesTendencias = useMemo(() => {
    if (!conversacionesData || conversacionesData.length < 2) {
      return {
        conversaciones: { value: 0, trend: "neutral" as "up" | "down" | "neutral" },
        mensajes: { value: 0, trend: "neutral" as "up" | "down" | "neutral" },
        tiempoRespuesta: { value: 0, trend: "neutral" as "up" | "down" | "neutral" }
      };
    }
    
    const mitad = Math.floor(conversacionesData.length / 2);
    const primeraData = conversacionesData.slice(0, mitad);
    const segundaData = conversacionesData.slice(mitad);
    
    // Calcular tendencia de conversaciones
    const primerPromedioConv = primeraData.reduce((acc, item) => acc + item.total_conversaciones, 0) / primeraData.length;
    const segundoPromedioConv = segundaData.reduce((acc, item) => acc + item.total_conversaciones, 0) / segundaData.length;
    const porcentajeCambioConv = primerPromedioConv === 0 ? 100 : ((segundoPromedioConv - primerPromedioConv) / primerPromedioConv) * 100;
    
    // Calcular tendencia de mensajes por conversación
    const primerPromedioMsg = primeraData.reduce((acc, item) => acc + item.mensajes_por_conversacion, 0) / primeraData.length;
    const segundoPromedioMsg = segundaData.reduce((acc, item) => acc + item.mensajes_por_conversacion, 0) / segundaData.length;
    const porcentajeCambioMsg = primerPromedioMsg === 0 ? 100 : ((segundoPromedioMsg - primerPromedioMsg) / primerPromedioMsg) * 100;
    
    // Calcular tendencia de tiempo de respuesta (aquí menos es mejor)
    const primerPromedioTiempo = primeraData.reduce((acc, item) => acc + item.tiempo_respuesta_promedio_seg, 0) / primeraData.length;
    const segundoPromedioTiempo = segundaData.reduce((acc, item) => acc + item.tiempo_respuesta_promedio_seg, 0) / segundaData.length;
    const porcentajeCambioTiempo = primerPromedioTiempo === 0 ? -100 : ((segundoPromedioTiempo - primerPromedioTiempo) / primerPromedioTiempo) * 100;
    // Para tiempo de respuesta, la tendencia es inversa (menos es mejor)
    const tiempoTrend = porcentajeCambioTiempo <= 0 ? "up" : "down";
    
    return {
      conversaciones: {
        value: Math.abs(Math.round(porcentajeCambioConv * 10) / 10),
        trend: porcentajeCambioConv >= 0 ? "up" : "down"
      },
      mensajes: {
        value: Math.abs(Math.round(porcentajeCambioMsg * 10) / 10),
        trend: porcentajeCambioMsg >= 0 ? "up" : "down"
      },
      tiempoRespuesta: {
        value: Math.abs(Math.round(porcentajeCambioTiempo * 10) / 10),
        trend: tiempoTrend
      }
    };
  }, [conversacionesData]);

  // Configuración del gráfico
  const chartConfig = {
    conversaciones: {
      label: "Conversaciones",
      color: "hsl(var(--chart-1))",
    },
    mensajes: {
      label: "Mensajes/Conversación",
      color: "hsl(var(--chart-2))",
    },
    tiempo: {
      label: "Tiempo Respuesta (min)",
      color: "hsl(var(--chart-3))",
    }
  } as ChartConfig;

  // Función para cambiar el rango predefinido
  const handlePredefinedRangeChange = (value: string) => {
    setPredefinedRange(value);
    
    // Si se selecciona un rango predefinido, limpiar el rango personalizado
    if (value !== "custom") {
      setDateRange({ from: undefined, to: undefined });
    }
  };

  // Función para manejar la selección de rango personalizado
  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (!range) return;
    
    setDateRange(range);
    setPredefinedRange("custom");
  };

  // Función para exportar datos
  const handleExportData = async () => {
    if (conversacionesData.length === 0) {
      toast.warning("No hay datos para exportar");
      return;
    }
    
    try {
      // Usar dynamic imports para cargar los módulos de exportación
      const XLSX = await import('xlsx');
      
      // Exportar datos a Excel
      const ws = XLSX.utils.json_to_sheet(conversacionesData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Conversaciones");
      
      // Escribir el archivo Excel
      XLSX.writeFile(wb, "conversaciones_dashboard.xlsx");
      
      toast.success("Datos exportados correctamente");
    } catch (error) {
      console.error("Error exportando datos:", error);
      toast.error("No se pudieron exportar los datos");
    }
  };

  // Renderizar el dashboard
  return (
    <div className="space-y-6 py-[14px] px-[21px]">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Análisis y métricas de tu plataforma
          </p>
        </div>
      </div>

      {/* Tabs para las diferentes secciones del dashboard */}
      <Tabs defaultValue="conversaciones" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="conversaciones" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Conversaciones y mensajes</span>
          </TabsTrigger>
          {/* Otras tabs se pueden añadir aquí en el futuro */}
        </TabsList>

        {/* Panel de Conversaciones y Mensajes */}
        <TabsContent value="conversaciones" className="space-y-4">
          {/* Barra de herramientas */}
          <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={predefinedRange} onValueChange={handlePredefinedRangeChange}>
                <SelectTrigger className="h-9 w-[180px] bg-background/50">
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 días</SelectItem>
                  <SelectItem value="14d">Últimos 14 días</SelectItem>
                  <SelectItem value="30d">Últimos 30 días</SelectItem>
                  <SelectItem value="90d">Últimos 90 días</SelectItem>
                  <SelectItem value="6m">Últimos 6 meses</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>

              {/* Selector de rango personalizado */}
              {predefinedRange === "custom" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-9 justify-start text-left font-normal",
                        !dateRange.from && !dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from && dateRange.to ? (
                        <>
                          {format(dateRange.from, "P", { locale: es })} - {" "}
                          {format(dateRange.to, "P", { locale: es })}
                        </>
                      ) : (
                        <span>Seleccionar fechas</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={dateRange}
                      onSelect={handleDateRangeChange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-md overflow-hidden border">
                <Button
                  variant={chartView === "barras" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none h-9"
                  onClick={() => setChartView("barras")}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={chartView === "lineas" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none h-9"
                  onClick={() => setChartView("lineas")}
                >
                  <LineChart className="h-4 w-4" />
                </Button>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 h-9"
                onClick={handleExportData}
              >
                <Download className="h-4 w-4" />
                <span>Exportar</span>
              </Button>
            </div>
          </div>

          {/* Tarjetas de KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Conversaciones
                    </p>
                    {isLoadingConversaciones ? 
                      <Skeleton className="h-8 w-16" /> : 
                      <p className="text-2xl font-bold">{conversacionesMetricas.totalConversaciones.toLocaleString()}</p>
                    }
                  </div>
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${conversacionesTendencias.conversaciones.trend === "up" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                    <MessageSquare className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs">
                  {conversacionesTendencias.conversaciones.trend === "up" ? 
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" /> : 
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                  }
                  <span className={conversacionesTendencias.conversaciones.trend === "up" ? "text-green-500" : "text-red-500"}>
                    {conversacionesTendencias.conversaciones.value}%
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
                      Mensajes por conversación
                    </p>
                    {isLoadingConversaciones ? 
                      <Skeleton className="h-8 w-16" /> : 
                      <p className="text-2xl font-bold">{conversacionesMetricas.promedioMensajes.toLocaleString()}</p>
                    }
                  </div>
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${conversacionesTendencias.mensajes.trend === "up" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs">
                  {conversacionesTendencias.mensajes.trend === "up" ? 
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" /> : 
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                  }
                  <span className={conversacionesTendencias.mensajes.trend === "up" ? "text-green-500" : "text-red-500"}>
                    {conversacionesTendencias.mensajes.value}%
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
                      Tiempo de respuesta
                    </p>
                    {isLoadingConversaciones ? 
                      <Skeleton className="h-8 w-16" /> : 
                      <p className="text-2xl font-bold">{conversacionesMetricas.tiempoRespuestaPromedio.toLocaleString()} min</p>
                    }
                  </div>
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${conversacionesTendencias.tiempoRespuesta.trend === "up" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs">
                  {conversacionesTendencias.tiempoRespuesta.trend === "up" ? 
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" /> : 
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                  }
                  <span className={conversacionesTendencias.tiempoRespuesta.trend === "up" ? "text-green-500" : "text-red-500"}>
                    {conversacionesTendencias.tiempoRespuesta.value}%
                  </span>
                  <span className="text-muted-foreground ml-1">vs período anterior</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico principal */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Evolución de conversaciones</CardTitle>
                <CardDescription>
                  {predefinedRange === "custom" && dateRange.from && dateRange.to ? 
                    `Desde el ${format(dateRange.from, "d 'de' MMMM", { locale: es })} hasta el ${format(dateRange.to, "d 'de' MMMM", { locale: es })}` : 
                    `Últimos ${predefinedRange === "7d" ? "7" : 
                              predefinedRange === "14d" ? "14" : 
                              predefinedRange === "30d" ? "30" : 
                              predefinedRange === "90d" ? "90" : 
                              "180"} días`
                  }
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoadingConversaciones ? (
                <div className="flex items-center justify-center h-[350px]">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    <p className="text-sm text-muted-foreground">Cargando datos...</p>
                  </div>
                </div>
              ) : conversacionesData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[350px]">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No hay datos para el período seleccionado</p>
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-[350px]">
                  {chartView === "barras" ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={conversacionesData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="fecha"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                        />
                        <YAxis 
                          yAxisId="left"
                          axisLine={false}
                          tickLine={false}
                          tickMargin={8}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          axisLine={false}
                          tickLine={false}
                          tickMargin={8}
                        />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar
                          yAxisId="left"
                          dataKey="total_conversaciones"
                          name="Conversaciones"
                          fill="hsl(var(--chart-1))"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="mensajes_por_conversacion"
                          name="Mensajes/Conv"
                          fill="hsl(var(--chart-2))"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          yAxisId="right"
                          dataKey="tiempo_respuesta_promedio_min"
                          name="Tiempo Resp (min)"
                          fill="hsl(var(--chart-3))"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={conversacionesData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="fecha"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                        />
                        <YAxis 
                          yAxisId="left"
                          axisLine={false}
                          tickLine={false}
                          tickMargin={8}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          axisLine={false}
                          tickLine={false}
                          tickMargin={8}
                        />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="total_conversaciones"
                          name="Conversaciones"
                          stroke="hsl(var(--chart-1))"
                          strokeWidth={2}
                          dot={true}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="mensajes_por_conversacion"
                          name="Mensajes/Conv"
                          stroke="hsl(var(--chart-2))"
                          strokeWidth={2}
                          dot={true}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="tiempo_respuesta_promedio_min"
                          name="Tiempo Resp (min)"
                          stroke="hsl(var(--chart-3))"
                          strokeWidth={2}
                          dot={true}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Tabla de datos */}
          <Card>
            <CardHeader>
              <CardTitle>Datos detallados</CardTitle>
              <CardDescription>
                Métricas diarias de conversaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="overflow-auto max-h-[400px]">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="p-2 text-left font-medium">Fecha</th>
                        <th className="p-2 text-left font-medium">Conversaciones</th>
                        <th className="p-2 text-left font-medium">Mensajes/Conversación</th>
                        <th className="p-2 text-left font-medium">Tiempo Respuesta (min)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingConversaciones ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                              <span className="text-sm text-muted-foreground">Cargando datos...</span>
                            </div>
                          </td>
                        </tr>
                      ) : conversacionesData.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center">
                            <span className="text-sm text-muted-foreground">No hay datos para el período seleccionado</span>
                          </td>
                        </tr>
                      ) : (
                        conversacionesData.map((item, index) => (
                          <tr key={index} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                            <td className="p-2">{item.fecha}</td>
                            <td className="p-2">{item.total_conversaciones}</td>
                            <td className="p-2">{item.mensajes_por_conversacion.toFixed(1)}</td>
                            <td className="p-2">{(item.tiempo_respuesta_promedio_seg / 60).toFixed(1)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;