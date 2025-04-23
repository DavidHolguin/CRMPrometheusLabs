import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, ChevronDown, Download, FileBarChart, Filter, PieChart, Activity, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useMarketingData, EventoAccion, TipoEvento, EventosSummary, EventosPorDia, MarketingFilterParams } from "@/hooks/useMarketingData";

// Datos de ejemplo - En producción estos vendrían de una API
const visitasData = [
  { fecha: "2025-04-01", visitas: 120, leads: 22, clics: 45 },
  { fecha: "2025-04-02", visitas: 132, leads: 25, clics: 52 },
  { fecha: "2025-04-03", visitas: 145, leads: 28, clics: 58 },
  { fecha: "2025-04-04", visitas: 155, leads: 30, clics: 63 },
  { fecha: "2025-04-05", visitas: 148, leads: 29, clics: 60 },
  { fecha: "2025-04-06", visitas: 138, leads: 26, clics: 55 },
  { fecha: "2025-04-07", visitas: 142, leads: 27, clics: 57 },
  { fecha: "2025-04-08", visitas: 150, leads: 29, clics: 61 },
  { fecha: "2025-04-09", visitas: 160, leads: 32, clics: 65 },
  { fecha: "2025-04-10", visitas: 168, leads: 33, clics: 68 },
  { fecha: "2025-04-11", visitas: 172, leads: 34, clics: 70 },
  { fecha: "2025-04-12", visitas: 180, leads: 36, clics: 74 },
  { fecha: "2025-04-13", visitas: 190, leads: 38, clics: 78 },
  { fecha: "2025-04-14", visitas: 195, leads: 39, clics: 80 },
];

const campaniasData = [
  { nombre: "Promoción Primavera", impresiones: 15600, clics: 780, leads: 195, conversion: 25.0, ctr: 5.0 },
  { nombre: "Webinar Producto", impresiones: 8900, clics: 534, leads: 128, conversion: 24.0, ctr: 6.0 },
  { nombre: "Descuento Especial", impresiones: 12300, clics: 690, leads: 165, conversion: 23.9, ctr: 5.6 },
  { nombre: "Email Marketing", impresiones: 25000, clics: 1250, leads: 275, conversion: 22.0, ctr: 5.0 },
  { nombre: "Redes Sociales", impresiones: 35000, clics: 1750, leads: 385, conversion: 22.0, ctr: 5.0 },
];

const fuentesTraficoData = [
  { fuente: "Google", visitas: 4500, porcentaje: 45 },
  { fuente: "Redes Sociales", visitas: 2800, porcentaje: 28 },
  { fuente: "Email", visitas: 1700, porcentaje: 17 },
  { fuente: "Directo", visitas: 1000, porcentaje: 10 },
];

const MarketingAnalytics = () => {
  const { user } = useAuth();
  const {
    isLoading, 
    error,
    tiposEventos,
    eventosAcciones,
    loadTiposEventos,
    loadEventosAcciones,
    getEventosSummary,
    getEventosPorDia
  } = useMarketingData();

  const [estados, setEstados] = useState({
    loadingEventos: false,
    errorEventos: null as string | null
  });

  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  
  // Estado para filtros
  const [periodoFiltro, setPeriodoFiltro] = useState("ultimos30dias");
  const [tipoEventoFiltro, setTipoEventoFiltro] = useState("todos");
  
  // Función para formatear números con separadores de miles
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  // Función para cambiar el filtro de período
  const handlePeriodoChange = (value: string) => {
    setPeriodoFiltro(value);
    
    const now = new Date();
    let from: Date | undefined;
    let to: Date | undefined = now;
    
    switch (value) {
      case "hoy":
        from = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "ayer":
        from = subDays(new Date(now.setHours(0, 0, 0, 0)), 1);
        to = new Date(from.getTime());
        to.setHours(23, 59, 59, 999);
        break;
      case "ultimos7dias":
        from = subDays(now, 7);
        break;
      case "ultimos14dias":
        from = subDays(now, 14);
        break;
      case "ultimos30dias":
        from = subDays(now, 30);
        break;
      case "estemés":
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case "mesanterior":
        from = startOfMonth(subMonths(now, 1));
        to = endOfMonth(subMonths(now, 1));
        break;
      default:
        // Mantener el rango personalizado
        break;
    }
    
    setDateRange({ from, to });
    
    // Cargar eventos con el nuevo filtro de fecha
    if (from && to) {
      const params: MarketingFilterParams = {
        fechaInicio: from.toISOString(),
        fechaFin: to.toISOString(),
        tipo: tipoEventoFiltro !== "todos" ? tipoEventoFiltro : undefined
      };
      
      loadEventosAcciones(params);
    }
  };

  // Función para restablecer filtros
  const resetFilters = () => {
    setPeriodoFiltro("ultimos30dias");
    setTipoEventoFiltro("todos");
    setDateRange({
      from: subDays(new Date(), 30),
      to: new Date(),
    });
    
    // Cargar todos los eventos de los últimos 30 días
    const params: MarketingFilterParams = {
      fechaInicio: subDays(new Date(), 30).toISOString(),
      fechaFin: new Date().toISOString()
    };
    
    loadEventosAcciones(params);
  };

  // Efecto para cargar los datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      setEstados(prev => ({ ...prev, loadingEventos: true }));
      
      try {
        // Cargar tipos de eventos
        await loadTiposEventos();
        
        // Cargar eventos de los últimos 30 días
        const params: MarketingFilterParams = {
          fechaInicio: dateRange.from?.toISOString(),
          fechaFin: dateRange.to?.toISOString()
        };
        
        await loadEventosAcciones(params);
      } catch (err: any) {
        setEstados(prev => ({ 
          ...prev, 
          errorEventos: err.message || "Error al cargar datos de eventos" 
        }));
      } finally {
        setEstados(prev => ({ ...prev, loadingEventos: false }));
      }
    };
    
    fetchInitialData();
  }, []);

  // Calcular métricas totales
  const calcularTotales = () => {
    const totalVisitas = visitasData.reduce((acc, curr) => acc + curr.visitas, 0);
    const totalClics = visitasData.reduce((acc, curr) => acc + curr.clics, 0);
    const totalLeads = visitasData.reduce((acc, curr) => acc + curr.leads, 0);
    const ctr = totalVisitas > 0 ? (totalClics / totalVisitas) * 100 : 0;
    
    return { totalVisitas, totalClics, totalLeads, ctr };
  };

  const { totalVisitas, totalClics, totalLeads, ctr } = calcularTotales();

  // Preparar los datos para los gráficos de eventos
  const prepararDatosEventos = () => {
    // Resumen de eventos por categoría para el gráfico de torta
    const resumenEventos = getEventosSummary();
    
    // Eventos por día para el gráfico de líneas
    const eventosPorDia = getEventosPorDia();
    
    // Convertir el formato de los eventos por día para facilitar su uso en gráficos
    const eventosPorDiaFormateado = eventosPorDia.map(item => {
      const formattedDate = format(new Date(item.fecha), 'dd MMM', { locale: es });
      return {
        fecha: formattedDate,
        total: item.total,
        ...item.por_categoria
      };
    });
    
    return {
      resumenEventos,
      eventosPorDiaFormateado
    };
  };

  const { resumenEventos, eventosPorDiaFormateado } = prepararDatosEventos();

  // Colores para los gráficos de eventos
  const COLORES_CATEGORIAS = [
    "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe", 
    "#00C49F", "#FFBB28", "#FF8042", "#a4de6c", "#d0ed57"
  ];
  
  // Calcular estadísticas de eventos
  const eventosStats = {
    total: eventosAcciones.length,
    totalCategorias: resumenEventos.length,
    promedioEventosPorDia: eventosPorDiaFormateado.length > 0 
      ? Math.round(eventosAcciones.length / eventosPorDiaFormateado.length) 
      : 0,
    maxEventosEnUnDia: eventosPorDiaFormateado.length > 0
      ? Math.max(...eventosPorDiaFormateado.map(item => item.total))
      : 0
  };

  // Cambiar el formato de las fechas para el gráfico
  const formattedChartData = visitasData.map(item => ({
    ...item,
    fecha: format(new Date(item.fecha), 'dd MMM', { locale: es })
  }));

  return (
    <div className="space-y-6 py-[14px] px-[21px]">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analíticas de Marketing</h1>
          <p className="text-muted-foreground">
            Métricas y análisis de campañas, tráfico y conversiones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-accent/40 p-3 rounded-lg">
        <div className="flex items-center">
          <Filter className="h-4 w-4 mr-2" />
          <span className="font-medium text-sm">Filtrar por:</span>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Select value={periodoFiltro} onValueChange={handlePeriodoChange}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoy">Hoy</SelectItem>
              <SelectItem value="ayer">Ayer</SelectItem>
              <SelectItem value="ultimos7dias">Últimos 7 días</SelectItem>
              <SelectItem value="ultimos14dias">Últimos 14 días</SelectItem>
              <SelectItem value="ultimos30dias">Últimos 30 días</SelectItem>
              <SelectItem value="estemés">Este mes</SelectItem>
              <SelectItem value="mesanterior">Mes anterior</SelectItem>
              <SelectItem value="personalizado">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {periodoFiltro === "personalizado" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-9 gap-2">
                  <Calendar className="h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy")
                    )
                  ) : (
                    "Seleccionar fechas"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range) {
                      const newRange = {
                        from: range.from,
                        to: range.to || range.from
                      };
                      setDateRange(newRange);
                      
                      // Si hay un rango completo, cargar datos
                      if (range.from && (range.to || range.from)) {
                        const params: MarketingFilterParams = {
                          fechaInicio: range.from.toISOString(),
                          fechaFin: (range.to || range.from).toISOString(),
                          tipo: tipoEventoFiltro !== "todos" ? tipoEventoFiltro : undefined
                        };
                        
                        loadEventosAcciones(params);
                      }
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}

          {/* Añadir filtro de tipo de evento */}
          <Select value={tipoEventoFiltro} onValueChange={(value) => {
            setTipoEventoFiltro(value);
            
            const params: MarketingFilterParams = {
              fechaInicio: dateRange.from?.toISOString(),
              fechaFin: dateRange.to?.toISOString(),
              tipo: value !== "todos" ? value : undefined
            };
            
            loadEventosAcciones(params);
          }}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Tipo de evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los eventos</SelectItem>
              {tiposEventos.map((tipo) => (
                <SelectItem key={tipo.tipo_evento_id} value={tipo.tipo_evento_id}>
                  {tipo.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="ghost" size="sm" className="h-9" onClick={resetFilters}>
            <span>Restablecer</span>
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Visitas
                </p>
                {isLoading ? 
                  <Skeleton className="h-8 w-16" /> : 
                  <p className="text-2xl font-bold">{formatNumber(totalVisitas)}</p>
                }
              </div>
              <div className="h-10 w-10 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-500">
                <FileBarChart className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <span className="text-green-500">+8.5%</span>
              <span className="text-muted-foreground ml-1">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Clics
                </p>
                {isLoading ? 
                  <Skeleton className="h-8 w-16" /> : 
                  <p className="text-2xl font-bold">{formatNumber(totalClics)}</p>
                }
              </div>
              <div className="h-10 w-10 rounded-full flex items-center justify-center bg-purple-500/10 text-purple-500">
                <FileBarChart className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <span className="text-green-500">+6.2%</span>
              <span className="text-muted-foreground ml-1">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  CTR
                </p>
                {isLoading ? 
                  <Skeleton className="h-8 w-16" /> : 
                  <p className="text-2xl font-bold">{ctr.toFixed(2)}%</p>
                }
              </div>
              <div className="h-10 w-10 rounded-full flex items-center justify-center bg-green-500/10 text-green-500">
                <FileBarChart className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <span className="text-red-500">-1.8%</span>
              <span className="text-muted-foreground ml-1">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Leads
                </p>
                {isLoading ? 
                  <Skeleton className="h-8 w-16" /> : 
                  <p className="text-2xl font-bold">{formatNumber(totalLeads)}</p>
                }
              </div>
              <div className="h-10 w-10 rounded-full flex items-center justify-center bg-orange-500/10 text-orange-500">
                <FileBarChart className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <span className="text-green-500">+9.5%</span>
              <span className="text-muted-foreground ml-1">vs período anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para diferentes análisis */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="campaigns">Campañas</TabsTrigger>
          <TabsTrigger value="content">Contenido</TabsTrigger>
          <TabsTrigger value="eventos">Eventos</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          {/* Gráfico de tendencia */}
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de visitas y conversiones</CardTitle>
              <CardDescription>
                Evolución de visitas, clics y leads en el período seleccionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={formattedChartData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="fecha" 
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        width={40}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          return [formatNumber(value as number), 
                                name === "visitas" ? "Visitas" : 
                                name === "clics" ? "Clics" : "Leads"];
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="visitas" name="Visitas" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="clics" name="Clics" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="leads" name="Leads" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tablas de fuentes de tráfico */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Fuentes de tráfico</CardTitle>
                <CardDescription>
                  De dónde provienen las visitas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium">Fuente</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Visitas</th>
                        <th className="h-12 px-4 text-right align-middle font-medium">Porcentaje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fuentesTraficoData.map((fuente, idx) => (
                        <tr key={idx} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle">{fuente.fuente}</td>
                          <td className="p-4 align-middle">{formatNumber(fuente.visitas)}</td>
                          <td className="p-4 align-middle text-right">{fuente.porcentaje}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Distribución geográfica</CardTitle>
                <CardDescription>
                  Visitas por ubicación
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Datos no disponibles en esta versión</p>
                  <Badge variant="outline" className="mt-2">Próximamente</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento de campañas</CardTitle>
              <CardDescription>
                Análisis detallado por campaña
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium">Campaña</th>
                      <th className="h-12 px-4 text-right align-middle font-medium">Impresiones</th>
                      <th className="h-12 px-4 text-right align-middle font-medium">Clics</th>
                      <th className="h-12 px-4 text-right align-middle font-medium">CTR</th>
                      <th className="h-12 px-4 text-right align-middle font-medium">Leads</th>
                      <th className="h-12 px-4 text-right align-middle font-medium">Conversión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaniasData.map((campania, idx) => (
                      <tr key={idx} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle font-medium">{campania.nombre}</td>
                        <td className="p-4 align-middle text-right">{formatNumber(campania.impresiones)}</td>
                        <td className="p-4 align-middle text-right">{formatNumber(campania.clics)}</td>
                        <td className="p-4 align-middle text-right">{campania.ctr.toFixed(1)}%</td>
                        <td className="p-4 align-middle text-right">{formatNumber(campania.leads)}</td>
                        <td className="p-4 align-middle text-right">{campania.conversion.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Comparativa de CTR</CardTitle>
                <CardDescription>
                  Tasa de clics por campaña
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={campaniasData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis 
                        type="number"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        dataKey="nombre"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        width={150}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="ctr" name="CTR (%)" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Comparativa de Conversión</CardTitle>
                <CardDescription>
                  Tasa de conversión por campaña
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={campaniasData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis 
                        type="number"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        dataKey="nombre"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        width={150}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="conversion" name="Conversión (%)" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de contenido</CardTitle>
              <CardDescription>
                Rendimiento por tipo de contenido
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Datos no disponibles en esta versión</p>
                <Badge variant="outline" className="mt-2">Próximamente</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NUEVA PESTAÑA DE EVENTOS */}
        <TabsContent value="eventos" className="space-y-4">
          {/* Métricas de eventos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Eventos
                    </p>
                    {estados.loadingEventos ? 
                      <Skeleton className="h-8 w-16" /> : 
                      <p className="text-2xl font-bold">{formatNumber(eventosStats.total)}</p>
                    }
                  </div>
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-500">
                    <Activity className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs">
                  <span className="text-muted-foreground">En el período seleccionado</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Categorías
                    </p>
                    {estados.loadingEventos ? 
                      <Skeleton className="h-8 w-16" /> : 
                      <p className="text-2xl font-bold">{eventosStats.totalCategorias}</p>
                    }
                  </div>
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-purple-500/10 text-purple-500">
                    <PieChart className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs">
                  <span className="text-muted-foreground">Tipos de eventos distintos</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Promedio diario
                    </p>
                    {estados.loadingEventos ? 
                      <Skeleton className="h-8 w-16" /> : 
                      <p className="text-2xl font-bold">{eventosStats.promedioEventosPorDia}</p>
                    }
                  </div>
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-green-500/10 text-green-500">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs">
                  <span className="text-muted-foreground">Eventos por día</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Máx. por día
                    </p>
                    {estados.loadingEventos ? 
                      <Skeleton className="h-8 w-16" /> : 
                      <p className="text-2xl font-bold">{eventosStats.maxEventosEnUnDia}</p>
                    }
                  </div>
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-orange-500/10 text-orange-500">
                    <Activity className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs">
                  <span className="text-muted-foreground">Pico de actividad</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de tendencia de eventos */}
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de eventos en el tiempo</CardTitle>
              <CardDescription>
                Evolución de la cantidad de eventos por día en el período seleccionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                {estados.loadingEventos ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : eventosPorDiaFormateado.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={eventosPorDiaFormateado}
                      margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="fecha" 
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        width={40}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'total') return [formatNumber(value as number), 'Total eventos'];
                          return [formatNumber(value as number), name];
                        }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="total" 
                        name="Total eventos" 
                        stroke="hsl(var(--chart-1))" 
                        fill="hsl(var(--chart-1))" 
                        fillOpacity={0.2} 
                        stackId="1"
                      />
                      {resumenEventos.map((categoria, index) => {
                        if (eventosPorDiaFormateado[0] && eventosPorDiaFormateado[0][categoria.categoria]) {
                          return (
                            <Area
                              key={index}
                              type="monotone"
                              dataKey={categoria.categoria}
                              name={categoria.categoria}
                              stroke={COLORES_CATEGORIAS[index % COLORES_CATEGORIAS.length]}
                              fill={COLORES_CATEGORIAS[index % COLORES_CATEGORIAS.length]}
                              fillOpacity={0.2}
                            />
                          );
                        }
                        return null;
                      })}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No hay datos de eventos para mostrar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Gráficos de distribución por categoría */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por categoría</CardTitle>
                <CardDescription>
                  Porcentaje de eventos por categoría
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {estados.loadingEventos ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : resumenEventos.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={resumenEventos}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="total"
                          nameKey="categoria"
                          label={({ categoria, porcentaje }) => `${categoria}: ${porcentaje}%`}
                        >
                          {resumenEventos.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORES_CATEGORIAS[index % COLORES_CATEGORIAS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => {
                            const porcentaje = props.payload.porcentaje;
                            return [`${formatNumber(value as number)} (${porcentaje}%)`, props.payload.categoria];
                          }}
                        />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No hay datos para mostrar</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Eventos por tipo</CardTitle>
                <CardDescription>
                  Cantidad de eventos por categoría
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {estados.loadingEventos ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : resumenEventos.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={resumenEventos}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" axisLine={false} tickLine={false} />
                        <YAxis 
                          type="category" 
                          dataKey="categoria" 
                          width={150}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip formatter={(value) => [formatNumber(value as number), 'Eventos']} />
                        <Legend />
                        <Bar 
                          dataKey="total" 
                          name="Total eventos" 
                          fill="hsl(var(--chart-1))"
                          radius={[0, 4, 4, 0]} 
                        >
                          {resumenEventos.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORES_CATEGORIAS[index % COLORES_CATEGORIAS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No hay datos para mostrar</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de eventos */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle de eventos</CardTitle>
              <CardDescription>
                Lista completa de eventos registrados en el período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium">Fecha</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Categoría</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Tipo de evento</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Score</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estados.loadingEventos ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          </div>
                        </td>
                      </tr>
                    ) : eventosAcciones.length > 0 ? (
                      eventosAcciones.slice(0, 10).map((evento, idx) => (
                        <tr key={idx} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle">
                            {new Date(evento.created_at).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="p-4 align-middle">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {evento.categoria_tipo_evento || 'Desconocido'}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle">{evento.nombre_tipo_evento || 'Desconocido'}</td>
                          <td className="p-4 align-middle">{evento.valor_score || 0}</td>
                          <td className="p-4 align-middle">
                            {evento.resultado ? (
                              <Badge variant={evento.resultado === "success" ? "success" : "secondary"}>
                                {evento.resultado}
                              </Badge>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-muted-foreground">
                          No hay eventos para mostrar en el período seleccionado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {eventosAcciones.length > 10 && (
                <div className="flex justify-center mt-4">
                  <Button variant="outline">Ver todos los eventos ({eventosAcciones.length})</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketingAnalytics;