import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  useMarketingInteligencia,
  MarketingCompetidor,
  MarketingTendencia
} from "@/hooks/marketing/useMarketingInteligencia";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";

import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  MoreVertical,
  Pencil,
  Eye,
  Trash2,
  TrendingUp,
  Globe,
  Building2,
  ArrowUpRight,
  BarChart4,
  Share2,
  LineChart,
  Users,
  Lightbulb,
  Target
} from "lucide-react";

const MarketingInteligencia = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndustria, setSelectedIndustria] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"competidores" | "tendencias">("competidores");
  const [selectedCompetidor, setSelectedCompetidor] = useState<MarketingCompetidor | null>(null);
  const [selectedTendencia, setSelectedTendencia] = useState<MarketingTendencia | null>(null);
  const [isCreatingCompetidor, setIsCreatingCompetidor] = useState(false);
  const [isCreatingTendencia, setIsCreatingTendencia] = useState(false);
  const [competidorFormOpen, setCompetidorFormOpen] = useState(false);
  const [tendenciaFormOpen, setTendenciaFormOpen] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 6;

  // Usar el hook con opciones de filtrado
  const {
    competidores,
    tendencias,
    isLoading,
    isLoadingTendencias,
    totalCount,
    totalPages,
    createCompetidor,
    createTendencia,
    getIndustrias,
    getCompetidorContenido
  } = useMarketingInteligencia({
    page,
    pageSize,
    filters: {
      industria: selectedIndustria || undefined,
      searchTerm: searchTerm || undefined
    }
  });

  // Estados para formularios
  const [competidorForm, setCompetidorForm] = useState({
    nombre: "",
    descripcion: "",
    sitio_web: "",
    industria: "",
    tamano: "pequeña",
    fortalezas: "" as string | string[],
    debilidades: "" as string | string[],
    nivel_amenaza: 5,
    productos_servicios: {},
    canales_sociales: {}
  });

  const [tendenciaForm, setTendenciaForm] = useState({
    categoria: "mercado",
    titulo: "",
    descripcion: "",
    fuente_datos: "",
    impacto_estimado: "medio",
    acciones_recomendadas: "" as string | string[]
  });

  // Manejar búsqueda
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0); // Resetear página al buscar
  };

  // Manejar cambio de industria
  const handleIndustriaChange = (value: string) => {
    // Si se selecciona "todas", establecer un string vacío para que no se aplique filtro
    setSelectedIndustria(value === "todas" ? "" : value);
    setPage(0); // Resetear página al cambiar filtro
  };

  // Abrir formulario para crear competidor
  const handleOpenCreateCompetidor = () => {
    setCompetidorForm({
      nombre: "",
      descripcion: "",
      sitio_web: "",
      industria: "",
      tamano: "pequeña",
      fortalezas: [],
      debilidades: [],
      nivel_amenaza: 5,
      productos_servicios: {},
      canales_sociales: {}
    });
    setIsCreatingCompetidor(true);
    setCompetidorFormOpen(true);
  };

  // Abrir formulario para crear tendencia
  const handleOpenCreateTendencia = () => {
    setTendenciaForm({
      categoria: "mercado",
      titulo: "",
      descripcion: "",
      fuente_datos: "",
      impacto_estimado: "medio",
      acciones_recomendadas: []
    });
    setIsCreatingTendencia(true);
    setTendenciaFormOpen(true);
  };

  // Ver detalles de competidor
  const handleViewCompetidor = (competidor: MarketingCompetidor) => {
    setSelectedCompetidor(competidor);
  };

  // Ver detalles de tendencia
  const handleViewTendencia = (tendencia: MarketingTendencia) => {
    setSelectedTendencia(tendencia);
  };

  // Guardar nuevo competidor
  const handleSaveCompetidor = () => {
    // Preparar los arrays para fortalezas y debilidades
    const fortalezasArray = typeof competidorForm.fortalezas === "string"
      ? competidorForm.fortalezas.split(',').map(item => item.trim()) 
      : competidorForm.fortalezas;
      
    const debilidadesArray = typeof competidorForm.debilidades === "string"
      ? competidorForm.debilidades.split(",").map(item => item.trim())
      : competidorForm.debilidades || [];
    
    // Crear competidor
    createCompetidor.mutate({
      nombre: competidorForm.nombre,
      descripcion: competidorForm.descripcion,
      sitio_web: competidorForm.sitio_web,
      industria: competidorForm.industria,
      tamano: competidorForm.tamano,
      fortalezas: fortalezasArray,
      debilidades: debilidadesArray,
      nivel_amenaza: competidorForm.nivel_amenaza,
      productos_servicios: competidorForm.productos_servicios || {},
      canales_sociales: competidorForm.canales_sociales || {}
    });
    
    setCompetidorFormOpen(false);
  };

  // Guardar nueva tendencia
  const handleSaveTendencia = () => {
    // Preparar el array para acciones recomendadas
    const accionesArray = typeof tendenciaForm.acciones_recomendadas === 'string' 
      ? tendenciaForm.acciones_recomendadas.split(',').map(item => item.trim()) 
      : tendenciaForm.acciones_recomendadas;
    
    // Crear tendencia
    createTendencia.mutate({
      categoria: tendenciaForm.categoria,
      titulo: tendenciaForm.titulo,
      descripcion: tendenciaForm.descripcion,
      fuente_datos: tendenciaForm.fuente_datos,
      impacto_estimado: tendenciaForm.impacto_estimado,
      acciones_recomendadas: { acciones: accionesArray }
    });
    
    setTendenciaFormOpen(false);
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "short",
      year: "numeric"
    };
    return new Date(dateString).toLocaleDateString("es-ES", options);
  };

  // Obtener color según nivel de amenaza
  const getAmenazaColor = (nivel: number) => {
    if (nivel <= 3) return "bg-green-500/10 text-green-500";
    if (nivel <= 6) return "bg-yellow-500/10 text-yellow-500";
    return "bg-red-500/10 text-red-500";
  };

  // Obtener color según impacto estimado
  const getImpactoColor = (impacto: string) => {
    switch (impacto.toLowerCase()) {
      case "alto":
        return "bg-red-500/10 text-red-500";
      case "medio":
        return "bg-yellow-500/10 text-yellow-500";
      case "bajo":
        return "bg-green-500/10 text-green-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  // Obtener icono según categoría de tendencia
  const getTendenciaIcon = (categoria: string) => {
    switch (categoria.toLowerCase()) {
      case "mercado":
        return <Globe className="h-4 w-4" />;
      case "industria":
        return <Building2 className="h-4 w-4" />;
      case "competencia":
        return <Target className="h-4 w-4" />;
      case "interna":
        return <Users className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 py-[14px] px-[21px]">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Inteligencia de Mercado</h1>
          <p className="text-muted-foreground">
            Análisis de competencia, tendencias del mercado e insights estratégicos
          </p>
        </div>

        <div className="flex gap-2">
          {activeTab === "competidores" ? (
            <Button className="gap-2" onClick={handleOpenCreateCompetidor}>
              <PlusCircle className="h-4 w-4" />
              Nuevo Competidor
            </Button>
          ) : (
            <Button className="gap-2" onClick={handleOpenCreateTendencia}>
              <PlusCircle className="h-4 w-4" />
              Nueva Tendencia
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "competidores" | "tendencias")} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:w-[400px]">
          <TabsTrigger value="competidores" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span>Competidores</span>
          </TabsTrigger>
          <TabsTrigger value="tendencias" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Tendencias</span>
          </TabsTrigger>
        </TabsList>

        {/* Vista de competidores */}
        <TabsContent value="competidores" className="space-y-4">
          {/* Filtros y búsqueda */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar competidores..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button type="submit">Buscar</Button>
              </form>
            </div>

            <div className="sm:w-[200px]">
              <Select value={selectedIndustria} onValueChange={handleIndustriaChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por industria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las industrias</SelectItem>
                  <SelectItem value="tecnologia">Tecnología</SelectItem>
                  <SelectItem value="finanzas">Finanzas</SelectItem>
                  <SelectItem value="salud">Salud</SelectItem>
                  <SelectItem value="educacion">Educación</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cuadrícula de competidores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading
              ? Array.from({ length: pageSize }).map((_, index) => (
                  <Card key={`skeleton-${index}`} className="border rounded-lg overflow-hidden">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="py-2">
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </CardFooter>
                  </Card>
                ))
              : competidores?.map((competidor) => (
                  <Card 
                    key={competidor.id} 
                    className="border rounded-lg hover:shadow-md transition-shadow"
                    onClick={() => handleViewCompetidor(competidor)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="text-base">{competidor.nombre}</CardTitle>
                        <Badge className={getAmenazaColor(competidor.nivel_amenaza || 0)}>
                          {competidor.nivel_amenaza}/10
                        </Badge>
                      </div>
                      <CardDescription>
                        {competidor.industria && (
                          <span className="inline-flex items-center">
                            <Building2 className="h-3 w-3 mr-1" />
                            {competidor.industria.charAt(0).toUpperCase() + competidor.industria.slice(1)}
                          </span>
                        )}
                        {competidor.tamano && (
                          <span className="ml-3 inline-flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {competidor.tamano.charAt(0).toUpperCase() + competidor.tamano.slice(1)}
                          </span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="py-2">
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {competidor.descripcion || "Sin descripción..."}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center pt-1">
                      {competidor.sitio_web ? (
                        <a 
                          href={competidor.sitio_web} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary-foreground/80 hover:text-primary flex items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Globe className="h-3 w-3 mr-1" />
                          {new URL(competidor.sitio_web).hostname}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin sitio web</span>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                      >
                        <Eye className="h-3 w-3 mr-1" /> Ver
                      </Button>
                    </CardFooter>
                  </Card>
                ))}

            {!isLoading && (!competidores || competidores.length === 0) && (
              <div className="col-span-full p-8 text-center">
                <Target className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No se encontraron competidores</h3>
                <p className="text-muted-foreground mt-1">
                  {searchTerm || selectedIndustria
                    ? "Prueba a cambiar los filtros de búsqueda."
                    : "Añade tu primer competidor para comenzar."}
                </p>
                <Button 
                  onClick={handleOpenCreateCompetidor} 
                  className="mt-4"
                >
                  <PlusCircle className="h-4 w-4 mr-1" /> Añadir competidor
                </Button>
              </div>
            )}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {page * pageSize + 1} a {Math.min((page + 1) * pageSize, totalCount)} de {totalCount} competidores
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Página {page + 1} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Vista de tendencias */}
        <TabsContent value="tendencias" className="space-y-4">
          {/* Grid de tendencias */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {isLoadingTendencias
              ? Array.from({ length: 6 }).map((_, index) => (
                  <Card key={`skeleton-trend-${index}`} className="border rounded-lg overflow-hidden">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="py-2">
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                ))
              : tendencias?.map((tendencia) => (
                  <Card 
                    key={tendencia.id} 
                    className="border rounded-lg hover:shadow-md transition-shadow"
                    onClick={() => handleViewTendencia(tendencia)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{tendencia.titulo}</CardTitle>
                          <CardDescription className="flex items-center mt-1">
                            <span className="inline-flex items-center mr-3">
                              {getTendenciaIcon(tendencia.categoria)}
                              <span className="ml-1 capitalize">{tendencia.categoria}</span>
                            </span>
                          </CardDescription>
                        </div>
                        <Badge className={getImpactoColor(tendencia.impacto_estimado || "medio")}>
                          {tendencia.impacto_estimado?.toUpperCase() || "MEDIO"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="py-2">
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {tendencia.descripcion || "Sin descripción..."}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center pt-1">
                      {tendencia.fuente_datos && (
                        <span className="text-xs text-muted-foreground">
                          Fuente: {tendencia.fuente_datos}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {tendencia.created_at ? formatDate(tendencia.created_at) : ""}
                      </span>
                    </CardFooter>
                  </Card>
                ))}
            
            {!isLoadingTendencias && (!tendencias || tendencias.length === 0) && (
              <div className="col-span-full p-8 text-center">
                <TrendingUp className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No se encontraron tendencias</h3>
                <p className="text-muted-foreground mt-1">
                  Añade tu primera tendencia para comenzar a realizar seguimiento.
                </p>
                <Button 
                  onClick={handleOpenCreateTendencia} 
                  className="mt-4"
                >
                  <PlusCircle className="h-4 w-4 mr-1" /> Añadir tendencia
                </Button>
              </div>
            )}
          </div>

          {/* Cuadros de resumen */}
          {tendencias && tendencias.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Insights del mercado</CardTitle>
                  <CardDescription>
                    Recomendaciones basadas en las tendencias observadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <Lightbulb className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Oportunidades emergentes</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Enfoca tus estrategias en las áreas de mayor crecimiento según las tendencias.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                        <Share2 className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Diferenciación estratégica</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Busca áreas donde los competidores no están enfocados para establecer ventajas competitivas.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center">
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Posicionamiento efectivo</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Define tu posicionamiento único basado en las debilidades identificadas en tus principales competidores.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribución por impacto</CardTitle>
                  <CardDescription>
                    Clasificación de tendencias según su relevancia
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    {/* Categorías de impacto */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Alto</span>
                          <span className="text-sm text-muted-foreground">
                            {tendencias.filter(t => t.impacto_estimado?.toLowerCase() === "alto").length} tendencias
                          </span>
                        </div>
                        <Progress value={
                          (tendencias.filter(t => t.impacto_estimado?.toLowerCase() === "alto").length / tendencias.length) * 100
                        } className="h-2 bg-red-500/20 [&>div]:bg-red-500" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Medio</span>
                          <span className="text-sm text-muted-foreground">
                            {tendencias.filter(t => t.impacto_estimado?.toLowerCase() === "medio").length} tendencias
                          </span>
                        </div>
                        <Progress value={
                          (tendencias.filter(t => t.impacto_estimado?.toLowerCase() === "medio").length / tendencias.length) * 100
                        } className="h-2 bg-yellow-500/20 [&>div]:bg-yellow-500" />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Bajo</span>
                          <span className="text-sm text-muted-foreground">
                            {tendencias.filter(t => t.impacto_estimado?.toLowerCase() === "bajo").length} tendencias
                          </span>
                        </div>
                        <Progress value={
                          (tendencias.filter(t => t.impacto_estimado?.toLowerCase() === "bajo").length / tendencias.length) * 100
                        } className="h-2 bg-green-500/20 [&>div]:bg-green-500" />
                      </div>
                    </div>

                    {/* Categorías */}
                    <div className="pt-2">
                      <h4 className="text-sm font-medium mb-3">Distribución por categoría</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 p-2 rounded-md bg-accent/50">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Mercado: {tendencias.filter(t => t.categoria?.toLowerCase() === "mercado").length}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-md bg-accent/50">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Industria: {tendencias.filter(t => t.categoria?.toLowerCase() === "industria").length}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-md bg-accent/50">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Competencia: {tendencias.filter(t => t.categoria?.toLowerCase() === "competencia").length}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-md bg-accent/50">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Interna: {tendencias.filter(t => t.categoria?.toLowerCase() === "interna").length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog para crear competidor */}
      <Dialog open={competidorFormOpen} onOpenChange={setCompetidorFormOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Añadir nuevo competidor</DialogTitle>
            <DialogDescription>
              Registra un nuevo competidor para analizar y realizar seguimiento
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre del competidor *</Label>
                <Input 
                  id="nombre" 
                  placeholder="Ej. Empresa XYZ"
                  value={competidorForm.nombre}
                  onChange={(e) => setCompetidorForm({...competidorForm, nombre: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industria">Industria *</Label>
                  <Input 
                    id="industria" 
                    placeholder="Ej. Tecnología"
                    value={competidorForm.industria}
                    onChange={(e) => setCompetidorForm({...competidorForm, industria: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="tamano">Tamaño *</Label>
                  <Select 
                    value={competidorForm.tamano}
                    onValueChange={(value) => setCompetidorForm({...competidorForm, tamano: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tamaño" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pequeña">Pequeña</SelectItem>
                      <SelectItem value="mediana">Mediana</SelectItem>
                      <SelectItem value="grande">Grande</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="sitio_web">Sitio web</Label>
                <Input
                  id="sitio_web" 
                  placeholder="https://www.ejemplo.com"
                  value={competidorForm.sitio_web}
                  onChange={(e) => setCompetidorForm({...competidorForm, sitio_web: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion" 
                  placeholder="Describe este competidor y sus características principales..."
                  value={competidorForm.descripcion}
                  onChange={(e) => setCompetidorForm({...competidorForm, descripcion: e.target.value})}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="nivel_amenaza">Nivel de amenaza (1-10)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="nivel_amenaza"
                    type="number"
                    min="1"
                    max="10"
                    value={competidorForm.nivel_amenaza}
                    onChange={(e) => setCompetidorForm({...competidorForm, nivel_amenaza: parseInt(e.target.value) || 5})}
                    className="w-20"
                  />
                  <div className="flex-1">
                    <Progress 
                      value={(competidorForm.nivel_amenaza / 10) * 100} 
                      className={`h-2 ${
                        competidorForm.nivel_amenaza <= 3 ? "bg-green-500" :
                        competidorForm.nivel_amenaza <= 6 ? "bg-yellow-500" :
                        "bg-red-500"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fortalezas">Fortalezas</Label>
                  <Textarea
                    id="fortalezas" 
                    placeholder="Una fortaleza por línea o separadas por comas"
                    value={Array.isArray(competidorForm.fortalezas) ? competidorForm.fortalezas.join(", ") : competidorForm.fortalezas}
                    onChange={(e) => setCompetidorForm({...competidorForm, fortalezas: e.target.value})}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="debilidades">Debilidades</Label>
                  <Textarea
                    id="debilidades" 
                    placeholder="Una debilidad por línea o separadas por comas"
                    value={Array.isArray(competidorForm.debilidades) ? competidorForm.debilidades.join(", ") : competidorForm.debilidades}
                    onChange={(e) => setCompetidorForm({...competidorForm, debilidades: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompetidorFormOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveCompetidor} 
              disabled={!competidorForm.nombre || !competidorForm.industria || !competidorForm.tamano}
            >
              Añadir competidor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para crear tendencia */}
      <Dialog open={tendenciaFormOpen} onOpenChange={setTendenciaFormOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Añadir nueva tendencia</DialogTitle>
            <DialogDescription>
              Registra una nueva tendencia o hallazgo del mercado
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="titulo_tendencia">Título *</Label>
                <Input 
                  id="titulo_tendencia" 
                  placeholder="Ej. Crecimiento de la demanda en..."
                  value={tendenciaForm.titulo}
                  onChange={(e) => setTendenciaForm({...tendenciaForm, titulo: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categoria_tendencia">Categoría *</Label>
                  <Select 
                    value={tendenciaForm.categoria}
                    onValueChange={(value) => setTendenciaForm({...tendenciaForm, categoria: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mercado">Mercado</SelectItem>
                      <SelectItem value="industria">Industria</SelectItem>
                      <SelectItem value="competencia">Competencia</SelectItem>
                      <SelectItem value="interna">Interna</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="impacto">Impacto estimado *</Label>
                  <Select 
                    value={tendenciaForm.impacto_estimado}
                    onValueChange={(value) => setTendenciaForm({...tendenciaForm, impacto_estimado: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona impacto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alto">Alto</SelectItem>
                      <SelectItem value="medio">Medio</SelectItem>
                      <SelectItem value="bajo">Bajo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="descripcion_tendencia">Descripción *</Label>
                <Textarea
                  id="descripcion_tendencia" 
                  placeholder="Describe esta tendencia con detalles relevantes..."
                  value={tendenciaForm.descripcion}
                  onChange={(e) => setTendenciaForm({...tendenciaForm, descripcion: e.target.value})}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="fuente_datos">Fuente de datos</Label>
                <Input
                  id="fuente_datos" 
                  placeholder="Ej. Estudio de mercado, Analytics, Encuestas..."
                  value={tendenciaForm.fuente_datos}
                  onChange={(e) => setTendenciaForm({...tendenciaForm, fuente_datos: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="acciones_recomendadas">Acciones recomendadas</Label>
                <Textarea
                  id="acciones_recomendadas" 
                  placeholder="Una acción por línea o separadas por comas"
                  value={Array.isArray(tendenciaForm.acciones_recomendadas) ? tendenciaForm.acciones_recomendadas.join(", ") : tendenciaForm.acciones_recomendadas}
                  onChange={(e) => setTendenciaForm({...tendenciaForm, acciones_recomendadas: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setTendenciaFormOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveTendencia} 
              disabled={!tendenciaForm.titulo || !tendenciaForm.descripcion}
            >
              Añadir tendencia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver detalles de competidor */}
      <Dialog open={!!selectedCompetidor} onOpenChange={() => setSelectedCompetidor(null)}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {selectedCompetidor?.nombre}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <span className="capitalize">{selectedCompetidor?.industria}</span>
              <span>•</span>
              <span className="capitalize">{selectedCompetidor?.tamano}</span>
              <span>•</span>
              <Badge className={selectedCompetidor?.nivel_amenaza ? getAmenazaColor(selectedCompetidor.nivel_amenaza) : ""}>
                Nivel {selectedCompetidor?.nivel_amenaza}/10
              </Badge>
            </DialogDescription>
          </DialogHeader>
          
          {selectedCompetidor && (
            <ScrollArea className="max-h-[500px] overflow-auto pr-4">
              <div className="space-y-6 py-2">
                {selectedCompetidor.sitio_web && (
                  <div className="flex justify-start">
                    <a 
                      href={selectedCompetidor.sitio_web} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary flex items-center hover:underline"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Visitar sitio web
                    </a>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">Descripción</h4>
                  <p className="text-sm">{selectedCompetidor.descripcion || "Sin descripción"}</p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Fortalezas</h4>
                    {selectedCompetidor.fortalezas && selectedCompetidor.fortalezas.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedCompetidor.fortalezas.map((fortaleza, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span>{fortaleza}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No se han registrado fortalezas</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Debilidades</h4>
                    {selectedCompetidor.debilidades && selectedCompetidor.debilidades.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedCompetidor.debilidades.map((debilidad, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>{debilidad}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No se han registrado debilidades</p>
                    )}
                  </div>
                </div>
                
                {selectedCompetidor.productos_servicios && Object.keys(selectedCompetidor.productos_servicios).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Productos y servicios</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(selectedCompetidor.productos_servicios).map(([key, value], idx) => (
                          <div key={idx} className="p-2 rounded bg-accent/50">
                            <p className="font-medium text-sm">{key}</p>
                            <p className="text-xs text-muted-foreground">
                              {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                
                {selectedCompetidor.canales_sociales && Object.keys(selectedCompetidor.canales_sociales).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Canales sociales</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(selectedCompetidor.canales_sociales).map(([canal, url], idx) => (
                          <a
                            key={idx}
                            href={url.toString()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 hover:bg-primary/20 text-primary-foreground text-xs"
                          >
                            <span className="capitalize">{canal}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          )}
          
          <DialogFooter>
            <Button onClick={() => setSelectedCompetidor(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver detalles de tendencia */}
      <Dialog open={!!selectedTendencia} onOpenChange={() => setSelectedTendencia(null)}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {selectedTendencia?.titulo}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <div className="flex items-center">
                {getTendenciaIcon(selectedTendencia?.categoria || "")}
                <span className="ml-1 capitalize">{selectedTendencia?.categoria}</span>
              </div>
              <span>•</span>
              <Badge className={selectedTendencia?.impacto_estimado ? getImpactoColor(selectedTendencia.impacto_estimado) : ""}>
                {selectedTendencia?.impacto_estimado?.toUpperCase() || ""}
              </Badge>
              <span>•</span>
              <span className="text-muted-foreground">
                {selectedTendencia?.created_at ? formatDate(selectedTendencia.created_at) : ""}
              </span>
            </DialogDescription>
          </DialogHeader>
          
          {selectedTendencia && (
            <ScrollArea className="max-h-[500px] overflow-auto pr-4">
              <div className="space-y-6 py-2">
                <div>
                  <h4 className="font-medium mb-2">Descripción</h4>
                  <p className="text-sm">{selectedTendencia.descripcion || "Sin descripción"}</p>
                </div>

                <Separator />
                
                {selectedTendencia.fuente_datos && (
                  <div>
                    <h4 className="font-medium mb-2">Fuente de datos</h4>
                    <p className="text-sm bg-accent/50 p-2 rounded">{selectedTendencia.fuente_datos}</p>
                  </div>
                )}
                
                {selectedTendencia.fecha_inicio && selectedTendencia.fecha_fin && (
                  <div>
                    <h4 className="font-medium mb-2">Período</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {formatDate(selectedTendencia.fecha_inicio)}
                      </span>
                      <span>→</span>
                      <span className="text-sm">
                        {formatDate(selectedTendencia.fecha_fin)}
                      </span>
                    </div>
                  </div>
                )}
                
                {selectedTendencia.acciones_recomendadas && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Acciones recomendadas</h4>
                      <div className="space-y-2">
                        {Array.isArray(selectedTendencia.acciones_recomendadas.acciones) && 
                          selectedTendencia.acciones_recomendadas.acciones.length > 0 ? (
                          <ul className="space-y-2">
                            {selectedTendencia.acciones_recomendadas.acciones.map((accion, idx) => (
                              <li key={idx} className="flex items-start gap-2 bg-accent/50 p-2 rounded">
                                <span className="font-medium">{idx + 1}.</span>
                                <span className="text-sm">{accion}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No hay acciones recomendadas registradas</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
                
                {selectedTendencia.datos_temporales && Object.keys(selectedTendencia.datos_temporales).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Datos temporales</h4>
                      <div className="bg-accent/50 p-3 rounded">
                        <pre className="text-xs overflow-auto">
                          {JSON.stringify(selectedTendencia.datos_temporales, null, 2)}
                        </pre>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Estos datos se pueden visualizar en gráficos para un mejor análisis.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          )}
          
          <DialogFooter>
            <Button onClick={() => setSelectedTendencia(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarketingInteligencia;