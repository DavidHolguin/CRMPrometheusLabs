import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, ChevronDown, Download, FileBarChart, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
  Legend,
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// Datos de ejemplo - En producción estos vendrían de una API
const visitasData = [
  { fecha: "2025-04-01", visitas: 120, leads: 22, clics: 45 },
  { fecha: "2025-04-02", visitas: 132, leads: 25, clics: 52 },
  { fecha: "2025-04-03", visitas: 145, leads: 28, clics: 58 },
  { fecha: "2025-04-04", visitas: 155, leads: 30, clics: 63 },
  { fecha: "2025-04-05", visitas: 148, leads: 29, clics: 60 },
  { fecha: "2025-04-06", visitas: 138, leads: 26, clics: 55 },
  { fecha: "2025-04-07", visitas: 142, leads: 27, clics: 57 },
  { fecha: "2025-04-08", visitas: 150, leads: 29, clics: 61 },
  { fecha: "2025-04-09", visitas: 160, leads: 32, clics: 65 },
  { fecha: "2025-04-10", visitas: 168, leads: 33, clics: 68 },
  { fecha: "2025-04-11", visitas: 172, leads: 34, clics: 70 },
  { fecha: "2025-04-12", visitas: 180, leads: 36, clics: 74 },
  { fecha: "2025-04-13", visitas: 190, leads: 38, clics: 78 },
  { fecha: "2025-04-14", visitas: 195, leads: 39, clics: 80 },
];

const campaniasData = [
  { nombre: "Promoción Primavera", impresiones: 15600, clics: 780, leads: 195, conversion: 25.0, ctr: 5.0 },
  { nombre: "Webinar Producto", impresiones: 8900, clics: 534, leads: 128, conversion: 24.0, ctr: 6.0 },
  { nombre: "Descuento Especial", impresiones: 12300, clics: 690, leads: 165, conversion: 23.9, ctr: 5.6 },
  { nombre: "Email Marketing", impresiones: 25000, clics: 1250, leads: 275, conversion: 22.0, ctr: 5.0 },
  { nombre: "Redes Sociales", impresiones: 35000, clics: 1750, leads: 385, conversion: 22.0, ctr: 5.0 },
];

const fuentesTraficoData = [
  { fuente: "Google", visitas: 4500, porcentaje: 45 },
  { fuente: "Redes Sociales", visitas: 2800, porcentaje: 28 },
  { fuente: "Email", visitas: 1700, porcentaje: 17 },
  { fuente: "Directo", visitas: 1000, porcentaje: 10 },
];

const MarketingAnalytics = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(2025, 3, 1),
    to: new Date(2025, 3, 14),
  });
  
  // Estado para filtros
  const [periodoFiltro, setPeriodoFiltro] = useState("ultimos14dias");

  // Función para formatear números con separadores de miles
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  // Calcular métricas totales
  const calcularTotales = () => {
    const totalVisitas = visitasData.reduce((acc, curr) => acc + curr.visitas, 0);
    const totalClics = visitasData.reduce((acc, curr) => acc + curr.clics, 0);
    const totalLeads = visitasData.reduce((acc, curr) => acc + curr.leads, 0);
    const ctr = totalVisitas > 0 ? (totalClics / totalVisitas) * 100 : 0;
    
    return { totalVisitas, totalClics, totalLeads, ctr };
  };

  const { totalVisitas, totalClics, totalLeads, ctr } = calcularTotales();

  // Cambiar el formato de las fechas para el gráfico
  const formattedChartData = visitasData.map(item => ({
    ...item,
    fecha: format(new Date(item.fecha), 'dd MMM', { locale: es })
  }));

  return (
    <div className="space-y-6 py-[14px] px-[21px]">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analíticas de Marketing</h1>
          <p className="text-muted-foreground">
            Métricas y análisis de campañas, tráfico y conversiones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-accent/40 p-3 rounded-lg">
        <div className="flex items-center">
          <Filter className="h-4 w-4 mr-2" />
          <span className="font-medium text-sm">Filtrar por:</span>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Select value={periodoFiltro} onValueChange={setPeriodoFiltro}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoy">Hoy</SelectItem>
              <SelectItem value="ayer">Ayer</SelectItem>
              <SelectItem value="ultimos7dias">Últimos 7 días</SelectItem>
              <SelectItem value="ultimos14dias">Últimos 14 días</SelectItem>
              <SelectItem value="ultimos30dias">Últimos 30 días</SelectItem>
              <SelectItem value="estemés">Este mes</SelectItem>
              <SelectItem value="mesanterior">Mes anterior</SelectItem>
              <SelectItem value="personalizado">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {periodoFiltro === "personalizado" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-9 gap-2">
                  <Calendar className="h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy")
                    )
                  ) : (
                    "Seleccionar fechas"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}
          
          <Button variant="ghost" size="sm" className="h-9">
            <span>Restablecer</span>
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Visitas
                </p>
                {isLoading ? 
                  <Skeleton className="h-8 w-16" /> : 
                  <p className="text-2xl font-bold">{formatNumber(totalVisitas)}</p>
                }
              </div>
              <div className="h-10 w-10 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-500">
                <FileBarChart className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <span className="text-green-500">+8.5%</span>
              <span className="text-muted-foreground ml-1">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Clics
                </p>
                {isLoading ? 
                  <Skeleton className="h-8 w-16" /> : 
                  <p className="text-2xl font-bold">{formatNumber(totalClics)}</p>
                }
              </div>
              <div className="h-10 w-10 rounded-full flex items-center justify-center bg-purple-500/10 text-purple-500">
                <FileBarChart className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <span className="text-green-500">+6.2%</span>
              <span className="text-muted-foreground ml-1">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  CTR
                </p>
                {isLoading ? 
                  <Skeleton className="h-8 w-16" /> : 
                  <p className="text-2xl font-bold">{ctr.toFixed(2)}%</p>
                }
              </div>
              <div className="h-10 w-10 rounded-full flex items-center justify-center bg-green-500/10 text-green-500">
                <FileBarChart className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <span className="text-red-500">-1.8%</span>
              <span className="text-muted-foreground ml-1">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Leads
                </p>
                {isLoading ? 
                  <Skeleton className="h-8 w-16" /> : 
                  <p className="text-2xl font-bold">{formatNumber(totalLeads)}</p>
                }
              </div>
              <div className="h-10 w-10 rounded-full flex items-center justify-center bg-orange-500/10 text-orange-500">
                <FileBarChart className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <span className="text-green-500">+9.5%</span>
              <span className="text-muted-foreground ml-1">vs período anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para diferentes análisis */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="campaigns">Campañas</TabsTrigger>
          <TabsTrigger value="content">Contenido</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          {/* Gráfico de tendencia */}
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de visitas y conversiones</CardTitle>
              <CardDescription>
                Evolución de visitas, clics y leads en el período seleccionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={formattedChartData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="fecha" 
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
                          return [formatNumber(value as number), 
                                name === "visitas" ? "Visitas" : 
                                name === "clics" ? "Clics" : "Leads"];
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="visitas" name="Visitas" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="clics" name="Clics" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="leads" name="Leads" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tablas de fuentes de tráfico */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Fuentes de tráfico</CardTitle>
                <CardDescription>
                  De dónde provienen las visitas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium">Fuente</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Visitas</th>
                        <th className="h-12 px-4 text-right align-middle font-medium">Porcentaje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fuentesTraficoData.map((fuente, idx) => (
                        <tr key={idx} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle">{fuente.fuente}</td>
                          <td className="p-4 align-middle">{formatNumber(fuente.visitas)}</td>
                          <td className="p-4 align-middle text-right">{fuente.porcentaje}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Distribución geográfica</CardTitle>
                <CardDescription>
                  Visitas por ubicación
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Datos no disponibles en esta versión</p>
                  <Badge variant="outline" className="mt-2">Próximamente</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento de campañas</CardTitle>
              <CardDescription>
                Análisis detallado por campaña
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium">Campaña</th>
                      <th className="h-12 px-4 text-right align-middle font-medium">Impresiones</th>
                      <th className="h-12 px-4 text-right align-middle font-medium">Clics</th>
                      <th className="h-12 px-4 text-right align-middle font-medium">CTR</th>
                      <th className="h-12 px-4 text-right align-middle font-medium">Leads</th>
                      <th className="h-12 px-4 text-right align-middle font-medium">Conversión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaniasData.map((campania, idx) => (
                      <tr key={idx} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle font-medium">{campania.nombre}</td>
                        <td className="p-4 align-middle text-right">{formatNumber(campania.impresiones)}</td>
                        <td className="p-4 align-middle text-right">{formatNumber(campania.clics)}</td>
                        <td className="p-4 align-middle text-right">{campania.ctr.toFixed(1)}%</td>
                        <td className="p-4 align-middle text-right">{formatNumber(campania.leads)}</td>
                        <td className="p-4 align-middle text-right">{campania.conversion.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Comparativa de CTR</CardTitle>
                <CardDescription>
                  Tasa de clics por campaña
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={campaniasData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis 
                        type="number"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        dataKey="nombre"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        width={150}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="ctr" name="CTR (%)" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Comparativa de Conversión</CardTitle>
                <CardDescription>
                  Tasa de conversión por campaña
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={campaniasData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis 
                        type="number"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        dataKey="nombre"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        width={150}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="conversion" name="Conversión (%)" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de contenido</CardTitle>
              <CardDescription>
                Rendimiento por tipo de contenido
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Datos no disponibles en esta versión</p>
                <Badge variant="outline" className="mt-2">Próximamente</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketingAnalytics;