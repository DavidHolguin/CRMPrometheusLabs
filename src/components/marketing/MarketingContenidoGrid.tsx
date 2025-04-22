import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import SimpleToggleSwitch from "@/components/ui/simple-toggle-switch";
import {
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  Pencil,
  File,
  FileText,
  Image as ImageIcon,
  Video,
  LayoutGrid,
  List,
  Tag,
  Clock,
  ThumbsUp,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  MarketingContenido,
  MarketingContenidoOptions,
  useMarketingContenido
} from "@/hooks/marketing/useMarketingContenido";

interface MarketingContenidoGridProps {
  onEditContenido?: (contenido: MarketingContenido) => void;
  onViewDetail?: (contenido: MarketingContenido) => void;
}

const MarketingContenidoGrid = ({ onEditContenido, onViewDetail }: MarketingContenidoGridProps) => {
  // Estado para opciones de filtrado y paginación
  const [options, setOptions] = useState<MarketingContenidoOptions>({
    page: 0,
    pageSize: 12,
    sort: { field: 'created_at', direction: 'desc' }
  });

  // Estado para búsqueda
  const [searchQuery, setSearchQuery] = useState("");
  
  // Estado para modo de visualización
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Utilizamos nuestro hook personalizado
  const {
    contenidos,
    isLoading,
    totalCount,
    totalPages,
    page,
    hasNextPage,
    hasPrevPage,
    deleteContenido,
    updateContenido
  } = useMarketingContenido(options);

  // Manejador para cambiar la página
  const handlePageChange = (newPage: number) => {
    setOptions(prev => ({ ...prev, page: newPage }));
  };

  // Manejador para filtrar por tipo
  const handleTypeFilterChange = (tipo: string) => {
    setOptions(prev => ({
      ...prev,
      page: 0,
      filters: { ...prev.filters, tipo: tipo === "todos" ? undefined : tipo }
    }));
  };

  // Manejador para filtrar por categoría
  const handleCategoryFilterChange = (categoria: string) => {
    setOptions(prev => ({
      ...prev,
      page: 0,
      filters: { ...prev.filters, categoria: categoria === "todos" ? undefined : categoria }
    }));
  };

  // Manejador para cambiar ordenamiento
  const handleSortChange = (sortOption: string) => {
    const [field, direction] = sortOption.split("-") as [string, "asc" | "desc"];
    setOptions(prev => ({
      ...prev,
      sort: { field, direction }
    }));
  };

  // Togglear estado activo/inactivo de un contenido
  const handleToggleActive = (contenido: MarketingContenido) => {
    updateContenido.mutate({
      id: contenido.id,
      is_active: !contenido.is_active
    });
  };

  // Función para obtener el icono según el tipo de contenido
  const getContentTypeIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case "post":
        return <FileText className="h-5 w-5" />;
      case "imagen":
        return <ImageIcon className="h-5 w-5" />;
      case "video":
        return <Video className="h-5 w-5" />;
      case "instagram":
        return <Instagram className="h-5 w-5" />;
      case "facebook":
        return <Facebook className="h-5 w-5" />;
      case "twitter":
        return <Twitter className="h-5 w-5" />;
      case "linkedin":
        return <Linkedin className="h-5 w-5" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };

  // Truncar texto largo
  const truncateText = (text: string, length: number) => {
    if (text.length <= length) return text;
    return `${text.substring(0, length)}...`;
  };

  // Formatear fecha
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(date);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Select
            defaultValue="todos"
            onValueChange={handleTypeFilterChange}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tipo de contenido" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="post">Post</SelectItem>
                <SelectItem value="imagen">Imagen</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            defaultValue="todos"
            onValueChange={handleCategoryFilterChange}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="producto">Producto</SelectItem>
                <SelectItem value="promocion">Promoción</SelectItem>
                <SelectItem value="educar">Educativo</SelectItem>
                <SelectItem value="evento">Evento</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar contenido..."
              className="w-full pl-8 sm:w-[240px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select
            defaultValue="created_at-desc"
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="created_at-desc">Más reciente</SelectItem>
                <SelectItem value="created_at-asc">Más antiguo</SelectItem>
                <SelectItem value="engagement_score-desc">Mayor engagement</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="rounded-none rounded-l-md"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="rounded-none rounded-r-md"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Nuevo Contenido
          </Button>
        </div>
      </div>

      {/* Contenido en modo Grid */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading
            ? Array(12).fill(0).map((_, idx) => (
                <Card key={`skeleton-${idx}`} className="overflow-hidden">
                  <CardContent className="p-0">
                    <Skeleton className="h-[160px] w-full" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))
            : contenidos && contenidos.map((contenido) => (
                <Card key={contenido.id} className="overflow-hidden">
                  <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${contenido.is_active ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>
                        {getContentTypeIcon(contenido.tipo)}
                      </div>
                      <div>
                        <CardTitle className="text-sm">{truncateText(contenido.tipo, 20)}</CardTitle>
                        <p className="text-xs text-muted-foreground">{contenido.categoria || "Sin categoría"}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onViewDetail?.(contenido)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditContenido?.(contenido)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => {
                            if (window.confirm(`¿Estás seguro de eliminar este contenido?`)) {
                              deleteContenido.mutate(contenido.id);
                            }
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="p-4 pt-3">
                    <div className="h-[90px] overflow-hidden mb-2 text-sm">
                      {truncateText(contenido.contenido, 180)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(contenido.created_at)}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3 text-blue-500" />
                      <span className="text-xs">
                        {contenido.engagement_score || 0} engagement
                      </span>
                    </div>
                    <SimpleToggleSwitch 
                      isOn={contenido.is_active} 
                      onToggle={() => handleToggleActive(contenido)} 
                    />
                  </CardFooter>
                </Card>
              ))}

          {!isLoading && (!contenidos || contenidos.length === 0) && (
            <div className="col-span-full flex items-center justify-center p-8 border rounded-lg bg-muted/10">
              <div className="text-center">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                <h3 className="mt-2 text-lg font-medium">No hay contenido</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  No se encontró contenido que coincida con tus filtros.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Vista de lista
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tipo</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Contenido</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Categoría</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Fecha</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Engagement</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array(10).fill(0).map((_, idx) => (
                    <tr key={`skeleton-list-${idx}`} className="border-b last:border-b-0">
                      <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-36" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                      <td className="px-4 py-3 text-right"><Skeleton className="h-8 w-8 ml-auto" /></td>
                    </tr>
                  ))
                : contenidos && contenidos.map((contenido) => (
                    <tr key={contenido.id} className="border-b last:border-b-0 hover:bg-accent/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getContentTypeIcon(contenido.tipo)}
                          <span className="text-sm font-medium">{contenido.tipo}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[300px]">
                        <div className="text-sm truncate">
                          {truncateText(contenido.contenido, 80)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-normal">
                          {contenido.categoria || "Sin categoría"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(contenido.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3 text-blue-500" />
                          <span className="text-sm">{contenido.engagement_score || 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <SimpleToggleSwitch 
                          isOn={contenido.is_active} 
                          onToggle={() => handleToggleActive(contenido)} 
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onViewDetail?.(contenido)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEditContenido?.(contenido)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                if (window.confirm(`¿Estás seguro de eliminar este contenido?`)) {
                                  deleteContenido.mutate(contenido.id);
                                }
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}

              {!isLoading && (!contenidos || contenidos.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No se encontró contenido que coincida con tus filtros.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {totalCount > 0 ? (
            <>Mostrando {page * options.pageSize! + 1} a {Math.min((page + 1) * options.pageSize!, totalCount)} de {totalCount} contenidos</>
          ) : (
            'No hay contenidos disponibles'
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={!hasPrevPage}
            onClick={() => handlePageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Página {page + 1} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={!hasNextPage}
            onClick={() => handlePageChange(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MarketingContenidoGrid;