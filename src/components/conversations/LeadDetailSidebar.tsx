import React, { useState, useRef } from 'react';
import { Lead } from '@/hooks/useLeads';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
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
  LineChart,
  Settings,
  Gauge,
  Activity,
  Send,
  CalendarIcon
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
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
  const [scoreValue, setScoreValue] = useState(selectedLead?.score || 0);
  const [isEditingScore, setIsEditingScore] = useState(false);
  const [textMessageOpen, setTextMessageOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  
  // Forms
  const messageForm = useForm<z.infer<typeof messageFormSchema>>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      message: "",
    },
  });
  
  const emailForm = useForm<z.infer<typeof emailFormSchema>>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      subject: "",
      body: "",
    },
  });
  
  const calendarForm = useForm<z.infer<typeof calendarFormSchema>>({
    resolver: zodResolver(calendarFormSchema),
    defaultValues: {
      title: "",
      date: format(new Date(), "yyyy-MM-dd"),
      time: format(new Date(), "HH:mm"),
      notes: "",
    },
  });
  
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
  
  // Datos simulados para los gráficos históricos
  const generateHistoricData = () => {
    const today = new Date();
    const data = [];
    
    for (let i = 14; i >= 0; i--) {
      const date = subDays(today, i);
      const value = Math.floor(Math.random() * 15) + 3;
      data.push({
        date,
        value
      });
    }
    
    return data;
  };
  
  const historicInteractions = generateHistoricData();
  const historicMessages = generateHistoricData();

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
  const scorePercentage = scoreValue;
  
  // Determinar el color del score
  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-500";
    if (score >= 40) return "text-amber-500";
    return "text-rose-500";
  };
  
  // Determinar la temperatura basada en el score
  const getTemperature = (score: number) => {
    if (score >= 70) return { label: "Hot", color: "bg-rose-500" };
    if (score >= 40) return { label: "Warm", color: "bg-amber-500" };
    return { label: "Cold", color: "bg-blue-500" };
  };
  
  const temperature = getTemperature(scorePercentage);

  // Calcular datos para mini gráficos
  const conversationCount = leadConversations?.length || 0;
  const messageCount = selectedLead.message_count || 0;
  
  // Manejar cambio de score
  const handleScoreChange = (value: number[]) => {
    setScoreValue(value[0]);
  };
  
  const handleScoreSubmit = () => {
    // Aquí iría la lógica para actualizar el score en la base de datos
    toast({
      title: "Score actualizado",
      description: `Se ha actualizado el score a ${scoreValue}`,
    });
    setIsEditingScore(false);
  };
  
  const maxValue = Math.max(...historicInteractions.map(d => d.value));
  
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
          
          {/* Botones de acción */}
          <div className="mt-3 flex justify-between gap-1">
            <TooltipProvider>
              {/* Botón de llamada */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 h-9 gap-1 bg-slate-900 hover:bg-slate-800 border-slate-800"
                    asChild
                  >
                    <a 
                      href={`tel:${selectedLead.telefono?.replace(/\D/g, '') || ''}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Phone className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs">Llamar</span>
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Llamar a {selectedLead.telefono || "contacto"}</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Botón de mensaje */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Popover open={textMessageOpen} onOpenChange={setTextMessageOpen}>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 h-9 gap-1 bg-slate-900 hover:bg-slate-800 border-slate-800"
                      >
                        <MessageSquare className="h-4 w-4 text-sky-400" />
                        <span className="text-xs">Mensaje</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="center">
                      <div className="bg-slate-900 p-4 rounded-t-md border-b border-slate-800">
                        <h3 className="text-sm font-medium text-white">Enviar mensaje</h3>
                        <p className="text-xs text-slate-400">A: {selectedLead.telefono || "Sin teléfono"}</p>
                      </div>
                      <div className="p-4 bg-slate-950">
                        <Form {...messageForm}>
                          <form onSubmit={messageForm.handleSubmit(handleMessageSubmit)} className="space-y-3">
                            <FormField
                              control={messageForm.control}
                              name="message"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Escribe tu mensaje..." 
                                      className="resize-none bg-slate-900 border-slate-800 text-white"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex justify-end">
                              <Button 
                                type="submit" 
                                size="sm" 
                                className="bg-sky-600 hover:bg-sky-500 text-white flex gap-1 items-center"
                              >
                                <Send className="h-3.5 w-3.5" />
                                Enviar
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </div>
                    </PopoverContent>
                  </Popover>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enviar mensaje SMS</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Botón de correo */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 h-9 gap-1 bg-slate-900 hover:bg-slate-800 border-slate-800"
                      >
                        <Mail className="h-4 w-4 text-indigo-400" />
                        <span className="text-xs">Email</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-950 border-slate-800 text-white">
                      <DialogHeader>
                        <DialogTitle>Enviar correo electrónico</DialogTitle>
                        <DialogDescription className="text-slate-400">
                          Para: {selectedLead.email || "Sin correo electrónico"}
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...emailForm}>
                        <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                          <FormField
                            control={emailForm.control}
                            name="subject"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">Asunto</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Asunto del correo..." 
                                    className="bg-slate-900 border-slate-800 text-white"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={emailForm.control}
                            name="body"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">Mensaje</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Cuerpo del correo..." 
                                    className="resize-none bg-slate-900 border-slate-800 text-white h-32"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <Button 
                              type="button" 
                              variant="outline"
                              className="bg-slate-900 border-slate-800 text-white"
                              onClick={() => setEmailDialogOpen(false)}
                            >
                              Cancelar
                            </Button>
                            <Button 
                              type="submit" 
                              className="bg-indigo-600 hover:bg-indigo-500 text-white"
                            >
                              Enviar correo
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enviar correo electrónico</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Botón de calendario */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Dialog open={calendarDialogOpen} onOpenChange={setCalendarDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 h-9 gap-1 bg-slate-900 hover:bg-slate-800 border-slate-800"
                      >
                        <CalendarIcon className="h-4 w-4 text-violet-400" />
                        <span className="text-xs">Agendar</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-950 border-slate-800 text-white">
                      <DialogHeader>
                        <DialogTitle>Agendar evento</DialogTitle>
                        <DialogDescription className="text-slate-400">
                          Crear evento con {selectedLead.nombre} {selectedLead.apellido}
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...calendarForm}>
                        <form onSubmit={calendarForm.handleSubmit(handleCalendarSubmit)} className="space-y-4">
                          <FormField
                            control={calendarForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">Título</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Título del evento..." 
                                    className="bg-slate-900 border-slate-800 text-white"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={calendarForm.control}
                              name="date"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-white">Fecha</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="date" 
                                      className="bg-slate-900 border-slate-800 text-white"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={calendarForm.control}
                              name="time"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-white">Hora</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="time" 
                                      className="bg-slate-900 border-slate-800 text-white"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={calendarForm.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">Notas</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Notas adicionales..." 
                                    className="resize-none bg-slate-900 border-slate-800 text-white h-20"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <Button 
                              type="button" 
                              variant="outline"
                              className="bg-slate-900 border-slate-800 text-white"
                              onClick={() => setCalendarDialogOpen(false)}
                            >
                              Cancelar
                            </Button>
                            <Button 
                              type="submit" 
                              className="bg-violet-600 hover:bg-violet-500 text-white"
                            >
                              Guardar evento
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Agendar evento</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Contenido principal con pestañas */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <TabsContent value="dashboard" className="m-0 p-0">
              <div className="p-4 space-y-6">
                {/* Panel de score con interactividad */}
                <div className="relative">
                  <div className="absolute -inset-2 rounded-xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-50 blur-lg"></div>
                  <Card className="relative overflow-hidden border-0 bg-gradient-to-b from-slate-900 to-slate-950">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-white flex items-center">
                          <Gauge className="h-4 w-4 mr-1.5 text-indigo-400" />
                          Calificación del Lead
                        </h4>
                        <button 
                          onClick={() => setIsEditingScore(!isEditingScore)}
                          className="h-7 w-7 rounded-full flex items-center justify-center bg-slate-800 hover:bg-slate-700 transition-colors"
                        >
                          <Settings className="h-4 w-4 text-slate-300" />
                        </button>
                      </div>
                      
                      <div className="flex justify-center relative">
                        <div className="relative h-32 w-32">
                          <svg className="h-32 w-32 -rotate-90 transform" viewBox="0 0 36 36">
                            <circle
                              cx="18"
                              cy="18"
                              r="16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="text-slate-800"
                            ></circle>
                            <circle
                              cx="18"
                              cy="18"
                              r="16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeDasharray="100"
                              strokeDashoffset={100 - scorePercentage}
                              className={cn(
                                scorePercentage >= 70 ? "text-emerald-500" :
                                scorePercentage >= 40 ? "text-amber-500" :
                                "text-rose-500"
                              )}
                            ></circle>
                          </svg>
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                            <span className={cn("text-3xl font-bold", getScoreColor(scorePercentage))}>
                              {scorePercentage}
                            </span>
                            <p className="text-xs text-slate-400 mt-1">/ 100</p>
                          </div>
                        </div>
                        
                        <div className="absolute right-0 bottom-0 flex items-center gap-2">
                          <Badge className={`${temperature.color} text-white`}>
                            {temperature.label}
                          </Badge>
                        </div>
                      </div>
                      
                      {isEditingScore && (
                        <div className="mt-3 space-y-3">
                          <Slider
                            defaultValue={[scorePercentage]}
                            max={100}
                            step={1}
                            onValueChange={handleScoreChange}
                            className="py-4"
                          />
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1 bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300"
                              onClick={() => setIsEditingScore(false)}
                            >
                              Cancelar
                            </Button>
                            <Button 
                              size="sm" 
                              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white"
                              onClick={handleScoreSubmit}
                            >
                              Guardar
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                  </Card>
                </div>
                
                {/* Tarjeta de estadísticas y métricas */}
                <div className="relative">
                  <div className="absolute -inset-2 rounded-xl bg-gradient-to-r from-cyan-500/20 via-sky-500/20 to-blue-500/20 opacity-50 blur-lg"></div>
                  <Card className="relative overflow-hidden border-0 bg-gradient-to-b from-slate-900 to-slate-950">
                    <CardContent className="p-5">
                      <h4 className="text-sm font-semibold text-white flex items-center mb-4">
                        <BarChart3 className="h-4 w-4 mr-1.5 text-cyan-400" />
                        Métricas de Actividad
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-slate-900/50 p-3">
                          <p className="text-xs font-medium text-slate-400">Mensajes totales</p>
                          <div className="flex items-end justify-between mt-1">
                            <p className="text-xl font-bold text-white">{messageCount}</p>
                            <span className="text-xs font-medium text-emerald-500">+12.3%</span>
                          </div>
                        </div>
                        
                        <div className="rounded-lg bg-slate-900/50 p-3">
                          <p className="text-xs font-medium text-slate-400">Conversaciones</p>
                          <div className="flex items-end justify-between mt-1">
                            <p className="text-xl font-bold text-white">{conversationCount}</p>
                            <span className="text-xs font-medium text-emerald-500">+8.1%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 h-24 overflow-hidden rounded-lg bg-slate-900/50 p-3">
                        <div className="flex justify-between items-end h-full">
                          {historicInteractions.slice(-10).map((item, i) => {
                            const heightPercent = (item.value / maxValue) * 100;
                            return (
                              <div key={i} className="w-2.5 rounded-sm bg-cyan-500/30 group">
                                <div 
                                  className="w-full rounded-sm bg-cyan-500 transition-all duration-300 group-hover:opacity-100 opacity-80"
                                  style={{ height: `${heightPercent}%` }}
                                ></div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                        <div>{formatShortDate(historicInteractions[0].date)}</div>
                        <div>Actividad histórica</div>
                        <div>{formatShortDate(historicInteractions[historicInteractions.length-1].date)}</div>
                      </div>
                    </CardContent>
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500"></div>
                  </Card>
                </div>
                
                {/* Tarjeta de eventos clave */}
                <div className="relative">
                  <div className="absolute -inset-2 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-green-500/20 opacity-50 blur-lg"></div>
                  <Card className="relative overflow-hidden border-0 bg-gradient-to-b from-slate-900 to-slate-950">
                    <CardContent className="p-5">
                      <h4 className="text-sm font-semibold text-white flex items-center mb-4">
                        <Activity className="h-4 w-4 mr-1.5 text-emerald-400" />
                        Eventos Recientes
                      </h4>
                      
                      <div className="space-y-3">
                        {/* Evento 1 */}
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className="bg-slate-900 text-emerald-500 text-xs font-medium rounded px-2 py-1">
                              {format(new Date(), "MMM", { locale: es })}
                            </div>
                            <div className="text-white font-bold text-lg">
                              {format(new Date(), "dd")}
                            </div>
                            <div className="text-xs text-slate-400">
                              {format(new Date(), "E", { locale: es })}
                            </div>
                          </div>
                          
                          <div className="flex-1 bg-slate-900/50 rounded-lg p-3">
                            <div className="flex justify-between items-start mb-1">
                              <div className="font-medium text-sm text-white">Primera interacción</div>
                              <Badge variant="outline" className="text-[10px] bg-slate-800 border-slate-700 text-slate-300">
                                {format(new Date(), "HH:mm")}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-400">El lead inició conversación a través del canal de WhatsApp</p>
                          </div>
                        </div>
                        
                        {/* Evento 2 */}
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className="bg-slate-900 text-emerald-500 text-xs font-medium rounded px-2 py-1">
                              {format(subDays(new Date(), 1), "MMM", { locale: es })}
                            </div>
                            <div className="text-white font-bold text-lg">
                              {format(subDays(new Date(), 1), "dd")}
                            </div>
                            <div className="text-xs text-slate-400">
                              {format(subDays(new Date(), 1), "E", { locale: es })}
                            </div>
                          </div>
                          
                          <div className="flex-1 bg-slate-900/50 rounded-lg p-3">
                            <div className="flex justify-between items-start mb-1">
                              <div className="font-medium text-sm text-white">Actualización de score</div>
                              <Badge variant="outline" className="text-[10px] bg-slate-800 border-slate-700 text-slate-300">
                                {format(subDays(new Date(), 1), "HH:mm")}
                              </Badge>
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-2">
                              <span>50</span>
                              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                              <span className="text-emerald-500">75</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500"></div>
                  </Card>
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
                                <AvatarFallback className="text-xs bg-slate-800 text-slate-300">
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
