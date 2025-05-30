import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  FileText, 
  Search, 
  PlusCircle, 
  Filter, 
  BarChart3, 
  ArrowUpRight,
  Link2,
  Pencil,
  Eye,
  Code,
  Copy,
  MoreVertical,
  Trash,
  FileCode,
  FormInput
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
import { useMarketingData } from "@/hooks/useMarketingData";
import { MarketingNavigationMenu } from "@/components/marketing/MarketingNavigationMenu";
import { FormularioDetail } from "@/components/marketing/formularios/FormularioDetail";
import { LandingPageDetail } from "@/components/marketing/formularios/LandingPageDetail";
import { FormularioIntegracion } from "@/components/marketing/formularios/FormularioIntegracion";
import { useMarketingForms, Formulario as FormularioType } from "@/hooks/marketing/useMarketingForms";
import { useMarketingLandings, LandingPage as LandingPageType } from "@/hooks/marketing/useMarketingLandings";

// Interfaz local compatible con FormularioType para mantener compatibilidad con componentes existentes
interface Formulario extends FormularioType {
  tipo?: string;
  estado?: string;
  fecha_creacion?: string;
  fecha_modificacion?: string;
  envios?: number;
  conversion?: number;
  tasa_conversion?: number;
}

// Interfaz local compatible con LandingPageType para mantener compatibilidad con componentes existentes
interface LandingPage extends LandingPageType {
  estado?: string;
  fecha_creacion?: string;
  fecha_modificacion?: string;
  visitas?: number;
  conversiones?: number;
  tasa_conversion?: number;
}

const MarketingFormularios = () => {
  const [activeTab, setActiveTab] = useState("formularios");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFormulario, setSelectedFormulario] = useState<Formulario | null>(null);
  const [selectedLandingPage, setSelectedLandingPage] = useState<LandingPage | null>(null);
  const [showIntegracion, setShowIntegracion] = useState(false);
  const [selectedIntegracionFormulario, setSelectedIntegracionFormulario] = useState<Formulario | null>(null);
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [isCreatingLanding, setIsCreatingLanding] = useState(false);
  const { toast } = useToast();

  // Usar los hooks de Supabase
  const { 
    formularios, 
    isLoading: isLoadingForms,
    createForm,
    updateForm,
    deleteForm
  } = useMarketingForms({
    filters: {
      searchTerm
    }
  });

  const {
    landingPages,
    isLoading: isLoadingLandings,
    createLanding,
    updateLanding,
    deleteLanding
  } = useMarketingLandings({
    filters: {
      searchTerm
    }
  });

  const isLoading = isLoadingForms || isLoadingLandings;

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  // Manejar clic en formulario
  const handleFormularioClick = (formulario: Formulario) => {
    setSelectedFormulario(formulario);
    setSelectedLandingPage(null);
    setShowIntegracion(false);
  };

  // Manejar clic en landing page
  const handleLandingPageClick = (landingPage: LandingPage) => {
    setSelectedLandingPage(landingPage);
    setSelectedFormulario(null);
    setShowIntegracion(false);
  };

  // Manejar clic en integración
  const handleIntegracionClick = (formulario: Formulario) => {
    setSelectedIntegracionFormulario(formulario);
    setShowIntegracion(true);
    setSelectedFormulario(null);
    setSelectedLandingPage(null);
  };

  // Manejar edición de landing page
  const handleEditLandingPage = (landingPage: LandingPage) => {
    setSelectedLandingPage(landingPage);
  };

  // Manejar eliminación de landing page
  const handleDeleteLandingPage = async (id: string) => {
    try {
      await deleteLanding.mutateAsync(id);
    } catch (error) {
      console.error('Error al eliminar landing page:', error);
    }
  };

  // Manejar cierre de detalles
  const handleCloseDetails = () => {
    setSelectedFormulario(null);
    setSelectedLandingPage(null);
    setShowIntegracion(false);
    setIsCreatingForm(false);
    setIsCreatingLanding(false);
  };

  // Manejar creación de formulario
  const handleCreateFormulario = () => {
    setIsCreatingForm(true);
    setSelectedFormulario(null);
    setSelectedLandingPage(null);
    setShowIntegracion(false);

    // Obtener IDs de pipeline y stage para el formulario
    // Usar valores predeterminados o solicitar al usuario que los seleccione
    // En este caso usamos valores ficticios para prueba
    const defaultPipelineId = "550e8400-e29b-41d4-a716-446655440000";
    const defaultStageId = "550e8400-e29b-41d4-a716-446655440001";
    
    // Crear formulario con los datos requeridos por la API
    const nuevoFormulario = {
      nombre: "Nuevo Formulario",
      descripcion: "Descripción del nuevo formulario",
      pipeline_id: defaultPipelineId,
      stage_id: defaultStageId,
      codigo_integracion: "",
      redirect_url: "",
      is_active: true
    };
    
    try {
      createForm.mutate(nuevoFormulario, {
        onSuccess: (data) => {
          toast({
            title: "Formulario creado",
            description: "Se ha creado el formulario correctamente."
          });
          // Seleccionar el formulario recién creado para editarlo
          setSelectedFormulario(data as Formulario);
          setIsCreatingForm(false);
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: "No se pudo crear el formulario. Inténtalo de nuevo.",
            variant: "destructive"
          });
          setIsCreatingForm(false);
        }
      });
    } catch (error) {
      console.error('Error al crear formulario:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el formulario. Inténtalo de nuevo.",
        variant: "destructive"
      });
      setIsCreatingForm(false);
    }
  };

  // Manejar creación de landing page
  const handleCreateLandingPage = () => {
    setIsCreatingLanding(true);
    setSelectedFormulario(null);
    setSelectedLandingPage(null);
    setShowIntegracion(false);
    
    // Verificar si hay formularios disponibles para asociar
    if (!formularios || formularios.length === 0) {
      toast({
        title: "No hay formularios disponibles",
        description: "Debes crear al menos un formulario antes de crear una landing page.",
        variant: "destructive"
      });
      setIsCreatingLanding(false);
      return;
    }
    
    // Crear landing page con los datos requeridos por la API
    const nuevaLandingPage = {
      nombre: "Nueva Landing Page",
      descripcion: "Descripción de la nueva landing page",
      formulario_id: formularios[0].id, // Asignar el primer formulario disponible por defecto
      configuracion_seguimiento: {
        analytics: {
          gtm_id: "",
          ga_id: ""
        },
        social: {
          og_title: "",
          og_description: "",
          og_image: ""
        }
      },
      is_active: true
    };
    
    try {
      createLanding.mutate(nuevaLandingPage, {
        onSuccess: (data) => {
          toast({
            title: "Landing page creada",
            description: "Se ha creado la landing page correctamente."
          });
          // Seleccionar la landing page recién creada para editarla
          setSelectedLandingPage(data as LandingPage);
          setIsCreatingLanding(false);
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: "No se pudo crear la landing page. Inténtalo de nuevo.",
            variant: "destructive"
          });
          setIsCreatingLanding(false);
        }
      });
    } catch (error) {
      console.error('Error al crear landing page:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la landing page. Inténtalo de nuevo.",
        variant: "destructive"
      });
      setIsCreatingLanding(false);
    }
  };

  // Filtrar formularios basado en el término de búsqueda
  const filteredFormularios = formularios?.filter(form => {
    if (!searchTerm) return true;
    return (
      form.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) || [];

  // Filtrar landing pages basado en el término de búsqueda
  const filteredLandingPages = landingPages?.filter(landing => {
    if (!searchTerm) return true;
    return (
      landing.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      landing.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) || [];

  return (
    <div className="flex flex-col space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Formularios y Landing Pages</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus formularios, landing pages y su integración con el seguimiento de leads.
          </p>
        </div>
        <MarketingNavigationMenu />
      </div>

      {selectedFormulario ? (
        <FormularioDetail 
          formulario={selectedFormulario} 
          onClose={handleCloseDetails} 
        />
      ) : selectedLandingPage ? (
        <LandingPageDetail 
          landingPage={selectedLandingPage} 
          formularios={formularios}
          onClose={handleCloseDetails} 
        />
      ) : showIntegracion ? (
        <FormularioIntegracion 
          formulario={selectedIntegracionFormulario} 
          onClose={handleCloseDetails} 
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 w-full max-w-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar formularios o landing pages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Select defaultValue="todos">
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                  <SelectItem value="borrador">Borrador</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button 
                size="sm" 
                className="h-9" 
                onClick={() => activeTab === "formularios" ? handleCreateFormulario() : handleCreateLandingPage()}
                disabled={isCreatingForm || isCreatingLanding}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                {isCreatingForm || isCreatingLanding ? "Creando..." : "Crear nuevo"}
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="formularios" className="flex items-center">
                <FormInput className="h-4 w-4 mr-2" />
                Formularios
              </TabsTrigger>
              <TabsTrigger value="landing" className="flex items-center">
                <FileCode className="h-4 w-4 mr-2" />
                Landing Pages
              </TabsTrigger>
            </TabsList>

            <TabsContent value="formularios" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2 mt-2" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : filteredFormularios.length === 0 ? (
                  <div className="col-span-3 text-center py-10">
                    <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No se encontraron formularios</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      No hay formularios que coincidan con tu búsqueda. Intenta con otros términos o crea uno nuevo.
                    </p>
                    <Button 
                      className="mt-4" 
                      size="sm" 
                      onClick={handleCreateFormulario}
                      disabled={isCreatingForm}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {isCreatingForm ? "Creando..." : "Crear formulario"}
                    </Button>
                  </div>
                ) : (
                  filteredFormularios.map((formulario) => (
                    <Card key={formulario.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{formulario.nombre}</CardTitle>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleFormularioClick(formulario)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleIntegracionClick(formulario)}>
                                <Code className="h-4 w-4 mr-2" />
                                Código de integración
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleFormularioClick(formulario)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => deleteForm.mutateAsync(formulario.id)}
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <CardDescription>{formulario.descripcion}</CardDescription>
                        <Badge variant={(formulario.is_active || formulario.estado === "activo") ? "default" : "secondary"} className="mt-2">
                          {(formulario.is_active || formulario.estado === "activo") ? "Activo" : "Inactivo"}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tipo:</span>
                            <span className="font-medium capitalize">{formulario.tipo || "Contacto"}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Campos:</span>
                            <span className="font-medium">{formulario.campos?.length || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tasa de conversión:</span>
                            <span className="font-medium">{formulario.tasa_conversion || 0}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Última modificación:</span>
                            <span className="font-medium">{formatDate(formulario.updated_at || formulario.fecha_modificacion || new Date().toISOString())}</span>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleFormularioClick(formulario)}
                          >
                            Ver detalles
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="landing" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2 mt-2" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : filteredLandingPages.length === 0 ? (
                  <div className="col-span-3 text-center py-10">
                    <FileCode className="h-10 w-10 mx-auto text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No se encontraron landing pages</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      No hay landing pages que coincidan con tu búsqueda. Intenta con otros términos o crea una nueva.
                    </p>
                    <Button 
                      className="mt-4" 
                      size="sm"
                      onClick={handleCreateLandingPage}
                      disabled={isCreatingLanding}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {isCreatingLanding ? "Creando..." : "Crear landing page"}
                    </Button>
                  </div>
                ) : (
                  filteredLandingPages.map((landingPage) => (
                    <Card key={landingPage.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{landingPage.nombre}</CardTitle>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleLandingPageClick(landingPage)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Link2 className="h-4 w-4 mr-2" />
                                Visitar URL
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditLandingPage(landingPage)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => deleteLanding.mutateAsync(landingPage.id)}
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <CardDescription>{landingPage.descripcion}</CardDescription>
                        <Badge variant={(landingPage.is_active || landingPage.estado === "activo") ? "default" : "secondary"} className="mt-2">
                          {(landingPage.is_active || landingPage.estado === "activo") ? "Activo" : "Inactivo"}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">URL:</span>
                            <span className="font-medium truncate max-w-[180px]" title={landingPage.url}>
                              {landingPage.url}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Visitas:</span>
                            <span className="font-medium">{landingPage.visitas || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tasa de conversión:</span>
                            <span className="font-medium">{landingPage.tasa_conversion || 0}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Última modificación:</span>
                            <span className="font-medium">{formatDate(landingPage.updated_at || landingPage.fecha_modificacion || new Date().toISOString())}</span>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleLandingPageClick(landingPage)}
                          >
                            Ver detalles
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default MarketingFormularios;
