import { useState, useMemo } from "react";
import { useLLMConfigs, LLMConfig } from "@/hooks/useLLMConfigs";
import { LLMCard } from "@/components/llm/LLMCard";
import { LLMEditDrawer } from "@/components/llm/LLMEditDrawer";
import { AdminNavbar } from "@/components/layouts/AdminNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Cpu,
  Search,
  Filter,
  PlusCircle,
  Grid3x3,
  List,
  CheckCircle2,
  AlertCircle,
  CircleOff,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminLLM() {
  // Obtener configuraciones LLM y funciones asociadas
  const {
    llmConfigs,
    isLoading,
    createLLMConfig,
    updateLLMConfig,
    deleteLLMConfig,
    setDefaultConfig,
    toggleActiveState,
    providers,
  } = useLLMConfigs();

  // Estados para la interfaz
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [activeView, setActiveView] = useState<"grid" | "list">("grid");
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<LLMConfig | null>(null);

  // Filtrar configuraciones según búsqueda y proveedor seleccionado
  const filteredConfigs = useMemo(() => {
    return llmConfigs.filter((config) => {
      const matchesQuery =
        searchQuery === "" ||
        config.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        config.proveedor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        config.modelo.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesProvider =
        selectedProvider === "all" ||
        config.proveedor.toLowerCase() === selectedProvider.toLowerCase();

      return matchesQuery && matchesProvider;
    });
  }, [llmConfigs, searchQuery, selectedProvider]);

  // Datos para el gráfico circular de distribución de proveedores
  const providerDistribution = useMemo(() => {
    const providerCounts: Record<string, number> = {};
    
    llmConfigs.forEach((config) => {
      const provider = config.proveedor.toLowerCase();
      providerCounts[provider] = (providerCounts[provider] || 0) + 1;
    });

    const colors: Record<string, string> = {
      openai: "#10b981",
      anthropic: "#8b5cf6",
      mistral: "#3b82f6",
      gemini: "#f59e0b",
    };

    return Object.entries(providerCounts).map(([provider, count]) => ({
      name: provider.charAt(0).toUpperCase() + provider.slice(1),
      value: count,
      color: colors[provider.toLowerCase()] || "#6b7280",
    }));
  }, [llmConfigs]);

  // Datos para el gráfico circular de estado de actividad
  const statusDistribution = useMemo(() => {
    let activeCount = 0;
    let inactiveCount = 0;

    llmConfigs.forEach((config) => {
      if (config.is_active) {
        activeCount++;
      } else {
        inactiveCount++;
      }
    });

    return [
      { name: "Activos", value: activeCount, color: "#10b981" },
      { name: "Inactivos", value: inactiveCount, color: "#6b7280" },
    ];
  }, [llmConfigs]);

  // Gestionar apertura/cierre del drawer de edición
  const handleEditDrawerClose = () => {
    setIsEditDrawerOpen(false);
    setTimeout(() => {
      setSelectedConfig(null);
    }, 200);
  };

  // Abrir drawer para editar o crear
  const handleOpenEdit = (config?: LLMConfig) => {
    setSelectedConfig(config || null);
    setIsEditDrawerOpen(true);
  };

  // Manejar guardado de configuración
  const handleSaveConfig = async (values: any) => {
    try {
      if (selectedConfig) {
        // Actualizar configuración existente
        await updateLLMConfig.mutateAsync({
          id: selectedConfig.id,
          ...values,
        });
        toast.success("Configuración LLM actualizada correctamente");
      } else {
        // Crear nueva configuración
        await createLLMConfig.mutateAsync(values);
        toast.success("Configuración LLM creada correctamente");
      }
      setIsEditDrawerOpen(false);
    } catch (error) {
      console.error("Error al guardar configuración LLM:", error);
      toast.error("Error al guardar la configuración LLM");
    }
  };

  // Eliminar configuración
  const handleDeleteConfig = async (id: string) => {
    try {
      await deleteLLMConfig.mutateAsync(id);
      toast.success("Configuración LLM eliminada correctamente");
    } catch (error) {
      console.error("Error al eliminar configuración LLM:", error);
      toast.error("Error al eliminar la configuración LLM");
    }
  };

  // Establecer configuración como predeterminada
  const handleSetDefaultConfig = async (id: string) => {
    try {
      await setDefaultConfig.mutateAsync(id);
    } catch (error) {
      console.error("Error al establecer configuración predeterminada:", error);
      toast.error("Error al establecer configuración predeterminada");
    }
  };

  // Activar/desactivar configuración
  const handleToggleActiveState = async (id: string, isActive: boolean) => {
    try {
      await toggleActiveState.mutateAsync({ id, isActive });
    } catch (error) {
      console.error("Error al cambiar estado de activación:", error);
      toast.error("Error al cambiar el estado de activación");
    }
  };

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configuración LLM</h2>
          <p className="text-muted-foreground">
            Administra los modelos de lenguaje y sus configuraciones
          </p>
        </div>
        <Button onClick={() => handleOpenEdit()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva configuración
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de configuraciones
            </CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{llmConfigs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {llmConfigs.filter(c => c.is_active).length} activas ·{" "}
              {llmConfigs.filter(c => !c.is_active).length} inactivas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Distribución por proveedor
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="h-[100px] w-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={providerDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={40}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {providerDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <div className="px-6 pb-2 flex justify-center">
            <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-xs">
              {providerDistribution.map((entry, index) => (
                <div className="flex items-center" key={index}>
                  <div
                    className="w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span>
                    {entry.name}: {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Estado de configuraciones
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="h-[100px] w-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={40}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <div className="px-6 pb-2 flex justify-center">
            <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-xs">
              {statusDistribution.map((entry, index) => (
                <div className="flex items-center" key={index}>
                  <div
                    className="w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span>
                    {entry.name}: {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[280px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar configuración..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={selectedProvider}
            onValueChange={setSelectedProvider}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por proveedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los proveedores</SelectItem>
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={activeView === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setActiveView("grid")}
            className="h-9 w-9"
          >
            <Grid3x3 className="h-4 w-4" />
            <span className="sr-only">Vista de tarjetas</span>
          </Button>
          <Button
            variant={activeView === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setActiveView("list")}
            className="h-9 w-9"
          >
            <List className="h-4 w-4" />
            <span className="sr-only">Vista de lista</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Cargando configuraciones...</div>
        </div>
      ) : filteredConfigs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Cpu className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
          <h3 className="text-lg font-medium">No se encontraron configuraciones</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery || selectedProvider !== "all"
              ? "Prueba a cambiar los filtros de búsqueda"
              : "Comienza creando una nueva configuración LLM"}
          </p>
          {(searchQuery || selectedProvider !== "all") && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                setSelectedProvider("all");
              }}
            >
              Limpiar filtros
            </Button>
          )}
          {!searchQuery && selectedProvider === "all" && (
            <Button className="mt-4" onClick={() => handleOpenEdit()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear configuración
            </Button>
          )}
        </div>
      ) : (
        <>
          {activeView === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredConfigs.map((config) => (
                <LLMCard
                  key={config.id}
                  config={config}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteConfig}
                  onSetDefault={handleSetDefaultConfig}
                  onToggleActive={handleToggleActiveState}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden md:table-cell">Estado</TableHead>
                    <TableHead>Activo</TableHead>
                    <TableHead className="hidden lg:table-cell">Actualizado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConfigs.map((config) => (
                    <LLMCard
                      key={config.id}
                      config={config}
                      onEdit={handleOpenEdit}
                      onDelete={handleDeleteConfig}
                      onSetDefault={handleSetDefaultConfig}
                      onToggleActive={handleToggleActiveState}
                      variant="row"
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      <LLMEditDrawer
        config={selectedConfig || undefined}
        open={isEditDrawerOpen}
        onOpenChange={handleEditDrawerClose}
        onSave={handleSaveConfig}
        providers={providers}
        isLoading={createLLMConfig.isPending || updateLLMConfig.isPending}
      />
    </div>
  );
}