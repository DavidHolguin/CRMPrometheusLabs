import { useState, useEffect } from "react";
import { Agente } from "@/hooks/useAgentes";
import { useLeads } from "@/hooks/useLeads";
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
  const { data: leads, isLoading } = useLeads();
  const [assignedLeads, setAssignedLeads] = useState<any[]>([]);

  // Datos de ejemplo para los gráficos
  const activityData = [
    { month: "Enero", conversaciones: 45, tickets: 20 },
    { month: "Febrero", conversaciones: 52, tickets: 15 },
    { month: "Marzo", conversaciones: 38, tickets: 25 },
    { month: "Abril", conversaciones: 65, tickets: 18 },
    { month: "Mayo", conversaciones: 72, tickets: 22 },
    { month: "Junio", conversaciones: 58, tickets: 30 },
  ];

  const performanceData = [
    { name: "Tiempo resp.", value: 85 },
    { name: "Satisfacción", value: 92 },
    { name: "Tasa conv.", value: 65 },
    { name: "Resolución", value: 78 },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  // Filtrar leads asignados al agente
  useEffect(() => {
    if (agente && leads) {
      const filtered = leads.filter(
        (lead) => lead.asignado_a === agente.id
      );
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

  // Función para formatear fechas
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
    tickets: {
      label: "Tickets",
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
              <Card>
                <CardHeader>
                  <CardTitle>Rendimiento</CardTitle>
                  <CardDescription>
                    Métricas de desempeño del agente
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={performanceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {performanceData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                          <Label
                            content={({ viewBox }) => {
                              if (
                                viewBox &&
                                "cx" in viewBox &&
                                "cy" in viewBox
                              ) {
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
                                      80%
                                    </tspan>
                                    <tspan
                                      x={viewBox.cx}
                                      y={(viewBox.cy || 0) + 20}
                                      className="fill-muted-foreground text-sm"
                                    >
                                      Promedio
                                    </tspan>
                                  </text>
                                );
                              }
                              return null;
                            }}
                          />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2 font-medium leading-none">
                    <TrendingUp className="h-4 w-4" /> Mejorando un 5% respecto
                    al mes anterior
                  </div>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actividad mensual</CardTitle>
                  <CardDescription>Últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={chartConfig}
                    className="aspect-video h-[250px]"
                  >
                    <AreaChart
                      data={activityData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid vertical={false} />
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
                        stackId="1"
                        stroke="var(--color-conversaciones)"
                        fill="var(--color-conversaciones)"
                        fillOpacity={0.3}
                      />
                      <Area
                        type="monotone"
                        dataKey="tickets"
                        stackId="1"
                        stroke="var(--color-tickets)"
                        fill="var(--color-tickets)"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2 font-medium leading-none">
                    <TrendingUp className="h-4 w-4" /> Incremento del 12% en
                    conversaciones
                  </div>
                </CardFooter>
              </Card>
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
                  {assignedLeads.length > 0 ? (
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