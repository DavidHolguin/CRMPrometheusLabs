import { useState } from "react";
import { AgenteIA } from "@/hooks/useAgentesIA";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Bot,
  Brain,
  Calendar,
  Check,
  Copy,
  Edit,
  FolderTree,
  History,
  Info,
  MessageSquare,
  PenTool,
  Power,
  PowerOff,
  RefreshCw,
  Settings,
  Shield,
  Timer,
  TimerReset,
  Trash2,
  Zap,
} from "lucide-react";

interface AgenteIADetailDrawerProps {
  agente: AgenteIA | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (agente: AgenteIA) => void;
  onActivate: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}

export function AgenteIADetailDrawer({
  agente,
  open,
  onOpenChange,
  onEdit,
  onActivate,
  onDelete,
}: AgenteIADetailDrawerProps) {
  const [activeTab, setActiveTab] = useState("general");

  if (!agente) return null;

  const getInitials = (name: string) => {
    if (!name) return "AI";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d MMM yyyy, HH:mm", { locale: es });
    } catch (e) {
      return "Fecha no disponible";
    }
  };

  const formatFullDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
    } catch (e) {
      return "Fecha no disponible";
    }
  };

  const copyToClipboard = (text: string, message?: string) => {
    navigator.clipboard.writeText(text);
    // Aquí se podría agregar un toast para indicar que se ha copiado al portapapeles
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case "asistente":
        return (
          <Badge className="bg-blue-500">
            <Bot className="h-3 w-3 mr-1" />
            Asistente
          </Badge>
        );
      case "analista":
        return (
          <Badge className="bg-purple-500">
            <Brain className="h-3 w-3 mr-1" />
            Analista
          </Badge>
        );
      case "automatizacion":
        return (
          <Badge className="bg-amber-500">
            <Settings className="h-3 w-3 mr-1" />
            Automatización
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Bot className="h-3 w-3 mr-1" />
            {tipo || "Sin tipo"}
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "activo":
        return (
          <Badge variant="outline" className="bg-green-500/10 border-green-500/20 text-green-500">
            <Check className="h-3 w-3 mr-1" />
            Activo
          </Badge>
        );
      case "entrenamiento":
        return (
          <Badge variant="outline" className="bg-amber-500/10 border-amber-500/20 text-amber-500">
            <Brain className="h-3 w-3 mr-1" />
            En entrenamiento
          </Badge>
        );
      case "inactivo":
        return (
          <Badge variant="outline" className="bg-slate-500/10 border-slate-500/20 text-slate-500">
            <PowerOff className="h-3 w-3 mr-1" />
            Inactivo
          </Badge>
        );
      default:
        return <Badge variant="outline">{status || "Sin estado"}</Badge>;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md lg:max-w-lg xl:max-w-xl">
        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <SheetHeader className="pb-4">
            <div className="flex items-center">
              <Avatar className="h-12 w-12 mr-4">
                <AvatarImage src={agente.avatar_url || undefined} alt={agente.nombre} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(agente.nombre)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <SheetTitle className="flex items-center gap-2">
                  {agente.nombre}
                  {getTipoBadge(agente.tipo)}
                </SheetTitle>
                <SheetDescription className="line-clamp-1">
                  {agente.descripcion || "Sin descripción"}
                </SheetDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <Button variant="outline" onClick={() => onEdit(agente)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button 
                variant={agente.is_active ? "destructive" : "default"}
                onClick={() => onActivate(agente.id, !agente.is_active)}
              >
                {agente.is_active ? (
                  <>
                    <PowerOff className="h-4 w-4 mr-2" />
                    Desactivar
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4 mr-2" />
                    Activar
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  onOpenChange(false);
                  setTimeout(() => onDelete(agente.id), 200);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <TabsList className="mt-4 grid grid-cols-3">
              <TabsTrigger value="general">
                <Info className="h-4 w-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger value="configuracion">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </TabsTrigger>
              <TabsTrigger value="historial">
                <History className="h-4 w-4 mr-2" />
                Historial
              </TabsTrigger>
            </TabsList>
          </SheetHeader>

          <ScrollArea className="flex-1 -mx-6">
            <div className="px-6">
              <TabsContent value="general" className="space-y-4 pt-2 pb-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Estado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {getStatusBadge(agente.status)}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Nivel de autonomía</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center">
                      <div className="flex items-center space-x-1 mr-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-1.5 w-4 rounded-full ${
                              i < agente.nivel_autonomia ? "bg-primary" : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm">{agente.nivel_autonomia}/5</span>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Creación</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        {formatDate(agente.created_at)}
                      </span>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Última actualización
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center">
                      <TimerReset className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(agente.updated_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </CardContent>
                  </Card>
                </div>

                <Card className="overflow-hidden">
                  <CardHeader className="bg-muted/50 pb-2">
                    <CardTitle className="text-md flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Información detallada
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-8">
                        <div className="min-w-[120px] text-sm text-muted-foreground">ID</div>
                        <div className="text-sm font-medium flex items-center gap-1 break-all">
                          {agente.id}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 shrink-0"
                            onClick={() => copyToClipboard(agente.id, "ID copiado al portapapeles")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Separator />

                      <div className="flex items-start gap-8">
                        <div className="min-w-[120px] text-sm text-muted-foreground">Nombre</div>
                        <div className="text-sm font-medium">{agente.nombre}</div>
                      </div>
                      <Separator />

                      <div className="flex items-start gap-8">
                        <div className="min-w-[120px] text-sm text-muted-foreground">Descripción</div>
                        <div className="text-sm font-medium">{agente.descripcion || "Sin descripción"}</div>
                      </div>
                      <Separator />

                      <div className="flex items-start gap-8">
                        <div className="min-w-[120px] text-sm text-muted-foreground">Tipo</div>
                        <div className="text-sm font-medium">
                          {getTipoBadge(agente.tipo)}
                        </div>
                      </div>
                      <Separator />

                      <div className="flex items-start gap-8">
                        <div className="min-w-[120px] text-sm text-muted-foreground">Estado</div>
                        <div className="text-sm font-medium">
                          {getStatusBadge(agente.status)}
                        </div>
                      </div>
                      <Separator />

                      <div className="flex items-start gap-8">
                        <div className="min-w-[120px] text-sm text-muted-foreground">Empresa ID</div>
                        <div className="text-sm font-medium break-all">{agente.empresa_id}</div>
                      </div>
                      <Separator />

                      <div className="flex items-start gap-8">
                        <div className="min-w-[120px] text-sm text-muted-foreground">Creación</div>
                        <div className="text-sm font-medium">{formatFullDate(agente.created_at)}</div>
                      </div>
                      <Separator />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Especialidad y capacidades</CardTitle>
                    <CardDescription>
                      Áreas en las que este agente ha sido entrenado y puede asistir
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {agente.especialidad && Object.keys(agente.especialidad).length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(agente.especialidad).map(([key, value], index) => (
                            <Badge key={index} variant="outline" className="px-3 py-1">
                              <span className="font-medium text-primary">{key}</span>: {String(value)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm italic">
                        Este agente no tiene especialidades definidas aún.
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="bg-muted/50 text-xs text-muted-foreground">
                    <Info className="h-3 w-3 mr-1" /> 
                    Las especialidades definen las áreas en las que este agente está mejor capacitado para actuar.
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="configuracion" className="space-y-4 pt-2 pb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración de idioma y comunicación</CardTitle>
                    <CardDescription>
                      Preferencias de idioma y estilo comunicativo del agente
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Idioma principal</h4>
                        <p className="text-sm text-muted-foreground">Español</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Modo de comunicación</h4>
                        <p className="text-sm text-muted-foreground">Conversacional</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Personalidad</h4>
                        <p className="text-sm text-muted-foreground">Amable, Profesional, Directo</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/50 text-xs text-muted-foreground">
                    <Info className="h-3 w-3 mr-1" /> 
                    Esta configuración afecta a cómo el agente se comunica con los usuarios.
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Modelo y configuración LLM</CardTitle>
                    <CardDescription>
                      Modelo de lenguaje y parámetros utilizados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {agente.llm_configuracion_id ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">ID de configuración LLM</h4>
                          <p className="text-sm break-all">{agente.llm_configuracion_id}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Ver configuración avanzada
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground mb-2">No hay configuración LLM asociada</p>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Configurar LLM
                        </Button>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="bg-muted/50 text-xs text-muted-foreground">
                    <Info className="h-3 w-3 mr-1" /> 
                    La configuración LLM determina el comportamiento del modelo de lenguaje del agente.
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Fuentes de conocimiento</CardTitle>
                    <CardDescription>
                      Bases de conocimiento utilizadas por este agente
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <FolderTree className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground mb-2">No hay fuentes de conocimiento configuradas</p>
                      <Button variant="outline" size="sm">
                        <PenTool className="h-4 w-4 mr-2" />
                        Agregar fuentes de conocimiento
                      </Button>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/50 text-xs text-muted-foreground">
                    <Info className="h-3 w-3 mr-1" /> 
                    Las fuentes de conocimiento mejoran las capacidades del agente con información específica.
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="historial" className="pt-2 pb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Historial de actividad</CardTitle>
                    <CardDescription>
                      Registro de actividades y cambios del agente
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="relative pl-6 border-l border-border">
                        <div className="absolute w-3 h-3 bg-primary rounded-full -left-[6.5px] top-1"></div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Agente creado</p>
                          <p className="text-xs text-muted-foreground">{formatFullDate(agente.created_at)}</p>
                        </div>
                      </div>
                      
                      <div className="relative pl-6 border-l border-border">
                        <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[6.5px] top-1"></div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Última actualización</p>
                          <p className="text-xs text-muted-foreground">{formatFullDate(agente.updated_at)}</p>
                        </div>
                      </div>
                      
                      <div className="relative pl-6">
                        <div className="absolute w-3 h-3 border-2 border-muted-foreground rounded-full -left-[6.5px] top-1"></div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Historial completo</p>
                          <p className="text-xs text-muted-foreground">Próximamente disponible</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Métricas de actividad</CardTitle>
                    <CardDescription>
                      Estadísticas de uso y rendimiento del agente
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                      <RefreshCw className="h-12 w-12 text-muted-foreground" />
                      <p className="font-medium">Métricas en desarrollo</p>
                      <p className="text-sm text-muted-foreground">
                        Las métricas detalladas de actividad estarán disponibles en una próxima actualización
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}