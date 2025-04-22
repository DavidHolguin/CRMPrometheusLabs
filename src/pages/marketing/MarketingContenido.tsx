// filepath: c:\Users\Juliana\Videos\laboratorio prometeo\crmPrometeoFront\src\pages\marketing\MarketingContenido.tsx
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FileText,
  PlusCircle,
  ImageIcon,
  Video, 
  Instagram, 
  Facebook, 
  Twitter, 
  Linkedin
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import MarketingContenidoGrid from "@/components/marketing/MarketingContenidoGrid";
import { 
  MarketingContenido as ContenidoType,
  useMarketingContenido
} from "@/hooks/marketing/useMarketingContenido";

const MarketingContenido = () => {
  const [isCreatingContenido, setIsCreatingContenido] = useState(false);
  const [editingContenido, setEditingContenido] = useState<ContenidoType | null>(null);
  const [viewDetailContenido, setViewDetailContenido] = useState<ContenidoType | null>(null);
  const [activeTab, setActiveTab] = useState("todos");

  // Manejadores para el formulario
  const handleEditContenido = (contenido: ContenidoType) => {
    setEditingContenido(contenido);
    setIsCreatingContenido(true);
  };

  const handleViewDetail = (contenido: ContenidoType) => {
    setViewDetailContenido(contenido);
  };

  // Obtener el icono según el tipo de contenido
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
        return <FileText className="h-5 w-5" />;
    }
  };

  // Formatear fecha
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  return (
    <div className="space-y-6 py-[14px] px-[21px]">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Contenido de Marketing</h1>
          <p className="text-muted-foreground">
            Gestiona y optimiza tu contenido para distintas plataformas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isCreatingContenido} onOpenChange={setIsCreatingContenido}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Nuevo Contenido
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingContenido ? "Editar Contenido" : "Crear Nuevo Contenido"}
                </DialogTitle>
                <DialogDescription>
                  {editingContenido 
                    ? "Actualiza los detalles del contenido seleccionado" 
                    : "Crea nuevo contenido para tus campañas de marketing"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo de Contenido</Label>
                    <Select defaultValue={editingContenido?.tipo || "post"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="post">Post</SelectItem>
                        <SelectItem value="imagen">Imagen</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="twitter">Twitter</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoría</Label>
                    <Select defaultValue={editingContenido?.categoria || "producto"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="producto">Producto</SelectItem>
                        <SelectItem value="promocion">Promoción</SelectItem>
                        <SelectItem value="educar">Educativo</SelectItem>
                        <SelectItem value="evento">Evento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="titulo">Título</Label>
                  <Input 
                    id="titulo" 
                    placeholder="Título del contenido" 
                    defaultValue={editingContenido?.titulo || ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contenido">Contenido</Label>
                  <Textarea 
                    id="contenido" 
                    placeholder="Escribe el contenido aquí" 
                    className="min-h-[120px]" 
                    defaultValue={editingContenido?.contenido || ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url_imagen">URL de Imagen (opcional)</Label>
                  <Input 
                    id="url_imagen" 
                    placeholder="https://ejemplo.com/imagen.jpg" 
                    defaultValue={editingContenido?.url_imagen || ""}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="campanias">Campaña Asociada (opcional)</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una campaña" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cam-001">Promoción Verano 2025</SelectItem>
                        <SelectItem value="cam-002">Campaña de Email Reactivación</SelectItem>
                        <SelectItem value="cam-003">Webinar Producto Nuevo</SelectItem>
                        <SelectItem value="cam-004">Descuentos Black Friday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="programacion">Programación</Label>
                    <Input 
                      id="programacion" 
                      type="datetime-local" 
                      defaultValue={
                        editingContenido?.fecha_publicacion ? 
                        new Date(editingContenido.fecha_publicacion).toISOString().slice(0, 16) : 
                        ""
                      }
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsCreatingContenido(false);
                    setEditingContenido(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button>
                  {editingContenido ? "Guardar Cambios" : "Crear Contenido"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog para ver el detalle del contenido */}
          <Dialog open={!!viewDetailContenido} onOpenChange={(open) => !open && setViewDetailContenido(null)}>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {viewDetailContenido && getContentTypeIcon(viewDetailContenido.tipo)}
                  {viewDetailContenido?.titulo || "Detalle del Contenido"}
                </DialogTitle>
                <DialogDescription>
                  {viewDetailContenido?.categoria && (
                    <div className="mt-2">Categoría: {viewDetailContenido.categoria}</div>
                  )}
                </DialogDescription>
              </DialogHeader>

              {viewDetailContenido && (
                <div className="space-y-4">
                  {viewDetailContenido.url_imagen && (
                    <div className="rounded-md overflow-hidden border">
                      <img 
                        src={viewDetailContenido.url_imagen} 
                        alt={viewDetailContenido.titulo || "Imagen de contenido"} 
                        className="w-full h-auto max-h-[300px] object-cover" 
                      />
                    </div>
                  )}
                  
                  <div className="text-sm space-y-4 border-b pb-4">
                    <p>{viewDetailContenido.contenido}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Fecha de creación:</span>
                      <div>{formatDate(viewDetailContenido.created_at)}</div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Estado:</span>
                      <div>{viewDetailContenido.is_active ? "Activo" : "Inactivo"}</div>
                    </div>
                    
                    {viewDetailContenido.fecha_publicacion && (
                      <div>
                        <span className="text-muted-foreground">Fecha de publicación programada:</span>
                        <div>{formatDate(viewDetailContenido.fecha_publicacion)}</div>
                      </div>
                    )}
                    
                    <div>
                      <span className="text-muted-foreground">Engagement score:</span>
                      <div>{viewDetailContenido.engagement_score || 0}</div>
                    </div>
                  </div>
                  
                  {viewDetailContenido.campania_id && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Campaña asociada:</span>
                      <div>Promoción Verano 2025</div>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setViewDetailContenido(null)}
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    if (viewDetailContenido) {
                      handleEditContenido(viewDetailContenido);
                      setViewDetailContenido(null);
                    }
                  }}
                >
                  Editar Contenido
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="todos" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="todos" className="py-2">
            Todos
          </TabsTrigger>
          <TabsTrigger value="publicados" className="py-2">
            Publicados
          </TabsTrigger>
          <TabsTrigger value="programados" className="py-2">
            Programados
          </TabsTrigger>
          <TabsTrigger value="borradores" className="py-2">
            Borradores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-4 mt-4">
          <MarketingContenidoGrid 
            onEditContenido={handleEditContenido}
            onViewDetail={handleViewDetail}
          />
        </TabsContent>
        
        <TabsContent value="publicados" className="space-y-4 mt-4">
          <MarketingContenidoGrid 
            onEditContenido={handleEditContenido}
            onViewDetail={handleViewDetail}
          />
        </TabsContent>
        
        <TabsContent value="programados" className="space-y-4 mt-4">
          <MarketingContenidoGrid 
            onEditContenido={handleEditContenido}
            onViewDetail={handleViewDetail}
          />
        </TabsContent>
        
        <TabsContent value="borradores" className="space-y-4 mt-4">
          <MarketingContenidoGrid 
            onEditContenido={handleEditContenido}
            onViewDetail={handleViewDetail}
          />
        </TabsContent>
      </Tabs>
      
      {/* Sección de Estadísticas de Contenido */}
      <div className="pt-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold">Rendimiento de Contenido</h2>
            <p className="text-muted-foreground">
              Métricas y estadísticas de engagement
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Contenido con mayor engagement
              </CardTitle>
              <CardDescription>
                Top 5 publicaciones con mejor rendimiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: 1, titulo: "¿Cómo mejorar tus campañas de email?", tipo: "post", engagement: 78 },
                  { id: 2, titulo: "Video tutorial del nuevo producto", tipo: "video", engagement: 65 },
                  { id: 3, titulo: "Infografía de mejores prácticas", tipo: "imagen", engagement: 54 },
                  { id: 4, titulo: "Anuncio de descuento especial", tipo: "instagram", engagement: 49 },
                  { id: 5, titulo: "Entrevista con expertos del sector", tipo: "linkedin", engagement: 42 }
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getContentTypeIcon(item.tipo)}
                      <div className="text-sm font-medium truncate max-w-[180px]">{item.titulo}</div>
                    </div>
                    <div className="text-sm font-bold">{item.engagement}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Rendimiento por tipo
              </CardTitle>
              <CardDescription>
                Engagement promedio por tipo de contenido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { tipo: "instagram", nombre: "Instagram", engagement: 67 },
                  { tipo: "video", nombre: "Videos", engagement: 58 },
                  { tipo: "linkedin", nombre: "LinkedIn", engagement: 52 },
                  { tipo: "imagen", nombre: "Imágenes", engagement: 45 },
                  { tipo: "facebook", nombre: "Facebook", engagement: 38 },
                  { tipo: "twitter", nombre: "Twitter", engagement: 32 },
                  { tipo: "post", nombre: "Posts", engagement: 25 }
                ].map((item) => (
                  <div key={item.tipo} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getContentTypeIcon(item.tipo)}
                      <div className="text-sm">{item.nombre}</div>
                    </div>
                    <div className="text-sm">{item.engagement} prom.</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Rendimiento por categoría
              </CardTitle>
              <CardDescription>
                Comparativa de categorías por engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { categoria: "producto", nombre: "Producto", engagement: 55, total: 12 },
                  { categoria: "educar", nombre: "Educativo", engagement: 48, total: 8 },
                  { categoria: "promocion", nombre: "Promoción", engagement: 42, total: 15 },
                  { categoria: "evento", nombre: "Evento", engagement: 39, total: 6 }
                ].map((item) => (
                  <div key={item.categoria} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">{item.nombre}</div>
                      <div className="text-sm text-muted-foreground">{item.total} publicaciones</div>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${(item.engagement / 100) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-right">{item.engagement} engagement promedio</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MarketingContenido;