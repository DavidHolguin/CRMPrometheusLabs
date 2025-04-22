import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  BarChart2, 
  LineChart as LineIcon, 
  PieChart as PieIcon,
  Users,
  Click,
  Eye,
  Percent
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Tipos de datos
interface MetricaMarketing {
  nombre: string;
  valor: number;
  incremento: number;
  icon: React.ReactNode;
}

interface CampañaPerformance {
  id: string;
  nombre: string;
  vistas: number;
  clics: number;
  conversiones: number;
  ctr: number;
  conversionRate: number;
}

interface ContenidoPerformance {
  id: string;
  titulo: string;
  tipo: string;
  vistas: number;
  interacciones: number;
  compartidos: number;
  conversionRate: number;
}

interface MarketingAnalyticsProps {
  periodo?: 'dia' | 'semana' | 'mes' | 'año' | 'personalizado';
  fechaInicio?: Date;
  fechaFin?: Date;
  onPeriodoChange?: (periodo: string) => void;
  onFechaChange?: (inicio: Date, fin: Date) => void;
}

export function MarketingAnalytics({
  periodo = 'mes',
  fechaInicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  fechaFin = new Date(),
  onPeriodoChange,
  onFechaChange
}: MarketingAnalyticsProps) {
  const [selectedPeriodo, setSelectedPeriodo] = useState(periodo);
  const [startDate, setStartDate] = useState<Date | undefined>(fechaInicio);
  const [endDate, setEndDate] = useState<Date | undefined>(fechaFin);
  const [activeTab, setActiveTab] = useState("general");

  // Métricas de ejemplo (en una implementación real vendrían de una API)
  const metricas: MetricaMarketing[] = [
    {
      nombre: "Vistas totales",
      valor: 12458,
      incremento: 12.5,
      icon: <Eye className="h-4 w-4 text-blue-500" />
    },
    {
      nombre: "Clics",
      valor: 3245,
      incremento: 8.2,
      icon: <Click className="h-4 w-4 text-green-500" />
    },
    {
      nombre: "CTR promedio",
      valor: 3.8,
      incremento: -2.1,
      icon: <Percent className="h-4 w-4 text-yellow-500" />
    },
    {
      nombre: "Leads generados",
      valor: 187,
      incremento: 15.3,
      icon: <Users className="h-4 w-4 text-purple-500" />
    }
  ];

  // Datos de campañas (simulados)
  const campañas: CampañaPerformance[] = [
    { id: "1", nombre: "Lanzamiento Primavera", vistas: 5234, clics: 1245, conversiones: 89, ctr: 23.8, conversionRate: 7.1 },
    { id: "2", nombre: "Descuentos Abril", vistas: 3890, clics: 980, conversiones: 54, ctr: 25.2, conversionRate: 5.5 },
    { id: "3", nombre: "Webinar Innovación", vistas: 2145, clics: 745, conversiones: 32, ctr: 34.7, conversionRate: 4.3 },
    { id: "4", nombre: "Guía Soluciones", vistas: 1189, clics: 275, conversiones: 12, ctr: 23.1, conversionRate: 4.4 },
  ];

  // Datos de contenido (simulados)
  const contenidos: ContenidoPerformance[] = [
    { id: "1", titulo: "10 Tendencias de IA para 2026", tipo: "Blog", vistas: 1245, interacciones: 345, compartidos: 87, conversionRate: 4.2 },
    { id: "2", titulo: "Cómo optimizar su CRM", tipo: "Guía", vistas: 890, interacciones: 230, compartidos: 45, conversionRate: 6.8 },
    { id: "3", titulo: "Webinar: Automatización", tipo: "Video", vistas: 678, interacciones: 198, compartidos: 32, conversionRate: 5.3 },
    { id: "4", titulo: "Infografía: ROI de IA", tipo: "Imagen", vistas: 543, interacciones: 125, compartidos: 76, conversionRate: 3.7 },
  ];

  const handlePeriodoChange = (value: string) => {
    setSelectedPeriodo(value as 'dia' | 'semana' | 'mes' | 'año' | 'personalizado');
    
    // Calcular fechas basadas en el periodo seleccionado
    const hoy = new Date();
    let inicio = new Date();
    
    switch(value) {
      case 'dia':
        inicio = new Date(hoy);
        inicio.setHours(0, 0, 0, 0);
        break;
      case 'semana':
        inicio = new Date(hoy);
        inicio.setDate(inicio.getDate() - 7);
        break;
      case 'mes':
        inicio = new Date(hoy);
        inicio.setMonth(inicio.getMonth() - 1);
        break;
      case 'año':
        inicio = new Date(hoy);
        inicio.setFullYear(inicio.getFullYear() - 1);
        break;
      case 'personalizado':
        // Mantener las fechas actuales
        return;
    }
    
    setStartDate(inicio);
    setEndDate(hoy);
    
    if (onPeriodoChange) onPeriodoChange(value);
    if (onFechaChange) onFechaChange(inicio, hoy);
  };

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      setStartDate(date);
      if (onFechaChange && endDate) onFechaChange(date, endDate);
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      setEndDate(date);
      if (onFechaChange && startDate) onFechaChange(startDate, date);
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector de periodo y fechas */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Analytics de Marketing</h2>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedPeriodo} onValueChange={handlePeriodoChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dia">Hoy</SelectItem>
              <SelectItem value="semana">Última semana</SelectItem>
              <SelectItem value="mes">Último mes</SelectItem>
              <SelectItem value="año">Último año</SelectItem>
              <SelectItem value="personalizado">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {selectedPeriodo === 'personalizado' && (
            <div className="flex gap-2">
              <DatePicker
                date={startDate}
                onDateChange={handleStartDateChange}
                placeholder="Fecha inicio"
              />
              <DatePicker
                date={endDate}
                onDateChange={handleEndDateChange}
                placeholder="Fecha fin"
              />
            </div>
          )}
        </div>
      </div>

      {/* Mostrar el rango de fechas */}
      <p className="text-sm text-muted-foreground">
        Mostrando datos de {startDate ? format(startDate, "d 'de' MMMM 'de' yyyy", { locale: es }) : "fecha inicio"} 
        {" "} hasta {" "}
        {endDate ? format(endDate, "d 'de' MMMM 'de' yyyy", { locale: es }) : "fecha fin"}
      </p>

      {/* Tarjetas de métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricas.map((metrica, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-muted-foreground">{metrica.nombre}</span>
                {metrica.icon}
              </div>
              <div className="flex justify-between items-end">
                <div className="text-2xl font-bold">
                  {metrica.nombre.includes('CTR') ? `${metrica.valor}%` : metrica.valor.toLocaleString()}
                </div>
                <div className={`text-sm font-medium flex items-center ${metrica.incremento >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {metrica.incremento >= 0 ? '↑' : '↓'} {Math.abs(metrica.incremento)}%
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pestañas para diferentes vistas */}
      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 md:w-[400px] mb-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="campañas" className="flex items-center gap-2">
            <LineIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Campañas</span>
          </TabsTrigger>
          <TabsTrigger value="contenido" className="flex items-center gap-2">
            <PieIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Contenido</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Content: General */}
        <TabsContent value="general" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento por Plataforma</CardTitle>
                <CardDescription>Distribución de métricas por plataforma</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <div className="p-4 bg-muted/20 rounded-lg w-full h-full flex flex-col items-center justify-center">
                  <BarChart className="h-16 w-16 text-muted" />
                  <p className="text-sm text-muted-foreground mt-2">Gráfica de barras</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendencias de Conversión</CardTitle>
                <CardDescription>Tasa de conversión en el tiempo</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <div className="p-4 bg-muted/20 rounded-lg w-full h-full flex flex-col items-center justify-center">
                  <LineChart className="h-16 w-16 text-muted" />
                  <p className="text-sm text-muted-foreground mt-2">Gráfica de líneas</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Content: Campañas */}
        <TabsContent value="campañas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento de Campañas</CardTitle>
              <CardDescription>Métricas clave de las campañas activas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left font-medium py-3 px-2">Nombre</th>
                      <th className="text-right font-medium py-3 px-2">Vistas</th>
                      <th className="text-right font-medium py-3 px-2">Clics</th>
                      <th className="text-right font-medium py-3 px-2">Conversiones</th>
                      <th className="text-right font-medium py-3 px-2">CTR</th>
                      <th className="text-right font-medium py-3 px-2">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campañas.map((campaña) => (
                      <tr key={campaña.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2">{campaña.nombre}</td>
                        <td className="text-right py-3 px-2">{campaña.vistas.toLocaleString()}</td>
                        <td className="text-right py-3 px-2">{campaña.clics.toLocaleString()}</td>
                        <td className="text-right py-3 px-2">{campaña.conversiones.toLocaleString()}</td>
                        <td className="text-right py-3 px-2">{campaña.ctr.toFixed(1)}%</td>
                        <td className="text-right py-3 px-2">{campaña.conversionRate.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comparativa de Campañas</CardTitle>
              <CardDescription>Rendimiento relativo entre campañas</CardDescription>
            </CardHeader>
            <CardContent className="h-80 flex items-center justify-center">
              <div className="p-4 bg-muted/20 rounded-lg w-full h-full flex flex-col items-center justify-center">
                <BarChart className="h-16 w-16 text-muted" />
                <p className="text-sm text-muted-foreground mt-2">Gráfica comparativa</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Content: Contenido */}
        <TabsContent value="contenido" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento de Contenido</CardTitle>
              <CardDescription>Métricas de engagement por contenido</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left font-medium py-3 px-2">Título</th>
                      <th className="text-left font-medium py-3 px-2">Tipo</th>
                      <th className="text-right font-medium py-3 px-2">Vistas</th>
                      <th className="text-right font-medium py-3 px-2">Interacciones</th>
                      <th className="text-right font-medium py-3 px-2">Compartidos</th>
                      <th className="text-right font-medium py-3 px-2">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contenidos.map((contenido) => (
                      <tr key={contenido.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2">{contenido.titulo}</td>
                        <td className="py-3 px-2">{contenido.tipo}</td>
                        <td className="text-right py-3 px-2">{contenido.vistas.toLocaleString()}</td>
                        <td className="text-right py-3 px-2">{contenido.interacciones.toLocaleString()}</td>
                        <td className="text-right py-3 px-2">{contenido.compartidos.toLocaleString()}</td>
                        <td className="text-right py-3 px-2">{contenido.conversionRate.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribución por Tipo de Contenido</CardTitle>
              <CardDescription>Impacto por categoría de contenido</CardDescription>
            </CardHeader>
            <CardContent className="h-80 flex items-center justify-center">
              <div className="p-4 bg-muted/20 rounded-lg w-full h-full flex flex-col items-center justify-center">
                <PieChart className="h-16 w-16 text-muted" />
                <p className="text-sm text-muted-foreground mt-2">Gráfica de distribución</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Contenedor que conectará con los hooks reales cuando se implementen
export function MarketingAnalyticsContainer() {
  const [periodo, setPeriodo] = useState<'dia' | 'semana' | 'mes' | 'año' | 'personalizado'>('mes');
  const [fechaInicio, setFechaInicio] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [fechaFin, setFechaFin] = useState<Date>(new Date());
  
  // Aquí se conectarán los hooks reales para obtener datos de analytics
  
  const handlePeriodoChange = (nuevoPeriodo: string) => {
    setPeriodo(nuevoPeriodo as any);
  };
  
  const handleFechaChange = (inicio: Date, fin: Date) => {
    setFechaInicio(inicio);
    setFechaFin(fin);
    
    // Aquí se llamaría a la función para actualizar datos según las fechas
  };
  
  return (
    <MarketingAnalytics 
      periodo={periodo}
      fechaInicio={fechaInicio}
      fechaFin={fechaFin}
      onPeriodoChange={handlePeriodoChange}
      onFechaChange={handleFechaChange}
    />
  );
}