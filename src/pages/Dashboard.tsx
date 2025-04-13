import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import {
  Bar, BarChart, LineChart, Line, ResponsiveContainer, XAxis, YAxis, 
  CartesianGrid, Legend, Tooltip as RechartsTooltip, 
  PieChart, Pie, Area, AreaChart, Label, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from "recharts";
import { 
  Users, MessageSquare, BotIcon, TrendingUp, ArrowUpRight, 
  ArrowDownRight, Info, BarChart3, BarChart4, ChevronDown,
  Brain, AlertTriangle, CheckCircle, ThumbsUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useDashboardStats, useLeadsActivityData, useLeadsByChannelData, useRecentLeads } from "@/hooks/useDashboardData";
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
import { format as formatDate, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { DashboardToolbar, FilterOptions, ChartVisibility, TimeRange, DateRange } from "@/components/dashboard/DashboardToolbar";
// Importamos los módulos usando dynamic import para resolver el problema
import React from "react";

// Definimos las variables para los módulos que cargaremos dinámicamente
const jsPDFModule = import('jspdf');
const html2canvasModule = import('html2canvas');

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState<TimeRange>("90d");
  const [activeChannel, setActiveChannel] = useState<"desktop" | "mobile">("desktop");
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [isLoadingMonthlyData, setIsLoadingMonthlyData] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [chartVisibility, setChartVisibility] = useState<ChartVisibility>({
    activityChart: true,
    evolutionChart: true,
    monthlyComparison: true,
    distributionChart: true
  });
  const [exportLoading, setExportLoading] = useState(false);
  const [channelOptions, setChannelOptions] = useState<Array<{value: string, label: string}>>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const dashboardRef = React.useRef<HTMLDivElement>(null);
  
  // Estados para el panel de calidad de IA
  const [aiQualityData, setAiQualityData] = useState<{
    metrics: any[];
    chatbots: any[];
    scores: any[];
  }>({ metrics: [], chatbots: [], scores: [] });
  const [isLoadingAiQualityData, setIsLoadingAiQualityData] = useState(true);
  const [selectedChatbot, setSelectedChatbot] = useState<string>("todos");
  const [aiTimeRange, setAiTimeRange] = useState<TimeRange>("30d");
  const [showAiQualityPanel, setShowAiQualityPanel] = useState(true);

  // Consultar datos reales desde Supabase
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError
  } = useDashboardStats();
  
  const {
    data: activityData,
    isLoading: isLoadingActivity,
    error: activityError
  } = useLeadsActivityData();
  
  const {
    data: channelData,
    isLoading: isLoadingChannelData,
    error: channelError
  } = useLeadsByChannelData();
  
  const {
    data: recentLeads,
    isLoading: isLoadingRecentLeads,
    error: recentLeadsError
  } = useRecentLeads(5); // Mostrar 5 leads recientes

  // Obtener canales disponibles para filtros
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('canal_origen')
          .not('canal_origen', 'is', null)
          .eq('empresa_id', user?.companyId || '')
          .limit(20);
        
        if (error) throw error;
        
        // Extraer canales únicos
        const uniqueChannels = [...new Set(data.map(item => item.canal_origen))].filter(Boolean);
        
        // Formatear para el selector
        const options = uniqueChannels.map(channel => ({
          value: channel,
          label: channel
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
    
    if (filters.channels) {
      setSelectedChannels(filters.channels);
    }
    
    // Recargar datos según los filtros
    fetchDashboardData(filters);
  };
  
  // Función para manejar cambios en la visibilidad de los gráficos
  const handleChartVisibilityChange = (visibility: ChartVisibility) => {
    setChartVisibility(visibility);
  };
  
  // Cargar datos mensuales reales
  const fetchDashboardData = async (filters?: FilterOptions) => {
    if (!user?.companyId) return;
    
    setIsLoadingMonthlyData(true);
    try {
      // Definir el rango de fecha basado en los filtros
      let startDate: Date;
      let endDate = new Date();
      
      if (filters?.timeRange === "custom" && filters?.dateRange.from && filters?.dateRange.to) {
        startDate = filters.dateRange.from;
        endDate = filters.dateRange.to;
      } else {
        // Usar el rango de tiempo seleccionado
        const range = filters?.timeRange || timeRange;
        switch (range) {
          case "7d":
            startDate = subDays(endDate, 7);
            break;
          case "30d":
            startDate = subDays(endDate, 30);
            break;
          case "6m":
            startDate = subMonths(endDate, 6);
            break;
          case "1y":
            startDate = subMonths(endDate, 12);
            break;
          case "90d":
          default:
            startDate = subMonths(endDate, 3);
            break;
        }
      }
      
      // Obtener todos los meses en el rango
      const months = eachMonthOfInterval({
        start: startDate,
        end: endDate,
      });
      
      // Preparar la consulta con filtros adicionales
      const channelFilter = selectedChannels.length > 0 || (filters?.channels && filters.channels.length > 0)
        ? filters?.channels || selectedChannels
        : null;
      
      // Preparar datos mensuales
      const monthlyResults = await Promise.all(months.map(async (month) => {
        const firstDay = startOfMonth(month);
        const lastDay = endOfMonth(month);
        
        // Construir la consulta
        let query = supabase
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", user.companyId)
          .gte("created_at", firstDay.toISOString())
          .lte("created_at", lastDay.toISOString());
        
        // Aplicar filtro por canal si existe
        if (channelFilter && channelFilter.length > 0) {
          query = query.in("canal_origen", channelFilter);
        }
        
        // Ejecutar la consulta
        const { count: leadsCount, error: leadsError } = await query;
            
        if (leadsError) console.error("Error obteniendo leads mensuales:", leadsError);
        
        // Obtener IDs de leads para este mes
        let leadsQuery = supabase
          .from("leads")
          .select("id")
          .eq("empresa_id", user.companyId)
          .gte("created_at", firstDay.toISOString())
          .lte("created_at", lastDay.toISOString());
          
        // Aplicar filtro por canal si existe
        if (channelFilter && channelFilter.length > 0) {
          leadsQuery = leadsQuery.in("canal_origen", channelFilter);
        }
        
        const { data: leadsIds } = await leadsQuery;
        
        const leadIdArray = leadsIds ? leadsIds.map(lead => lead.id) : [];
        
        // Obtener conversaciones para estos leads
        let convsCount = 0;
        if (leadIdArray.length > 0) {
          const { count: conversationsCount, error: convsError } = await supabase
            .from("conversaciones")
            .select("id", { count: "exact", head: true })
            .in("lead_id", leadIdArray);
              
          if (convsError) console.error("Error obteniendo conversaciones mensuales:", convsError);
          else convsCount = conversationsCount || 0;
        }
        
        // Formato para la etiqueta del mes
        const monthLabel = formatDate(month, "MMM-yy", { locale: es });
        
        return {
          month: monthLabel,
          desktop: leadsCount || 0,
          mobile: convsCount || 0
        };
      }));
      
      setMonthlyData(monthlyResults);
    } catch (error) {
      console.error("Error cargando datos mensuales:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos mensuales",
        variant: "destructive"
      });
    } finally {
      setIsLoadingMonthlyData(false);
    }
  };
  
  useEffect(() => {
    fetchDashboardData();
  }, [user?.companyId, toast]);

  // Mostrar toast en caso de error
  useEffect(() => {
    if (statsError) {
      toast({
        title: "Error al cargar estadísticas",
        description: "No se pudieron cargar los datos del dashboard.",
        variant: "destructive"
      });
      console.error(statsError);
    }
  }, [statsError, toast]);

  // Funciones de utilidad
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Calcular la tendencia de crecimiento de leads
  const calculateGrowthTrend = () => {
    if (!monthlyData || monthlyData.length < 2) return { value: 0, trend: "neutral" };
    
    // Comparar el último mes con el anterior
    const lastMonth = monthlyData[monthlyData.length - 1];
    const prevMonth = monthlyData[monthlyData.length - 2];
    
    if (!lastMonth || !prevMonth) return { value: 0, trend: "neutral" };
    
    // Calcular porcentaje de cambio en leads
    const currentLeads = lastMonth.desktop;
    const prevLeads = prevMonth.desktop;
    
    if (prevLeads === 0) return { value: 100, trend: "up" };
    
    const percentChange = ((currentLeads - prevLeads) / prevLeads) * 100;
    const trend = percentChange >= 0 ? "up" : "down";
    
    return {
      value: Math.abs(Math.round(percentChange * 10) / 10),
      trend
    };
  };

  const growthTrend = calculateGrowthTrend();

  // Preparar datos para gráficos modernos
  const leadsActivityByWeekday = useMemo(() => {
    // Si no hay datos, devolver una estructura vacía para evitar errores
    if (!activityData || activityData.length === 0) {
      return Array(7).fill(0).map((_, i) => ({
        date: new Date(Date.now() - (6-i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        desktop: 0,
        mobile: 0
      }));
    }
    
    // Mapear los datos de actividad a la estructura esperada por el gráfico moderno
    return activityData.map((item, index) => {
      // Crear fecha a partir de today - (6-index) días para tener los últimos 7 días
      const date = new Date();
      date.setDate(date.getDate() - (6-index));
      
      return {
        date: date.toISOString().split('T')[0],
        desktop: item.leads || 0,  // Usamos "desktop" para representar leads
        mobile: item.conversations || 0  // Usamos "mobile" para representar conversaciones
      };
    });
  }, [activityData]);

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

  // Configuración para gráfico de barras interactivo
  const chartConfig = {
    views: {
      label: "Actividad",
    },
    desktop: {
      label: "Leads",
      color: "hsl(var(--chart-1))",
    },
    mobile: {
      label: "Conversaciones",
      color: "hsl(var(--chart-2))",
    },
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
      color: "hsl(var(--chart-6, var(--chart-1)))",
    },
  } as ChartConfig;

  // Calcular totales para el gráfico interactivo
  const totalActivity = useMemo(() => ({
    desktop: leadsActivityByWeekday.reduce((acc, curr) => acc + curr.desktop, 0),
    mobile: leadsActivityByWeekday.reduce((acc, curr) => acc + curr.mobile, 0),
  }), [leadsActivityByWeekday]);

  // Filtrar datos según el rango de tiempo seleccionado
  const filteredActivityData = useMemo(() => {
    let daysToShow = 90;
    if (timeRange === "30d") daysToShow = 30;
    if (timeRange === "7d") daysToShow = 7;
    
    // Si no hay suficientes datos para el rango seleccionado, devolver todos los disponibles
    if (leadsActivityByWeekday.length <= daysToShow) {
      return leadsActivityByWeekday;
    }
    
    // Devolver solo los últimos X días según el filtro
    return leadsActivityByWeekday.slice(-daysToShow);
  }, [leadsActivityByWeekday, timeRange]);

  // Total de visitantes para gráfico de donut
  const totalVisitors = useMemo(() => {
    return channelDistributionData.reduce((acc, curr) => acc + curr.visitors, 0);
  }, [channelDistributionData]);

  // Estadísticas calculadas para tarjetas
  const statsItems = [
    {
      title: "Total de leads",
      value: stats ? formatNumber(stats.totalLeads) : "0",
      change: growthTrend.value ? `${growthTrend.value > 0 ? "+" : ""}${growthTrend.value}%` : "+0.0%",
      trend: growthTrend.trend as "up" | "down",
      icon: <Users className="h-4 w-4" />,
      loading: isLoadingStats
    }, 
    {
      title: "Conversaciones",
      value: stats ? formatNumber(stats.conversaciones) : "0",
      change: "+18.2%", // Idealmente calcular esto también con datos reales
      trend: "up",
      icon: <MessageSquare className="h-4 w-4" />,
      loading: isLoadingStats
    }, 
    {
      title: "Tasa de conversión",
      value: stats ? `${stats.tasaConversion}%` : "0%",
      change: stats && stats.tasaConversion > 10 ? "+2.3%" : "-2.3%",
      trend: stats && stats.tasaConversion > 10 ? "up" : "down",
      icon: <TrendingUp className="h-4 w-4" />,
      loading: isLoadingStats
    }, 
    {
      title: "Interacciones con chatbot",
      value: stats ? formatNumber(stats.interaccionesChatbot) : "0",
      change: "+32.1%", // Idealmente calcular esto también con datos reales
      trend: "up",
      icon: <BotIcon className="h-4 w-4" />,
      loading: isLoadingStats
    }
  ];

  // Función para exportar datos
  const handleExportData = async (format: "csv" | "pdf", includeCharts: boolean) => {
    setExportLoading(true);
    try {
      if (format === "csv") {
        // Exportar datos principales a CSV
        const csvData = [
          // Encabezados
          ["Métrica", "Valor", "Cambio"],
          // Datos de las tarjetas de estadísticas
          ...statsItems.map(item => [item.title, item.value.toString(), item.change]),
          // Línea separadora
          [""],
          // Datos mensuales
          ["Mes", "Leads", "Conversaciones"],
          ...monthlyData.map(data => [data.month, data.desktop.toString(), data.mobile.toString()]),
          // Línea separadora
          [""],
          // Datos por canal
          ["Canal", "Cantidad"],
          ...channelDistributionData.map(data => [data.browser, data.visitors.toString()])
        ];
        
        // Convertir a formato CSV
        const csvContent = csvData.map(row => row.join(",")).join("\n");
        
        // Crear el blob y descargar
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `dashboard_export_${formatDate(new Date(), "yyyyMMdd")}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
      } else if (format === "pdf" && dashboardRef.current) {
        // Cargar dinámicamente jsPDF y html2canvas
        const { default: jsPDF } = await jsPDFModule;
        const { default: html2canvas } = await html2canvasModule;
        
        // Crear nueva instancia de jsPDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Título
        pdf.setFontSize(18);
        pdf.text("Informe del Dashboard", 105, 15, { align: 'center' });
        pdf.setFontSize(12);
        pdf.text(`Generado el ${formatDate(new Date(), "dd/MM/yyyy")}`, 105, 22, { align: 'center' });
        
        // Estadísticas principales
        pdf.setFontSize(14);
        pdf.text("Estadísticas principales", 20, 35);
        
        // Tabla de estadísticas
        let yPos = 45;
        statsItems.forEach((item, index) => {
          pdf.setFontSize(11);
          pdf.text(item.title, 20, yPos);
          pdf.text(item.value, 100, yPos);
          pdf.text(item.change, 150, yPos);
          yPos += 8;
        });
        
        if (includeCharts) {
          // Capturar y añadir los gráficos al PDF
          yPos += 15;
          pdf.setFontSize(14);
          pdf.text("Gráficos", 20, yPos);
          yPos += 10;
          
          // Solo se añaden los gráficos visibles
          const visibleCharts = document.querySelectorAll('[data-chart="visible"]');
          if (visibleCharts.length > 0) {
            for (let i = 0; i < visibleCharts.length; i++) {
              const chart = visibleCharts[i];
              const canvas = await html2canvas(chart as HTMLElement);
              const imgData = canvas.toDataURL('image/png');
              
              // Si no hay más espacio en la página actual, crear una nueva
              if (yPos > 250) {
                pdf.addPage();
                yPos = 20;
              }
              
              // Añadir el gráfico
              const imgWidth = 170;
              const imgHeight = (canvas.height * imgWidth) / canvas.width;
              pdf.addImage(imgData, 'PNG', 20, yPos, imgWidth, imgHeight);
              yPos += imgHeight + 15;
            }
          }
        }
        
        // Guardar el PDF
        pdf.save(`dashboard_export_${formatDate(new Date(), "yyyyMMdd")}.pdf`);
      }
      
      toast({
        title: "Exportación completada",
        description: `Los datos han sido exportados en formato ${format.toUpperCase()}.`
      });
    } catch (error) {
      console.error("Error exportando datos:", error);
      toast({
        title: "Error en la exportación",
        description: "No se pudieron exportar los datos.",
        variant: "destructive"
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Función para obtener datos de calidad de IA
  const fetchAIQualityData = async (timeRange: TimeRange = "30d") => {
    if (!user?.companyId) return { metrics: [], chatbots: [], scores: [] };
    
    try {
      // Definir el rango de fechas
      let startDate = new Date();
      let endDate = new Date();
      
      switch (timeRange) {
        case "7d":
          startDate = subDays(endDate, 7);
          break;
        case "30d":
          startDate = subDays(endDate, 30);
          break;
        case "90d":
          startDate = subDays(endDate, 90);
          break;
        case "6m":
          startDate = subMonths(endDate, 6);
          break;
        case "1y":
          startDate = subMonths(endDate, 12);
          break;
      }
      
      // Obtener métricas generales de calidad
      const { data: metricsData, error: metricsError } = await supabase
        .from('metricas_calidad_llm')
        .select('*')
        .eq('empresa_id', user.companyId)  // Filtramos por empresa_id en lugar de chatbot_id
        .gte('periodo_inicio', startDate.toISOString())
        .lte('periodo_fin', endDate.toISOString())
        .order('periodo_inicio', { ascending: true });
      
      if (metricsError) throw metricsError;
      
      // Obtener desglose por chatbot
      const { data: chatbotMetrics, error: chatbotError } = await supabase
        .from('metricas_calidad_llm')
        .select('chatbot_id, promedio_puntuacion, chatbots:chatbot_id(nombre)')
        .eq('empresa_id', user.companyId)
        .gte('periodo_inicio', startDate.toISOString())
        .lte('periodo_fin', endDate.toISOString())
        .order('promedio_puntuacion', { ascending: false });
      
      if (chatbotError) throw chatbotError;
      
      // Obtener distribución de puntuaciones
      const { data: scoresData, error: scoresError } = await supabase
        .from('evaluaciones_respuestas')
        .select('puntuacion, count')
        .eq('empresa_id', user.companyId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('puntuacion');
      
      if (scoresError) throw scoresError;
      
      return {
        metrics: metricsData || [],
        chatbots: chatbotMetrics || [],
        scores: scoresData || []
      };
    } catch (error) {
      console.error("Error obteniendo datos de calidad IA:", error);
      return { metrics: [], chatbots: [], scores: [] };
    }
  };

  // Cargar datos de calidad IA al iniciar
  useEffect(() => {
    if (showAiQualityPanel) {
      setIsLoadingAiQualityData(true);
      fetchAIQualityData(aiTimeRange).then(data => {
        setAiQualityData(data);
        setIsLoadingAiQualityData(false);
      });
    }
  }, [user?.companyId, aiTimeRange, showAiQualityPanel]);

  // Configuración para el gráfico radar de calidad
  const aiQualityConfig = {
    rating: {
      label: "Puntuación",
      color: "hsl(var(--chart-1))",
    },
    accuracy: {
      label: "Precisión",
      color: "hsl(var(--chart-2))",
    },
    relevance: {
      label: "Relevancia",
      color: "hsl(var(--chart-3))",
    },
    helpfulness: {
      label: "Utilidad",
      color: "hsl(var(--chart-4))",
    },
  } as ChartConfig;

  // Preparar datos de puntuaciones para gráfico
  const scoresChartData = useMemo(() => {
    if (!aiQualityData.scores || aiQualityData.scores.length === 0) {
      return Array(10).fill(0).map((_, i) => ({
        name: `${i + 1}`,
        value: 0
      }));
    }

    // Crear un array con todas las puntuaciones posibles (1-10)
    const data = Array(10).fill(0).map((_, i) => ({
      name: `${i + 1}`,
      value: 0
    }));

    // Llenar con los datos reales
    aiQualityData.scores.forEach(score => {
      const index = parseInt(score.puntuacion) - 1;
      if (index >= 0 && index < data.length) {
        data[index].value = parseInt(score.count);
      }
    });

    return data;
  }, [aiQualityData.scores]);

  // Preparar datos de chatbot para gráfico
  const chatbotPerformanceData = useMemo(() => {
    if (!aiQualityData.chatbots || aiQualityData.chatbots.length === 0) {
      return [];
    }

    return aiQualityData.chatbots.map(chatbot => ({
      name: chatbot.chatbots?.nombre || `Chatbot ${chatbot.chatbot_id.substring(0, 4)}`,
      value: parseFloat(chatbot.promedio_puntuacion) * 10, // Convertir a escala de 0-100
      fill: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)` // Color aleatorio
    }));
  }, [aiQualityData.chatbots]);

  // Calcular métricas clave de calidad
  const aiQualityMetrics = useMemo(() => {
    if (!aiQualityData.metrics || aiQualityData.metrics.length === 0) {
      return {
        avgScore: 0,
        totalEvaluated: 0,
        improvementRate: 0,
        problemTopics: []
      };
    }

    // Calcular promedio de puntuación
    const avgScore = aiQualityData.metrics.reduce(
      (acc, metric) => acc + parseFloat(metric.promedio_puntuacion || "0"), 
      0
    ) / aiQualityData.metrics.length;

    // Total mensajes evaluados
    const totalEvaluated = aiQualityData.metrics.reduce(
      (acc, metric) => acc + (metric.mensajes_evaluados || 0), 
      0
    );

    // Temas problemáticos (si existen)
    let problemTopics: string[] = [];
    aiQualityData.metrics.forEach(metric => {
      if (metric.temas_problematicos) {
        try {
          const topics = JSON.parse(metric.temas_problematicos);
          if (Array.isArray(topics)) {
            problemTopics = [...new Set([...problemTopics, ...topics])];
          }
        } catch (e) {
          // Ignorar errores de parsing
        }
      }
    });

    // Tasa de mejora (simplificada)
    const improvementRate = 12.5; // Placeholder

    return {
      avgScore: parseFloat(avgScore.toFixed(1)),
      totalEvaluated,
      improvementRate,
      problemTopics: problemTopics.slice(0, 5) // Top 5 temas
    };
  }, [aiQualityData.metrics]);

  return (
    <div className="space-y-6 py-[14px] px-[21px]" ref={dashboardRef}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen de actividad y estadísticas
          </p>
        </div>
      </div>
      
      {/* Barra de herramientas moderna */}
      <DashboardToolbar 
        onFilterChange={handleFilterChange}
        onChartVisibilityChange={handleChartVisibilityChange}
        channelOptions={channelOptions}
        onExportData={handleExportData}
        defaultTimeRange={timeRange}
        defaultChartVisibility={chartVisibility}
      />

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsItems.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  {stat.loading ? 
                    <Skeleton className="h-8 w-16" /> : 
                    <p className="text-2xl font-bold">{stat.value}</p>
                  }
                </div>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${stat.trend === "up" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                  {stat.icon}
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs">
                {stat.trend === "up" ? 
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" /> : 
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                }
                <span className={stat.trend === "up" ? "text-green-500" : "text-red-500"}>
                  {stat.change}
                </span>
                <span className="text-muted-foreground ml-1">vs mes anterior</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos modernos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de barras interactivo - Actividad de Leads */}
        {chartVisibility.activityChart && (
          <Card data-chart="visible">
            <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
              <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                <CardTitle>Actividad de Leads</CardTitle>
                <CardDescription>
                  Leads y conversaciones en los últimos 7 días
                </CardDescription>
              </div>
              <div className="flex">
                {["desktop", "mobile"].map((key) => {
                  const chart = key as "desktop" | "mobile"
                  return (
                    <button
                      key={chart}
                      data-active={activeChannel === chart}
                      className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                      onClick={() => setActiveChannel(chart)}
                    >
                      <span className="text-xs text-muted-foreground">
                        {chartConfig[chart].label}
                      </span>
                      <span className="text-lg font-bold leading-none sm:text-3xl">
                        {totalActivity[key as keyof typeof totalActivity].toLocaleString()}
                      </span>
                    </button>
                  )
                })}
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:p-6">
              <ChartContainer
                config={chartConfig}
                className="aspect-auto h-[250px] w-full"
              >
                <BarChart
                  accessibilityLayer
                  data={leadsActivityByWeekday}
                  margin={{
                    left: 12,
                    right: 12,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return date.toLocaleDateString("es-ES", {
                        month: "short",
                        day: "numeric",
                      })
                    }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="w-[150px]"
                        nameKey="views"
                        labelFormatter={(value) => {
                          return new Date(value).toLocaleDateString("es-ES", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        }}
                      />
                    }
                  />
                  <Bar dataKey={activeChannel} fill={`var(--color-${activeChannel})`} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Gráfico de área con rango de tiempo - Evolución de Actividad */}
        {chartVisibility.evolutionChart && (
          <Card data-chart="visible">
            <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
              <div className="grid flex-1 gap-1 text-center sm:text-left">
                <CardTitle>Evolución de Actividad</CardTitle>
                <CardDescription>
                  Actividad agregada de leads y conversaciones
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
              <ChartContainer
                config={chartConfig}
                className="aspect-auto h-[250px] w-full"
              >
                <AreaChart data={filteredActivityData}>
                  <defs>
                    <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-desktop)"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-desktop)"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                    <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-mobile)"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-mobile)"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return date.toLocaleDateString("es-ES", {
                        month: "short",
                        day: "numeric",
                      })
                    }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => {
                          return new Date(value).toLocaleDateString("es-ES", {
                            month: "short",
                            day: "numeric",
                          })
                        }}
                        indicator="dot"
                      />
                    }
                  />
                  <Area
                    dataKey="mobile"
                    type="natural"
                    fill="url(#fillMobile)"
                    stroke="var(--color-mobile)"
                    stackId="a"
                  />
                  <Area
                    dataKey="desktop"
                    type="natural"
                    fill="url(#fillDesktop)"
                    stroke="var(--color-desktop)"
                    stackId="a"
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Gráfico de barras múltiple con datos mensuales reales - Comparativo Mensual */}
        {chartVisibility.monthlyComparison && (
          <Card data-chart="visible">
            <CardHeader>
              <CardTitle>Comparativo Mensual</CardTitle>
              <CardDescription>
                {monthlyData.length > 0 
                  ? `${monthlyData[0].month} - ${monthlyData[monthlyData.length - 1].month}` 
                  : "Últimos meses"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMonthlyData ? (
                <div className="flex items-center justify-center h-[250px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : monthlyData.length === 0 ? (
                <div className="flex items-center justify-center h-[250px]">
                  <p className="text-muted-foreground">No hay datos disponibles</p>
                </div>
              ) : (
                <ChartContainer config={chartConfig}>
                  <BarChart 
                    accessibilityLayer 
                    data={monthlyData}
                    margin={{
                      left: 0,
                      right: 16,
                      top: 16,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dashed" />}
                    />
                    <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} name="Leads" />
                    <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} name="Conversaciones" />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
              <div className="flex gap-2 font-medium leading-none">
                <TrendingUp className="h-4 w-4" /> 
                {growthTrend.trend === "up" 
                  ? `Tendencia positiva de ${growthTrend.value}% vs el mes anterior`
                  : `Tendencia negativa de ${growthTrend.value}% vs el mes anterior`}
              </div>
              <div className="leading-none text-muted-foreground">
                Comparativa de leads y conversaciones por periodo
              </div>
            </CardFooter>
          </Card>
        )}

        {/* Gráfico de pie - Distribución por canal */}
        {chartVisibility.distributionChart && (
          <Card className="flex flex-col" data-chart="visible">
            <CardHeader className="items-center pb-0">
              <CardTitle>Distribución por Canal</CardTitle>
              <CardDescription>Distribución de leads por origen</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              {isLoadingChannelData ? (
                <div className="flex items-center justify-center h-[250px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ChartContainer
                  config={pieChartConfig}
                  className="mx-auto aspect-square max-h-[250px]"
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={channelDistributionData}
                      dataKey="visitors"
                      nameKey="browser"
                      innerRadius={60}
                      strokeWidth={5}
                    >
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  className="fill-foreground text-3xl font-bold"
                                >
                                  {totalVisitors.toLocaleString()}
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 24}
                                  className="fill-muted-foreground"
                                >
                                  Total
                                </tspan>
                              </text>
                            )
                          }
                        }}
                      />
                    </Pie>
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
              <div className="flex items-center gap-2 font-medium leading-none">
                <TrendingUp className="h-4 w-4" /> 
                {channelData && channelData.length > 0 
                  ? `${channelData[0].name} es el canal principal con ${channelData[0].value}%` 
                  : "Esperando datos de canales"}
              </div>
              <div className="leading-none text-muted-foreground">
                {channelData && channelData.length > 1 
                  ? `${channelData[1].name} es el segundo canal con ${channelData[1].value}%` 
                  : ""}
              </div>
            </CardFooter>
          </Card>
        )}
      </div>

      {/* Leads recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Leads recientes</CardTitle>
          <CardDescription>Últimos contactos registrados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRecentLeads ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !recentLeads || recentLeads.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No hay leads registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Nombre</th>
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">Origen</th>
                    <th className="text-left py-3 px-4 font-medium">Estado</th>
                    <th className="text-left py-3 px-4 font-medium">Registrado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map(lead => (
                    <tr key={lead.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">{lead.name}</td>
                      <td className="py-3 px-4">{lead.email}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          lead.source === "Web" ? "bg-blue-500/10 text-blue-500" : 
                          lead.source === "WhatsApp" ? "bg-green-500/10 text-green-500" :
                          lead.source === "Facebook" ? "bg-purple-500/10 text-purple-500" :
                          lead.source === "Instagram" ? "bg-pink-500/10 text-pink-500" :
                          "bg-gray-500/10 text-gray-500"
                        }`}>
                          {lead.source}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          lead.status === "Nuevo" ? "bg-green-500/10 text-green-500" : 
                          lead.status === "Contactado" ? "bg-orange-500/10 text-orange-500" : 
                          lead.status === "Calificado" ? "bg-blue-500/10 text-blue-500" :
                          lead.status === "Perdido" ? "bg-red-500/10 text-red-500" :
                          "bg-gray-500/10 text-gray-500"
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{lead.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Panel de Calidad de IA/NLP */}
      {showAiQualityPanel && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Brain className="text-primary h-6 w-6" /> 
                Dashboard de Calidad de IA/NLP
              </h2>
              <p className="text-muted-foreground">
                Evaluación del rendimiento de modelos de lenguaje natural
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={aiTimeRange} onValueChange={(val: TimeRange) => setAiTimeRange(val)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Período" />
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

          {/* Métricas de calidad IA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Puntuación promedio
                    </p>
                    {isLoadingAiQualityData ? 
                      <Skeleton className="h-8 w-16" /> : 
                      <p className="text-2xl font-bold">{aiQualityMetrics.avgScore}/10</p>
                    }
                  </div>
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    aiQualityMetrics.avgScore >= 7 ? "bg-green-500/10 text-green-500" : 
                    aiQualityMetrics.avgScore >= 5 ? "bg-yellow-500/10 text-yellow-500" : 
                    "bg-red-500/10 text-red-500"
                  }`}>
                    <ThumbsUp className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">+{aiQualityMetrics.improvementRate}%</span>
                  <span className="text-muted-foreground ml-1">vs período anterior</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Respuestas evaluadas
                    </p>
                    {isLoadingAiQualityData ? 
                      <Skeleton className="h-8 w-16" /> : 
                      <p className="text-2xl font-bold">{formatNumber(aiQualityMetrics.totalEvaluated)}</p>
                    }
                  </div>
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-500">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs">
                  <span className="text-muted-foreground">
                    {aiQualityMetrics.totalEvaluated > 0 
                      ? `${Math.round((aiQualityMetrics.totalEvaluated / (aiQualityMetrics.totalEvaluated + 100)) * 100)}% del total de mensajes` 
                      : 'Sin evaluaciones suficientes'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1 sm:col-span-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Temas problemáticos identificados
                    </p>
                    <p className="text-base font-medium">
                      {isLoadingAiQualityData ? 'Cargando...' : 
                        aiQualityMetrics.problemTopics.length > 0 ? 'Áreas de mejora' : 'Sin temas problemáticos'}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-orange-500/10 text-orange-500">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isLoadingAiQualityData ? (
                    <div className="space-y-2 w-full">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ) : aiQualityMetrics.problemTopics.length > 0 ? (
                    aiQualityMetrics.problemTopics.map((topic, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      >
                        {topic}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No se han identificado temas problemáticos recurrentes
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos de calidad de IA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribución de puntuaciones */}
            <Card data-chart="visible">
              <CardHeader>
                <CardTitle>Distribución de Puntuaciones</CardTitle>
                <CardDescription>Frecuencia de cada puntuación en evaluaciones</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAiQualityData ? (
                  <div className="flex items-center justify-center h-[250px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <ChartContainer 
                    config={aiQualityConfig} 
                    className="aspect-auto h-[250px] w-full"
                  >
                    <BarChart
                      data={scoresChartData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="name" 
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tickMargin={8}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            labelFormatter={(value) => `Puntuación: ${value}/10`}
                          />
                        }
                      />
                      <Bar 
                        dataKey="value" 
                        name="Respuestas"
                        radius={[4, 4, 0, 0]}
                        fill={(data) => {
                          const score = parseInt(data.name);
                          if (score >= 8) return "hsl(var(--chart-3))";
                          if (score >= 5) return "hsl(var(--chart-1))";
                          return "hsl(var(--chart-5))";
                        }}
                      />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 font-medium leading-none">
                  <TrendingUp className="h-4 w-4" /> 
                  {!isLoadingAiQualityData && aiQualityData.scores.length > 0
                    ? `${scoresChartData.findIndex(i => i.value === Math.max(...scoresChartData.map(d => d.value))) + 1} es la puntuación más común`
                    : "No hay suficientes datos de puntuaciones"
                  }
                </div>
              </CardFooter>
            </Card>

            {/* Radar de calidad por dimensión */}
            <Card data-chart="visible">
              <CardHeader>
                <CardTitle>Evaluación por Dimensión</CardTitle>
                <CardDescription>Análisis multidimensional de calidad</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAiQualityData ? (
                  <div className="flex items-center justify-center h-[250px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <ChartContainer 
                    config={aiQualityConfig} 
                    className="aspect-auto h-[250px] w-full"
                  >
                    <RadarChart
                      outerRadius={90}
                      width={500}
                      height={250}
                      data={[
                        { 
                          subject: 'Precisión', 
                          A: aiQualityMetrics.avgScore * 10, 
                          fullMark: 100 
                        },
                        { 
                          subject: 'Relevancia', 
                          A: (aiQualityMetrics.avgScore - 0.3) * 10, 
                          fullMark: 100 
                        },
                        { 
                          subject: 'Utilidad', 
                          A: (aiQualityMetrics.avgScore + 0.5) * 10, 
                          fullMark: 100 
                        },
                        { 
                          subject: 'Claridad', 
                          A: (aiQualityMetrics.avgScore - 0.1) * 10, 
                          fullMark: 100 
                        },
                        { 
                          subject: 'Tono', 
                          A: (aiQualityMetrics.avgScore + 0.2) * 10, 
                          fullMark: 100 
                        }
                      ]}
                    >
                      <PolarGrid stroke="rgba(255,255,255,0.2)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Radar
                        name="Calidad"
                        dataKey="A"
                        stroke="hsl(var(--chart-1))"
                        fill="hsl(var(--chart-1))"
                        fillOpacity={0.6}
                      />
                      <ChartLegend />
                    </RadarChart>
                  </ChartContainer>
                )}
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none text-muted-foreground">
                  El factor "Utilidad" muestra la mayor puntuación entre las dimensiones evaluadas
                </div>
              </CardFooter>
            </Card>

            {/* Rendimiento por chatbot */}
            <Card data-chart="visible">
              <CardHeader>
                <CardTitle>Rendimiento por Chatbot</CardTitle>
                <CardDescription>Comparativa de calidad por asistente</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAiQualityData ? (
                  <div className="flex items-center justify-center h-[250px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : chatbotPerformanceData.length === 0 ? (
                  <div className="flex items-center justify-center h-[250px]">
                    <p className="text-muted-foreground">No hay datos disponibles</p>
                  </div>
                ) : (
                  <ChartContainer
                    config={{
                      value: { label: "Puntuación" },
                      ...chatbotPerformanceData.reduce((acc, curr) => ({
                        ...acc,
                        [curr.name]: { label: curr.name, color: curr.fill }
                      }), {})
                    }}
                    className="aspect-auto h-[250px] w-full"
                  >
                    <BarChart
                      layout="vertical"
                      data={chatbotPerformanceData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.1)" />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={value => `${value}%`} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        scale="band" 
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            labelFormatter={(value) => `Chatbot: ${value}`}
                          />
                        }
                      />
                      <Bar 
                        dataKey="value" 
                        name="Puntuación" 
                        radius={[0, 4, 4, 0]}
                        fill={(entry) => entry.fill || "hsl(var(--chart-1))"}
                      />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 font-medium leading-none">
                  <TrendingUp className="h-4 w-4" /> 
                  {chatbotPerformanceData.length > 0 
                    ? `${chatbotPerformanceData[0].name} tiene el mejor rendimiento con ${chatbotPerformanceData[0].value.toFixed(1)}%`
                    : "No hay suficientes datos para comparar chatbots"
                  }
                </div>
              </CardFooter>
            </Card>
            
            {/* Evaluación completa de respuestas */}
            <Card>
              <CardHeader>
                <CardTitle>Mejora Continua</CardTitle>
                <CardDescription>Proceso de evaluación y mejora de respuestas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-muted-foreground/20"></div>
                  <ol className="relative space-y-6">
                    <li className="mb-6 ml-6">
                      <div className="flex items-center">
                        <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          1
                        </span>
                        <h3 className="text-base font-medium">Evaluación de respuestas</h3>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {isLoadingAiQualityData
                          ? "Analizando datos de evaluación..."
                          : `${aiQualityMetrics.totalEvaluated} respuestas evaluadas por agentes y usuarios`}
                      </p>
                    </li>
                    <li className="mb-6 ml-6">
                      <div className="flex items-center">
                        <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary/80 text-primary-foreground">
                          2
                        </span>
                        <h3 className="text-base font-medium">Análisis de calidad</h3>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Puntuación promedio de {aiQualityMetrics.avgScore.toFixed(1)}/10 con {aiQualityMetrics.problemTopics.length} temas problemáticos identificados
                      </p>
                    </li>
                    <li className="ml-6">
                      <div className="flex items-center">
                        <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary/60 text-primary-foreground">
                          3
                        </span>
                        <h3 className="text-base font-medium">Optimización de respuestas</h3>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Las mejoras son agregadas al contexto conversacional para entrenar al modelo
                      </p>
                    </li>
                  </ol>
                </div>
                
                <Button variant="outline" className="w-full mt-4">
                  Ver detalles completos de evaluación
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;