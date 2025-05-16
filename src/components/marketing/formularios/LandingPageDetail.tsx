import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BarChart3, Copy, Download, Edit, ExternalLink, Eye, Link2, Trash } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Campo } from "./FormularioIntegracion";

interface Formulario {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  campos: Campo[];
  fecha_creacion: string;
  fecha_modificacion: string;
  estado: string;
  envios: number;
  conversion: number;
  tasa_conversion: number;
}

interface LandingPage {
  id: string;
  nombre: string;
  descripcion: string;
  url: string;
  formulario_id: string;
  campania_id: string | null;
  fecha_creacion: string;
  fecha_modificacion: string;
  estado: string;
  visitas: number;
  conversiones: number;
  tasa_conversion: number;
}

interface LandingPageDetailProps {
  landingPage: LandingPage;
  formularios: Formulario[];
  onClose: () => void;
}

// Datos de ejemplo para visitas
const visitasMock = [
  {
    id: "visit-001",
    landing_page_id: "lp-001",
    fecha: "2025-06-20T14:30:00",
    ip: "192.168.1.1",
    user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)",
    referrer: "https://www.google.com",
    utm_source: "facebook",
    utm_medium: "social",
    utm_campaign: "promo-verano-2025",
    dispositivo: "mobile",
    pais: "España",
    ciudad: "Madrid",
    tiempo_pagina: 45,
    conversion: true
  },
  {
    id: "visit-002",
    landing_page_id: "lp-001",
    fecha: "2025-06-20T13:15:00",
    ip: "192.168.1.2",
    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    referrer: "https://www.instagram.com",
    utm_source: "instagram",
    utm_medium: "social",
    utm_campaign: "promo-verano-2025",
    dispositivo: "desktop",
    pais: "España",
    ciudad: "Barcelona",
    tiempo_pagina: 120,
    conversion: true
  },
  {
    id: "visit-003",
    landing_page_id: "lp-001",
    fecha: "2025-06-20T12:45:00",
    ip: "192.168.1.3",
    user_agent: "Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)",
    referrer: "https://www.facebook.com",
    utm_source: "facebook",
    utm_medium: "social",
    utm_campaign: "promo-verano-2025",
    dispositivo: "tablet",
    pais: "España",
    ciudad: "Valencia",
    tiempo_pagina: 60,
    conversion: false
  },
];

export function LandingPageDetail({ landingPage, formularios, onClose }: LandingPageDetailProps) {
  const [activeTab, setActiveTab] = useState("general");

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  // Encontrar el formulario asociado
  const formularioAsociado = formularios.find(f => f.id === landingPage.formulario_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={onClose} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{landingPage.nombre}</h2>
          <p className="text-muted-foreground">{landingPage.descripcion}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="visitas">Visitas</TabsTrigger>
              <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Información general</CardTitle>
                  <CardDescription>
                    Configuración general de la landing page
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">URL de la landing page</h3>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 p-3 border rounded-md bg-muted/50">
                        <a href={landingPage.url} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center">
                          {landingPage.url}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                      <Button variant="outline" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Link2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Formulario asociado</h3>
                    {formularioAsociado ? (
                      <Card className="border">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{formularioAsociado.nombre}</CardTitle>
                          <CardDescription>{formularioAsociado.descripcion}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="text-sm">
                            <div className="flex justify-between mb-1">
                              <span className="text-muted-foreground">Tipo:</span>
                              <span className="font-medium capitalize">{formularioAsociado.tipo}</span>
                            </div>
                            <div className="flex justify-between mb-1">
                              <span className="text-muted-foreground">Campos:</span>
                              <span className="font-medium">{formularioAsociado.campos.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Tasa de conversión:</span>
                              <span className="font-medium">{formularioAsociado.tasa_conversion}%</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver formulario
                          </Button>
                        </CardFooter>
                      </Card>
                    ) : (
                      <div className="p-4 border rounded-md bg-muted/50 text-center">
                        <p className="text-muted-foreground">No hay formulario asociado</p>
                        <div className="mt-2">
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar formulario" />
                            </SelectTrigger>
                            <SelectContent>
                              {formularios.map(form => (
                                <SelectItem key={form.id} value={form.id}>{form.nombre}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Vista previa</h3>
                    <div className="border rounded-md overflow-hidden">
                      <div className="bg-muted p-2 flex items-center justify-between border-b">
                        <div className="flex items-center space-x-2">
                          <div className="h-3 w-3 rounded-full bg-red-500"></div>
                          <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                          <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{landingPage.url}</div>
                        <div className="w-16"></div>
                      </div>
                      <div className="h-[300px] flex items-center justify-center bg-white">
                        <div className="text-center">
                          <Eye className="h-10 w-10 mx-auto text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            Vista previa de la landing page
                          </p>
                          <Button variant="outline" size="sm" className="mt-2">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Abrir en nueva pestaña
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="visitas" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Registro de visitas</CardTitle>
                  <CardDescription>
                    Últimas visitas registradas en esta landing page
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Origen</TableHead>
                        <TableHead>Dispositivo</TableHead>
                        <TableHead>Ubicación</TableHead>
                        <TableHead>Tiempo</TableHead>
                        <TableHead>Conversión</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visitasMock.map((visita) => (
                        <TableRow key={visita.id}>
                          <TableCell>{formatDate(visita.fecha)}</TableCell>
                          <TableCell>
                            <div className="font-medium">{visita.utm_source || "Directo"}</div>
                            <div className="text-xs text-muted-foreground">{visita.referrer || "N/A"}</div>
                          </TableCell>
                          <TableCell className="capitalize">{visita.dispositivo}</TableCell>
                          <TableCell>
                            {visita.ciudad}, {visita.pais}
                          </TableCell>
                          <TableCell>{visita.tiempo_pagina}s</TableCell>
                          <TableCell>
                            {visita.conversion ? (
                              <Badge>Convertido</Badge>
                            ) : (
                              <Badge variant="outline">No convertido</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar visitas
                  </Button>
                  <Button variant="outline">
                    Ver todas las visitas
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="estadisticas" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas de rendimiento</CardTitle>
                  <CardDescription>
                    Métricas de rendimiento de la landing page
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total visitas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{landingPage.visitas}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Conversiones</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{landingPage.conversiones}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de conversión</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{landingPage.tasa_conversion}%</div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="mt-6 h-[300px] flex items-center justify-center border rounded-md">
                    <div className="text-center">
                      <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Gráfico de rendimiento de la landing page
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium">ID de la landing page</div>
                <div className="text-sm text-muted-foreground flex items-center mt-1">
                  {landingPage.id}
                  <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Estado</div>
                <div className="mt-1">
                  <Badge variant={landingPage.estado === "activo" ? "default" : "secondary"}>
                    {landingPage.estado === "activo" ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Fecha de creación</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {new Date(landingPage.fecha_creacion).toLocaleDateString("es-ES")}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Última modificación</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {new Date(landingPage.fecha_modificacion).toLocaleDateString("es-ES")}
                </div>
              </div>
              {landingPage.campania_id && (
                <div>
                  <div className="text-sm font-medium">Campaña asociada</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    ID: {landingPage.campania_id}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button className="w-full">
                <Edit className="h-4 w-4 mr-2" />
                Editar landing page
              </Button>
              <Button variant="outline" className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                Visitar URL
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}