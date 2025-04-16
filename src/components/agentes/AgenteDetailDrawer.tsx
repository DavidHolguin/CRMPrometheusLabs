import { useState, useEffect } from "react";
import { Agente } from "@/hooks/useAgentes";
import { useLeads } from "@/hooks/useLeads";
import { useAgenteStats } from "@/hooks/useAgenteStats";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
  AreaChart,
  Area,
} from "recharts";
import {
  Edit,
  X,
  MessageSquare,
  UserCheck,
  Calendar,
  TrendingUp,
  Loader2,
  Clock,
  ThumbsUp,
  Users,
  Check,
  Sparkles,
  Award,
  BrainCircuit,
  Timer,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CircularProgressbarWithChildren,
  buildStyles,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

interface AgenteDetailDrawerProps {
  agente: Agente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (agente: Agente) => void;
}

export function AgenteDetailDrawer({
  agente,
  open,
  onOpenChange,
  onEdit,
}: AgenteDetailDrawerProps) {
  const [tab, setTab] = useState<string>("info");
  const { data: leads, isLoading: isLoadingLeads } = useLeads();
  const [assignedLeads, setAssignedLeads] = useState<any[]>([]);

  const {
    performanceMetrics,
    activityData,
    leadsStats,
    isLoading: isLoadingStats,
  } = useAgenteStats(agente?.id || null);

  const performanceData = performanceMetrics
    ? [
        {
          name: "Tiempo resp.",
          value: 100 - Math.min(100, performanceMetrics.tiempoRespuestaPromedio * 4),
        },
        { name: "Satisfacción", value: performanceMetrics.satisfaccionPromedio },
        { name: "Tasa conv.", value: performanceMetrics.tasaConversionLeads },
        { name: "Resolución", value: performanceMetrics.tasaResolucion },
      ]
    : [];

  const promedioRendimiento = performanceMetrics
    ? Math.round(
        (100 -
          Math.min(100, performanceMetrics.tiempoRespuestaPromedio * 4) +
          performanceMetrics.satisfaccionPromedio +
          performanceMetrics.tasaConversionLeads +
          performanceMetrics.tasaResolucion) /
          4
      )
    : 0;

  const chartActivityData =
    activityData?.map((item) => ({
      month: item.mes,
      conversaciones: item.conversaciones,
      mensajes: item.mensajesEnviados,
    })) || [];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  useEffect(() => {
    if (agente && leads) {
      const filtered = leads.filter((lead) => lead.asignado_a === agente.id);
      setAssignedLeads(filtered);
    }
  }, [agente, leads]);

  const getInitials = (name: string) => {
    if (!name) return "NA";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-rose-500">Administrador</Badge>;
      case "admin_empresa":
        return <Badge className="bg-amber-500">Admin Empresa</Badge>;
      default:
        return <Badge variant="secondary">Agente</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    try {
      const date = new Date(dateString);
      return `${formatDistanceToNow(date, { addSuffix: true, locale: es })}`;
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const chartConfig = {
    conversaciones: {
      label: "Conversaciones",
      color: "hsl(var(--chart-1))",
    },
    mensajes: {
      label: "Mensajes",
      color: "hsl(var(--chart-2))",
    },
  };

  if (!agente) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full md:max-w-[700px] overflow-auto p-0"
      >
        <SheetHeader className="sticky top-0 z-20 bg-background p-6 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={agente.avatar_url || undefined}
                  alt={agente.full_name}
                />
                <AvatarFallback>{getInitials(agente.full_name)}</AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-xl">{agente.full_name}</SheetTitle>
                <SheetDescription className="text-sm">
                  {agente.email}
                </SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(agente)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <Tabs
          defaultValue="info"
          value={tab}
          onValueChange={setTab}
          className="h-full"
        >
          <TabsList className="grid grid-cols-3 px-6 pt-4">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
            <TabsTrigger value="leads">
              Leads ({assignedLeads.length})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="p-6">
            <TabsContent value="info" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Estado de cuenta
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      {agente.is_active ? (
                        <Badge
                          variant="outline"
                          className="text-green-500 border-green-500 bg-green-500/10"
                        >
                          <UserCheck className="h-3 w-3 mr-1" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-rose-500 border-rose-500 bg-rose-500/10"
                        >
                          <UserCheck className="h-3 w-3 mr-1" />
                          Inactivo
                        </Badge>
                      )}
                      {getRoleBadge(agente.role)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Último acceso
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">
                      {formatDate(agente.last_sign_in)}
                    </span>
                  </CardContent>
                </Card>

                <Card className="col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Información de cuenta
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-muted-foreground">ID</dt>
                        <dd className="font-medium truncate">{agente.id}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">
                          Fecha de creación
                        </dt>
                        <dd className="font-medium">
                          {format(
                            new Date(agente.created_at),
                            "dd/MM/yyyy HH:mm",
                            { locale: es }
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">
                          Estado de onboarding
                        </dt>
                        <dd className="font-medium">
                          {agente.onboarding_completed
                            ? "Completado"
                            : "Pendiente"}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-6">
              {isLoadingStats ? (
                <div className="space-y-6">
                  <div className="flex justify-center items-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                  <Card>
                    <CardHeader>
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-[250px] w-full" />
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <>
                  {/* Indicador de rendimiento principal */}
                  <Card className="border-none shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-xl font-bold">
                        Rendimiento General
                      </CardTitle>
                      <Award className="h-5 w-5 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-1 flex justify-center items-center">
                          <div style={{ width: 120, height: 120 }}>
                            <CircularProgressbarWithChildren
                              value={promedioRendimiento}
                              strokeWidth={8}
                              styles={buildStyles({
                                pathColor: `hsl(var(--primary))`,
                                trailColor: "hsl(var(--muted))",
                              })}
                            >
                              <div className="flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold">
                                  {promedioRendimiento}%
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Desempeño
                                </span>
                              </div>
                            </CircularProgressbarWithChildren>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                              {/* Indicadores detallados */}
                              <div className="flex items-center gap-2 border rounded-lg p-2">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <Timer className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Tiempo resp.
                                  </p>
                                  <p className="text-sm font-medium">
                                    {performanceMetrics?.tiempoRespuestaPromedio.toFixed(
                                      1
                                    )}{" "}
                                    min
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 border rounded-lg p-2">
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                  <ThumbsUp className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Satisfacción
                                  </p>
                                  <p className="text-sm font-medium">
                                    {performanceMetrics?.satisfaccionPromedio.toFixed(
                                      0
                                    )}
                                    %
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 border rounded-lg p-2">
                                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                  <Users className="h-4 w-4 text-purple-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Tasa conv.
                                  </p>
                                  <p className="text-sm font-medium">
                                    {performanceMetrics?.tasaConversionLeads.toFixed(
                                      0
                                    )}
                                    %
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 border rounded-lg p-2">
                                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                                  <Check className="h-4 w-4 text-amber-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Resolución
                                  </p>
                                  <p className="text-sm font-medium">
                                    {performanceMetrics?.tasaResolucion.toFixed(
                                      0
                                    )}
                                    %
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <TrendingUp className="h-4 w-4 inline mr-1" />
                              {promedioRendimiento > 75
                                ? "Excelente rendimiento"
                                : promedioRendimiento > 50
                                ? "Buen rendimiento"
                                : "Necesita mejorar rendimiento"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Estadísticas de leads */}
                  <Card className="border-none shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl font-bold">
                        <Users className="h-5 w-5 text-blue-500" />
                        Gestión de Leads
                      </CardTitle>
                      <CardDescription>
                        {leadsStats?.totalLeads || 0} leads asignados a este
                        agente
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                Leads activos
                              </span>
                              <span className="text-sm font-bold">
                                {leadsStats?.leadsActivos || 0}
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{
                                  width: `${
                                    leadsStats?.totalLeads
                                      ? (leadsStats.leadsActivos /
                                          leadsStats.totalLeads) *
                                        100
                                      : 0
                                  }%`,
                                }}
                              ></div>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                              <span className="text-sm font-medium">
                                Cerrados ganados
                              </span>
                              <span className="text-sm font-bold">
                                {leadsStats?.leadsCerradosGanados || 0}
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{
                                  width: `${
                                    leadsStats?.totalLeads
                                      ? (leadsStats.leadsCerradosGanados /
                                          leadsStats.totalLeads) *
                                        100
                                      : 0
                                  }%`,
                                }}
                              ></div>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                              <span className="text-sm font-medium">
                                Cerrados perdidos
                              </span>
                              <span className="text-sm font-bold">
                                {leadsStats?.leadsCerradosPerdidos || 0}
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-red-500 h-2 rounded-full"
                                style={{
                                  width: `${
                                    leadsStats?.totalLeads
                                      ? (leadsStats.leadsCerradosPerdidos /
                                          leadsStats.totalLeads) *
                                        100
                                      : 0
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="h-[200px] flex items-center justify-center">
                            {leadsStats?.totalLeads ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={[
                                      {
                                        name: "Activos",
                                        value: leadsStats.leadsActivos,
                                        color: "#3b82f6",
                                      },
                                      {
                                        name: "Ganados",
                                        value: leadsStats.leadsCerradosGanados,
                                        color: "#22c55e",
                                      },
                                      {
                                        name: "Perdidos",
                                        value: leadsStats.leadsCerradosPerdidos,
                                        color: "#ef4444",
                                      },
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={30}
                                    outerRadius={60}
                                    fill="#8884d8"
                                    paddingAngle={3}
                                    dataKey="value"
                                  >
                                    {[
                                      {
                                        name: "Activos",
                                        color: "#3b82f6",
                                      },
                                      {
                                        name: "Ganados",
                                        color: "#22c55e",
                                      },
                                      {
                                        name: "Perdidos",
                                        color: "#ef4444",
                                      },
                                    ].map((entry, index) => (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                      />
                                    ))}
                                  </Pie>
                                  <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    formatter={(value, entry, index) => {
                                      return (
                                        <span className="text-xs">{value}</span>
                                      );
                                    }}
                                  />
                                  <Tooltip />
                                </PieChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="text-center text-muted-foreground">
                                <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">
                                  No hay leads asignados
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actividad mensual mejorada */}
                  <Card className="border-none shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl font-bold">
                        <BrainCircuit className="h-5 w-5 text-purple-500" />
                        Actividad Mensual
                      </CardTitle>
                      <CardDescription>
                        Conversaciones y mensajes en los últimos 6 meses
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={chartConfig}
                        className="aspect-video h-[250px]"
                      >
                        <AreaChart
                          data={chartActivityData}
                          margin={{
                            top: 10,
                            right: 10,
                            left: 0,
                            bottom: 0,
                          }}
                        >
                          <defs>
                            <linearGradient
                              id="colorConversaciones"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="hsl(var(--primary))"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="hsl(var(--primary))"
                                stopOpacity={0}
                              />
                            </linearGradient>
                            <linearGradient
                              id="colorMensajes"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="hsl(var(--secondary))"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="hsl(var(--secondary))"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 3"
                            stroke="hsl(var(--muted))"
                          />
                          <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.slice(0, 3)}
                          />
                          <YAxis tickLine={false} axisLine={false} />
                          <ChartTooltip
                            content={<ChartTooltipContent indicator="line" />}
                          />
                          <Area
                            type="monotone"
                            dataKey="conversaciones"
                            stroke="hsl(var(--primary))"
                            fillOpacity={1}
                            fill="url(#colorConversaciones)"
                          />
                          <Area
                            type="monotone"
                            dataKey="mensajes"
                            stroke="hsl(var(--secondary))"
                            fillOpacity={1}
                            fill="url(#colorMensajes)"
                          />
                        </AreaChart>
                      </ChartContainer>
                      <div className="mt-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-primary"></div>
                          <span className="text-sm">Conversaciones</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-secondary"></div>
                          <span className="text-sm">Mensajes</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Sparkles className="h-4 w-4 text-amber-500" />
                          <span className="text-sm font-medium">
                            {chartActivityData &&
                              chartActivityData.length > 0 &&
                              `Total: ${chartActivityData.reduce(
                                (sum, item) => sum + item.conversaciones,
                                0
                              )} conv.`}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="leads" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Leads asignados</CardTitle>
                  <CardDescription>
                    {assignedLeads.length} leads asignados a este agente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingLeads ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : assignedLeads.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Último contacto</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assignedLeads.map((lead) => (
                            <TableRow key={lead.id}>
                              <TableCell className="font-medium">
                                {lead.nombre || lead.email}
                              </TableCell>
                              <TableCell>{lead.email}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="bg-blue-500/10 text-blue-500 border-blue-500/20"
                                >
                                  {lead.status || "Nuevo"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {lead.updated_at
                                  ? formatDate(lead.updated_at)
                                  : "Sin contacto"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>Este agente no tiene leads asignados</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="justify-between">
                  <Button variant="outline" size="sm">
                    Asignar nuevo lead
                  </Button>
                  <Button variant="ghost" size="sm">
                    Ver todos
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}