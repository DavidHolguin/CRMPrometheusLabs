import { useState } from "react";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreatePipelineDialog } from "./CreatePipelineDialog";
import { CreateStageDialog } from "./CreateStageDialog";
import { AddLeadDialog } from "./AddLeadDialog";
import { PipelineStage, Pipeline } from "@/hooks/usePipelines"; // Importar Pipeline desde usePipelines
import { 
  Plus, 
  Filter, 
  UserPlus, 
  Settings, 
  Search, 
  ChevronDown,
  LayoutDashboard,
  Check,
  X
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface PipelineToolbarProps {
  pipelines: Pipeline[];
  selectedPipeline: string | null;
  onPipelineChange: (pipelineId: string) => void;
  currentPipeline?: Pipeline;
  onLeadAdded: () => void;
  onSearchChange?: (query: string) => void;
  onFilterChange?: (filters: FilterOptions) => void;
}

export interface FilterOptions {
  onlyUnassigned?: boolean;
  createdToday?: boolean;
  recentlyUpdated?: boolean;
  stageFilter?: string;
}

export function PipelineToolbar({ 
  pipelines, 
  selectedPipeline, 
  onPipelineChange, 
  currentPipeline,
  onLeadAdded,
  onSearchChange,
  onFilterChange
}: PipelineToolbarProps) {
  const [showAddStageDialog, setShowAddStageDialog] = useState(false);
  const [showAddLeadDialog, setShowAddLeadDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    onlyUnassigned: false,
    createdToday: false,
    recentlyUpdated: false,
    stageFilter: undefined
  });
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  
  // Para el filtrado y búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    if (onSearchChange) {
      onSearchChange(newQuery);
    }
  };

  // Limpiar búsqueda
  const clearSearch = () => {
    setSearchQuery("");
    if (onSearchChange) {
      onSearchChange("");
    }
  };

  // Manejar cambio de filtros
  const handleFilterChange = (filterName: keyof FilterOptions, value: boolean | string) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    
    // Contar filtros activos para mostrar el indicador
    const count = Object.entries(newFilters).filter(([key, val]) => {
      if (key === 'stageFilter') {
        return val !== undefined;
      }
      return !!val;
    }).length;
    
    setActiveFiltersCount(count);
    
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };
  
  // Limpiar todos los filtros
  const clearAllFilters = () => {
    const resetFilters = {
      onlyUnassigned: false,
      createdToday: false,
      recentlyUpdated: false,
      stageFilter: undefined
    };
    
    setFilters(resetFilters);
    setActiveFiltersCount(0);
    
    if (onFilterChange) {
      onFilterChange(resetFilters);
    }
  };

  return (
    <div className="flex items-center justify-between w-full py-2 px-3 bg-background/95 backdrop-blur-sm border-b sticky top-0 z-20">
      <div className="flex items-center gap-3 flex-1">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-primary/80" />
          <h2 className="font-medium text-lg tracking-tight">Pipeline</h2>
        </div>
        
        <div className="w-[230px] ml-2">
          <Select value={selectedPipeline || ''} onValueChange={onPipelineChange}>
            <SelectTrigger className="h-9 border-primary/20 bg-background/50">
              <SelectValue placeholder="Seleccionar pipeline" />
            </SelectTrigger>
            <SelectContent>
              {pipelines.map((pipeline) => (
                <SelectItem key={pipeline.id} value={pipeline.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{pipeline.nombre}</span>
                    {pipeline.is_default && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
              <div className="py-2 border-t">
                <CreatePipelineDialog>
                  <Button variant="ghost" className="w-full flex items-center justify-start text-blue-500 hover:text-blue-600 hover:bg-blue-50/50 pl-6">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Pipeline
                  </Button>
                </CreatePipelineDialog>
              </div>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2 ml-1">
          <div className="relative w-[180px] md:w-[240px]">
            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar leads..."
              className="h-9 pl-9 pr-9 focus-visible:ring-primary/30"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={clearSearch}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
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
            <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
            
            <DropdownMenuCheckboxItem
              checked={filters.onlyUnassigned}
              onCheckedChange={(checked) => handleFilterChange('onlyUnassigned', checked)}
            >
              Leads sin asignar
            </DropdownMenuCheckboxItem>
            
            <DropdownMenuCheckboxItem
              checked={filters.createdToday}
              onCheckedChange={(checked) => handleFilterChange('createdToday', checked)}
            >
              Creados hoy
            </DropdownMenuCheckboxItem>
            
            <DropdownMenuCheckboxItem
              checked={filters.recentlyUpdated}
              onCheckedChange={(checked) => handleFilterChange('recentlyUpdated', checked)}
            >
              Actualizados recientemente
            </DropdownMenuCheckboxItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuLabel>Filtrar por etapa</DropdownMenuLabel>
            
            {currentPipeline?.stages && currentPipeline.stages.length > 0 && (
              <>
                <DropdownMenuItem
                  className="flex items-center"
                  onSelect={() => handleFilterChange('stageFilter', undefined)}
                >
                  <div className="flex items-center flex-1">
                    <span>Todas las etapas</span>
                  </div>
                  {!filters.stageFilter && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                
                {currentPipeline.stages.map((stage) => (
                  <DropdownMenuItem 
                    key={stage.id}
                    className="flex items-center"
                    onSelect={() => handleFilterChange('stageFilter', stage.id)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: stage.color || '#ccc' }}
                      />
                      <span>{stage.nombre}</span>
                    </div>
                    {filters.stageFilter === stage.id && <Check className="h-4 w-4 ml-2" />}
                  </DropdownMenuItem>
                ))}
              </>
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
        
        {currentPipeline && (
          <Button 
            size="sm" 
            variant="outline" 
            className="gap-1 h-9"
            onClick={() => setShowAddStageDialog(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Etapa</span>
          </Button>
        )}
        
        {currentPipeline && (
          <Button 
            size="sm" 
            className="gap-1 h-9"
            onClick={() => setShowAddLeadDialog(true)}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Lead</span>
          </Button>
        )}
        
        {currentPipeline && showAddStageDialog && (
          <CreateStageDialog 
            pipeline={currentPipeline}
            onComplete={() => setShowAddStageDialog(false)}
            open={showAddStageDialog}
            onOpenChange={setShowAddStageDialog}
          />
        )}
        
        {currentPipeline && showAddLeadDialog && (
          <AddLeadDialog 
            pipelineId={currentPipeline.id}
            stages={currentPipeline.stages || []}
            onLeadAdded={onLeadAdded}
            open={showAddLeadDialog}
            onOpenChange={setShowAddLeadDialog}
          />
        )}
      </div>
    </div>
  );
}