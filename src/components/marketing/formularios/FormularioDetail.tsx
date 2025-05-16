import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BarChart3, Copy, Download, Edit, Eye, Trash } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Campo {
  id: string;
  label: string;
  tipo: string;
  requerido: boolean;
  opciones?: string[];
}

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

interface FormularioDetailProps {
  formulario: Formulario;
  onClose: () => void;
}

// Datos de ejemplo para respuestas de formulario
const respuestasMock = [
  {
    id: "resp-001",
    formulario_id: "form-001",
    fecha: "2025-06-20T14:30:00",
    datos: {
      nombre: "María López",
      email: "maria.lopez@ejemplo.com",
      telefono: "+34 612 345 678",
      mensaje: "Me gustaría recibir más información sobre sus servicios de marketing digital."
    },
    origen: "Landing Promoción Verano",
    dispositivo: "mobile",
    convertido: true,
    lead_id: "lead-123"
  },
  {
    id: "resp-002",
    formulario_id: "form-001",
    fecha: "2025-06-19T10:15:00",
    datos: {
      nombre: "Carlos Rodríguez",
      email: "carlos.rodriguez@ejemplo.com",
      telefono: "+34 623 456 789",
      mensaje: "Estoy interesado en una consultoría para mi empresa."
    },
    origen: "Landing Promoción Verano",
    dispositivo: "desktop",
    convertido: true,
    lead_id: "lead-124"
  },
  {
    id: "resp-003",
    formulario_id: "form-001",
    fecha: "2025-06-18T16:45:00",
    datos: {
      nombre: "Ana Martínez",
      email: "ana.martinez@ejemplo.com",
      telefono: "",
      mensaje: "¿Podrían enviarme un presupuesto para una campaña de redes sociales?"
    },
    origen: "Landing Promoción Verano",
    dispositivo: "tablet",
    convertido: false,
    lead_id: null
  },
];

export function FormularioDetail({ formulario, onClose }: FormularioDetailProps) {
  const [activeTab, setActiveTab] = useState("campos");

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

  // Obtener icono según tipo de campo
  const getFieldTypeIcon = (tipo: string) => {
    switch (tipo) {
      case "text":
        return "Aa";
      case "email":
        return "@";
      case "tel":
        return "📱";
      case "textarea":
        return "¶";
      case "select":
        return "▼";
      case "checkbox":
        return "☑";
      case "radio":
        return "⊙";
      default:
        return "?";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={onClose} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{formulario.nombre}</h2>
          <p className="text-muted-foreground">{formulario.descripcion}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="campos">Campos</TabsTrigger>
              <TabsTrigger value="respuestas">Respuestas</TabsTrigger>
              <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="campos" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Estructura del formulario</CardTitle>
                  <CardDescription>
                    Campos configurados para este formulario
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {formulario.campos.map((campo, index) => (
                      <div 
                        key={campo.id} 
                        className="p-4 border rounded-md flex items-start justify-between hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                            {getFieldTypeIcon(campo.tipo)}
                          </div>
                          <div>
                            <div className="font-medium">{campo.label}</div>
                            <div className="text-sm text-muted-foreground flex items-center space-x-2">
                              <span className="capitalize">{campo.tipo}</span>
                              {campo.requerido && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Requerido
                                </Badge>
                              )}
                            </div>
                            {campo.opciones && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Opciones: {campo.opciones.join(", ")}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    Añadir nuevo campo
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="respuestas" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Respuestas recibidas</CardTitle>
                  <CardDescription>
                    Últimas respuestas recibidas a través de este formulario
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Datos</TableHead>
                        <TableHead>Origen</TableHead>
                        <TableHead>Dispositivo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {respuestasMock.map((respuesta) => (
                        <TableRow key={respuesta.id}>
                          <TableCell>{formatDate(respuesta.fecha)}</TableCell>
                          <TableCell>
                            <div className="font-medium">{respuesta.datos.nombre}</div>
                            <div className="text-sm text-muted-foreground">{respuesta.datos.email}</div>
                          </TableCell>
                          <TableCell>{respuesta.origen}</TableCell>
                          <TableCell className="capitalize">{respuesta.dispositivo}</TableCell>
                          <TableCell>
                            {respuesta.convertido ? (
                              <Badge>Convertido</Badge>
                            ) : (
                              <Badge variant="outline">Pendiente</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar respuestas
                  </Button>
                  <Button variant="outline">
                    Ver todas las respuestas
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="estadisticas" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas de rendimiento</CardTitle>
                  <CardDescription>
                    Métricas de rendimiento del formulario
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total envíos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formulario.envios}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Conversiones</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formulario.conversion}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de conversión</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formulario.tasa_conversion}%</div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="mt-6 h-[300px] flex items-center justify-center border rounded-md">
                    <div className="text-center">
                      <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Gráfico de rendimiento del formulario
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
                <div className="text-sm font-medium">ID del formulario</div>
                <div className="text-sm text-muted-foreground flex items-center mt-1">
                  {formulario.id}
                  <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Tipo</div>
                <div className="text-sm text-muted-foreground mt-1 capitalize">{formulario.tipo}</div>
              </div>
              <div>
                <div className="text-sm font-medium">Estado</div>
                <div className="mt-1">
                  <Badge variant={formulario.estado === "activo" ? "default" : "secondary"}>
                    {formulario.estado === "activo" ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Fecha de creación</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {new Date(formulario.fecha_creacion).toLocaleDateString("es-ES")}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Última modificación</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {new Date(formulario.fecha_modificacion).toLocaleDateString("es-ES")}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button className="w-full">
                <Edit className="h-4 w-4 mr-2" />
                Editar formulario
              </Button>
              <Button variant="outline" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                Vista previa
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}