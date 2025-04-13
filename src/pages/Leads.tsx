import { useState, useRef, useMemo, useEffect } from "react";
import { useLeads } from "@/hooks/useLeads";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useLocation } from "react-router-dom";
import { 
  ArrowDownToLine, 
  BarChart3, 
  BarChart4, 
  ChevronDown, 
  ChevronRight,
  ChevronUp, 
  Filter, 
  Grid3X3,
  ListFilter,
  MoreHorizontal,
  LineChart,
  List, 
  Mail, 
  MessageSquare, 
  Phone, 
  PieChart,
  Search, 
  Settings,
  SlidersHorizontal,
  Star, 
  User,
  X
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

// Importamos componentes reutilizables del pipeline
import { LeadPersonalDataTab } from "@/components/pipeline/LeadPersonalDataTab";
import { LeadHistoryTab } from "@/components/pipeline/LeadHistoryTab";
import { LeadCommentsTab } from "@/components/pipeline/LeadCommentsTab";
import { LeadActivityChart } from "@/components/pipeline/LeadActivityChart";
import { LeadAIEvaluation } from "@/components/pipeline/LeadAIEvaluation";

interface Column {
  id: string;
  header: string;
  accessorKey: string;
  visible: boolean;
}

interface FilterOption {
  field: string;
  operator: string;
  value: string | number | null; // Removiendo Date como tipo posible para el valor
}

interface ChartData {
  name: string; 
  value: number;
}

const LeadsPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const chatbotId = searchParams.get('chatbotId');
  const tableRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Estado base
  const { data: leads = [], isLoading } = useLeads(chatbotId || undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  
  // Estados nuevos
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isLeadDrawerOpen, setIsLeadDrawerOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"table" | "charts">("table");
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([]);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  const defaultColumns: Column[] = [
    { id: "nombre", header: "Nombre", accessorKey: "nombre", visible: true },
    { id: "contacto", header: "Contacto", accessorKey: "contacto", visible: true },
    { id: "origen", header: "Origen", accessorKey: "canal_origen", visible: true },
    { id: "score", header: "Score", accessorKey: "score", visible: true },
    { id: "mensajes", header: "Mensajes", accessorKey: "message_count", visible: true },
    { id: "interacciones", header: "Interacciones", accessorKey: "interaction_count", visible: true },
    { id: "etapa", header: "Etapa", accessorKey: "stage_name", visible: true },
    { id: "ultima_interaccion", header: "Última Interacción", accessorKey: "ultima_interaccion", visible: true },
    { id: "created_at", header: "Fecha de Creación", accessorKey: "created_at", visible: false },
    { id: "pais", header: "País", accessorKey: "pais", visible: false },
    { id: "ciudad", header: "Ciudad", accessorKey: "ciudad", visible: false },
  ];
  
  const [columns, setColumns] = useState<Column[]>(defaultColumns);

  // Filtrado de leads avanzado basado en búsqueda y filtros activos
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Búsqueda general
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === "" || (
        (lead.nombre && lead.nombre.toLowerCase().includes(searchLower)) ||
        (lead.apellido && lead.apellido.toLowerCase().includes(searchLower)) ||
        (lead.email && lead.email.toLowerCase().includes(searchLower)) ||
        (lead.telefono && lead.telefono.toLowerCase().includes(searchLower)) ||
        (lead.canal_origen && lead.canal_origen.toLowerCase().includes(searchLower))
      );
      
      // Filtros específicos
      const matchesFilters = filterOptions.length === 0 || filterOptions.every(filter => {
        const value = lead[filter.field as keyof typeof lead];
        
        if (value === undefined || value === null) return false;
        
        switch (filter.operator) {
          case "equals":
            return String(value) === String(filter.value);
          case "contains":
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          case "greater":
            return typeof value === "number" ? value > Number(filter.value) : false;
          case "less":
            return typeof value === "number" ? value < Number(filter.value) : false;
          default:
            return true;
        }
      });
      
      // Filtro por rango de fechas
      const createdDate = lead.created_at ? new Date(lead.created_at) : null;
      const matchesDateRange = !dateRange.from || !dateRange.to || !createdDate 
        ? true 
        : (createdDate >= dateRange.from && createdDate <= dateRange.to);
      
      return matchesSearch && matchesFilters && matchesDateRange;
    });
  }, [leads, searchQuery, filterOptions, dateRange]);

  // Ordenamiento de leads
  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      let aValue: any = a[sortField as keyof typeof a];
      let bValue: any = b[sortField as keyof typeof b];
      
      // Handle null values
      if (aValue === null) aValue = "";
      if (bValue === null) bValue = "";
      
      // Handle dates
      if (sortField === "created_at" || sortField === "updated_at" || sortField === "ultima_interaccion") {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }
      
      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [filteredLeads, sortField, sortDirection]);

  // Paginación de leads
  const totalPages = Math.ceil(sortedLeads.length / itemsPerPage);
  const paginatedLeads = sortedLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Funciones de utilidad
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    try {
      return formatDistanceToNow(new Date(dateStr), { 
        addSuffix: true,
        locale: es
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Fecha inválida";
    }
  };
  
  const toggleColumnVisibility = (columnId: string) => {
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };
  
  const addFilterOption = () => {
    setFilterOptions([...filterOptions, { field: "score", operator: "greater", value: 0 }]);
  };
  
  const removeFilterOption = (index: number) => {
    setFilterOptions(filterOptions.filter((_, i) => i !== index));
  };
  
  const updateFilterOption = (index: number, field: string, value: any) => {
    const updatedFilters = [...filterOptions];
    updatedFilters[index] = { ...updatedFilters[index], [field]: value };
    setFilterOptions(updatedFilters);
  };
  
  const toggleRowExpand = (leadId: string) => {
    setExpandedLeadId(expandedLeadId === leadId ? null : leadId);
  };
  
  const openLeadDrawer = (leadId: string) => {
    setSelectedLeadId(leadId);
    setIsLeadDrawerOpen(true);
  };
  
  const exportToCSV = () => {
    const visibleColumns = columns.filter(col => col.visible);
    
    // Crear encabezados
    let csvContent = visibleColumns.map(col => `"${col.header}"`).join(",") + "\n";
    
    // Agregar filas
    const dataToExport = isExportingAll ? sortedLeads : paginatedLeads;
    
    dataToExport.forEach(lead => {
      const row = visibleColumns.map(col => {
        const rawValue = lead[col.accessorKey as keyof typeof lead];
        
        // Formateo específico para ciertos tipos
        let formattedValue = rawValue;
        
        if (col.accessorKey === "ultima_interaccion" || col.accessorKey === "created_at") {
          formattedValue = rawValue ? format(new Date(rawValue as string), "dd/MM/yyyy HH:mm") : "";
        }
        
        // Escapar comillas y envolver en comillas para CSV
        return `"${String(formattedValue || "").replace(/"/g, '""')}"`;
      }).join(",");
      
      csvContent += row + "\n";
    });
    
    // Crear y descargar el archivo
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_export_${format(new Date(), "yyyyMMdd_HHmm")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsExportDialogOpen(false);
    toast({
      title: "Exportación completada",
      description: `Se han exportado ${dataToExport.length} leads correctamente.`
    });
  };
  
  const [isExportingAll, setIsExportingAll] = useState(false);
  
  // Datos para gráficos
  const chartData = useMemo(() => {
    // Datos para gráfico de origen
    const origenData: ChartData[] = [];
    const origenMap = new Map<string, number>();
    
    filteredLeads.forEach(lead => {
      const origen = lead.canal_origen || "Desconocido";
      origenMap.set(origen, (origenMap.get(origen) || 0) + 1);
    });
    
    origenMap.forEach((value, name) => {
      origenData.push({ name, value });
    });
    
    // Datos para gráfico de etapas
    const etapaData: ChartData[] = [];
    const etapaMap = new Map<string, number>();
    
    filteredLeads.forEach(lead => {
      const etapa = lead.stage_name || "Sin etapa";
      etapaMap.set(etapa, (etapaMap.get(etapa) || 0) + 1);
    });
    
    etapaMap.forEach((value, name) => {
      etapaData.push({ name, value });
    });
    
    // Datos para gráfico de score
    const scoreRanges = [
      { name: "0-20", min: 0, max: 20 },
      { name: "21-40", min: 21, max: 40 },
      { name: "41-60", min: 41, max: 60 },
      { name: "61-80", min: 61, max: 80 },
      { name: "81-100", min: 81, max: 100 }
    ];
    
    const scoreData: ChartData[] = scoreRanges.map(range => ({
      name: range.name,
      value: filteredLeads.filter(lead => {
        const score = lead.score || 0;
        return score >= range.min && score <= range.max;
      }).length
    }));
    
    return { origenData, etapaData, scoreData };
  }, [filteredLeads]);

  // Función para resetear filtros
  const resetFilters = () => {
    setSearchQuery("");
    setFilterOptions([]);
    setDateRange({ from: undefined, to: undefined });
  };

  const selectedLead = useMemo(() => {
    return leads.find(lead => lead.id === selectedLeadId);
  }, [leads, selectedLeadId]);
  
  return (
    <div className="flex flex-col h-full">
      {/* Header y filtros */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="container mx-auto py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Leads</h1>
            <div className="flex items-center gap-2">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "table" | "charts")} className="mr-2">
                <TabsList className="grid w-[200px] grid-cols-2">
                  <TabsTrigger value="table">
                    <List className="h-4 w-4 mr-2" />
                    Tabla
                  </TabsTrigger>
                  <TabsTrigger value="charts">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Gráficos
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ArrowDownToLine className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Exportar Leads</DialogTitle>
                    <DialogDescription>
                      Selecciona las opciones para exportar tus leads a CSV.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="export-all"
                        checked={isExportingAll}
                        onCheckedChange={() => setIsExportingAll(!isExportingAll)}
                      />
                      <label
                        htmlFor="export-all"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Exportar todos los leads ({sortedLeads.length})
                      </label>
                    </div>
                    {!isExportingAll && (
                      <p className="text-sm text-muted-foreground">
                        Se exportarán solo los leads de la página actual ({paginatedLeads.length}).
                      </p>
                    )}
                    
                    <div className="border rounded-md p-3 bg-muted/20">
                      <h4 className="font-medium text-sm mb-2">Columnas a exportar:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {columns.map(column => (
                          <div key={column.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`export-col-${column.id}`}
                              checked={column.visible}
                              onCheckedChange={() => toggleColumnVisibility(column.id)}
                            />
                            <label
                              htmlFor={`export-col-${column.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {column.header}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={exportToCSV}>
                      Exportar a CSV
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Button>
                Nuevo Lead
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2 mt-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Buscar leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Button 
                variant={filtersVisible ? "default" : "outline"} 
                size="sm"
                onClick={() => setFiltersVisible(!filtersVisible)}
              >
                <Filter size={16} className="mr-2" />
                Filtros {filterOptions.length > 0 && `(${filterOptions.length})`}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SlidersHorizontal size={16} className="mr-2" />
                    Columnas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {columns.map(column => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.visible}
                      onCheckedChange={() => toggleColumnVisibility(column.id)}
                    >
                      {column.header}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings size={16} className="mr-2" />
                    Mostrar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Registros por página</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {[10, 15, 25, 50, 100].map(size => (
                    <DropdownMenuCheckboxItem
                      key={size}
                      checked={itemsPerPage === size}
                      onCheckedChange={() => setItemsPerPage(size)}
                    >
                      {size} registros
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {(filterOptions.length > 0 || dateRange.from || searchQuery) && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <X size={16} className="mr-2" />
                  Limpiar filtros
                </Button>
              )}
            </div>
            
            {/* Filtros avanzados */}
            {filtersVisible && (
              <div className="bg-muted/30 rounded-md p-4 border">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Filtros avanzados</h3>
                  <Button variant="outline" size="sm" onClick={addFilterOption}>
                    Añadir filtro
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {/* Rango de fechas */}
                  <div className="flex flex-wrap gap-3 items-center mb-2">
                    <div className="flex items-center">
                      <span className="text-sm mr-2">Fecha de creación:</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "justify-start text-left font-normal w-[240px]",
                              !dateRange.from && "text-muted-foreground"
                            )}
                          >
                            {dateRange.from && dateRange.to ? (
                              <>
                                {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                              </>
                            ) : (
                              <span>Seleccionar rango de fechas</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="range"
                            selected={dateRange}
                            onSelect={(range) => {
                              if (range) {
                                setDateRange({
                                  from: range.from,
                                  to: range.to || range.from
                                });
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      
                      {dateRange.from && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="ml-1 h-8 w-8"
                          onClick={() => setDateRange({ from: undefined, to: undefined })}
                        >
                          <X size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Filtros dinámicos */}
                  {filterOptions.map((filter, index) => (
                    <div key={index} className="flex flex-wrap gap-2 items-center">
                      <select
                        className="border rounded p-2 text-sm"
                        value={filter.field}
                        onChange={(e) => updateFilterOption(index, "field", e.target.value)}
                      >
                        <option value="score">Score</option>
                        <option value="stage_name">Etapa</option>
                        <option value="canal_origen">Origen</option>
                        <option value="message_count">Mensajes</option>
                        <option value="interaction_count">Interacciones</option>
                        <option value="pais">País</option>
                        <option value="ciudad">Ciudad</option>
                      </select>
                      
                      <select
                        className="border rounded p-2 text-sm"
                        value={filter.operator}
                        onChange={(e) => updateFilterOption(index, "operator", e.target.value)}
                      >
                        <option value="equals">Igual a</option>
                        <option value="contains">Contiene</option>
                        <option value="greater">Mayor que</option>
                        <option value="less">Menor que</option>
                      </select>
                      
                      <Input
                        type={filter.field === "score" || filter.field === "message_count" || filter.field === "interaction_count" ? "number" : "text"}
                        placeholder="Valor"
                        value={filter.value !== null ? filter.value : ""}
                        onChange={(e) => updateFilterOption(index, "value", e.target.value)}
                        className="h-9 w-52 text-sm"
                      />
                      
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => removeFilterOption(index)}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="flex-1 container mx-auto py-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-primary">Cargando leads...</div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ListFilter className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No se encontraron leads</h3>
            <p className="text-muted-foreground max-w-md mt-1">
              No hay leads que coincidan con tu búsqueda o filtros. Intenta con otros criterios o limpia los filtros para ver todos los leads.
            </p>
            {(filterOptions.length > 0 || dateRange.from || searchQuery) && (
              <Button variant="outline" className="mt-4" onClick={resetFilters}>
                Limpiar todos los filtros
              </Button>
            )}
          </div>
        ) : (
          <Tabs defaultValue="table" value={activeTab} className="w-full">
            <TabsContent value="table" className="mt-0">
              <div ref={tableRef} className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      {columns.filter(col => col.visible).map(column => (
                        <TableHead 
                          key={column.id}
                          className="cursor-pointer"
                          onClick={() => handleSort(column.accessorKey)}
                        >
                          <div className="flex items-center">
                            {column.header}
                            {sortField === column.accessorKey && (
                              sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                            )}
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="w-20">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLeads.map((lead) => (
                      <>
                        <TableRow 
                          key={lead.id} 
                          className={cn(
                            "cursor-pointer hover:bg-muted/30",
                            expandedLeadId === lead.id && "bg-muted/40 border-b-0"
                          )}
                          onClick={() => toggleRowExpand(lead.id)}
                        >
                          <TableCell className="p-2 text-center">
                            {expandedLeadId === lead.id ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )}
                          </TableCell>
                          
                          {/* Renderizamos las celdas según las columnas visibles */}
                          {columns.filter(col => col.visible).map(column => {
                            const value = lead[column.accessorKey as keyof typeof lead];
                            
                            // Renderizado especial según el tipo de columna
                            switch (column.accessorKey) {
                              case "nombre":
                                return (
                                  <TableCell key={column.id}>
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                                        {lead.nombre ? lead.nombre.charAt(0) : "?"}
                                        {lead.apellido ? lead.apellido.charAt(0) : ""}
                                      </div>
                                      <div>
                                        <p className="font-medium">{lead.nombre} {lead.apellido}</p>
                                        <p className="text-xs text-muted-foreground">
                                          Creado {formatDate(lead.created_at)}
                                        </p>
                                      </div>
                                    </div>
                                  </TableCell>
                                );
                                
                              case "contacto":
                                return (
                                  <TableCell key={column.id}>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1">
                                        <Mail size={14} className="text-muted-foreground" />
                                        <span className="text-sm">{lead.email || "N/A"}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Phone size={14} className="text-muted-foreground" />
                                        <span className="text-sm">{lead.telefono || "N/A"}</span>
                                      </div>
                                    </div>
                                  </TableCell>
                                );
                                
                              case "canal_origen":
                                return (
                                  <TableCell key={column.id}>
                                    {lead.canal_origen || "Desconocido"}
                                  </TableCell>
                                );
                                
                              case "score":
                                return (
                                  <TableCell key={column.id}>
                                    <Badge variant="outline">{lead.score || 0}</Badge>
                                  </TableCell>
                                );
                                
                              case "stage_name":
                                return (
                                  <TableCell key={column.id}>
                                    <Badge style={{ backgroundColor: lead.stage_color || "#666" }}>
                                      {lead.stage_name || "Sin etapa"}
                                    </Badge>
                                  </TableCell>
                                );
                                
                              case "ultima_interaccion":
                                return (
                                  <TableCell key={column.id}>
                                    {formatDate(lead.ultima_interaccion)}
                                  </TableCell>
                                );
                                
                              case "created_at":
                                return (
                                  <TableCell key={column.id}>
                                    {formatDate(lead.created_at)}
                                  </TableCell>
                                );
                                
                              default:
                                return (
                                  <TableCell key={column.id}>
                                    {value !== undefined && value !== null ? String(value) : "N/A"}
                                  </TableCell>
                                );
                            }
                          })}
                          
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                  <MoreHorizontal size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  openLeadDrawer(lead.id);
                                }}>
                                  <User size={14} className="mr-2" />
                                  Ver detalles
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild onClick={(e) => e.stopPropagation()}>
                                  <a href={`/dashboard/conversations/${lead.id}`}>
                                    <MessageSquare size={14} className="mr-2" />
                                    Ver conversaciones
                                  </a>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        
                        {/* Fila expandida con detalles del lead */}
                        {expandedLeadId === lead.id && (
                          <TableRow className="bg-muted/20">
                            <TableCell colSpan={columns.filter(col => col.visible).length + 2} className="p-0">
                              <div className="p-4">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                  <Card className="col-span-1">
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-base">Información de Contacto</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-2">
                                        <div className="flex justify-between">
                                          <span className="text-sm text-muted-foreground">Email:</span>
                                          <span className="text-sm font-medium">{lead.email || "No disponible"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-sm text-muted-foreground">Teléfono:</span>
                                          <span className="text-sm font-medium">{lead.telefono || "No disponible"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-sm text-muted-foreground">País:</span>
                                          <span className="text-sm font-medium">{lead.pais || "No especificado"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-sm text-muted-foreground">Ciudad:</span>
                                          <span className="text-sm font-medium">{lead.ciudad || "No especificado"}</span>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                  
                                  <Card className="col-span-1">
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-base">Información de Pipeline</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-2">
                                        <div className="flex justify-between">
                                          <span className="text-sm text-muted-foreground">Etapa:</span>
                                          <Badge style={{ backgroundColor: lead.stage_color || "#666" }}>
                                            {lead.stage_name || "Sin etapa"}
                                          </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-sm text-muted-foreground">Score:</span>
                                          <span className="text-sm font-medium">{lead.score || 0}/100</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-sm text-muted-foreground">Origen:</span>
                                          <span className="text-sm font-medium">{lead.canal_origen || "Desconocido"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-sm text-muted-foreground">Mensajes:</span>
                                          <span className="text-sm font-medium">{lead.message_count || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-sm text-muted-foreground">Interacciones:</span>
                                          <span className="text-sm font-medium">{lead.interaction_count || 0}</span>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                  
                                  <Card className="col-span-1">
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-base">Etiquetas y Metadatos</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-4">
                                        <div>
                                          <h4 className="text-sm font-medium mb-2">Etiquetas:</h4>
                                          <div className="flex flex-wrap gap-1">
                                            {lead.tags && lead.tags.length > 0 ? lead.tags.map(tag => (
                                              <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }}>
                                                {tag.nombre}
                                              </Badge>
                                            )) : (
                                              <span className="text-sm text-muted-foreground">Sin etiquetas</span>
                                            )}
                                          </div>
                                        </div>
                                        
                                        <div>
                                          <h4 className="text-sm font-medium mb-2">Datos adicionales:</h4>
                                          {lead.datos_adicionales && Object.keys(lead.datos_adicionales).length > 0 ? (
                                            <div className="space-y-1">
                                              {Object.entries(lead.datos_adicionales).map(([key, value]) => (
                                                <div key={key} className="flex justify-between text-sm">
                                                  <span className="text-muted-foreground">{key}:</span>
                                                  <span>{String(value)}</span>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <span className="text-sm text-muted-foreground">Sin datos adicionales</span>
                                          )}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                                
                                <div className="flex justify-end mt-4 gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openLeadDrawer(lead.id);
                                    }}
                                  >
                                    Ver todos los detalles
                                  </Button>
                                  <Button 
                                    size="sm"
                                    asChild
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <a href={`/dashboard/conversations/${lead.id}`}>
                                      <MessageSquare size={14} className="mr-2" />
                                      Ver conversaciones
                                    </a>
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, sortedLeads.length)} de {sortedLeads.length} leads
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) setCurrentPage(currentPage - 1);
                          }}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Mostrar siempre la primera página, la última, y las cercanas a la actual
                        let pageToShow: number;
                        if (totalPages <= 5) {
                          // Si hay 5 o menos páginas, mostrar todas
                          pageToShow = i + 1;
                        } else if (currentPage <= 3) {
                          // Si estamos en las primeras páginas
                          if (i < 4) {
                            pageToShow = i + 1;
                          } else {
                            pageToShow = totalPages;
                          }
                        } else if (currentPage >= totalPages - 2) {
                          // Si estamos en las últimas páginas
                          if (i === 0) {
                            pageToShow = 1;
                          } else {
                            pageToShow = totalPages - (4 - i);
                          }
                        } else {
                          // En cualquier otra posición
                          if (i === 0) {
                            pageToShow = 1;
                          } else if (i === 4) {
                            pageToShow = totalPages;
                          } else {
                            pageToShow = currentPage + i - 2;
                          }
                        }
                        
                        // Mostrar ellipsis en lugar de algunos números
                        if (
                          (pageToShow > 2 && pageToShow < currentPage - 1) || 
                          (pageToShow > currentPage + 1 && pageToShow < totalPages - 1)
                        ) {
                          return (
                            <PaginationItem key={`ellipsis-${i}`}>
                              <span className="px-2">...</span>
                            </PaginationItem>
                          );
                        }
                        
                        return (
                          <PaginationItem key={pageToShow}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(pageToShow);
                              }}
                              isActive={pageToShow === currentPage}
                            >
                              {pageToShow}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                          }}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="charts" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Leads por Origen</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-[300px] flex items-center justify-center">
                      <BarChart3 className="h-16 w-16 text-muted-foreground opacity-50" />
                      <div className="ml-4">
                        <p className="text-sm font-medium">Distribución por canal de origen:</p>
                        <ul className="space-y-2 mt-3">
                          {chartData.origenData.slice(0, 5).map((item, idx) => (
                            <li key={idx} className="flex justify-between text-sm">
                              <span>{item.name}:</span>
                              <span className="font-medium">{item.value}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Leads por Etapa</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-[300px] flex items-center justify-center">
                      <PieChart className="h-16 w-16 text-muted-foreground opacity-50" />
                      <div className="ml-4">
                        <p className="text-sm font-medium">Distribución por etapa:</p>
                        <ul className="space-y-2 mt-3">
                          {chartData.etapaData.slice(0, 5).map((item, idx) => (
                            <li key={idx} className="flex justify-between text-sm">
                              <span>{item.name}:</span>
                              <span className="font-medium">{item.value}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Distribución de Scores</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-[300px] flex items-center justify-center">
                      <BarChart4 className="h-16 w-16 text-muted-foreground opacity-50" />
                      <div className="ml-4">
                        <p className="text-sm font-medium">Distribución por puntaje:</p>
                        <ul className="space-y-2 mt-3">
                          {chartData.scoreData.map((item, idx) => (
                            <li key={idx} className="flex justify-between text-sm">
                              <span>Score {item.name}:</span>
                              <span className="font-medium">{item.value}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="lg:col-span-3">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Resumen de Leads</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="border rounded-lg p-4 text-center">
                        <p className="text-muted-foreground text-sm">Total Leads</p>
                        <p className="text-2xl font-bold mt-1">{filteredLeads.length}</p>
                      </div>
                      <div className="border rounded-lg p-4 text-center">
                        <p className="text-muted-foreground text-sm">Score Promedio</p>
                        <p className="text-2xl font-bold mt-1">
                          {Math.round(filteredLeads.reduce((acc, lead) => acc + (lead.score || 0), 0) / (filteredLeads.length || 1))}
                        </p>
                      </div>
                      <div className="border rounded-lg p-4 text-center">
                        <p className="text-muted-foreground text-sm">Total Mensajes</p>
                        <p className="text-2xl font-bold mt-1">
                          {filteredLeads.reduce((acc, lead) => acc + (lead.message_count || 0), 0)}
                        </p>
                      </div>
                      <div className="border rounded-lg p-4 text-center">
                        <p className="text-muted-foreground text-sm">Interacciones</p>
                        <p className="text-2xl font-bold mt-1">
                          {filteredLeads.reduce((acc, lead) => acc + (lead.interaction_count || 0), 0)}
                        </p>
                      </div>
                      <div className="border rounded-lg p-4 text-center">
                        <p className="text-muted-foreground text-sm">Canales</p>
                        <p className="text-2xl font-bold mt-1">
                          {new Set(filteredLeads.map(lead => lead.canal_origen)).size}
                        </p>
                      </div>
                      <div className="border rounded-lg p-4 text-center">
                        <p className="text-muted-foreground text-sm">Países</p>
                        <p className="text-2xl font-bold mt-1">
                          {new Set(filteredLeads.map(lead => lead.pais).filter(Boolean)).size || "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
      
      {/* Panel lateral con detalles completos del lead */}
      <Sheet open={isLeadDrawerOpen && !!selectedLead} onOpenChange={setIsLeadDrawerOpen}>
        <SheetContent className="sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-[700px] overflow-y-auto">
          {selectedLead && (
            <>
              <SheetHeader className="mb-5">
                <SheetTitle className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    {selectedLead.nombre ? selectedLead.nombre.charAt(0) : "?"}
                    {selectedLead.apellido ? selectedLead.apellido.charAt(0) : ""}
                  </div>
                  <div>
                    <span>{selectedLead.nombre} {selectedLead.apellido}</span>
                    <SheetDescription className="mt-1">
                      Creado {formatDate(selectedLead.created_at)} · {selectedLead.canal_origen || "Canal desconocido"}
                    </SheetDescription>
                  </div>
                </SheetTitle>
              </SheetHeader>
              
              <div className="space-y-6">
                <Tabs defaultValue="datos">
                  <TabsList className="grid w-full grid-cols-4 mb-4">
                    <TabsTrigger value="datos">Datos</TabsTrigger>
                    <TabsTrigger value="evaluacion">Evaluación</TabsTrigger>
                    <TabsTrigger value="historial">Historial</TabsTrigger>
                    <TabsTrigger value="comentarios">Comentarios</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="datos" className="space-y-4">
                    <LeadPersonalDataTab lead={selectedLead} />
                    <LeadActivityChart leadId={selectedLead.id} />
                  </TabsContent>
                  
                  <TabsContent value="evaluacion">
                    <LeadAIEvaluation lead={selectedLead} />
                  </TabsContent>
                  
                  <TabsContent value="historial">
                    <ScrollArea className="h-[500px]">
                      <LeadHistoryTab lead={selectedLead} formatDate={formatDate} />
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="comentarios">
                    <ScrollArea className="h-[500px]">
                      <LeadCommentsTab lead={selectedLead} formatDate={formatDate} />
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default LeadsPage;
