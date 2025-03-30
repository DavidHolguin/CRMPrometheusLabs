
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Edit, Save, Plus, User, Map, Calendar, 
  FileText, TrendingUp, MessageSquare, 
  User as UserIcon, Mail, Phone
} from "lucide-react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Lead } from "@/hooks/useLeads";
import { 
  ChartConfig, 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { 
  PolarGrid, 
  PolarRadiusAxis, 
  RadialBar, 
  RadialBarChart,
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  Label 
} from "recharts";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface LeadDataTabProps {
  lead: Lead;
  formatDate: (dateStr: string | null) => string;
}

export function LeadDataTab({ lead, formatDate }: LeadDataTabProps) {
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [customFields, setCustomFields] = useState<Array<{key: string, value: string}>>([]);
  const [newCustomField, setNewCustomField] = useState({key: "", value: ""});
  const [interactionTypes, setInteractionTypes] = useState<any[]>([]);
  
  // Convert lead.score to a number for all calculations and displays
  const scoreNumber = Number(lead.score || 0);
  
  // Setup form with default values from the lead
  const form = useForm({
    defaultValues: {
      nombre: lead.nombre || "",
      apellido: lead.apellido || "",
      email: lead.email || "",
      telefono: lead.telefono || "",
      documento_tipo: "DNI",
      documento_numero: "",
      fecha_nacimiento: "",
      direccion: lead.direccion || "",
      ciudad: lead.ciudad || "",
      pais: lead.pais || "",
      codigo_postal: "",
    }
  });
  
  const toggleEditMode = (field: string) => {
    setEditMode(prev => ({...prev, [field]: !prev[field]}));
  };
  
  const addCustomField = () => {
    if (newCustomField.key && newCustomField.value) {
      setCustomFields([...customFields, newCustomField]);
      setNewCustomField({key: "", value: ""});
    }
  };

  // Fetch lead interactions
  const { data: interactions = [], isLoading: loadingInteractions } = useQuery({
    queryKey: ["leadInteractions", lead.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_interactions")
        .select(`
          id, 
          created_at, 
          valor_score,
          interaction_type_id,
          lead_interaction_types(nombre, color)
        `)
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: true });
        
      if (error) {
        console.error("Error fetching interactions:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!lead.id,
  });

  // Fetch interaction types
  useEffect(() => {
    const fetchInteractionTypes = async () => {
      try {
        const { data, error } = await supabase
          .from("lead_interaction_types")
          .select("*")
          .order("nombre");
          
        if (error) throw error;
        
        setInteractionTypes(data || []);
      } catch (error) {
        console.error("Error fetching interaction types:", error);
      }
    };
    
    fetchInteractionTypes();
  }, []);
  
  // Function to render field with edit toggle
  const renderEditableField = (label: string, field: string, icon: JSX.Element, value: string) => {
    return (
      <div className="mb-3 bg-card rounded-md p-3 border shadow-sm">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium">{label}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7" 
            onClick={() => toggleEditMode(field)}
          >
            {editMode[field] ? <Save size={15} /> : <Edit size={15} />}
          </Button>
        </div>
        
        {!value && !editMode[field] ? (
          <div 
            className="text-sm text-muted-foreground cursor-pointer p-2 border border-dashed rounded hover:bg-accent/50 flex justify-center"
            onClick={() => toggleEditMode(field)}
          >
            Click para agregar {label}
          </div>
        ) : editMode[field] ? (
          <FormField
            control={form.control}
            name={field as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    className="h-8 text-sm" 
                    placeholder={label}
                    {...formField}
                    autoFocus
                  />
                </FormControl>
              </FormItem>
            )}
          />
        ) : (
          <div className="text-sm py-1">{value}</div>
        )}
      </div>
    );
  };

  // Get stats for charts
  const messageCount = lead.message_count || 0;
  const interactionCount = lead.interaction_count || 0;
  
  // Helper function to get score color
  function getScoreColor(score: number): string {
    if (score > 75) return "hsl(var(--chart-3))"; // Green
    if (score > 50) return "hsl(var(--chart-1))"; // Orange
    if (score > 25) return "hsl(var(--chart-4))"; // Yellow
    return "hsl(var(--chart-5))"; // Red
  }

  // Generate message activity data (fake data for now, will be replaced with real data)
  const generateMessageActivityData = () => {
    const today = new Date();
    const data = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      data.push({
        date: dateStr,
        messages: Math.floor(Math.random() * 5), // Random value between 0-5
        interactions: Math.floor(Math.random() * 3) // Random value between 0-3
      });
    }
    return data;
  };

  const messageActivityData = useMemo(() => generateMessageActivityData(), []);
  
  // Chart configurations
  const scoreChartConfig = {
    score: {
      label: "Puntuación",
      color: getScoreColor(scoreNumber),
    },
  } satisfies ChartConfig;

  const activityChartConfig = {
    activity: {
      label: "Actividad",
    },
    messages: {
      label: "Mensajes",
      color: "hsl(var(--chart-1))",
    },
    interactions: {
      label: "Interacciones",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  const [activeActivityChart, setActiveActivityChart] = useState<'messages' | 'interactions'>('messages');

  const scoreChartData = [
    { name: "score", value: scoreNumber, fill: getScoreColor(scoreNumber) }
  ];

  // Calculate totals for message data
  const activityTotals = useMemo(() => ({
    messages: messageActivityData.reduce((acc, curr) => acc + curr.messages, 0),
    interactions: messageActivityData.reduce((acc, curr) => acc + curr.interactions, 0),
  }), [messageActivityData]);

  return (
    <div>
      {/* Tabs for main navigation - changed order, improved styling */}
      <Tabs defaultValue="progreso" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="progreso">Progreso</TabsTrigger>
          <TabsTrigger value="datos">Datos Personales</TabsTrigger>
        </TabsList>
        
        {/* Progreso Tab Content - Redesigned with new charts */}
        <TabsContent value="progreso" className="space-y-4">
          {/* Score Section */}
          <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
              <CardTitle className="text-lg">Puntuación del Lead</CardTitle>
              <CardDescription>Puntaje basado en actividades e interacciones</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <ChartContainer
                config={scoreChartConfig}
                className="mx-auto aspect-square max-h-[250px]"
              >
                <RadialBarChart
                  data={scoreChartData}
                  startAngle={0}
                  endAngle={360}
                  innerRadius={80}
                  outerRadius={110}
                >
                  <PolarGrid
                    gridType="circle"
                    radialLines={false}
                    stroke="none"
                    className="first:fill-muted last:fill-background"
                    polarRadius={[86, 74]}
                  />
                  <RadialBar dataKey="value" background cornerRadius={10} />
                  <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
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
                                className="fill-foreground text-4xl font-bold"
                              >
                                {scoreNumber}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className="fill-muted-foreground"
                              >
                                puntos
                              </tspan>
                            </text>
                          );
                        }
                        return null;
                      }}
                    />
                  </PolarRadiusAxis>
                </RadialBarChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm pt-2">
              <div className="flex items-center gap-2 font-medium leading-none">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Mejorando con {interactionCount} interacciones recientes
              </div>
              <div className="leading-none text-muted-foreground">
                Etapa actual: {lead.stage_name || "Sin etapa"}
              </div>
            </CardFooter>
          </Card>

          {/* Activity/Messages Chart */}
          <Card>
            <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
              <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                <CardTitle>Actividad del Lead</CardTitle>
                <CardDescription>
                  Historial de mensajes e interacciones
                </CardDescription>
              </div>
              <div className="flex">
                {["messages", "interactions"].map((key) => {
                  const chart = key as keyof typeof activityTotals;
                  return (
                    <button
                      key={chart}
                      data-active={activeActivityChart === chart}
                      className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                      onClick={() => setActiveActivityChart(chart as 'messages' | 'interactions')}
                    >
                      <span className="text-xs text-muted-foreground">
                        {activityChartConfig[chart]?.label || chart}
                      </span>
                      <span className="text-lg font-bold leading-none sm:text-3xl">
                        {activityTotals[chart].toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:p-6">
              <ChartContainer
                config={activityChartConfig}
                className="aspect-auto h-[250px] w-full"
              >
                <LineChart
                  accessibilityLayer
                  data={messageActivityData}
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
                      const date = new Date(value);
                      return date.toLocaleDateString("es-ES", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="w-[150px]"
                        nameKey="activity"
                        labelFormatter={(value) => {
                          return new Date(value).toLocaleDateString("es-ES", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          });
                        }}
                      />
                    }
                  />
                  <Line
                    dataKey={activeActivityChart}
                    type="monotone"
                    stroke={`var(--color-${activeActivityChart})`}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Lead interaction history - mini timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Interacciones Recientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingInteractions ? (
                <div className="flex justify-center py-4">
                  <div className="animate-pulse h-24 w-full bg-muted rounded" />
                </div>
              ) : interactions.length === 0 ? (
                <div className="text-center py-3 text-muted-foreground text-sm">
                  No hay interacciones registradas
                </div>
              ) : (
                <div className="space-y-3">
                  {interactions.slice(0, 5).map((interaction: any) => (
                    <div 
                      key={interaction.id} 
                      className="flex items-start gap-3 p-2 border-l-2 rounded-sm"
                      style={{ borderLeftColor: interaction.lead_interaction_types?.color || '#cccccc' }}
                    >
                      <div>
                        <div className="text-sm font-medium">
                          {interaction.lead_interaction_types?.nombre || "Interacción"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(interaction.created_at)} · Valor: {interaction.valor_score}/10
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {interactions.length > 5 && (
                    <Button variant="outline" size="sm" className="w-full">
                      Ver todas las interacciones ({interactions.length})
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Current stage info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Etapa actual</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <Badge 
                style={{ backgroundColor: lead.stage_color }} 
                className="w-full justify-center py-2 text-center"
              >
                {lead.stage_name}
              </Badge>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Datos Personales Tab Content - with secondary styling */}
        <TabsContent value="datos" className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Información Personal</h3>
            <Separator />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Form {...form}>
                <div className="space-y-1">
                  {renderEditableField("Tipo de Documento", "documento_tipo", <FileText size={16} className="text-purple-500" />, form.getValues("documento_tipo"))}
                  {renderEditableField("Número de Documento", "documento_numero", <FileText size={16} className="text-purple-500" />, form.getValues("documento_numero"))}
                  {renderEditableField("Fecha de Nacimiento", "fecha_nacimiento", <Calendar size={16} className="text-green-500" />, form.getValues("fecha_nacimiento"))}
                </div>
              </Form>
            </div>
            <div>
              <Form {...form}>
                <div className="space-y-1">
                  {renderEditableField("Dirección", "direccion", <Map size={16} className="text-orange-500" />, form.getValues("direccion"))}
                  {renderEditableField("Ciudad", "ciudad", <Map size={16} className="text-orange-500" />, form.getValues("ciudad"))}
                  {renderEditableField("País", "pais", <Map size={16} className="text-orange-500" />, form.getValues("pais"))}
                  {renderEditableField("Código Postal", "codigo_postal", <Map size={16} className="text-orange-500" />, form.getValues("codigo_postal"))}
                </div>
              </Form>
            </div>
          </div>
          
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Información de Contacto</h3>
            <Separator />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-medium">{lead.email || "No disponible"}</div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">Teléfono</div>
                    <div className="font-medium">{lead.telefono || "No disponible"}</div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-4">
            <div className="space-y-1 mb-3">
              <h3 className="text-lg font-semibold">Campos Personalizados</h3>
              <Separator />
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-muted-foreground">
                Agrega información adicional personalizada
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={addCustomField}
                disabled={!newCustomField.key || !newCustomField.value}
              >
                <Plus size={14} className="mr-1" />
                Agregar
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Input 
                placeholder="Nombre del campo" 
                size="sm" 
                className="h-8 text-xs"
                value={newCustomField.key}
                onChange={(e) => setNewCustomField({...newCustomField, key: e.target.value})}
              />
              <Input 
                placeholder="Valor" 
                size="sm" 
                className="h-8 text-xs"
                value={newCustomField.value}
                onChange={(e) => setNewCustomField({...newCustomField, value: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {customFields.map((field, index) => (
                <div key={index} className="flex justify-between items-center bg-accent/20 p-2 rounded-md">
                  <span className="text-xs font-medium">{field.key}:</span>
                  <span className="text-xs">{field.value}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
