
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Save, Plus, User, Map, Calendar, FileText, TrendingUp } from "lucide-react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Lead } from "@/hooks/useLeads";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart, Label } from "recharts";

interface LeadDataTabProps {
  lead: Lead;
  formatDate: (dateStr: string | null) => string;
}

export function LeadDataTab({ lead, formatDate }: LeadDataTabProps) {
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [customFields, setCustomFields] = useState<Array<{key: string, value: string}>>([]);
  const [newCustomField, setNewCustomField] = useState({key: "", value: ""});
  
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
  
  // Get interaction stats for visuals
  const messageCount = lead.message_count || 0;
  const interactionCount = lead.interaction_count || 0;
  
  // Convert lead.score to a number for all calculations and displays
  const scoreNumber = Number(lead.score || 0);
  
  // Chart config for score
  const scoreChartData = [
    { name: "score", value: scoreNumber, fill: getScoreColor(scoreNumber) }
  ];
  
  const scoreChartConfig = {
    score: {
      label: "Puntuación",
      color: getScoreColor(scoreNumber),
    },
  } satisfies ChartConfig;
  
  // Chart config for messages
  const messageChartData = [
    { name: "messages", value: messageCount, fill: "hsl(var(--chart-1))" }
  ];
  
  const messageChartConfig = {
    messages: {
      label: "Mensajes",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;
  
  // Chart config for interactions
  const interactionChartData = [
    { name: "interactions", value: interactionCount, fill: "hsl(var(--chart-2))" }
  ];
  
  const interactionChartConfig = {
    interactions: {
      label: "Interacciones",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;
  
  // Helper function to get score color
  function getScoreColor(score: number): string {
    if (score > 75) return "hsl(var(--chart-3))"; // Green
    if (score > 50) return "hsl(var(--chart-1))"; // Orange
    if (score > 25) return "hsl(var(--chart-4))"; // Yellow
    return "hsl(var(--chart-5))"; // Red
  }
  
  return (
    <div>
      {/* Tabs for main navigation - changed order and styling */}
      <Tabs defaultValue="progreso" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="progreso">Progreso</TabsTrigger>
          <TabsTrigger value="datos">Datos Personales</TabsTrigger>
        </TabsList>
        
        {/* Progreso Tab Content */}
        <TabsContent value="progreso" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="flex flex-col">
              <CardHeader className="items-center pb-0">
                <CardTitle className="text-lg">Puntuación</CardTitle>
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
            </Card>
            
            <div className="space-y-3">
              <Card className="flex flex-col">
                <CardHeader className="items-center pb-0">
                  <CardTitle className="text-sm font-medium">Mensajes</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                  <ChartContainer
                    config={messageChartConfig}
                    className="mx-auto aspect-square max-h-[150px]"
                  >
                    <RadialBarChart
                      data={messageChartData}
                      startAngle={0}
                      endAngle={Math.min(360, messageCount * 18)}
                      innerRadius={50}
                      outerRadius={70}
                    >
                      <PolarGrid
                        gridType="circle"
                        radialLines={false}
                        stroke="none"
                        className="first:fill-muted last:fill-background"
                      />
                      <RadialBar dataKey="value" background cornerRadius={5} />
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
                                    className="fill-foreground text-2xl font-bold"
                                  >
                                    {messageCount}
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
              </Card>
              
              <Card className="flex flex-col">
                <CardHeader className="items-center pb-0">
                  <CardTitle className="text-sm font-medium">Interacciones</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                  <ChartContainer
                    config={interactionChartConfig}
                    className="mx-auto aspect-square max-h-[150px]"
                  >
                    <RadialBarChart
                      data={interactionChartData}
                      startAngle={0}
                      endAngle={Math.min(360, interactionCount * 36)}
                      innerRadius={50}
                      outerRadius={70}
                    >
                      <PolarGrid
                        gridType="circle"
                        radialLines={false}
                        stroke="none"
                        className="first:fill-muted last:fill-background"
                      />
                      <RadialBar dataKey="value" background cornerRadius={5} />
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
                                    className="fill-foreground text-2xl font-bold"
                                  >
                                    {interactionCount}
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
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Etapa actual</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <Badge style={{ backgroundColor: lead.stage_color }} className="w-full justify-center py-2 text-center">
                    {lead.stage_name}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Datos Personales Tab Content - with secondary styling */}
        <TabsContent value="datos" className="space-y-4">
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
              
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium">Campos Personalizados</h4>
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
                
                <div className="space-y-2">
                  {customFields.map((field, index) => (
                    <div key={index} className="flex justify-between items-center bg-accent/20 p-2 rounded-md">
                      <span className="text-xs font-medium">{field.key}:</span>
                      <span className="text-xs">{field.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
