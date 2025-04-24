import React, { useState, useRef, useEffect, forwardRef, ButtonHTMLAttributes } from 'react';
import { Lead } from '@/hooks/useLeads';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart3,
  User,
  Tag,
  MessageSquare,
  BarChart4,
  Plus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  ArrowUpRight,
  Star,
  Bot,
  Settings,
  Gauge,
  Activity,
  Send,
  CalendarIcon,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  BarChart2
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Importación para gráficos
import {
  Line,
  LineChart,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartTooltip,
  Area,
  AreaChart,
  Bar,
  BarChart,
} from "recharts";

// Tipos para los datos de historial
interface ScoreHistoryItem {
  created_at: string;
  score_nuevo: number;
  fecha_formateada?: string;
}

interface LeadDetailSidebarProps {
  selectedLead: Lead | null;
  leadComments: any[];
  isLoadingComments: boolean;
  onAddComment: () => void;
  user: any;
  isAssigning: boolean;
  isReleasing: boolean;
  handleAssignToMe: () => Promise<void>;
  handleReleaseAssignment: () => Promise<void>;
  openTransferDialog: () => void;
  leadConversations: any[];
}

// Schema para formulario de mensaje de texto
const messageFormSchema = z.object({
  message: z.string().min(1, "El mensaje no puede estar vacío"),
});

// Schema para formulario de correo electrónico
const emailFormSchema = z.object({
  subject: z.string().min(1, "El asunto no puede estar vacío"),
  body: z.string().min(1, "El mensaje no puede estar vacío"),
});

// Schema para formulario de agenda
const calendarFormSchema = z.object({
  title: z.string().min(1, "El título no puede estar vacío"),
  date: z.string().min(1, "La fecha es requerida"),
  time: z.string().min(1, "La hora es requerida"),
  notes: z.string().optional(),
});

// Definir la interfaz de props para ActionButton
interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

// Componente de botón personalizado con forwardRef para resolver el problema de refs
const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(({ children, className, ...props }, ref) => (
  <Button
    ref={ref}
    variant="outline" 
    size="sm"
    className={`flex-1 h-9 gap-1 bg-slate-900 hover:bg-slate-800 border-slate-800 ${className || ''}`}
    {...props}
  >
    {children}
  </Button>
));

ActionButton.displayName = 'ActionButton';

const LeadDetailSidebar: React.FC<LeadDetailSidebarProps> = ({
  selectedLead,
  leadComments,
  isLoadingComments,
  onAddComment,
  user,
  isAssigning,
  isReleasing,
  handleAssignToMe,
  handleReleaseAssignment,
  openTransferDialog,
  leadConversations
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [textMessageOpen, setTextMessageOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  
  // Estado para históricos
  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  // Forms para los diferentes formularios
  const messageForm = useForm<z.infer<typeof messageFormSchema>>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: { message: "" }
  });
  
  const emailForm = useForm<z.infer<typeof emailFormSchema>>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: { subject: "", body: "" }
  });
  
  const calendarForm = useForm<z.infer<typeof calendarFormSchema>>({
    resolver: zodResolver(calendarFormSchema),
    defaultValues: {
      title: "",
      date: format(new Date(), "yyyy-MM-dd"),
      time: format(new Date(), "HH:mm"),
      notes: "",
    }
  });
  
  // Obtener el historial de score del lead
  useEffect(() => {
    const fetchScoreHistory = async () => {
      if (!selectedLead?.id) return;
      
      setLoadingHistory(true);
      try {
        const { data, error } = await supabase
          .from('view_lead_score_history')
          .select('*')
          .eq('lead_id', selectedLead.id)
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        
        // Formatear las fechas para mostrar en el gráfico
        const formattedData = data?.map(item => ({
          ...item,
          fecha_formateada: format(new Date(item.created_at), "dd MMM", { locale: es })
        })) || [];
        
        setScoreHistory(formattedData);
      } catch (error) {
        console.error('Error al cargar el historial de score:', error);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchScoreHistory();
  }, [selectedLead?.id]);
  
  // Handlers for form submission
  const handleMessageSubmit = (data: z.infer<typeof messageFormSchema>) => {
    toast({
      title: "Mensaje enviado",
      description: `Se ha enviado el mensaje al contacto`,
    });
    setTextMessageOpen(false);
    messageForm.reset();
  };
  
  const handleEmailSubmit = (data: z.infer<typeof emailFormSchema>) => {
    toast({
      title: "Correo enviado",
      description: `Se ha enviado el correo al contacto`,
    });
    setEmailDialogOpen(false);
    emailForm.reset();
  };
  
  const handleCalendarSubmit = (data: z.infer<typeof calendarFormSchema>) => {
    toast({
      title: "Evento creado",
      description: `Se ha agendado el evento para el ${format(new Date(data.date), "PPP", { locale: es })} a las ${data.time}`,
    });
    setCalendarDialogOpen(false);
    calendarForm.reset();
  };

  if (!selectedLead) {
    return (
      <aside className="w-80 border-l border-border bg-card p-4 flex flex-col items-center justify-center text-center h-full">
        <p className="text-muted-foreground">Selecciona una conversación para ver los detalles del lead.</p>
      </aside>
    );
  }

  // Formatear fecha de última interacción
  const formatDate = (dateString?: string) => {
    if (!dateString) return "No disponible";
    try {
      return format(new Date(dateString), "d MMM, HH:mm", { locale: es });
    } catch (e) {
      return "Fecha inválida";
    }
  };
  
  const formatShortDate = (date: Date) => {
    return format(date, "d MMM", { locale: es });
  };

  // Calcular el porcentaje de engagement basado en el score
  const scorePercentage = selectedLead.score || 0;
  
  // Determinar el color del score
  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-500";
    if (score >= 40) return "text-amber-500";
    return "text-rose-500";
  };
  
  // Determinar la temperatura basada en el score
  const getTemperature = (score: number) => {
    if (score >= 70) return { label: "Hot", color: "bg-rose-500", textColor: "text-rose-500" };
    if (score >= 40) return { label: "Warm", color: "bg-amber-500", textColor: "text-amber-500" };
    return { label: "Cold", color: "bg-blue-500", textColor: "text-blue-500" };
  };
  
  const temperature = getTemperature(scorePercentage);

  // Calcular datos para mini gráficos
  const conversationCount = leadConversations?.length || 0;
  const messageCount = selectedLead.message_count || 0;
  
  // Calcular nivel de satisfacción (simulado - normalmente vendría de un análisis de sentimiento)
  const satisfactionLevel = selectedLead.ultima_evaluacion_llm?.sentimiento || Math.floor(Math.random() * 30) + 70;
  const qualificationLevel = selectedLead.probabilidad_cierre || Math.floor(Math.random() * 40) + 60;
  
  // Generar datos para gráfico de tendencia si no hay historial
  const generateTrendData = () => {
    const today = new Date();
    const data = [];
    
    for (let i = 10; i >= 0; i--) {
      const date = subDays(today, i);
      // Crear una tendencia simulada que termine en el score actual
      const baseScore = Math.max(scorePercentage - 15, 10);
      const increment = (scorePercentage - baseScore) / 10;
      const dayScore = Math.round(baseScore + (10 - i) * increment);
      
      data.push({
        created_at: format(date, "yyyy-MM-dd'T'HH:mm:ss"),
        score_nuevo: dayScore,
        fecha_formateada: format(date, "dd MMM", { locale: es })
      });
    }
    
    return data;
  };
  
  // Usar datos reales o simulados según disponibilidad
  const chartData = scoreHistory.length > 1 ? scoreHistory : generateTrendData();
  
  // Calcular temperatura histórica (simulada)
  const temperatureHistory = chartData.map(item => {
    const temperatureData = getTemperature(item.score_nuevo);
    return {
      ...item,
      temperatura: temperatureData.label
    };
  });
  
  return (
    <aside className="w-90 border-l border-border bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Cabecera con datos principales - altura igualada */}
        <div className="relative px-4 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {selectedLead.nombre?.[0]}{selectedLead.apellido?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold truncate text-white">
                  {selectedLead.nombre} {selectedLead.apellido}
                </h3>
                <div className="flex items-center text-xs text-slate-400 gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Última actividad: {formatDate(selectedLead.ultima_interaccion)}</span>
                </div>
              </div>
            </div>
            
            <Badge 
              className={cn(
                "h-6 px-2", 
                scorePercentage >= 70 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : 
                scorePercentage >= 40 ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : 
                "bg-rose-500/20 text-rose-400 border-rose-500/30"
              )}
            >
              {temperature.label} • {scorePercentage}
            </Badge>
          </div>
        </div>

        {/* Contenido principal con pestañas */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <TabsContent value="dashboard" className="m-0 p-0">
              <div className="p-4 space-y-4">
                {/* Gráfico principal de score */}
                <div className="relative">
                  <div className="absolute -inset-2 rounded-xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-50 blur-lg"></div>
                  <Card className="relative overflow-hidden border-0 bg-gradient-to-b from-slate-900 to-slate-950">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm font-semibold text-white flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1.5 text-indigo-400" />
                          Evolución del Score
                        </CardTitle>
                        <Badge className={cn(
                          "px-2", 
                          scorePercentage >= 70 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : 
                          scorePercentage >= 40 ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : 
                          "bg-rose-500/20 text-rose-400 border-rose-500/30"
                        )}>
                          {scorePercentage}/100
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="px-0 pt-0 pb-2">
                      <div className="h-44">
                        {loadingHistory ? (
                          <div className="h-full w-full flex items-center justify-center">
                            <p className="text-sm text-slate-500">Cargando datos...</p>
                          </div>
                        ) : chartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart 
                              data={chartData} 
                              margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#8f6ed5" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#8f6ed5" stopOpacity={0.2}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                              <XAxis 
                                dataKey="fecha_formateada" 
                                tick={{ fill: '#94a3b8', fontSize: 10 }} 
                                axisLine={{ stroke: '#333' }}
                                tickLine={false}
                                minTickGap={20}
                              />
                              <YAxis 
                                domain={[0, 100]}
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <RechartTooltip 
                                content={({ active, payload, label }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-slate-900 p-2 border border-slate-700 rounded shadow-md">
                                        <p className="text-xs text-slate-300">{`${label}`}</p>
                                        <p className="text-xs font-bold text-indigo-400">
                                          {`Score: ${payload[0].value}`}
                                        </p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="score_nuevo"
                                stroke="#8f6ed5"
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 6, fill: '#8f6ed5', stroke: '#fff', strokeWidth: 2 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <p className="text-sm text-slate-500">No hay datos de score disponibles</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                  </Card>
                </div>

                {/* Gráfico de temperatura histórica */}
                <div className="relative">
                  <div className="absolute -inset-2 rounded-xl bg-gradient-to-r from-blue-500/20 via-sky-500/20 to-cyan-500/20 opacity-50 blur-lg"></div>
                  <Card className="relative overflow-hidden border-0 bg-gradient-to-b from-slate-900 to-slate-950">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-white flex items-center">
                        <Gauge className="h-4 w-4 mr-1.5 text-sky-400" />
                        Historial de Temperatura
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 pt-0 pb-2">
                      <div className="h-36">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={temperatureHistory}
                            margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="tempColorHot" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2}/>
                              </linearGradient>
                              <linearGradient id="tempColorWarm" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2}/>
                              </linearGradient>
                              <linearGradient id="tempColorCold" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                            <XAxis 
                              dataKey="fecha_formateada" 
                              tick={{ fill: '#94a3b8', fontSize: 10 }} 
                              axisLine={{ stroke: '#333' }}
                              tickLine={false}
                              minTickGap={20}
                            />
                            <YAxis 
                              domain={[0, 100]}
                              tick={{ fill: '#94a3b8', fontSize: 10 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <RechartTooltip 
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  const temp = getTemperature(payload[0].payload.score_nuevo);
                                  return (
                                    <div className="bg-slate-900 p-2 border border-slate-700 rounded shadow-md">
                                      <p className="text-xs text-slate-300">{`${label}`}</p>
                                      <p className={`text-xs font-bold ${temp.textColor}`}>
                                        {`Temperatura: ${temp.label}`}
                                      </p>
                                      <p className="text-xs text-slate-300">
                                        {`Score: ${payload[0].payload.score_nuevo}`}
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="score_nuevo"
                              stroke="#60a5fa"
                              fill="url(#tempColorCold)"
                              fillOpacity={1}
                              activeDot={{ r: 6, fill: '#60a5fa', stroke: '#fff', strokeWidth: 2 }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Leyenda de temperaturas */}
                      <div className="flex justify-center gap-4 pt-2 px-3">
                        <div className="flex items-center gap-1">
                          <div className="h-2.5 w-2.5 rounded-full bg-rose-500"></div>
                          <span className="text-xs text-slate-400">Hot</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="h-2.5 w-2.5 rounded-full bg-amber-500"></div>
                          <span className="text-xs text-slate-400">Warm</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="h-2.5 w-2.5 rounded-full bg-blue-500"></div>
                          <span className="text-xs text-slate-400">Cold</span>
                        </div>
                      </div>
                    </CardContent>
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500"></div>
                  </Card>
                </div>
                
                {/* Tarjetas de métricas - Satisfacción y Cualificación */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Tarjeta de Satisfacción */}
                  <div className="relative">
                    <div className="absolute -inset-2 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-green-500/20 opacity-50 blur-lg"></div>
                    <Card className="relative overflow-hidden border-0 bg-gradient-to-b from-slate-900 to-slate-950">
                      <CardContent className="p-4">
                        <div className="flex flex-col">
                          <div className="flex justify-between items-center">
                            <h3 className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                              <ThumbsUp className="h-3.5 w-3.5 text-emerald-400" />
                              Satisfacción
                            </h3>
                            <span className={`text-lg font-bold ${satisfactionLevel >= 70 ? 'text-emerald-500' : satisfactionLevel >= 40 ? 'text-amber-500' : 'text-rose-500'}`}>
                              {satisfactionLevel}%
                            </span>
                          </div>
                          
                          <div className="mt-3 w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                satisfactionLevel >= 70 ? 'bg-emerald-500' : 
                                satisfactionLevel >= 40 ? 'bg-amber-500' : 
                                'bg-rose-500'
                              }`}
                              style={{ width: `${satisfactionLevel}%` }}
                            >
                              <div className="h-full w-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent"></div>
                            </div>
                          </div>
                          
                          <div className="mt-3 flex justify-center items-center">
                            {satisfactionLevel >= 70 ? (
                              <Badge className="gap-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                <CheckCircle2 className="h-3 w-3" />
                                Excelente
                              </Badge>
                            ) : satisfactionLevel >= 40 ? (
                              <Badge className="gap-1 bg-amber-500/20 text-amber-400 border-amber-500/30">
                                <AlertCircle className="h-3 w-3" />
                                Promedio
                              </Badge>
                            ) : (
                              <Badge className="gap-1 bg-rose-500/20 text-rose-400 border-rose-500/30">
                                <ThumbsDown className="h-3 w-3" />
                                Bajo
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500"></div>
                    </Card>
                  </div>

                  {/* Tarjeta de Cualificación */}
                  <div className="relative">
                    <div className="absolute -inset-2 rounded-xl bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-fuchsia-500/20 opacity-50 blur-lg"></div>
                    <Card className="relative overflow-hidden border-0 bg-gradient-to-b from-slate-900 to-slate-950">
                      <CardContent className="p-4">
                        <div className="flex flex-col">
                          <div className="flex justify-between items-center">
                            <h3 className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                              <BarChart2 className="h-3.5 w-3.5 text-violet-400" />
                              Cualificación
                            </h3>
                            <span className={`text-lg font-bold ${qualificationLevel >= 70 ? 'text-violet-500' : qualificationLevel >= 40 ? 'text-amber-500' : 'text-rose-500'}`}>
                              {qualificationLevel}%
                            </span>
                          </div>
                          
                          {/* Gráfico de barras mini */}
                          <div className="mt-2 flex items-end justify-center gap-0.5 h-10">
                            {[0.4, 0.6, 0.5, 0.7, 0.8, qualificationLevel/100].map((value, idx) => (
                              <div 
                                key={idx} 
                                className={`w-3 rounded-t-sm ${
                                  idx === 5 
                                    ? (qualificationLevel >= 70 ? 'bg-violet-500' : qualificationLevel >= 40 ? 'bg-amber-500' : 'bg-rose-500')
                                    : 'bg-slate-700'
                                }`}
                                style={{ height: `${value * 100}%` }}
                              ></div>
                            ))}
                          </div>
                          
                          <div className="mt-3 flex justify-center items-center">
                            <Badge className="gap-1 bg-violet-500/20 text-violet-400 border-violet-500/30">
                              {qualificationLevel >= 70 ? 'Altamente cualificado' : 
                               qualificationLevel >= 50 ? 'Cualificado' : 
                               'Requiere cualificación'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500"></div>
                    </Card>
                  </div>
                </div>
                
                {/* Otras métricas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Conversaciones</span>
                      <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-200">
                        {conversationCount}
                      </Badge>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-slate-400">Mensajes</span>
                      <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-200">
                        {messageCount}
                      </Badge>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-slate-400">Días en etapa</span>
                      <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-200">
                        {selectedLead.dias_en_etapa_actual || 0}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-400">Etapa</span>
                      <Badge
                        style={{ 
                          backgroundColor: selectedLead.stage_color || "#6366f1",
                          color: "white"
                        }}
                      >
                        {selectedLead.stage_name || "Sin etapa"}
                      </Badge>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-slate-400">Probabilidad</span>
                      <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-200">
                        {selectedLead.probabilidad_cierre || 0}%
                      </Badge>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-slate-400">Canal</span>
                      <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-200 truncate max-w-[120px]">
                        {selectedLead.canal_origen || "Desconocido"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="profile" className="m-0">
              <div className="p-4 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center mb-2">
                    <User className="h-4 w-4 mr-1.5 text-indigo-400" />
                    Datos personales
                  </h4>
                  <Card className="overflow-hidden border-slate-800 bg-slate-900/70">
                    <CardContent className="p-3 space-y-2 text-sm">
                      {selectedLead.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <a className="text-indigo-400 hover:underline truncate" href={`mailto:${selectedLead.email}`}>
                            {selectedLead.email}
                          </a>
                        </div>
                      )}
                      {selectedLead.telefono && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <a className="text-white hover:underline" href={`https://wa.me/${selectedLead.telefono.replace(/\D/g, '')}`}>
                            {selectedLead.telefono}
                          </a>
                        </div>
                      )}
                      {selectedLead.ciudad && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-white">{selectedLead.ciudad}{selectedLead.pais ? `, ${selectedLead.pais}` : ''}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-white">Creado: {formatDate(selectedLead.created_at)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Información de pipeline */}
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center mb-2">
                    <BarChart3 className="h-4 w-4 mr-1.5 text-cyan-400" />
                    Pipeline
                  </h4>
                  <Card className="overflow-hidden border-slate-800 bg-slate-900/70">
                    <CardContent className="p-3 space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Etapa:</span>
                        {selectedLead.stage_name ? (
                          <Badge
                            style={{ 
                              backgroundColor: selectedLead.stage_color || "#6366f1",
                              color: "white"
                            }}
                          >
                            {selectedLead.stage_name}
                          </Badge>
                        ) : (
                          <span className="text-white">Sin etapa</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Canal:</span>
                        <Badge variant="outline" className="bg-slate-800 border-slate-700 text-white">
                          {selectedLead.canal_origen || "Desconocido"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Datos adicionales */}
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center mb-2">
                    <LineChart className="h-4 w-4 mr-1.5 text-emerald-400" />
                    Datos adicionales
                  </h4>
                  <Card className="overflow-hidden border-slate-800 bg-slate-900/70">
                    <CardContent className="p-3 space-y-2 text-sm">
                      {selectedLead.datos_adicionales && 
                      Object.keys(selectedLead.datos_adicionales).length > 0 ? (
                        Object.entries(selectedLead.datos_adicionales).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span className="text-slate-400">{key}:</span>
                            <span className="text-white font-medium">{String(value)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="py-2 text-center text-slate-400">
                          No hay datos adicionales
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="tags" className="m-0">
              <div className="p-4 space-y-4">
                {/* Etiquetas del lead */}
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 mr-1.5 text-indigo-400" />
                      <span>Etiquetas</span>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-white">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </h4>
                  <Card className="overflow-hidden border-slate-800 bg-slate-900/70">
                    <CardContent className="p-3">
                      {selectedLead.tags && selectedLead.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedLead.tags.map((tag) => (
                            <Badge
                              key={tag.id}
                              variant="outline"
                              className="h-6"
                              style={{
                                borderColor: tag.color,
                                color: tag.color
                              }}
                            >
                              {tag.nombre}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="py-2 text-center text-slate-400">
                          No hay etiquetas
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Productos de interés */}
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-1.5 text-amber-400" />
                      <span>Productos de interés</span>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-white">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </h4>
                  <Card className="overflow-hidden border-slate-800 bg-slate-900/70">
                    <CardContent className="p-3">
                      <div className="py-2 text-center text-slate-400">
                        No hay productos identificados
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="comments" className="m-0">
              <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-white flex items-center">
                    <MessageSquare className="h-4 w-4 mr-1.5 text-cyan-400" />
                    <span>Comentarios</span>
                  </h4>
                  <Button size="sm" variant="outline" className="h-8 bg-slate-800 border-slate-700 hover:bg-slate-700 text-white" onClick={onAddComment}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Añadir
                  </Button>
                </div>
                
                {isLoadingComments ? (
                  <div className="py-8 text-center text-sm text-slate-400">
                    Cargando comentarios...
                  </div>
                ) : leadComments.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">
                    No hay comentarios para este lead
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leadComments.map((comment) => (
                      <Card key={comment.id} className={cn(
                        "overflow-hidden border-slate-800 bg-slate-900/70",
                        comment.is_private && "border-amber-700/50 bg-amber-900/10"
                      )}>
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-slate-800 text-slate-300">
                                  {comment.user?.full_name?.[0] || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium text-white">
                                {comment.user?.full_name || "Usuario"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {comment.is_private && (
                                <Badge variant="outline" className="h-5 text-[10px] border-amber-700/50 text-amber-400">
                                  Privado
                                </Badge>
                              )}
                              <span className="text-xs text-slate-400">
                                {formatDate(comment.created_at)}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm whitespace-pre-wrap text-white">{comment.contenido}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="ai" className="m-0">
              <div className="p-4 space-y-4">
                <div className="relative">
                  <div className="absolute -inset-2 rounded-xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-indigo-500/20 opacity-50 blur-lg"></div>
                  <Card className="relative overflow-hidden border-0 bg-gradient-to-b from-slate-900 to-slate-950">
                    <CardContent className="p-5">
                      <h4 className="text-sm font-semibold text-white flex items-center mb-4">
                        <Bot className="h-4 w-4 mr-1.5 text-purple-400" />
                        <span>Evaluación de IA</span>
                      </h4>
                      
                      {/* Mini tarjetas de evaluación */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="rounded-lg bg-slate-900/50 p-3">
                          <span className="text-xs text-slate-400">Intención</span>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-base font-semibold text-white">Consulta</span>
                            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                              83%
                            </Badge>
                          </div>
                        </div>
                        <div className="rounded-lg bg-slate-900/50 p-3">
                          <span className="text-xs text-slate-400">Sentimiento</span>
                          <div className="mt-1">
                            <span className="text-base font-semibold text-emerald-400">Positivo</span>
                            <div className="mt-2 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '74%' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Intenciones detectadas */}
                      <div className="rounded-lg bg-slate-900/50 p-3">
                        <h5 className="text-xs font-semibold text-white mb-2">Intenciones detectadas</h5>
                        
                        {selectedLead.intenciones_detectadas ? (
                          <div className="space-y-2">
                            {selectedLead.intenciones_detectadas.split(',').map((intent, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <Badge variant="outline" className="font-normal border-slate-700 text-white">
                                  {intent.trim()}
                                </Badge>
                                <span className="text-xs text-slate-400">
                                  {Math.floor(Math.random() * 20 + 80)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-2 text-center text-slate-400">
                            No hay intenciones detectadas
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"></div>
                  </Card>
                </div>
                
                {/* Evaluaciones de LLM */}
                {selectedLead.ultima_evaluacion_llm && (
                  <div className="relative">
                    <div className="absolute -inset-2 rounded-xl bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-teal-500/20 opacity-50 blur-lg"></div>
                    <Card className="relative overflow-hidden border-0 bg-gradient-to-b from-slate-900 to-slate-950">
                      <CardContent className="p-5">
                        <h4 className="text-sm font-semibold text-white flex items-center mb-4">
                          <LineChart className="h-4 w-4 mr-1.5 text-cyan-400" />
                          Evaluación reciente
                        </h4>
                        
                        {typeof selectedLead.ultima_evaluacion_llm === 'object' ? (
                          <div className="space-y-2">
                            {Object.entries(selectedLead.ultima_evaluacion_llm).map(([key, value]) => (
                              <div key={key} className="flex justify-between p-2 border-b border-slate-800">
                                <span className="text-slate-400">{key}:</span>
                                <span className="text-white font-medium">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-white">{selectedLead.ultima_evaluacion_llm}</p>
                        )}
                      </CardContent>
                      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500"></div>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
          
          {/* Menú de navegación fijo en la parte inferior */}
          <div className="border-t border-slate-800 bg-slate-950 p-1">
            <TabsList className="grid grid-cols-5 bg-slate-900 border border-slate-800">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-slate-800">
                <BarChart4 className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="profile" className="data-[state=active]:bg-slate-800">
                <User className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="tags" className="data-[state=active]:bg-slate-800">
                <Tag className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="comments" className="data-[state=active]:bg-slate-800">
                <MessageSquare className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="ai" className="data-[state=active]:bg-slate-800">
                <Bot className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Sección de asignación */}
          <div className="border-t border-slate-800 bg-slate-950 p-2">
            <div className="flex items-center gap-2 justify-between">
              {selectedLead.asignado_a ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-indigo-900/50 text-indigo-200 text-xs">
                      {selectedLead.usuario_asignado?.nombre?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-xs text-white">
                    Asignado a {selectedLead.asignado_a === user?.id ? 'ti' : 
                    selectedLead.usuario_asignado?.nombre || 'otro usuario'}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400">Sin asignar</div>
              )}
              
              {selectedLead.asignado_a ? (
                selectedLead.asignado_a === user?.id ? (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-7 text-xs bg-slate-900 border-slate-800 hover:bg-slate-800 text-white"
                    onClick={handleReleaseAssignment}
                    disabled={isReleasing}
                  >
                    {isReleasing ? "Liberando..." : "Liberar"}
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-7 text-xs bg-slate-900 border-slate-800 hover:bg-slate-800 text-white"
                    onClick={openTransferDialog}
                  >
                    Transferir
                  </Button>
                )
              ) : (
                <Button 
                  size="sm" 
                  className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-white"
                  onClick={handleAssignToMe}
                  disabled={isAssigning}
                >
                  {isAssigning ? "Asignando..." : "Asignar a mí"}
                </Button>
              )}
            </div>
          </div>
        </Tabs>
      </div>
    </aside>
  );
};

export default LeadDetailSidebar;
