import { useState } from "react";
import { 
  Calendar,
  Download,
  FileSpreadsheet,
  FileText, // Cambiamos FilePdf por FileText que sí existe en lucide-react
  Filter, 
  LineChart,
  Search, 
  BarChart,
  ChevronDown,
  X,
  Sliders
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { DateRange as DayPickerDateRange } from "react-day-picker";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Tipo para el rango de fechas personalizado que usamos en nuestra aplicación
export type DateRange = {
  from?: Date;
  to?: Date;
};

// Tiempos predefinidos para selección rápida
export type TimeRange = "7d" | "30d" | "90d" | "6m" | "1y" | "custom";

// Tipos de visualización de gráficos
export type ChartVisibility = {
  activityChart: boolean;
  evolutionChart: boolean;
  monthlyComparison: boolean;
  distributionChart: boolean;
};

// Opciones de filtrado para el dashboard
export interface FilterOptions {
  timeRange: TimeRange;
  dateRange: DateRange;
  groupBy?: "day" | "week" | "month";
  channels?: string[];
  stages?: string[];
}

interface DashboardToolbarProps {
  onFilterChange?: (filters: FilterOptions) => void;
  onChartVisibilityChange?: (visibility: ChartVisibility) => void;
  activeChannels?: string[];
  onExportData?: (format: "csv" | "pdf", includeCharts: boolean) => void;
  timeRangeOptions?: Array<{value: TimeRange, label: string}>;
  channelOptions?: Array<{value: string, label: string}>;
  defaultTimeRange?: TimeRange;
  defaultChartVisibility?: ChartVisibility;
}

export function DashboardToolbar({
  onFilterChange,
  onChartVisibilityChange,
  activeChannels = [],
  onExportData,
  timeRangeOptions = [
    { value: "7d", label: "7 días" },
    { value: "30d", label: "30 días" },
    { value: "90d", label: "3 meses" },
    { value: "6m", label: "6 meses" },
    { value: "1y", label: "1 año" },
    { value: "custom", label: "Personalizado" },
  ],
  channelOptions = [],
  defaultTimeRange = "30d",
  defaultChartVisibility = {
    activityChart: true,
    evolutionChart: true,
    monthlyComparison: true,
    distributionChart: true
  }
}: DashboardToolbarProps) {
  // Estado para manejar filtros
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultTimeRange);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [chartVisibility, setChartVisibility] = useState<ChartVisibility>(defaultChartVisibility);
  const [searchQuery, setSearchQuery] = useState("");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");
  const [includeCharts, setIncludeCharts] = useState(true);
  
  // Contador de filtros activos
  const activeFiltersCount = 
    (timeRange !== defaultTimeRange ? 1 : 0) + 
    (selectedChannels.length > 0 ? 1 : 0);
  
  // Manejar cambios en el rango de tiempo
  const handleTimeRangeChange = (value: TimeRange) => {
    setTimeRange(value);
    
    // Si se selecciona un rango predefinido, limpiar el rango personalizado
    if (value !== "custom") {
      setDateRange({ from: undefined, to: undefined });
    }
    
    // Notificar cambio
    if (onFilterChange) {
      onFilterChange({
        timeRange: value,
        dateRange: value === "custom" ? dateRange : { from: undefined, to: undefined }
      });
    }
  };
  
  // Manejar cambios en el rango de fechas personalizado
  const handleDateRangeChange = (range: DateRange | undefined) => {
    // Si range es undefined, mantenemos el rango actual
    if (!range) return;
    
    setDateRange(range);
    
    // Si se selecciona un rango personalizado, actualizar el timeRange
    if (range.from && range.to) {
      setTimeRange("custom");
      
      // Notificar cambio
      if (onFilterChange) {
        onFilterChange({
          timeRange: "custom",
          dateRange: range
        });
      }
    }
  };
  
  // Manejar cambios en la visibilidad de los gráficos
  const handleChartVisibilityChange = (chart: keyof ChartVisibility) => {
    const newVisibility = { 
      ...chartVisibility,
      [chart]: !chartVisibility[chart]
    };
    setChartVisibility(newVisibility);
    
    if (onChartVisibilityChange) {
      onChartVisibilityChange(newVisibility);
    }
  };
  
  // Manejar la selección de canales
  const handleChannelToggle = (channel: string) => {
    setSelectedChannels(prev => 
      prev.includes(channel)
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
    
    // Notificar cambio
    if (onFilterChange) {
      onFilterChange({
        timeRange,
        dateRange: timeRange === "custom" ? dateRange : { from: undefined, to: undefined },
        channels: selectedChannels.includes(channel)
          ? selectedChannels.filter(c => c !== channel)
          : [...selectedChannels, channel]
      });
    }
  };
  
  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setTimeRange(defaultTimeRange);
    setDateRange({ from: undefined, to: undefined });
    setSelectedChannels([]);
    setSearchQuery("");
    
    // Notificar cambio
    if (onFilterChange) {
      onFilterChange({
        timeRange: defaultTimeRange,
        dateRange: { from: undefined, to: undefined },
        channels: []
      });
    }
  };
  
  // Manejar la exportación de datos
  const handleExport = () => {
    if (onExportData) {
      onExportData(exportFormat, includeCharts);
    }
    setShowExportDialog(false);
  };
  
  return (
    <div className="flex items-center justify-between w-full py-2 px-3 bg-background/95 backdrop-blur-sm border-b sticky top-0 z-20">
      <div className="flex items-center gap-3 flex-1">
        {/* Selector de rango de tiempo */}
        <div className="w-[160px]">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="h-9 border-primary/20 bg-background/50">
              <SelectValue placeholder="Rango de tiempo" />
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Selector de fechas personalizado */}
        {timeRange === "custom" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-9 justify-start text-left font-normal",
                  !dateRange.from && !dateRange.to && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {dateRange.from && dateRange.to ? (
                  <>
                    {format(dateRange.from, "P", { locale: es })} - {" "}
                    {format(dateRange.to, "P", { locale: es })}
                  </>
                ) : (
                  <span>Seleccionar fechas</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange as DayPickerDateRange}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        )}
        
        {/* Búsqueda */}
        <div className="relative w-[200px] md:w-[280px]">
          <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar en el dashboard..."
            className="h-9 pl-9 pr-9 focus-visible:ring-primary/30"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchQuery("")}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {/* Filtros adicionales */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1">
              <Filter className="h-3.5 w-3.5" />
              <span>
                Filtrar
                {activeFiltersCount > 0 && (
                  <Badge className="ml-1.5 h-5 px-1.5 bg-primary text-white">
                    {activeFiltersCount}
                  </Badge>
                )}
              </span>
              <ChevronDown className="h-3.5 w-3.5 ml-0.5 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[240px]">
            <DropdownMenuLabel>Filtrar por canal</DropdownMenuLabel>
            
            {channelOptions.length > 0 ? (
              channelOptions.map(channel => (
                <DropdownMenuCheckboxItem
                  key={channel.value}
                  checked={selectedChannels.includes(channel.value)}
                  onCheckedChange={() => handleChannelToggle(channel.value)}
                >
                  {channel.label}
                </DropdownMenuCheckboxItem>
              ))
            ) : (
              <DropdownMenuItem disabled>
                No hay canales disponibles
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              onSelect={clearAllFilters}
              disabled={activeFiltersCount === 0}
              className="text-primary flex justify-center font-medium"
            >
              Limpiar todos los filtros
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Control de visualización de gráficos */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1">
              <Sliders className="h-3.5 w-3.5" />
              <span>Visualización</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mostrar gráficos</DropdownMenuLabel>
            
            <DropdownMenuCheckboxItem
              checked={chartVisibility.activityChart}
              onCheckedChange={() => handleChartVisibilityChange("activityChart")}
            >
              <BarChart className="h-3.5 w-3.5 mr-2" />
              Actividad de leads
            </DropdownMenuCheckboxItem>
            
            <DropdownMenuCheckboxItem
              checked={chartVisibility.evolutionChart}
              onCheckedChange={() => handleChartVisibilityChange("evolutionChart")}
            >
              <LineChart className="h-3.5 w-3.5 mr-2" />
              Evolución de actividad
            </DropdownMenuCheckboxItem>
            
            <DropdownMenuCheckboxItem
              checked={chartVisibility.monthlyComparison}
              onCheckedChange={() => handleChartVisibilityChange("monthlyComparison")}
            >
              <BarChart className="h-3.5 w-3.5 mr-2" />
              Comparativo mensual
            </DropdownMenuCheckboxItem>
            
            <DropdownMenuCheckboxItem
              checked={chartVisibility.distributionChart}
              onCheckedChange={() => handleChartVisibilityChange("distributionChart")}
            >
              <LineChart className="h-3.5 w-3.5 mr-2" />
              Distribución por canal
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Exportar datos */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1">
              <Download className="h-3.5 w-3.5" />
              <span>Exportar</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Exportar datos del dashboard</DialogTitle>
              <DialogDescription>
                Selecciona el formato y las opciones para exportar tus datos.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-1">
                <h4 className="font-medium text-sm">Formato</h4>
                <div className="flex gap-4 mt-2">
                  <div 
                    className={cn(
                      "flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all",
                      exportFormat === "csv" 
                        ? "border-primary bg-primary/5" 
                        : "hover:border-primary/50"
                    )}
                    onClick={() => setExportFormat("csv")}
                  >
                    <FileSpreadsheet className={cn(
                      "h-8 w-8 mb-2",
                      exportFormat === "csv" ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className={exportFormat === "csv" ? "font-medium" : ""}>CSV</span>
                  </div>
                  
                  <div 
                    className={cn(
                      "flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all",
                      exportFormat === "pdf" 
                        ? "border-primary bg-primary/5" 
                        : "hover:border-primary/50"
                    )}
                    onClick={() => setExportFormat("pdf")}
                  >
                    <FileText className={cn(
                      "h-8 w-8 mb-2",
                      exportFormat === "pdf" ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className={exportFormat === "pdf" ? "font-medium" : ""}>PDF</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeCharts"
                  checked={includeCharts}
                  onChange={(e) => setIncludeCharts(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="includeCharts" className="text-sm font-medium">
                  Incluir gráficos en la exportación
                </label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleExport}>
                Exportar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}