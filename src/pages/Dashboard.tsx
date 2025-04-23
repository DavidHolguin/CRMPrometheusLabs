import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import {
  Bar, BarChart, LineChart, Line, ResponsiveContainer, XAxis, YAxis, 
  CartesianGrid, Legend, Tooltip as RechartsTooltip, 
  PieChart, Pie, Area, AreaChart, Label, RadarChart, PolarGrid, PolarAngleAxis, Radar, Cell
} from "recharts";
import { 
  Users, MessageSquare, BotIcon, TrendingUp, ArrowUpRight, 
  ArrowDownRight, Info, BarChart3, BarChart4, ChevronDown,
  Brain, AlertTriangle, CheckCircle, ThumbsUp, LineChart as LineChartIcon,
  PieChart as PieChartIcon, BarChart as BarChartIcon, Download,
  Waves, LayoutDashboard, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  useGranularData, 
  useDimensionalData, 
  useLeadsByChannelData 
} from "@/hooks/useDashboardData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { format as formatDate, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, subDays, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { 
  DashboardToolbar, 
  FilterOptions, 
  ChartVisibility, 
  TimeRange, 
  DateRange, 
  GroupByTime 
} from "@/components/dashboard/DashboardToolbar";
import { AnalyticsPanel } from "@/components/dashboard/AnalyticsPanel";
import React from "react";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [groupBy, setGroupBy] = useState<GroupByTime>("dia");
  const [includeHours, setIncludeHours] = useState<boolean>(false);
  const [hourRange, setHourRange] = useState<{start: number, end: number}>({ start: 0, end: 23 });
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [channelOptions, setChannelOptions] = useState<Array<{value: string, label: string}>>([]);
  const [chartVisibility, setChartVisibility] = useState<ChartVisibility>({
    activityChart: true,
    evolutionChart: true,
    monthlyComparison: true,
    distributionChart: true
  });
  
  // Consulta el tiempo real según filtros seleccionados
  const {
    data: granularData,
    isLoading: isLoadingGranularData,
    error: granularDataError
  } = useGranularData(
    timeRange,
    dateRange,
    groupBy,
    includeHours,
    hourRange,
    selectedChannels
  );
  
  // Para los datos dimensionales/analíticos
  const {
    data: dimensionalData,
    isLoading: isLoadingDimensionalData
  } = useDimensionalData(timeRange);
  
  // Para los datos de distribución por canal
  const {
    data: channelData,
    isLoading: isLoadingChannelData,
    error: channelError
  } = useLeadsByChannelData();

  // Obtener canales disponibles para filtros
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const { data, error } = await supabase
          .from('canales')
          .select('id, nombre')
          .not('nombre', 'is', null)
          .eq('is_active', true);
        
        if (error) throw error;
        
        // Formatear para el selector
        const options = data.map(channel => ({
          value: channel.id,
          label: channel.nombre
        }));
        
        setChannelOptions(options);
      } catch (error) {
        console.error('Error obteniendo canales:', error);
      }
    };
    
    fetchChannels();
  }, [user?.companyId]);

  // Función para manejar cambios en los filtros
  const handleFilterChange = (filters: FilterOptions) => {
    if (filters.timeRange) {
      setTimeRange(filters.timeRange);
    }
    
    if (filters.dateRange) {
      setDateRange(filters.dateRange);
    }

    if (filters.groupBy) {
      setGroupBy(filters.groupBy);
    }
    
    if (filters.channels) {
      setSelectedChannels(filters.channels);
    }

    if (filters.includeHours !== undefined) {
      setIncludeHours(filters.includeHours);
    }

    if (filters.hourRange) {
      setHourRange(filters.hourRange);
    }
  };
  
  // Función para manejar cambios en la visibilidad de los gráficos
  const handleChartVisibilityChange = (visibility: ChartVisibility) => {
    setChartVisibility(visibility);
  };
  
  // Formatear los datos para los gráficos
  const formattedGranularData = useMemo(() => {
    if (!granularData || granularData.length === 0) return [];
    
    return granularData.map(item => {
      // Formatear el período según el tipo de agrupación
      let formattedPeriod = item.periodo;
      
      if (groupBy === "hora") {
        // Si es por hora, mostrar hora en formato 12h
        const date = new Date(item.fecha_hora);
        const hour = date.getHours();
        const amPm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        formattedPeriod = `${hour12}${amPm}`;
      } else if (groupBy === "dia") {
        // Si es por día, formato corto de fecha
        const date = new Date(item.fecha_hora);
        formattedPeriod = formatDate(date, 'dd/MM', { locale: es });
      } else if (groupBy === "semana") {
        // Si es por semana, mostrar semana del año
        formattedPeriod = item.periodo;
      } else if (groupBy === "mes") {
        // Si es por mes, mostrar mes abreviado
        const [year, month] = item.periodo.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        formattedPeriod = formatDate(date, 'MMM yy', { locale: es });
      }
      
      return {
        periodo: formattedPeriod,
        fecha_hora: item.fecha_hora,
        eventos: item.total_eventos,
        leads: item.total_leads,
        conversaciones: item.total_conversaciones,
        score: item.score_promedio
      };
    });
  }, [granularData, groupBy]);

  // Preparar datos para gráfico de distribución
  const channelDistributionData = useMemo(() => {
    if (!channelData || channelData.length === 0) {
      return [{
        browser: "Sin datos",
        visitors: 100,
        fill: "var(--color-other)"
      }];
    }
    
    // Colores para los diferentes canales
    const channelColors: Record<string, string> = {
      "WhatsApp": "var(--color-chrome)",
      "Web": "var(--color-safari)",
      "Facebook": "var(--color-firefox)",
      "Instagram": "var(--color-edge)",
      "Telegram": "var(--color-opera)",
      "Desconocido": "var(--color-other)"
    };
    
    // Mapear datos de canal a la estructura del gráfico de pie
    return channelData.map((item) => {
      // Determinar el color basado en el nombre del canal o usar un color por defecto
      const color = channelColors[item.name] || "var(--color-other)";
      
      return {
        browser: item.name,
        visitors: item.value || 0,
        fill: color
      };
    });
  }, [channelData]);

  // Configuración para el gráfico moderno
  const chartConfig = {
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
    score: {
      label: "Score Promedio",
      color: "hsl(var(--chart-4))",
    }
  } as ChartConfig;

  // Configuración para gráficos de pie
  const pieChartConfig = {
    visitors: {
      label: "Distribución",
    },
    chrome: {
      label: "WhatsApp",
      color: "hsl(var(--chart-1))",
    },
    safari: {
      label: "Web",
      color: "hsl(var(--chart-2))",
    },
    firefox: {
      label: "Facebook",
      color: "hsl(var(--chart-3))",
    },
    edge: {
      label: "Instagram",
      color: "hsl(var(--chart-4))",
    },
    opera: {
      label: "Telegram",
      color: "hsl(var(--chart-5))",
    },
    other: {
      label: "Otros",
      color: "hsl(var(--chart-6), var(--chart-1)))",
    },
  } as ChartConfig;

  // Totals for data metrics
  const totals = useMemo(() => {
    if (!granularData || granularData.length === 0) {
      return { eventos: 0, leads: 0, conversaciones: 0, score: 0 };
    }
    
    return {
      eventos: granularData.reduce((acc, item) => acc + item.total_eventos, 0),
      leads: granularData.reduce((acc, item) => acc + item.total_leads, 0),
      conversaciones: granularData.reduce((acc, item) => acc + item.total_conversaciones, 0),
      score: granularData.length > 0 
        ? Math.round(granularData.reduce((acc, item) => acc + item.score_promedio, 0) / granularData.length) 
        : 0
    };
  }, [granularData]);

  // Calcular tendencias
  const trends = useMemo(() => {
    if (!granularData || granularData.length < 2) {
      return {
        eventos: { value: 0, trend: "neutral" as "up" | "down" | "neutral" },
        leads: { value: 0, trend: "neutral" as "up" | "down" | "neutral" },
        conversaciones: { value: 0, trend: "neutral" as "up" | "down" | "neutral" },
        score: { value: 0, trend: "neutral" as "up" | "down" | "neutral" }
      };
    }
    
    const mitad = Math.floor(granularData.length / 2);
    const primeraData = granularData.slice(0, mitad);
    const segundaData = granularData.slice(mitad);
    
    // Función para calcular tendencia
    const calcularTendencia = (key: string) => {
      const primerPromedio = primeraData.reduce((acc, item) => acc + item[key], 0) / primeraData.length;
      const segundoPromedio = segundaData.reduce((acc, item) => acc + item[key], 0) / segundaData.length;
      
      if (primerPromedio === 0) return { value: 100, trend: "up" as "up" | "down" | "neutral" };
      
      const porcentajeCambio = ((segundoPromedio - primerPromedio) / primerPromedio) * 100;
      const trend = porcentajeCambio >= 0 ? "up" : "down";
      
      return {
        value: Math.abs(Math.round(porcentajeCambio * 10) / 10),
        trend
      };
    };
    
    return {
      eventos: calcularTendencia("total_eventos"),
      leads: calcularTendencia("total_leads"),
      conversaciones: calcularTendencia("total_conversaciones"),
      score: calcularTendencia("score_promedio")
    };
  }, [granularData]);

  // Función para obtener un título descriptivo según los filtros actuales
  const getDashboardTitle = () => {
    if (timeRange === "today") {
      return "Dashboard - Datos de hoy";
    } else if (timeRange === "yesterday") {
      return "Dashboard - Datos de ayer";
    } else if (timeRange === "7d") {
      return "Dashboard - Últimos 7 días";
    } else if (timeRange === "30d") {
      return "Dashboard - Últimos 30 días";
    } else if (timeRange === "90d") {
      return "Dashboard - Últimos 3 meses";
    } else if (timeRange === "6m") {
      return "Dashboard - Últimos 6 meses";
    } else if (timeRange === "1y") {
      return "Dashboard - Último año";
    } else if (timeRange === "custom" && dateRange.from && dateRange.to) {
      return `Dashboard - Del ${formatDate(dateRange.from, 'PP', { locale: es })} al ${formatDate(dateRange.to, 'PP', { locale: es })}`;
    } else {
      return "Dashboard";
    }
  };

  // Función para exportar datos
  const handleExportData = async () => {
    if (!user?.companyId) {
      toast({
        title: "Error",
        description: "No se puede exportar datos sin identificación de empresa",
        variant: "destructive"
      });
      return;
    }
    
    setExportLoading(true);
    
    try {
      // Preparar los datos para exportar
      const exportData = {
        generadoEl: new Date().toISOString(),
        usuario: user.email || "usuario@prometeo.com",
        empresa: user.companyId,
        filtros: {
          periodo: timeRange,
          canales: selectedChannels.length > 0 ? selectedChannels : "Todos",
          agrupadoPor: groupBy,
          incluirHoras: includeHours,
          rangoHoras: includeHours ? hourRange : null
        },
        estadisticas: {
          totalEventos: totals.eventos,
          totalLeads: totals.leads,
          totalConversaciones: totals.conversaciones,
          scorePromedio: totals.score
        },
        datosGranulares: granularData,
        datosAnaliticos: {
          tipoEventos: dimensionalData?.tipoEventos || [],
          distribucionCanales: dimensionalData?.rendimientoCanales || [],
          rendimientoChatbots: dimensionalData?.rendimientoChatbots || []
        }
      };

      // Usar dynamic imports para cargar los módulos de exportación
      const jsPDF = await import('jspdf');
      // Importar xlsx con su nombre completo para evitar problemas
      const XLSX = await import('xlsx');
      
      // Crear documento PDF
      const pdf = new jsPDF.default();
      
      // Añadir título y fecha
      pdf.setFontSize(22);
      pdf.text("Dashboard Prometeo CRM", 20, 20);
      
      pdf.setFontSize(12);
      pdf.text(`Informe generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, 20, 30);
      pdf.text(`Usuario: ${user.email || "No disponible"}`, 20, 40);
      
      // Añadir estadísticas principales
      pdf.setFontSize(16);
      pdf.text("Estadísticas Principales", 20, 55);
      
      pdf.setFontSize(12);
      pdf.text(`Total de Eventos: ${totals.eventos}`, 25, 65);
      pdf.text(`Total de Leads: ${totals.leads}`, 25, 75);
      pdf.text(`Conversaciones: ${totals.conversaciones}`, 25, 85);
      pdf.text(`Score Promedio: ${totals.score}`, 25, 95);
      
      // Guardar PDF
      pdf.save("prometeo_dashboard.pdf");
      
      // Exportar datos a Excel
      const ws = XLSX.utils.json_to_sheet(granularData || []);
      const ws2 = XLSX.utils.json_to_sheet(dimensionalData?.tipoEventos || []);
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Datos Granulares");
      XLSX.utils.book_append_sheet(wb, ws2, "Tipos de Eventos");
      
      // Si hay datos analíticos, añadirlos también
      if (dimensionalData?.rendimientoCanales && dimensionalData.rendimientoCanales.length > 0) {
        const ws3 = XLSX.utils.json_to_sheet(dimensionalData.rendimientoCanales);
        XLSX.utils.book_append_sheet(wb, ws3, "Rendimiento Canales");
      }
      
      if (dimensionalData?.rendimientoChatbots && dimensionalData.rendimientoChatbots.length > 0) {
        const ws4 = XLSX.utils.json_to_sheet(dimensionalData.rendimientoChatbots);
        XLSX.utils.book_append_sheet(wb, ws4, "Rendimiento Chatbots");
      }
      
      // Escribir el archivo Excel
      XLSX.writeFile(wb, "prometeo_dashboard.xlsx");
      
      toast({
        title: "Exportación completada",
        description: "Los datos del dashboard se han exportado correctamente",
        variant: "default"
      });
    } catch (error) {
      console.error("Error exportando datos:", error);
      toast({
        title: "Error en la exportación",
        description: "No se pudieron exportar los datos. Inténtalo de nuevo más tarde.",
        variant: "destructive"
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Definir el tipo de visualización según la agrupación temporal
  const getChartType = () => {
    if (groupBy === "hora") {
      return "barras"; // Barras para datos horarios
    } else if (groupBy === "dia" || groupBy === "semana") {
      return "area"; // Área para datos diarios o semanales
    } else {
      return "linea"; // Línea para datos mensuales, trimestrales o anuales
    }
  };

  return (
    <div className="space-y-6 py-[14px] px-[21px]">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{getDashboardTitle()}</h1>
          <p className="text-muted-foreground">
            {groupBy === "hora" ? "Datos desglosados por hora" : 
             groupBy === "dia" ? "Datos desglosados por día" :
             groupBy === "semana" ? "Datos desglosados por semana" :
             groupBy === "mes" ? "Datos desglosados por mes" :
             groupBy === "trimestre" ? "Datos desglosados por trimestre" :
             "Datos desglosados por año"}
          </p>
        </div>
      </div>
      
      {/* Barra de herramientas moderna con filtros mejorados */}
      <DashboardToolbar 
        onFilterChange={handleFilterChange}
        onChartVisibilityChange={handleChartVisibilityChange}
        channelOptions={channelOptions}
        onExportData={handleExportData}
        defaultTimeRange={timeRange}
        defaultChartVisibility={chartVisibility}
        isExporting={exportLoading}
      />

      {/* Panel principal con datos granulares */}
      <div className="space-y-6">
        {/* Tarjetas de KPIs con datos granulares */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de eventos
                  </p>
                  {isLoadingGranularData ? 
                    <Skeleton className="h-8 w-16" /> : 
                    <p className="text-2xl font-bold">{totals.eventos.toLocaleString()}</p>
                  }
                </div>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${trends.eventos.trend === "up" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                  <BarChart3 className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs">
                {trends.eventos.trend === "up" ? 
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" /> : 
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                }
                <span className={trends.eventos.trend === "up" ? "text-green-500" : "text-red-500"}>
                  {trends.eventos.value}%
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
                  {isLoadingGranularData ? 
                    <Skeleton className="h-8 w-16" /> : 
                    <p className="text-2xl font-bold">{totals.leads.toLocaleString()}</p>
                  }
                </div>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${trends.leads.trend === "up" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs">
                {trends.leads.trend === "up" ? 
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" /> : 
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                }
                <span className={trends.leads.trend === "up" ? "text-green-500" : "text-red-500"}>
                  {trends.leads.value}%
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
                  {isLoadingGranularData ? 
                    <Skeleton className="h-8 w-16" /> : 
                    <p className="text-2xl font-bold">{totals.conversaciones.toLocaleString()}</p>
                  }
                </div>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${trends.conversaciones.trend === "up" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                  <MessageSquare className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs">
                {trends.conversaciones.trend === "up" ? 
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" /> : 
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                }
                <span className={trends.conversaciones.trend === "up" ? "text-green-500" : "text-red-500"}>
                  {trends.conversaciones.value}%
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
                    Score promedio
                  </p>
                  {isLoadingGranularData ? 
                    <Skeleton className="h-8 w-16" /> : 
                    <p className="text-2xl font-bold">{totals.score}</p>
                  }
                </div>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${trends.score.trend === "up" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs">
                {trends.score.trend === "up" ? 
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" /> : 
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                }
                <span className={trends.score.trend === "up" ? "text-green-500" : "text-red-500"}>
                  {trends.score.value}%
                </span>
                <span className="text-muted-foreground ml-1">vs período anterior</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico principal con datos granulares */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-0 justify-between">
            <div>
              <CardTitle>Actividad {groupBy === "hora" ? "por hora" : groupBy === "dia" ? "diaria" : groupBy === "semana" ? "semanal" : groupBy === "mes" ? "mensual" : groupBy === "trimestre" ? "trimestral" : "anual"}</CardTitle>
              <CardDescription>
                Evolución de eventos, leads y conversaciones
                {timeRange === "today" ? " de hoy" : 
                 timeRange === "yesterday" ? " de ayer" :
                 timeRange === "custom" && dateRange.from && dateRange.to ? ` del ${formatDate(dateRange.from, 'PP', { locale: es })} al ${formatDate(dateRange.to, 'PP', { locale: es })}` :
                 ` en los últimos ${timeRange === "7d" ? "7 días" : 
                                   timeRange === "30d" ? "30 días" : 
                                   timeRange === "90d" ? "3 meses" : 
                                   timeRange === "6m" ? "6 meses" : "12 meses"}`}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex rounded-md overflow-hidden border">
                <Select defaultValue="eventos">
                  <SelectTrigger className="h-8 px-2 rounded-none min-w-[100px]">
                    <SelectValue placeholder="Métrica" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eventos">Eventos</SelectItem>
                    <SelectItem value="leads">Leads</SelectItem>
                    <SelectItem value="conversaciones">Conversaciones</SelectItem>
                    <SelectItem value="score">Score</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingGranularData ? (
              <div className="flex items-center justify-center h-[350px]">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Cargando datos...</p>
                </div>
              </div>
            ) : formattedGranularData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[350px]">
                <LayoutDashboard className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No hay datos para el período seleccionado</p>
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                {getChartType() === "area" ? (
                  <AreaChart data={formattedGranularData}>
                    <defs>
                      <linearGradient id="colorEventos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorConversaciones" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="periodo" 
                      axisLine={false}
                      tickLine={false}
                      tickMargin={8}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tickMargin={8}
                      yAxisId="left"
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tickMargin={8}
                      orientation="right"
                      yAxisId="right"
                      domain={[0, 100]}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="eventos"
                      name="Eventos"
                      stroke="hsl(var(--chart-1))"
                      fill="url(#colorEventos)"
                      strokeWidth={2}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="leads"
                      name="Leads"
                      stroke="hsl(var(--chart-2))"
                      fill="url(#colorLeads)"
                      strokeWidth={2}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="conversaciones"
                      name="Conversaciones"
                      stroke="hsl(var(--chart-3))"
                      fill="url(#colorConversaciones)"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="score"
                      name="Score"
                      stroke="hsl(var(--chart-4))"
                      strokeWidth={2}
                      dot={true}
                    />
                  </AreaChart>
                ) : getChartType() === "barras" ? (
                  <BarChart data={formattedGranularData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="periodo" 
                      axisLine={false}
                      tickLine={false}
                      tickMargin={8}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tickMargin={8}
                      yAxisId="left"
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tickMargin={8}
                      orientation="right"
                      yAxisId="right"
                      domain={[0, 100]}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="eventos"
                      name="Eventos"
                      fill="hsl(var(--chart-1))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="leads"
                      name="Leads"
                      fill="hsl(var(--chart-2))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="conversaciones"
                      name="Conversaciones"
                      fill="hsl(var(--chart-3))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="score"
                      name="Score"
                      stroke="hsl(var(--chart-4))"
                      strokeWidth={2}
                      dot={true}
                    />
                  </BarChart>
                ) : (
                  <LineChart data={formattedGranularData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="periodo" 
                      axisLine={false}
                      tickLine={false}
                      tickMargin={8}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tickMargin={8}
                      yAxisId="left"
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tickMargin={8}
                      orientation="right"
                      yAxisId="right"
                      domain={[0, 100]}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="eventos"
                      name="Eventos"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={true}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="leads"
                      name="Leads"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={true}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="conversaciones"
                      name="Conversaciones"
                      stroke="hsl(var(--chart-3))"
                      strokeWidth={2}
                      dot={true}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="score"
                      name="Score"
                      stroke="hsl(var(--chart-4))"
                      strokeWidth={2}
                      dot={true}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                )}
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Gráficos de distribución */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {chartVisibility.distributionChart && (
            <Card>
              <CardHeader>
                <CardTitle>Distribución por canal</CardTitle>
                <CardDescription>Leads por canal de adquisición</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingChannelData ? (
                  <div className="flex items-center justify-center h-[250px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={channelDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="visitors"
                        nameKey="browser"
                      >
                        {channelDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tipos de eventos */}
          <Card>
            <CardHeader>
              <CardTitle>Tipos de eventos</CardTitle>
              <CardDescription>Distribución por tipo de interacción</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDimensionalData ? (
                <div className="flex items-center justify-center h-[250px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : !dimensionalData || dimensionalData.tipoEventos.length === 0 ? (
                <div className="flex items-center justify-center h-[250px]">
                  <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    layout="vertical"
                    data={dimensionalData.tipoEventos.slice(0, 6)}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="categoria" 
                      type="category" 
                      scale="point" 
                      width={120}
                      tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                    />
                    <ChartTooltip />
                    <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                      {dimensionalData.tipoEventos.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || `hsl(var(--chart-${index + 1}))`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Rendimiento de chatbots */}
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento de chatbots</CardTitle>
            <CardDescription>Comparativa de rendimiento entre chatbots</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingDimensionalData ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : !dimensionalData || dimensionalData.rendimientoChatbots.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dimensionalData.rendimientoChatbots}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="categoria" 
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                    height={60}
                    interval={0}
                    tick={(props) => {
                      const { x, y, payload } = props;
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text 
                            x={0} 
                            y={0} 
                            dy={16} 
                            textAnchor="middle" 
                            fill="#666" 
                            fontSize={12}
                            width={120}
                          >
                            {payload.value.length > 12 ? `${payload.value.substring(0, 12)}...` : payload.value}
                          </text>
                        </g>
                      );
                    }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                  />
                  <ChartTooltip />
                  <Legend />
                  <Bar 
                    dataKey="valor" 
                    name="Interacciones"
                    radius={[4, 4, 0, 0]}
                  >
                    {dimensionalData.rendimientoChatbots.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;