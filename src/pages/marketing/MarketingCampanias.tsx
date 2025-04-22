import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Megaphone, 
  Search, 
  PlusCircle, 
  Calendar, 
  Filter, 
  BarChart3, 
  ArrowUpRight,
  Link2,
  Pencil,
  Eye,
  PieChart,
  Target,
  QrCode,
  Copy,
  MoreVertical,
  Pause,
  Play,
  Trash
} from "lucide-react";

import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

// Datos de ejemplo para las campañas
const campaniasMock = [
  {
    id: "cam-001",
    nombre: "Promoción Verano 2025",
    descripcion: "Campaña especial para promocionar productos de verano",
    objetivo: "conversion",
    presupuesto: 1500,
    gastado: 750,
    fecha_inicio: "2025-06-01",
    fecha_fin: "2025-08-31",
    estado: "active",
    plataformas: ["facebook", "instagram", "google"],
    resultados: {
      impresiones: 15000,
      clics: 1200,
      conversiones: 125,
      ctr: 8.0,
      cpc: 0.62,
      roas: 3.2
    }
  },
  {
    id: "cam-002",
    nombre: "Campaña de Email Reactivación",
    descripcion: "Recuperación de clientes inactivos en los últimos 6 meses",
    objetivo: "engagement",
    presupuesto: 800,
    gastado: 320,
    fecha_inicio: "2025-05-15",
    fecha_fin: "2025-07-15",
    estado: "active",
    plataformas: ["email"],
    resultados: {
      impresiones: 8000,
      clics: 560,
      conversiones: 68,
      ctr: 7.0,
      cpc: 0.57,
      roas: 2.8
    }
  },
  {
    id: "cam-003",
    nombre: "Webinar Producto Nuevo",
    descripcion: "Presentación del lanzamiento del nuevo producto",
    objetivo: "awareness",
    presupuesto: 1200,
    gastado: 0,
    fecha_inicio: "2025-09-10",
    fecha_fin: "2025-09-10",
    estado: "scheduled",
    plataformas: ["linkedin", "email", "facebook"],
    resultados: {
      impresiones: 0,
      clics: 0,
      conversiones: 0,
      ctr: 0,
      cpc: 0,
      roas: 0
    }
  },
  {
    id: "cam-004",
    nombre: "Descuentos Black Friday",
    descripcion: "Campaña especial para Black Friday con descuentos exclusivos",
    objetivo: "conversion",
    presupuesto: 2000,
    gastado: 1800,
    fecha_inicio: "2025-11-20",
    fecha_fin: "2025-11-27",
    estado: "completed",
    plataformas: ["facebook", "instagram", "google", "email"],
    resultados: {
      impresiones: 25000,
      clics: 3200,
      conversiones: 420,
      ctr: 12.8,
      cpc: 0.56,
      roas: 4.5
    }
  },
  {
    id: "cam-005",
    nombre: "Campaña Awareness Podcast",
    descripcion: "Difusión de nuestro nuevo podcast sobre tecnología",
    objetivo: "awareness",
    presupuesto: 600,
    gastado: 150,
    fecha_inicio: "2025-07-01",
    fecha_fin: "2025-08-31",
    estado: "active",
    plataformas: ["spotify", "linkedin", "twitter"],
    resultados: {
      impresiones: 5000,
      clics: 350,
      conversiones: 45,
      ctr: 7.0,
      cpc: 0.43,
      roas: 1.8
    }
  },
];

// Datos de ejemplo para UTMs
const utmsMock = [
  {
    id: "utm-001",
    campania_id: "cam-001",
    utm_source: "facebook",
    utm_medium: "social",
    utm_campaign: "promo-verano-2025",
    utm_content: "carrusel1",
    url_destino: "https://empresa.com/promo-verano",
    url_completa: "https://empresa.com/promo-verano?utm_source=facebook&utm_medium=social&utm_campaign=promo-verano-2025&utm_content=carrusel1",
    descripcion: "Anuncio de carrusel para Facebook",
    qr_code_url: "https://placeholder.com/qr-placeholder.png"
  },
  {
    id: "utm-002",
    campania_id: "cam-001",
    utm_source: "instagram",
    utm_medium: "social",
    utm_campaign: "promo-verano-2025",
    utm_content: "story1",
    url_destino: "https://empresa.com/promo-verano",
    url_completa: "https://empresa.com/promo-verano?utm_source=instagram&utm_medium=social&utm_campaign=promo-verano-2025&utm_content=story1",
    descripcion: "Stories de Instagram",
    qr_code_url: "https://placeholder.com/qr-placeholder.png"
  },
  {
    id: "utm-003",
    campania_id: "cam-002",
    utm_source: "email",
    utm_medium: "email",
    utm_campaign: "reactivacion-2025",
    utm_content: "header-button",
    url_destino: "https://empresa.com/reactivacion",
    url_completa: "https://empresa.com/reactivacion?utm_source=email&utm_medium=email&utm_campaign=reactivacion-2025&utm_content=header-button",
    descripcion: "Botón principal en el email",
    qr_code_url: null
  },
];

const MarketingCampanias = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("todas");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCampanias, setSelectedCampanias] = useState<string[]>([]);
  const [isCreatingCampania, setIsCreatingCampania] = useState(false);
  const [isCreatingUTM, setIsCreatingUTM] = useState(false);
  const [selectedUTMCampania, setSelectedUTMCampania] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Filtrar campañas basado en la búsqueda, estado y pestaña activa
  const filteredCampanias = campaniasMock.filter(campania => {
    // Filtro por búsqueda
    const matchesSearch = campania.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campania.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por estado
    const matchesStatus = statusFilter === "all" || campania.estado === statusFilter;
    
    // Filtro por pestaña
    const matchesTab = activeTab === "todas" || 
                      (activeTab === "activas" && campania.estado === "active") || 
                      (activeTab === "programadas" && campania.estado === "scheduled") ||
                      (activeTab === "completadas" && campania.estado === "completed");
    
    return matchesSearch && matchesStatus && matchesTab;
  });

  // Formatear números con separadores de miles
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  // Formatear fecha
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Obtener color basado en el objetivo
  const getObjetivoColor = (objetivo: string) => {
    switch (objetivo) {
      case "conversion": return "bg-green-500/10 text-green-500";
      case "engagement": return "bg-blue-500/10 text-blue-500";
      case "awareness": return "bg-purple-500/10 text-purple-500";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  // Obtener color y texto basado en el estado
  const getEstadoInfo = (estado: string) => {
    switch (estado) {
      case "active": return { color: "bg-green-500/10 text-green-500", text: "Activa" };
      case "scheduled": return { color: "bg-blue-500/10 text-blue-500", text: "Programada" };
      case "paused": return { color: "bg-orange-500/10 text-orange-500", text: "Pausada" };
      case "completed": return { color: "bg-gray-500/10 text-gray-500", text: "Completada" };
      default: return { color: "bg-gray-500/10 text-gray-500", text: "Desconocido" };
    }
  };

  // Obtener UTMs para una campaña específica
  const getUTMsForCampania = (campaniaId: string) => {
    return utmsMock.filter(utm => utm.campania_id === campaniaId);
  };

  // Manejar selección de campañas
  const handleSelectCampania = (id: string) => {
    if (selectedCampanias.includes(id)) {
      setSelectedCampanias(selectedCampanias.filter(campId => campId !== id));
    } else {
      setSelectedCampanias([...selectedCampanias, id]);
    }
  };

  // Manejar selección de todas las campañas
  const handleSelectAll = () => {
    if (selectedCampanias.length === filteredCampanias.length) {
      setSelectedCampanias([]);
    } else {
      setSelectedCampanias(filteredCampanias.map(camp => camp.id));
    }
  };

  // Copiar URL al portapapeles
  const handleCopyURL = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="space-y-6 py-[14px] px-[21px]">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Campañas</h1>
          <p className="text-muted-foreground">
            Gestiona tus campañas de marketing en diferentes plataformas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isCreatingCampania} onOpenChange={setIsCreatingCampania}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Nueva Campaña
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Crear Nueva Campaña</DialogTitle>
                <DialogDescription>
                  Configura los detalles de tu nueva campaña de marketing
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="nombre" className="text-sm font-medium">Nombre</label>
                    <Input id="nombre" placeholder="Nombre de la campaña" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="objetivo" className="text-sm font-medium">Objetivo</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un objetivo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conversion">Conversión</SelectItem>
                        <SelectItem value="awareness">Awareness</SelectItem>
                        <SelectItem value="engagement">Engagement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="descripcion" className="text-sm font-medium">Descripción</label>
                  <Input id="descripcion" placeholder="Describe el propósito de la campaña" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="fecha_inicio" className="text-sm font-medium">Fecha Inicio</label>
                    <Input id="fecha_inicio" type="date" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="fecha_fin" className="text-sm font-medium">Fecha Fin</label>
                    <Input id="fecha_fin" type="date" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="presupuesto" className="text-sm font-medium">Presupuesto (€)</label>
                    <Input id="presupuesto" type="number" min="0" step="100" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="plataformas" className="text-sm font-medium">Plataformas</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar plataformas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreatingCampania(false)}>Cancelar</Button>
                <Button>Crear Campaña</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreatingUTM} onOpenChange={setIsCreatingUTM}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Crear Enlaces UTM</DialogTitle>
                <DialogDescription>
                  {selectedUTMCampania ? 
                    `Generar enlaces UTM para la campaña: ${campaniasMock.find(c => c.id === selectedUTMCampania)?.nombre}` :
                    "Crea enlaces de seguimiento para tus campañas"
                  }
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                {!selectedUTMCampania && (
                  <div className="space-y-2">
                    <label htmlFor="campania" className="text-sm font-medium">Campaña</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una campaña" />
                      </SelectTrigger>
                      <SelectContent>
                        {campaniasMock.map(camp => (
                          <SelectItem key={camp.id} value={camp.id}>{camp.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="url_destino" className="text-sm font-medium">URL de Destino</label>
                  <Input id="url_destino" placeholder="https://tudominio.com/pagina" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="utm_source" className="text-sm font-medium">Fuente (utm_source)</label>
                    <Input id="utm_source" placeholder="facebook, google, newsletter" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="utm_medium" className="text-sm font-medium">Medio (utm_medium)</label>
                    <Input id="utm_medium" placeholder="cpc, email, social" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="utm_campaign" className="text-sm font-medium">Campaña (utm_campaign)</label>
                    <Input id="utm_campaign" placeholder="nombre-de-campaña" value={selectedUTMCampania ? campaniasMock.find(c => c.id === selectedUTMCampania)?.nombre.toLowerCase().replace(/\s+/g, '-') : ''} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="utm_content" className="text-sm font-medium">Contenido (utm_content)</label>
                    <Input id="utm_content" placeholder="banner-superior, boton-cta" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="url_preview" className="text-sm font-medium">Vista previa de URL</label>
                  <div className="border rounded-md p-3 bg-muted/30">
                    <p className="text-xs break-all text-muted-foreground">
                      https://tudominio.com/pagina?utm_source=facebook&utm_medium=social&utm_campaign=promo-verano-2025&utm_content=carrusel1
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsCreatingUTM(false);
                  setSelectedUTMCampania(null);
                }}>
                  Cancelar
                </Button>
                <Button>Generar UTM</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar campañas..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activas</SelectItem>
              <SelectItem value="scheduled">Programadas</SelectItem>
              <SelectItem value="paused">Pausadas</SelectItem>
              <SelectItem value="completed">Completadas</SelectItem>
            </SelectContent>
          </Select>

          <div className="rounded-md border">
            <div className="flex h-10 items-center">
              <Button 
                variant={viewMode === "grid" ? "default" : "ghost"} 
                size="sm" 
                className="rounded-none h-9" 
                onClick={() => setViewMode("grid")}
              >
                <PieChart className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === "list" ? "default" : "ghost"} 
                size="sm" 
                className="rounded-none h-9" 
                onClick={() => setViewMode("list")}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="todas" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="todas" className="py-2">
            Todas
          </TabsTrigger>
          <TabsTrigger value="activas" className="py-2">
            Activas
          </TabsTrigger>
          <TabsTrigger value="programadas" className="py-2">
            Programadas
          </TabsTrigger>
          <TabsTrigger value="completadas" className="py-2">
            Completadas
          </TabsTrigger>
        </TabsList>

        {/* Estado de carga */}
        {isLoading ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <Skeleton className="h-3 w-1/2 mb-1" />
                  <Skeleton className="h-2 w-full mb-4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-10 w-20" />
                    <Skeleton className="h-10 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Vista de Grid */}
            {viewMode === "grid" && (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredCampanias.map((campania) => (
                  <Card key={campania.id} className="overflow-hidden">
                    <div className="flex items-start justify-between p-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            checked={selectedCampanias.includes(campania.id)}
                            onCheckedChange={() => handleSelectCampania(campania.id)}
                            className="h-4 w-4"
                          />
                          <h3 className="font-semibold text-lg">{campania.nombre}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{campania.descripcion}</p>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2">
                            <Eye className="h-4 w-4" /> Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Pencil className="h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => {
                            setSelectedUTMCampania(campania.id);
                            setIsCreatingUTM(true);
                          }}>
                            <Link2 className="h-4 w-4" /> Crear UTM
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {campania.estado === "active" ? (
                            <DropdownMenuItem className="gap-2 text-amber-500">
                              <Pause className="h-4 w-4" /> Pausar
                            </DropdownMenuItem>
                          ) : campania.estado === "paused" ? (
                            <DropdownMenuItem className="gap-2 text-green-500">
                              <Play className="h-4 w-4" /> Activar
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem className="gap-2 text-red-500">
                            <Trash className="h-4 w-4" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <CardContent className="pb-1">
                      <div className="flex justify-between items-center mb-3">
                        <Badge 
                          variant="secondary" 
                          className={getObjetivoColor(campania.objetivo)}
                        >
                          {campania.objetivo === "conversion" ? "Conversión" : 
                           campania.objetivo === "engagement" ? "Engagement" : 
                           "Awareness"}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={getEstadoInfo(campania.estado).color}
                        >
                          {getEstadoInfo(campania.estado).text}
                        </Badge>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="text-sm font-medium flex justify-between">
                            <span>Presupuesto utilizado</span>
                            <span>{Math.round((campania.gastado / campania.presupuesto) * 100)}%</span>
                          </div>
                          <Progress 
                            value={(campania.gastado / campania.presupuesto) * 100}
                            className="h-2"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Presupuesto:</span>
                          </div>
                          <div className="text-right">
                            <span>{formatNumber(campania.presupuesto)} €</span>
                          </div>

                          <div>
                            <span className="text-muted-foreground">Fechas:</span>
                          </div>
                          <div className="text-right">
                            <span>{formatDate(campania.fecha_inicio)} - {formatDate(campania.fecha_fin)}</span>
                          </div>

                          {campania.resultados.conversiones > 0 && (
                            <>
                              <div>
                                <span className="text-muted-foreground">Conversiones:</span>
                              </div>
                              <div className="text-right">
                                <span>{formatNumber(campania.resultados.conversiones)}</span>
                                {campania.resultados.conversiones > campania.resultados.conversiones - 10 && (
                                  <ArrowUpRight className="h-3 w-3 text-green-500 inline ml-1" />
                                )}
                              </div>
                            </>
                          )}
                          
                          {campania.resultados.ctr > 0 && (
                            <>
                              <div>
                                <span className="text-muted-foreground">CTR:</span>
                              </div>
                              <div className="text-right">
                                <span>{campania.resultados.ctr}%</span>
                              </div>
                            </>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {campania.plataformas.map((plataforma) => (
                            <Badge 
                              key={plataforma} 
                              variant="outline"
                              className="bg-muted/40"
                            >
                              {plataforma}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="flex justify-between pt-1">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" /> Ver Detalles
                      </Button>
                      
                      <Button variant="ghost" size="sm" className="gap-2" onClick={() => {
                        setSelectedUTMCampania(campania.id);
                        setIsCreatingUTM(true);
                      }}>
                        <Link2 className="h-4 w-4" /> UTM
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {/* Vista de Lista */}
            {viewMode === "list" && (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox 
                            checked={selectedCampanias.length > 0 && selectedCampanias.length === filteredCampanias.length} 
                            onCheckedChange={handleSelectAll}
                            className="h-4 w-4"
                          />
                        </TableHead>
                        <TableHead>Campaña</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Objetivo</TableHead>
                        <TableHead className="hidden md:table-cell">Presupuesto</TableHead>
                        <TableHead className="hidden md:table-cell">Fechas</TableHead>
                        <TableHead className="hidden lg:table-cell">Conversiones</TableHead>
                        <TableHead className="hidden lg:table-cell">CTR</TableHead>
                        <TableHead className="w-[100px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCampanias.map((campania) => (
                        <TableRow key={campania.id}>
                          <TableCell>
                            <Checkbox 
                              checked={selectedCampanias.includes(campania.id)}
                              onCheckedChange={() => handleSelectCampania(campania.id)}
                              className="h-4 w-4"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{campania.nombre}</span>
                              <span className="text-xs text-muted-foreground truncate max-w-xs">{campania.descripcion}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={getEstadoInfo(campania.estado).color}
                            >
                              {getEstadoInfo(campania.estado).text}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary" 
                              className={getObjetivoColor(campania.objetivo)}
                            >
                              {campania.objetivo === "conversion" ? "Conversión" : 
                               campania.objetivo === "engagement" ? "Engagement" : 
                               "Awareness"}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex flex-col">
                              <span>{formatNumber(campania.gastado)} € / {formatNumber(campania.presupuesto)} €</span>
                              <div className="w-24 h-1.5 bg-muted rounded-full mt-1">
                                <div 
                                  className="h-full bg-primary rounded-full" 
                                  style={{ width: `${(campania.gastado / campania.presupuesto) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex flex-col">
                              <span className="whitespace-nowrap">{formatDate(campania.fecha_inicio)}</span>
                              <span className="whitespace-nowrap text-muted-foreground">a {formatDate(campania.fecha_fin)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {campania.resultados.conversiones}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {campania.resultados.ctr}%
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem className="gap-2">
                                  <Eye className="h-4 w-4" /> Ver detalles
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2">
                                  <Pencil className="h-4 w-4" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2" onClick={() => {
                                  setSelectedUTMCampania(campania.id);
                                  setIsCreatingUTM(true);
                                }}>
                                  <Link2 className="h-4 w-4" /> Crear UTM
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {campania.estado === "active" ? (
                                  <DropdownMenuItem className="gap-2 text-amber-500">
                                    <Pause className="h-4 w-4" /> Pausar
                                  </DropdownMenuItem>
                                ) : campania.estado === "paused" ? (
                                  <DropdownMenuItem className="gap-2 text-green-500">
                                    <Play className="h-4 w-4" /> Activar
                                  </DropdownMenuItem>
                                ) : null}
                                <DropdownMenuItem className="gap-2 text-red-500">
                                  <Trash className="h-4 w-4" /> Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Sin resultados */}
            {filteredCampanias.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No se encontraron campañas</h3>
                  <p className="text-center text-muted-foreground max-w-md mb-6">
                    No hay campañas que coincidan con tu búsqueda. Intenta con otros términos o crea una nueva campaña.
                  </p>
                  <Button onClick={() => setIsCreatingCampania(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Crear Campaña
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Tabs>

      {/* Sección de UTM */}
      <div className="pt-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold">Enlaces UTM</h2>
            <p className="text-muted-foreground">
              Gestiona tus enlaces de seguimiento para campañas
            </p>
          </div>
          <Button variant="outline" onClick={() => setIsCreatingUTM(true)} className="gap-2">
            <Link2 className="h-4 w-4" />
            Nuevo Enlace UTM
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaña</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead className="hidden md:table-cell">Medio</TableHead>
                  <TableHead className="hidden md:table-cell">Contenido</TableHead>
                  <TableHead className="hidden lg:table-cell">URL</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {utmsMock.map((utm) => {
                  const campania = campaniasMock.find(c => c.id === utm.campania_id);
                  return (
                    <TableRow key={utm.id}>
                      <TableCell>
                        {campania?.nombre || "Campaña desconocida"}
                      </TableCell>
                      <TableCell>{utm.utm_source}</TableCell>
                      <TableCell className="hidden md:table-cell">{utm.utm_medium}</TableCell>
                      <TableCell className="hidden md:table-cell">{utm.utm_content}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="max-w-xs truncate text-muted-foreground text-xs">
                          {utm.url_completa}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleCopyURL(utm.url_completa)}
                          >
                            {copiedUrl === utm.url_completa ? (
                              <div className="text-green-500 text-xs">✓</div>
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          {utm.qr_code_url && (
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <QrCode className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MarketingCampanias;