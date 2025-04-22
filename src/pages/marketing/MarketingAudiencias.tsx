import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMarketingAudiencias, MarketingAudiencia } from "@/hooks/marketing/useMarketingAudiencias";

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
  DialogTrigger,
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
import { Switch } from "@/components/ui/switch";

import {
  Users,
  UserPlus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Edit,
  Trash2,
  MoreVertical,
  Pencil,
  Eye,
  BarChart,
  LineChart,
  PieChart,
  AlertCircle
} from "lucide-react";

const MarketingAudiencias = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSegmento, setSelectedSegmento] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"lista" | "analytics">("lista");
  const [selectedAudiencia, setSelectedAudiencia] = useState<MarketingAudiencia | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 8;

  // Usar el hook con opciones de filtrado
  const {
    audiencias,
    isLoading,
    totalCount,
    totalPages,
    getSegmentos,
    createAudiencia,
    updateAudiencia,
    deleteAudiencia
  } = useMarketingAudiencias({
    page,
    pageSize,
    filters: {
      segmento: selectedSegmento || undefined,
      searchTerm: searchTerm || undefined
    }
  });

  // Estado para el formulario
  const [formData, setFormData] = useState({
    id: "",
    nombre: "",
    descripcion: "",
    segmento: "demografico", // valor predeterminado
    tamano_estimado: 0,
    caracteristicas: {},
    comportamiento: {},
    fuentes_datos: [],
    valor_estimado: 0,
    tasa_conversion: 0,
    interacciones_promedio: 0
  });

  // Manejar búsqueda
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0); // Resetear página al buscar
  };

  // Manejar cambio de segmento
  const handleSegmentoChange = (value: string) => {
    // Si se selecciona "todos", establecer un string vacío para que no se aplique filtro
    setSelectedSegmento(value === "todos" ? "" : value);
    setPage(0); // Resetear página al cambiar filtro
  };

  // Abrir formulario para crear
  const handleOpenCreateForm = () => {
    setFormData({
      id: "",
      nombre: "",
      descripcion: "",
      segmento: "demografico",
      tamano_estimado: 0,
      caracteristicas: {},
      comportamiento: {},
      fuentes_datos: [],
      valor_estimado: 0,
      tasa_conversion: 0,
      interacciones_promedio: 0
    });
    setIsCreating(true);
    setIsEditing(false);
    setFormOpen(true);
  };

  // Abrir formulario para editar
  const handleOpenEditForm = (audiencia: MarketingAudiencia) => {
    setFormData({
      id: audiencia.id,
      nombre: audiencia.nombre,
      descripcion: audiencia.descripcion || "",
      segmento: audiencia.segmento,
      tamano_estimado: audiencia.tamano_estimado || 0,
      caracteristicas: audiencia.caracteristicas || {},
      comportamiento: audiencia.comportamiento || {},
      fuentes_datos: audiencia.fuentes_datos || [],
      valor_estimado: audiencia.valor_estimado || 0,
      tasa_conversion: audiencia.tasa_conversion || 0,
      interacciones_promedio: audiencia.interacciones_promedio || 0
    });
    setIsCreating(false);
    setIsEditing(true);
    setFormOpen(true);
  };

  // Ver detalles de audiencia
  const handleViewDetails = (audiencia: MarketingAudiencia) => {
    setSelectedAudiencia(audiencia);
  };

  // Guardar audiencia (crear o actualizar)
  const handleSaveAudiencia = () => {
    if (isCreating) {
      // Crear nueva audiencia
      createAudiencia.mutate({
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        segmento: formData.segmento,
        tamano_estimado: formData.tamano_estimado,
        caracteristicas: formData.caracteristicas,
        comportamiento: formData.comportamiento,
        fuentes_datos: formData.fuentes_datos,
        valor_estimado: formData.valor_estimado,
        tasa_conversion: formData.tasa_conversion,
        interacciones_promedio: formData.interacciones_promedio
      });
    } else {
      // Actualizar audiencia existente
      updateAudiencia.mutate({
        id: formData.id,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        segmento: formData.segmento,
        tamano_estimado: formData.tamano_estimado,
        caracteristicas: formData.caracteristicas,
        comportamiento: formData.comportamiento,
        fuentes_datos: formData.fuentes_datos,
        valor_estimado: formData.valor_estimado,
        tasa_conversion: formData.tasa_conversion,
        interacciones_promedio: formData.interacciones_promedio
      });
    }
    
    setFormOpen(false);
  };

  // Eliminar audiencia
  const handleDeleteAudiencia = (id: string) => {
    if (window.confirm("¿Estás seguro que deseas eliminar esta audiencia? Esta acción no se puede deshacer.")) {
      deleteAudiencia.mutate(id);
    }
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

  // Obtener el color de badge según el segmento
  const getSegmentoBadgeColor = (segmento: string) => {
    switch (segmento.toLowerCase()) {
      case "demografico":
        return "bg-blue-500/10 text-blue-500";
      case "comportamiento":
        return "bg-green-500/10 text-green-500";
      case "intereses":
        return "bg-purple-500/10 text-purple-500";
      case "geografico":
        return "bg-orange-500/10 text-orange-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  // Renderizar características en formato amigable
  const renderCaracteristicas = (caracteristicas: Record<string, any>) => {
    if (!caracteristicas || Object.keys(caracteristicas).length === 0) {
      return <span className="text-muted-foreground italic">Sin datos</span>;
    }

    return (
      <ul className="space-y-1">
        {Object.entries(caracteristicas).map(([key, value], index) => (
          <li key={index}>
            <span className="font-medium">{key}:</span>{" "}
            {typeof value === "object" ? JSON.stringify(value) : value.toString()}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-6 py-[14px] px-[21px]">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Audiencias</h1>
          <p className="text-muted-foreground">
            Segmentos de audiencia para tus campañas de marketing
          </p>
        </div>

        {activeTab === "lista" && (
          <div>
            <Button className="gap-2" onClick={handleOpenCreateForm}>
              <PlusCircle className="h-4 w-4" />
              Nueva Audiencia
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "lista" | "analytics")} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:w-[360px]">
          <TabsTrigger value="lista" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Audiencias</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            <span>Análisis</span>
          </TabsTrigger>
        </TabsList>

        {/* Vista de lista de audiencias */}
        <TabsContent value="lista" className="space-y-4">
          {/* Filtros y búsqueda */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar audiencias..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button type="submit">Buscar</Button>
              </form>
            </div>

            <div className="sm:w-[200px]">
              <Select value={selectedSegmento} onValueChange={handleSegmentoChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por segmento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los segmentos</SelectItem>
                  <SelectItem value="demografico">Demográfico</SelectItem>
                  <SelectItem value="comportamiento">Comportamiento</SelectItem>
                  <SelectItem value="intereses">Intereses</SelectItem>
                  <SelectItem value="geografico">Geográfico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contenedor de tarjetas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {isLoading
              ? Array.from({ length: pageSize }).map((_, index) => (
                  <Card key={`skeleton-${index}`} className="border rounded-lg overflow-hidden">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/4" />
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
              : audiencias?.map((audiencia) => (
                  <Card key={audiencia.id} className="border rounded-lg hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <div>
                          <CardTitle className="text-base">{audiencia.nombre}</CardTitle>
                          <CardDescription>
                            <Badge className={`${getSegmentoBadgeColor(audiencia.segmento)} mt-1`}>
                              {audiencia.segmento.charAt(0).toUpperCase() + audiencia.segmento.slice(1)}
                            </Badge>
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewDetails(audiencia)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEditForm(audiencia)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:bg-destructive focus:text-destructive-foreground" 
                              onClick={() => handleDeleteAudiencia(audiencia.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="py-2">
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {audiencia.descripcion || "Sin descripción..."}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center pt-1">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Tamaño estimado:</span>
                        <span className="text-sm font-medium">{audiencia.tamano_estimado?.toLocaleString() || "N/A"}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewDetails(audiencia)}
                      >
                        <Eye className="h-3 w-3 mr-1" /> Ver
                      </Button>
                    </CardFooter>
                  </Card>
                ))}

            {!isLoading && (!audiencias || audiencias.length === 0) && (
              <div className="col-span-full p-8 text-center">
                <Users className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No se encontraron audiencias</h3>
                <p className="text-muted-foreground mt-1">
                  {searchTerm || selectedSegmento
                    ? "Prueba a cambiar los filtros de búsqueda."
                    : "Crea tu primera audiencia para comenzar."}
                </p>
                <Button 
                  onClick={handleOpenCreateForm} 
                  className="mt-4"
                >
                  <PlusCircle className="h-4 w-4 mr-1" /> Crear audiencia
                </Button>
              </div>
            )}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {page * pageSize + 1} a {Math.min((page + 1) * pageSize, totalCount)} de {totalCount} audiencias
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

        {/* Vista de análisis */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por segmento</CardTitle>
                <CardDescription>
                  Audiencias agrupadas por segmentos
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="text-center py-8">
                  <PieChart className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Pronto disponible</p>
                  <Badge variant="outline" className="mt-2">Próximamente</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Valor por audiencia</CardTitle>
                <CardDescription>
                  Valor estimado vs. tamaño
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="text-center py-8">
                  <BarChart className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Pronto disponible</p>
                  <Badge variant="outline" className="mt-2">Próximamente</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tasas de conversión</CardTitle>
                <CardDescription>
                  Comparativa de conversión entre segmentos
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="text-center py-8">
                  <LineChart className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Pronto disponible</p>
                  <Badge variant="outline" className="mt-2">Próximamente</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog para crear/editar audiencia */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{isCreating ? "Crear nueva audiencia" : "Editar audiencia"}</DialogTitle>
            <DialogDescription>
              {isCreating 
                ? "Completa los detalles para crear un nuevo segmento de audiencia." 
                : "Actualiza los detalles de este segmento de audiencia."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre de la audiencia *</Label>
                <Input 
                  id="nombre" 
                  placeholder="Ej. Profesionales 25-35 años"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="segmento">Segmento *</Label>
                <Select 
                  value={formData.segmento}
                  onValueChange={(value) => setFormData({...formData, segmento: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un segmento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demografico">Demográfico</SelectItem>
                    <SelectItem value="comportamiento">Comportamiento</SelectItem>
                    <SelectItem value="intereses">Intereses</SelectItem>
                    <SelectItem value="geografico">Geográfico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion" 
                  placeholder="Describe esta audiencia y sus características principales..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tamano">Tamaño estimado</Label>
                  <Input
                    id="tamano"
                    type="number"
                    min="0"
                    value={formData.tamano_estimado}
                    onChange={(e) => setFormData({...formData, tamano_estimado: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="valor">Valor estimado</Label>
                  <Input
                    id="valor"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.valor_estimado}
                    onChange={(e) => setFormData({...formData, valor_estimado: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="conversion">Tasa de conversión (%)</Label>
                  <Input
                    id="conversion"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.tasa_conversion}
                    onChange={(e) => setFormData({...formData, tasa_conversion: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="interacciones">Interacciones promedio</Label>
                  <Input
                    id="interacciones"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.interacciones_promedio}
                    onChange={(e) => setFormData({...formData, interacciones_promedio: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              {/* Nota: Para simplificar la interfaz, los campos más complejos como 'características',
                  'comportamiento' y 'fuentes_datos' se manejarían con componentes especializados
                  en una implementación completa */}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAudiencia} disabled={!formData.nombre || !formData.segmento}>
              {isCreating ? "Crear" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver detalles de audiencia */}
      <Dialog open={!!selectedAudiencia} onOpenChange={() => setSelectedAudiencia(null)}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedAudiencia?.nombre}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <Badge className={selectedAudiencia?.segmento ? getSegmentoBadgeColor(selectedAudiencia.segmento) : ""}>
                {selectedAudiencia?.segmento?.charAt(0).toUpperCase() + selectedAudiencia?.segmento?.slice(1) || ""}
              </Badge>
              <span className="text-muted-foreground">
                Creada el {selectedAudiencia?.created_at ? formatDate(selectedAudiencia.created_at) : ""}
              </span>
            </DialogDescription>
          </DialogHeader>
          
          {selectedAudiencia && (
            <ScrollArea className="max-h-[500px] overflow-auto pr-4">
              <div className="space-y-6 py-2">
                <div>
                  <h4 className="font-medium mb-2">Descripción</h4>
                  <p className="text-sm">{selectedAudiencia.descripcion || "Sin descripción"}</p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Tamaño estimado</h4>
                    <p className="text-2xl font-bold">{selectedAudiencia.tamano_estimado?.toLocaleString() || "N/A"}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Valor estimado</h4>
                    <p className="text-2xl font-bold">{selectedAudiencia.valor_estimado ? `${selectedAudiencia.valor_estimado.toLocaleString()} €` : "N/A"}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Tasa de conversión</h4>
                    <p className="text-2xl font-bold">{selectedAudiencia.tasa_conversion ? `${selectedAudiencia.tasa_conversion.toFixed(2)}%` : "N/A"}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Interacciones promedio</h4>
                    <p className="text-2xl font-bold">{selectedAudiencia.interacciones_promedio?.toFixed(1) || "N/A"}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Características</h4>
                  <div className="text-sm">
                    {renderCaracteristicas(selectedAudiencia.caracteristicas)}
                  </div>
                </div>
                
                {selectedAudiencia.comportamiento && Object.keys(selectedAudiencia.comportamiento).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Comportamiento</h4>
                      <div className="text-sm">
                        {renderCaracteristicas(selectedAudiencia.comportamiento)}
                      </div>
                    </div>
                  </>
                )}
                
                {selectedAudiencia.fuentes_datos && selectedAudiencia.fuentes_datos.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Fuentes de datos</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedAudiencia.fuentes_datos.map((fuente, index) => (
                          <Badge key={index} variant="secondary">{fuente}</Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => selectedAudiencia && handleOpenEditForm(selectedAudiencia)}
            >
              <Pencil className="h-4 w-4 mr-2" /> Editar
            </Button>
            <Button onClick={() => setSelectedAudiencia(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarketingAudiencias;