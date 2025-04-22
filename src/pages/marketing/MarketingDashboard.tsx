import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, 
  BarChart3, 
  Target, 
  Calendar, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight,
  FileBarChart,
  Megaphone,
  Share2,
  PlusCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  TooltipProps,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

// Datos de ejemplo para pruebas
const campaniasActivasData = [
  { nombre: "Promoción Verano 2025", estado: "active", objetivo: "conversion", presupuesto: 1500, gastado: 750, conversiones: 125, ctr: 4.2 },
  { nombre: "Campaña de Email Reactivación", estado: "active", objetivo: "engagement", presupuesto: 800, gastado: 320, conversiones: 68, ctr: 3.8 },
  { nombre: "Webinar Producto Nuevo", estado: "scheduled", objetivo: "awareness", presupuesto: 1200, gastado: 0, conversiones: 0, ctr: 0 },
];

const rendimientoData = [
  { mes: "Ene", leads: 120, conversiones: 32, meta: 100 },
  { mes: "Feb", leads: 140, conversiones: 45, meta: 100 },
  { mes: "Mar", leads: 180, conversiones: 52, meta: 100 },
  { mes: "Abr", leads: 190, conversiones: 58, meta: 110 },
  { mes: "May", leads: 250, conversiones: 75, meta: 110 },
  { mes: "Jun", leads: 280, conversiones: 98, meta: 120 },
];

const distribucionCanalesData = [
  { name: "Redes Sociales", value: 45, color: "hsl(var(--chart-1))" },
  { name: "Email", value: 28, color: "hsl(var(--chart-2))" },
  { name: "Búsqueda", value: 17, color: "hsl(var(--chart-3))" },
  { name: "Referido", value: 10, color: "hsl(var(--chart-4))" },
];

const insightsData = [
  { 
    tipo: "tendencia", 
    titulo: "Aumento en CTR de campañas de email", 
    descripcion: "Las tasas de clic en campañas de email han aumentado un 18% desde la implementación de asuntos personalizados.",
    impacto: "alto",
    categoria: "contenido"
  },
  { 
    tipo: "oportunidad", 
    titulo: "Audiencia sin explotar en LinkedIn", 
    descripcion: "Hemos identificado un segmento de audiencia profesional en LinkedIn que no estamos aprovechando adecuadamente.",
    impacto: "medio",
    categoria: "audiencia"
  },
  { 
    tipo: "recomendacion", 
    titulo: "Optimizar landing pages para móviles", 
    descripcion: "El 68% del tráfico proviene de dispositivos móviles pero las conversiones son bajas. Recomendamos optimizar la experiencia mobile.",
    impacto: "alto",
    categoria: "canales"
  },
];

const MarketingDashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Estado para pesañas
  const [activeTab, setActiveTab] = useState("overview");

  // Función para formatear números con separadores de miles
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  // Obtener el porcentaje de presupuesto gastado
  const getPresupuestoGastado = () => {
    const totalPresupuesto = campaniasActivasData.reduce((acc, curr) => acc + curr.presupuesto, 0);
    const totalGastado = campaniasActivasData.reduce((acc, curr) => acc + curr.gastado, 0);
    return totalPresupuesto > 0 ? Math.round((totalGastado / totalPresupuesto) * 100) : 0;
  };

  // Obtener el número total de campañas activas
  const getCampaniasActivas = () => {
    return campaniasActivasData.filter(c => c.estado === "active").length;
  };

  // Obtener el total de conversiones
  const getTotalConversiones = () => {
    return campaniasActivasData.reduce((acc, curr) => acc + curr.conversiones, 0);
  };

  // Calcular el crecimiento de leads respecto al mes anterior
  const getLeadsGrowth = () => {
    if (rendimientoData.length < 2) return { value: 0, trend: "neutral" };
    
    const currentMonth = rendimientoData[rendimientoData.length - 1].leads;
    const prevMonth = rendimientoData[rendimientoData.length - 2].leads;
    
    const percentChange = prevMonth > 0 ? ((currentMonth - prevMonth) / prevMonth) * 100 : 0;
    const trend = percentChange >= 0 ? "up" : "down";
    
    return {
      value: Math.abs(Math.round(percentChange * 10) / 10),
      trend
    };
  };

  // Crecimiento de leads
  const leadsGrowth = getLeadsGrowth();

  return (
    <div className="space-y-6 py-[14px] px-[21px]">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Marketing</h1>
          <p className="text-muted-foreground">
            Dashboard de campañas, contenido y rendimiento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Nueva Campaña
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="overview" className="py-2">
            <FileBarChart className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline-block">Resumen</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="py-2">
            <Megaphone className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline-block">Campañas</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="py-2">
            <Share2 className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline-block">Insights</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* KPIs Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Presupuesto Utilizado
                    </p>
                    {isLoading ? 
                      <Skeleton className="h-8 w-16" /> : 
                      <p className="text-2xl font-bold">{getPresupuestoGastado()}%</p>
                    }
                  </div>
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-500">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${getPresupuestoGastado()}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Campañas Activas
                    </p>
                    {isLoading ? 
                      <Skeleton className="h-8 w-16" /> : 
                      <p className="text-2xl font-bold">{getCampaniasActivas()}</p>
                    }
                  </div>
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-purple-500/10 text-purple-500">
                    <Megaphone className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs">
                  {/* Aquí podría ir un texto para más contexto */}
                  <span className="text-muted-foreground">Campañas en ejecución actualmente</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Conversiones
                    </p>
                    {isLoading ? 
                      <Skeleton className="h-8 w-16" /> : 
                      <p className="text-2xl font-bold">{formatNumber(getTotalConversiones())}</p>
                    }
                  </div>
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-green-500/10 text-green-500">
                    <Target className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs">
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">+12.5%</span>
                  <span className="text-muted-foreground ml-1">vs mes anterior</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Leads Generados
                    </p>
                    {isLoading ? 
                      <Skeleton className="h-8 w-16" /> : 
                      <p className="text-2xl font-bold">{formatNumber(rendimientoData[rendimientoData.length - 1].leads)}</p>
                    }
                  </div>
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-orange-500/10 text-orange-500">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs">
                  {leadsGrowth.trend === "up" ? (
                    <>
                      <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-green-500">+{leadsGrowth.value}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                      <span className="text-red-500">-{leadsGrowth.value}%</span>
                    </>
                  )}
                  <span className="text-muted-foreground ml-1">vs mes anterior</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos principales */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            {/* Gráfico de rendimiento */}
            <Card className="lg:col-span-5">
              <CardHeader>
                <CardTitle>Rendimiento de Marketing</CardTitle>
                <CardDescription>
                  Leads, conversiones y objetivos por mes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={rendimientoData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="mes" 
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
                            return [formatNumber(value as number), name === "leads" ? "Leads" : 
                                  name === "conversiones" ? "Conversiones" : "Meta"];
                          }}
                        />
                        <Legend />
                        <Bar dataKey="leads" name="Leads" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="conversiones" name="Conversiones" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                        <Line type="monotone" dataKey="meta" name="Meta" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de distribución por canal */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Distribución por Canal</CardTitle>
                <CardDescription>
                  Leads por fuente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={distribucionCanalesData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {distribucionCanalesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip 
                          formatter={(value, name, props) => {
                            return [formatNumber(value as number), props.payload.name];
                          }}
                        />
                      </RePieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campañas activas e insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Campañas activas */}
            <Card>
              <CardHeader className="flex justify-between">
                <div>
                  <CardTitle>Campañas Activas</CardTitle>
                  <CardDescription>
                    Estado actual de campañas en ejecución
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  Ver todas
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaniasActivasData
                      .filter(c => c.estado === "active")
                      .slice(0, 3)
                      .map((campania, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="flex flex-col">
                            <span className="font-medium">{campania.nombre}</span>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                                campania.objetivo === "conversion" ? "bg-green-500" : 
                                campania.objetivo === "engagement" ? "bg-blue-500" :
                                "bg-purple-500"
                              }`}></span>
                              <span>{campania.objetivo.charAt(0).toUpperCase() + campania.objetivo.slice(1)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {formatNumber(campania.gastado)} € <span className="text-muted-foreground">/ {formatNumber(campania.presupuesto)} €</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {campania.conversiones} conversiones
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Insights recientes */}
            <Card>
              <CardHeader className="flex justify-between">
                <div>
                  <CardTitle>Insights Recientes</CardTitle>
                  <CardDescription>
                    Descubrimientos y oportunidades clave
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  Ver todos
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {insightsData.slice(0, 3).map((insight, idx) => (
                      <div key={idx} className="flex items-start p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className={`flex items-center justify-center h-8 w-8 rounded-full mr-3 ${
                          insight.tipo === "tendencia" ? "bg-blue-500/10 text-blue-500" : 
                          insight.tipo === "oportunidad" ? "bg-green-500/10 text-green-500" :
                          insight.tipo === "recomendacion" ? "bg-orange-500/10 text-orange-500" :
                          "bg-red-500/10 text-red-500"
                        }`}>
                          {insight.tipo === "tendencia" ? <TrendingUp size={16} /> : 
                          insight.tipo === "oportunidad" ? <Target size={16} /> :
                          insight.tipo === "recomendacion" ? <Share2 size={16} /> :
                          <TrendingUp size={16} />}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{insight.titulo}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{insight.descripcion}</p>
                          <div className="flex items-center mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              insight.impacto === "alto" ? "bg-green-500/10 text-green-500" : 
                              insight.impacto === "medio" ? "bg-yellow-500/10 text-yellow-500" :
                              "bg-blue-500/10 text-blue-500"
                            }`}>
                              {insight.impacto.toUpperCase()}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">{insight.categoria}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Campañas</CardTitle>
              <CardDescription>
                Visualiza, crea y administra tus campañas de marketing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Contenido detallado de campañas se cargará aquí</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>Panel de Insights</CardTitle>
              <CardDescription>
                Análisis de datos e insights de marketing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Contenido de insights detallados se cargará aquí</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketingDashboard;