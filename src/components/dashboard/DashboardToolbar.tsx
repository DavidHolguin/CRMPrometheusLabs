import { useState, useEffect } from "react";
import { 
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  Filter, 
  LineChart,
  Search, 
  BarChart,
  ChevronDown,
  X,
  Sliders,
  Clock,
  Loader2
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

// Tipo para el rango de fechas personalizado que usamos en nuestra aplicación
export type DateRange = {
  from?: Date;
  to?: Date;
};

// Tiempos predefinidos para selección rápida
export type TimeRange = "7d" | "30d" | "90d" | "6m" | "1y" | "custom" | "today" | "yesterday";

// Tipos de visualización de gráficos
export type ChartVisibility = {
  activityChart: boolean;
  evolutionChart: boolean;
  monthlyComparison: boolean;
  distributionChart: boolean;
};

// Tipo para agrupación temporal
export type GroupByTime = "hora" | "dia" | "semana" | "mes" | "trimestre" | "año";

// Opciones de filtrado para el dashboard
export interface FilterOptions {
  timeRange: TimeRange;
  dateRange: DateRange;
  groupBy?: GroupByTime;
  channels?: string[];
  stages?: string[];
  includeHours?: boolean;
  hourRange?: {
    start: number;
    end: number;
  };
}

interface DashboardToolbarProps {
  onFilterChange?: (filters: FilterOptions) => void;
  onChartVisibilityChange?: (visibility: ChartVisibility) => void;
  activeChannels?: string[];
  onExportData?: () => void;
  timeRangeOptions?: Array<{value: TimeRange, label: string}>;
  channelOptions?: Array<{value: string, label: string}>;
  defaultTimeRange?: TimeRange;
  defaultChartVisibility?: ChartVisibility;
  isExporting?: boolean;
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
    { value: "today", label: "Hoy" },
    { value: "yesterday", label: "Ayer" },
  ],
  channelOptions = [],
  defaultTimeRange = "30d",
  defaultChartVisibility = {
    activityChart: true,
    evolutionChart: true,
    monthlyComparison: true,
    distributionChart: true
  },
  isExporting = false
}: DashboardToolbarProps) {
  // Estado para manejar filtros
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultTimeRange);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [chartVisibility, setChartVisibility] = useState<ChartVisibility>(defaultChartVisibility);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupBy, setGroupBy] = useState<GroupByTime>("dia");
  const [includeHours, setIncludeHours] = useState(false);
  const [hourRange, setHourRange] = useState({ start: 0, end: 23 });
  
  // Contador de filtros activos
  const activeFiltersCount = 
    (timeRange !== defaultTimeRange ? 1 : 0) + 
    (selectedChannels.length > 0 ? 1 : 0) +
    (includeHours ? 1 : 0) + 
    (groupBy !== "dia" ? 1 : 0);
  
  // Efecto para configurar valores iniciales basados en timeRange
  useEffect(() => {
    if (timeRange === "today" || timeRange === "yesterday") {
      setIncludeHours(true);
      setGroupBy("hora");
    } else if (timeRange === "7d") {
      setGroupBy("dia");
      setIncludeHours(false);
    } else if (timeRange === "30d" || timeRange === "90d") {
      setGroupBy("dia");
      setIncludeHours(false);
    } else if (timeRange === "6m") {
      setGroupBy("semana");
      setIncludeHours(false);
    } else if (timeRange === "1y") {
      setGroupBy("mes");
      setIncludeHours(false);
    }
  }, [timeRange]);
  
  // Manejar cambios en el rango de tiempo
  const handleTimeRangeChange = (value: TimeRange) => {
    setTimeRange(value);
    
    // Si se selecciona un rango predefinido, limpiar el rango personalizado
    if (value !== "custom") {
      setDateRange({ from: undefined, to: undefined });
    }
    
    // Ajustar rango de horas para hoy
    if (value === "today") {
      setIncludeHours(true);
      setGroupBy("hora");
    }
    
    // Notificar cambio
    if (onFilterChange) {
      onFilterChange({
        timeRange: value,
        dateRange: value === "custom" ? dateRange : { from: undefined, to: undefined },
        groupBy,
        channels: selectedChannels,
        includeHours: value === "today" || value === "yesterday" || includeHours,
        hourRange: includeHours ? hourRange : undefined
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
          dateRange: range,
          groupBy,
          channels: selectedChannels,
          includeHours,
          hourRange: includeHours ? hourRange : undefined
        });
      }
    }
  };
  
  // Manejar cambios en la agrupación temporal
  const handleGroupByChange = (value: GroupByTime) => {
    setGroupBy(value);
    
    // Si se selecciona hora, activar includeHours
    if (value === "hora") {
      setIncludeHours(true);
    }
    
    // Notificar cambio
    if (onFilterChange) {
      onFilterChange({
        timeRange,
        dateRange: timeRange === "custom" ? dateRange : { from: undefined, to: undefined },
        groupBy: value,
        channels: selectedChannels,
        includeHours: value === "hora" || includeHours,
        hourRange: (value === "hora" || includeHours) ? hourRange : undefined
      });
    }
  };
  
  // Manejar cambios en la inclusión de horas
  const handleIncludeHoursChange = (include: boolean) => {
    setIncludeHours(include);
    
    // Si se activan las horas y el grupo no es por hora, ajustar
    if (include && groupBy !== "hora" && timeRange === "today") {
      setGroupBy("hora");
    }
    
    // Notificar cambio
    if (onFilterChange) {
      onFilterChange({
        timeRange,
        dateRange: timeRange === "custom" ? dateRange : { from: undefined, to: undefined },
        groupBy: include && timeRange === "today" ? "hora" : groupBy,
        channels: selectedChannels,
        includeHours: include,
        hourRange: include ? hourRange : undefined
      });
    }
  };
  
  // Manejar cambios en el rango de horas
  const handleHourRangeChange = (start: number, end: number) => {
    const newRange = { start, end };
    setHourRange(newRange);
    
    // Notificar cambio
    if (onFilterChange && includeHours) {
      onFilterChange({
        timeRange,
        dateRange: timeRange === "custom" ? dateRange : { from: undefined, to: undefined },
        groupBy,
        channels: selectedChannels,
        includeHours,
        hourRange: newRange
      });
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
    const newChannels = selectedChannels.includes(channel)
      ? selectedChannels.filter(c => c !== channel)
      : [...selectedChannels, channel];
      
    setSelectedChannels(newChannels);
    
    // Notificar cambio
    if (onFilterChange) {
      onFilterChange({
        timeRange,
        dateRange: timeRange === "custom" ? dateRange : { from: undefined, to: undefined },
        groupBy,
        channels: newChannels,
        includeHours,
        hourRange: includeHours ? hourRange : undefined
      });
    }
  };
  
  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setTimeRange(defaultTimeRange);
    setDateRange({ from: undefined, to: undefined });
    setSelectedChannels([]);
    setSearchQuery("");
    setGroupBy("dia");
    setIncludeHours(false);
    setHourRange({ start: 0, end: 23 });
    
    // Notificar cambio
    if (onFilterChange) {
      onFilterChange({
        timeRange: defaultTimeRange,
        dateRange: { from: undefined, to: undefined },
        groupBy: "dia",
        channels: [],
        includeHours: false,
        hourRange: undefined
      });
    }
  };
  
  return (
    <div className="flex items-center justify-between w-full py-2 px-3 bg-background/95 backdrop-blur-sm border-b sticky top-0 z-20 flex-wrap gap-2">
      <div className="flex items-center gap-3 flex-1 flex-wrap">
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
        
        {/* Selector de agrupación temporal */}
        <div className="w-[160px]">
          <Select value={groupBy} onValueChange={(val) => handleGroupByChange(val as GroupByTime)}>
            <SelectTrigger className="h-9 border-primary/20 bg-background/50">
              <SelectValue placeholder="Agrupar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hora">Por hora</SelectItem>
              <SelectItem value="dia">Por día</SelectItem>
              <SelectItem value="semana">Por semana</SelectItem>
              <SelectItem value="mes">Por mes</SelectItem>
              <SelectItem value="trimestre">Por trimestre</SelectItem>
              <SelectItem value="año">Por año</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Selector de rango de horas (visible solo si includeHours es true) */}
        {(includeHours || groupBy === "hora") && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-9 justify-start text-left font-normal"
              >
                <Clock className="mr-2 h-4 w-4" />
                <span>{hourRange.start}:00 - {hourRange.end}:00</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
              <div className="space-y-4">
                <h4 className="font-medium">Rango de horas</h4>
                <div className="flex gap-2 items-center">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Desde</span>
                    <Select 
                      value={hourRange.start.toString()}
                      onValueChange={(val) => handleHourRangeChange(parseInt(val), hourRange.end)}
                    >
                      <SelectTrigger className="w-[80px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }).map((_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {i}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <span className="text-muted-foreground">a</span>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Hasta</span>
                    <Select 
                      value={hourRange.end.toString()}
                      onValueChange={(val) => handleHourRangeChange(hourRange.start, parseInt(val))}
                    >
                      <SelectTrigger className="w-[80px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }).map((_, i) => (
                          <SelectItem 
                            key={i} 
                            value={i.toString()}
                            disabled={i < hourRange.start}
                          >
                            {i}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
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
            <DropdownMenuLabel>Opciones de filtrado</DropdownMenuLabel>
            
            <DropdownMenuCheckboxItem
              checked={includeHours}
              onCheckedChange={(checked) => handleIncludeHoursChange(!!checked)}
            >
              Incluir filtros por hora
            </DropdownMenuCheckboxItem>
            
            <DropdownMenuSeparator />
            
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
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 gap-1"
          onClick={onExportData}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Exportando...</span>
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5" />
              <span>Exportar</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}