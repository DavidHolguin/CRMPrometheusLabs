import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Bar, BarChart, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Users, MessageSquare, BotIcon, TrendingUp, ArrowUpRight, ArrowDownRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip as TooltipComponent, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useDashboardStats, useLeadsActivityData, useLeadsByChannelData, useRecentLeads } from "@/hooks/useDashboardData";
const Dashboard = () => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();

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
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Estadísticas calculadas
  const statsItems = [{
    title: "Total de leads",
    value: stats ? formatNumber(stats.totalLeads) : "0",
    change: "+12.5%",
    // Esto podría calcularse en base a datos anteriores
    trend: "up",
    icon: <Users className="h-4 w-4" />,
    loading: isLoadingStats
  }, {
    title: "Conversaciones",
    value: stats ? formatNumber(stats.conversaciones) : "0",
    change: "+18.2%",
    trend: "up",
    icon: <MessageSquare className="h-4 w-4" />,
    loading: isLoadingStats
  }, {
    title: "Tasa de conversión",
    value: stats ? `${stats.tasaConversion}%` : "0%",
    change: "-2.3%",
    trend: "down",
    icon: <TrendingUp className="h-4 w-4" />,
    loading: isLoadingStats
  }, {
    title: "Interacciones con chatbot",
    value: stats ? formatNumber(stats.interaccionesChatbot) : "0",
    change: "+32.1%",
    trend: "up",
    icon: <BotIcon className="h-4 w-4" />,
    loading: isLoadingStats
  }];
  return <div className="space-y-6 py-[7px] px-[21px]">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen de actividad y estadísticas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            Exportar datos
          </Button>
          <TooltipProvider>
            <TooltipComponent>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Datos actualizados en tiempo real</p>
              </TooltipContent>
            </TooltipComponent>
          </TooltipProvider>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsItems.map((stat, index) => <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  {stat.loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{stat.value}</p>}
                </div>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${stat.trend === "up" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                  {stat.icon}
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs">
                {stat.trend === "up" ? <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" /> : <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />}
                <span className={stat.trend === "up" ? "text-green-500" : "text-red-500"}>
                  {stat.change}
                </span>
                <span className="text-muted-foreground ml-1">vs mes anterior</span>
              </div>
            </CardContent>
          </Card>)}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Leads y Conversaciones</CardTitle>
            <CardDescription>Actividad de la última semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoadingActivity ? <div className="w-full h-full flex items-center justify-center">
                  <p className="text-muted-foreground">Cargando datos...</p>
                </div> : !activityData || activityData.length === 0 ? <div className="w-full h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No hay datos disponibles</p>
                </div> : <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activityData} margin={{
                top: 5,
                right: 30,
                left: 0,
                bottom: 5
              }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--card-foreground))"
                }} />
                    <Legend />
                    <Line type="monotone" dataKey="leads" name="Leads" stroke="hsl(var(--chart-1))" strokeWidth={2} activeDot={{
                  r: 8
                }} />
                    <Line type="monotone" dataKey="conversations" name="Conversaciones" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Leads por canal</CardTitle>
            <CardDescription>Distribución por origen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoadingChannelData ? <div className="w-full h-full flex items-center justify-center">
                  <p className="text-muted-foreground">Cargando datos...</p>
                </div> : !channelData || channelData.length === 0 ? <div className="w-full h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No hay datos disponibles</p>
                </div> : <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channelData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--card-foreground))"
                }} formatter={value => [`${value}%`, "Porcentaje"]} />
                    <Bar dataKey="value" name="Porcentaje" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Leads recientes</CardTitle>
          <CardDescription>Últimos contactos registrados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRecentLeads ? <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div> : !recentLeads || recentLeads.length === 0 ? <div className="py-8 text-center">
              <p className="text-muted-foreground">No hay leads registrados</p>
            </div> : <div className="overflow-x-auto">
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
                  {recentLeads.map(lead => <tr key={lead.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">{lead.name}</td>
                      <td className="py-3 px-4">{lead.email}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${lead.source === "Website" ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"}`}>
                          {lead.source}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${lead.status === "Nuevo" ? "bg-green-500/10 text-green-500" : lead.status === "Contactado" ? "bg-orange-500/10 text-orange-500" : "bg-blue-500/10 text-blue-500"}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{lead.date}</td>
                    </tr>)}
                </tbody>
              </table>
            </div>}
        </CardContent>
      </Card>
    </div>;
};
export default Dashboard;