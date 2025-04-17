import { useState, useEffect } from "react";
import { Agente } from "@/hooks/useAgentes";
import { useAgenteStats } from "@/hooks/useAgenteStats";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import QRCode from "react-qr-code";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Edit,
  X,
  UserCheck,
  Calendar,
  TrendingUp,
  Loader2,
  Clock,
  ThumbsUp,
  Users,
  Check,
  Sparkles,
  Award,
  BrainCircuit,
  RefreshCw,
  Download,
  Shield,
  User,
  KeyRound,
  Copy,
  Timer,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CircularProgressbarWithChildren,
  buildStyles,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface AgenteDetailDrawerProps {
  agente: Agente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (agente: Agente) => void;
}

export function AgenteDetailDrawer({
  agente,
  open,
  onOpenChange,
  onEdit,
}: AgenteDetailDrawerProps) {
  const [tab, setTab] = useState<string>("info");
  const { user } = useAuth();
  const [empresaData, setEmpresaData] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [qrValue, setQrValue] = useState("");
  const [userData, setUserData] = useState<any>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);

  const {
    performanceMetrics,
    activityData,
    isLoading: isLoadingStats,
  } = useAgenteStats(agente?.id || null);

  const performanceData = performanceMetrics
    ? [
        {
          name: "Tiempo resp.",
          value: 100 - Math.min(100, performanceMetrics.tiempoRespuestaPromedio * 4),
        },
        { name: "Satisfacción", value: performanceMetrics.satisfaccionPromedio },
        { name: "Tasa conv.", value: performanceMetrics.tasaConversionLeads },
        { name: "Resolución", value: performanceMetrics.tasaResolucion },
      ]
    : [];

  const promedioRendimiento = performanceMetrics
    ? Math.round(
        (100 -
          Math.min(100, performanceMetrics.tiempoRespuestaPromedio * 4) +
          performanceMetrics.satisfaccionPromedio +
          performanceMetrics.tasaConversionLeads +
          performanceMetrics.tasaResolucion) /
          4
      )
    : 0;

  const chartActivityData =
    activityData?.map((item) => ({
      month: item.mes,
      conversaciones: item.conversaciones,
      mensajes: item.mensajesEnviados,
    })) || [];

  useEffect(() => {
    if (agente && agente.empresa_id) {
      fetchEmpresaData(agente.empresa_id);
      fetchUserData(agente.id);
    }
    
    if (agente) {
      // Generar URL para el código QR
      const domain = window.location.origin;
      setQrValue(`${domain}/profile/${agente.id}`);
    }
  }, [agente]);

  const fetchEmpresaData = async (empresaId: string) => {
    try {
      const { data, error } = await supabase
        .from("empresas")
        .select("*")
        .eq("id", empresaId)
        .single();
      
      if (error) throw error;
      
      setEmpresaData(data);
      if (data.logo_url) {
        setLogoUrl(data.logo_url);
      }
    } catch (error) {
      console.error("Error al cargar datos de la empresa:", error);
    }
  };

  const fetchUserData = async (userId: string) => {
    setIsLoadingUserData(true);
    try {
      // Intentamos obtener datos directamente desde la tabla profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      
      setUserData({
        ...profileData,
        last_sign_in_at: profileData?.last_sign_in || null
      });
      
      console.log("Datos de usuario cargados desde profiles:", profileData);
      
      // Solo intentamos usar la función RPC si estamos en modo desarrollo
      // Esto es temporal hasta que la función esté disponible en producción
      if (process.env.NODE_ENV === 'development') {
        try {
          const { data, error } = await supabase.rpc('get_user_auth_data', {
            user_id: userId
          });
          
          if (error) {
            console.warn("La función RPC get_user_auth_data no está disponible:", error);
          } else if (data) {
            console.log("Datos de usuario actualizados mediante RPC:", data);
            setUserData(data);
          }
        } catch (rpcError) {
          console.warn("Error al intentar usar la función RPC:", rpcError);
        }
      }
    } catch (error) {
      console.error("Error al cargar datos del usuario:", error);
    } finally {
      setIsLoadingUserData(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "NA";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-rose-500">Administrador</Badge>;
      case "admin_empresa":
        return <Badge className="bg-amber-500">Admin Empresa</Badge>;
      default:
        return <Badge variant="secondary">Agente</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    try {
      const date = new Date(dateString);
      return `${formatDistanceToNow(date, { addSuffix: true, locale: es })}`;
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const formatFullDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const chartConfig = {
    conversaciones: {
      label: "Conversaciones",
      color: "hsl(var(--chart-1))",
    },
    mensajes: {
      label: "Mensajes",
      color: "hsl(var(--chart-2))",
    },
  };
  
  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(message);
    }, (err) => {
      console.error('No se pudo copiar al portapapeles: ', err);
    });
  };

  const downloadQRCode = () => {
    const svg = document.getElementById("agent-qr-code");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `qr-${agente?.full_name.replace(/\s+/g, '-').toLowerCase()}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
    }
  };

  if (!agente) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full md:max-w-[700px] p-0 max-h-screen flex flex-col"
      >
        <SheetHeader className="sticky top-0 z-20 bg-background p-6 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={agente.avatar_url || undefined}
                  alt={agente.full_name}
                />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(agente.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-xl">{agente.full_name}</SheetTitle>
                <SheetDescription className="text-sm flex items-center gap-1">
                  {agente.email}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5"
                    onClick={() => copyToClipboard(agente.email, "Email copiado al portapapeles")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(agente)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <Tabs
          defaultValue="info"
          value={tab}
          onValueChange={setTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="grid grid-cols-2 ">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 overflow-auto">
            <div className="p-6">
              <TabsContent value="info" className="space-y-6 mt-0">
                <div className="grid gap-6">
                  {/* Estado de cuenta y último acceso */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Estado de cuenta
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          {agente.is_active ? (
                            <Badge
                              variant="outline"
                              className="text-green-500 border-green-500 bg-green-500/10"
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              Activo
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-rose-500 border-rose-500 bg-rose-500/10"
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              Inactivo
                            </Badge>
                          )}
                          {getRoleBadge(agente.role)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Último acceso
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        {isLoadingUserData ? (
                          <Skeleton className="h-5 w-36" />
                        ) : (
                          <span className="text-sm">
                            {userData?.last_sign_in_at 
                              ? formatDate(userData.last_sign_in_at) 
                              : formatDate(agente.last_sign_in)}
                          </span>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Información completa */}
                  <Card className="overflow-hidden">
                    <CardHeader className="bg-muted/50 pb-2">
                      <CardTitle className="text-md flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Información personal
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-8">
                          <div className="min-w-[120px] text-sm text-muted-foreground">Nombre completo</div>
                          <div className="text-sm font-medium">{agente.full_name}</div>
                        </div>
                        <Separator />
                        
                        <div className="flex items-start gap-8">
                          <div className="min-w-[120px] text-sm text-muted-foreground">Email</div>
                          <div className="text-sm font-medium flex items-center gap-1">
                            {agente.email}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-5 w-5"
                              onClick={() => copyToClipboard(agente.email, "Email copiado al portapapeles")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <Separator />
                        
                        <div className="flex items-start gap-8">
                          <div className="min-w-[120px] text-sm text-muted-foreground">Rol</div>
                          <div className="text-sm font-medium">
                            {agente.role === "admin" && "Administrador"}
                            {agente.role === "admin_empresa" && "Admin Empresa"}
                            {agente.role === "agente" && "Agente"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Información de cuenta */}
                  <Card className="overflow-hidden">
                    <CardHeader className="bg-muted/50 pb-2">
                      <CardTitle className="text-md flex items-center">
                        <Shield className="h-4 w-4 mr-2" />
                        Información de cuenta
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
                          <div className="min-w-[120px] text-sm text-muted-foreground">Empresa</div>
                          <div className="text-sm font-medium">
                            {empresaData ? (
                              <div className="flex items-center gap-2">
                                {empresaData.logo_url && (
                                  <img 
                                    src={empresaData.logo_url} 
                                    alt="Logo" 
                                    className="h-5 w-5 rounded-sm object-contain"
                                  />
                                )}
                                {empresaData.nombre}
                              </div>
                            ) : (
                              <Skeleton className="h-5 w-32" />
                            )}
                          </div>
                        </div>
                        <Separator />
                        
                        <div className="flex items-start gap-8">
                          <div className="min-w-[120px] text-sm text-muted-foreground">Estado onboarding</div>
                          <div className="text-sm font-medium">
                            {agente.onboarding_completed ? (
                              <Badge variant="outline" className="bg-green-500/10 border-green-500/20 text-green-500">
                                <Check className="h-3 w-3 mr-1" /> Completado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-500/10 border-amber-500/20 text-amber-500">
                                Pendiente
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Separator />
                        
                        <div className="flex items-start gap-8">
                          <div className="min-w-[120px] text-sm text-muted-foreground">Creación</div>
                          <div className="text-sm font-medium">{formatFullDate(agente.created_at)}</div>
                        </div>
                        <Separator />
                        
                        <div className="flex items-start gap-8">
                          <div className="min-w-[120px] text-sm text-muted-foreground">Último acceso</div>
                          <div className="text-sm font-medium">
                            {isLoadingUserData ? (
                              <Skeleton className="h-5 w-32" />
                            ) : (
                              userData?.last_sign_in_at 
                                ? formatFullDate(userData.last_sign_in_at) 
                                : formatFullDate(agente.last_sign_in)
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Código QR */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md flex items-center gap-2">
                        <KeyRound className="h-4 w-4" /> 
                        Código QR de acceso
                      </CardTitle>
                      <CardDescription>
                        Utiliza este código para acceder rápidamente al perfil del agente
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center pt-2">
                      <div className="relative bg-white p-4 rounded-lg mb-4">
                        {logoUrl && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <div className="bg-white p-[10px] rounded-md">
                              <img 
                                src={logoUrl} 
                                alt="Logo" 
                                className="h-12 w-12 object-contain"
                              />
                            </div>
                          </div>
                        )}
                        <QRCode
                          id="agent-qr-code"
                          value={qrValue}
                          size={200}
                          level={"M"}
                          // includeMargin={true}
                          style={{ maxWidth: "100%", width: "200px" }}
                          bgColor="#FFFFFF"
                          fgColor="#000000"
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={downloadQRCode}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Descargar QR
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="stats" className="space-y-6 mt-0">
                {isLoadingStats ? (
                  <div className="space-y-6">
                    <div className="flex justify-center items-center h-[300px]">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                    <Card>
                      <CardHeader>
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-[250px] w-full" />
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <>
                    {/* Indicador de rendimiento principal */}
                    <Card className="border-none shadow-md">
                      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xl font-bold">
                          Rendimiento General
                        </CardTitle>
                        <Award className="h-5 w-5 text-amber-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-6">
                          <div className="col-span-1 flex justify-center items-center">
                            <div style={{ width: 120, height: 120 }}>
                              <CircularProgressbarWithChildren
                                value={promedioRendimiento}
                                strokeWidth={8}
                                styles={buildStyles({
                                  pathColor: `hsl(var(--primary))`,
                                  trailColor: "hsl(var(--muted))",
                                })}
                              >
                                <div className="flex flex-col items-center justify-center">
                                  <span className="text-2xl font-bold">
                                    {promedioRendimiento}%
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Desempeño
                                  </span>
                                </div>
                              </CircularProgressbarWithChildren>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-2">
                                {/* Indicadores detallados */}
                                <div className="flex items-center gap-2 border rounded-lg p-2">
                                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Timer className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      Tiempo resp.
                                    </p>
                                    <p className="text-sm font-medium">
                                      {performanceMetrics?.tiempoRespuestaPromedio.toFixed(
                                        1
                                      )}{" "}
                                      min
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 border rounded-lg p-2">
                                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <ThumbsUp className="h-4 w-4 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      Satisfacción
                                    </p>
                                    <p className="text-sm font-medium">
                                      {performanceMetrics?.satisfaccionPromedio.toFixed(
                                        0
                                      )}
                                      %
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 border rounded-lg p-2">
                                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                    <Users className="h-4 w-4 text-purple-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      Tasa conv.
                                    </p>
                                    <p className="text-sm font-medium">
                                      {performanceMetrics?.tasaConversionLeads.toFixed(
                                        0
                                      )}
                                      %
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 border rounded-lg p-2">
                                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                                    <Check className="h-4 w-4 text-amber-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      Resolución
                                    </p>
                                    <p className="text-sm font-medium">
                                      {performanceMetrics?.tasaResolucion.toFixed(
                                        0
                                      )}
                                      %
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <TrendingUp className="h-4 w-4 inline mr-1" />
                                {promedioRendimiento > 75
                                  ? "Excelente rendimiento"
                                  : promedioRendimiento > 50
                                  ? "Buen rendimiento"
                                  : "Necesita mejorar rendimiento"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Actividad mensual mejorada */}
                    <Card className="border-none shadow-md">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-bold">
                          <BrainCircuit className="h-5 w-5 text-purple-500" />
                          Actividad Mensual
                        </CardTitle>
                        <CardDescription>
                          Conversaciones y mensajes en los últimos 6 meses
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer
                          config={chartConfig}
                          className="aspect-video h-[250px]"
                        >
                          <AreaChart
                            data={chartActivityData}
                            margin={{
                              top: 10,
                              right: 10,
                              left: 0,
                              bottom: 0,
                            }}
                          >
                            <defs>
                              <linearGradient
                                id="colorConversaciones"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="hsl(var(--primary))"
                                  stopOpacity={0.3}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="hsl(var(--primary))"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                              <linearGradient
                                id="colorMensajes"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="hsl(var(--secondary))"
                                  stopOpacity={0.3}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="hsl(var(--secondary))"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              vertical={false}
                              strokeDasharray="3 3"
                              stroke="hsl(var(--muted))"
                            />
                            <XAxis
                              dataKey="month"
                              tickLine={false}
                              axisLine={false}
                              tickMargin={8}
                              tickFormatter={(value) => value.slice(0, 3)}
                            />
                            <YAxis tickLine={false} axisLine={false} />
                            <ChartTooltip
                              content={<ChartTooltipContent indicator="line" />}
                            />
                            <Area
                              type="monotone"
                              dataKey="conversaciones"
                              stroke="hsl(var(--primary))"
                              fillOpacity={1}
                              fill="url(#colorConversaciones)"
                            />
                            <Area
                              type="monotone"
                              dataKey="mensajes"
                              stroke="hsl(var(--secondary))"
                              fillOpacity={1}
                              fill="url(#colorMensajes)"
                            />
                          </AreaChart>
                        </ChartContainer>
                        <div className="mt-4 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-primary"></div>
                            <span className="text-sm">Conversaciones</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-secondary"></div>
                            <span className="text-sm">Mensajes</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-medium">
                              {chartActivityData &&
                                chartActivityData.length > 0 &&
                                `Total: ${chartActivityData.reduce(
                                  (sum, item) => sum + item.conversaciones,
                                  0
                                )} conv.`}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Mensaje de funcionalidad en desarrollo */}
                    <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="bg-blue-100 dark:bg-blue-900/50 rounded-full p-3">
                            <RefreshCw className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-medium text-lg">Más estadísticas pronto</h3>
                            <p className="text-muted-foreground">
                              Estamos trabajando en nuevas métricas y visualizaciones para ayudarte a entender mejor el rendimiento de tus agentes.
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                              ¡Próximamente disponibles!
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}