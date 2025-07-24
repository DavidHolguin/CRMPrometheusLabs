import { useState, useMemo, useRef } from "react";
import { AgenteCard } from "@/components/agentes/AgenteCard";
import { AgenteEditDialog } from "@/components/agentes/AgenteEditDialog";
import { AgenteDetailDrawer } from "@/components/agentes/AgenteDetailDrawer";
import { useAgentes, Agente } from "@/hooks/useAgentes";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Label,
  Tooltip,
} from "recharts";
import {
  Search,
  Filter,
  UserPlus,
  Grid3x3,
  List,
  TrendingUp,
  Copy,
  Check,
  Clipboard,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function AdminAgentes() {
  const { user } = useAuth();
  const { agentes, isLoading, isUploading, createAgente, updateAgente, resetPassword } = useAgentes();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [activeView, setActiveView] = useState<"grid" | "list">("grid");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedAgente, setSelectedAgente] = useState<Agente | null>(null);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [isWelcomeDialogOpen, setIsWelcomeDialogOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const filteredAgentes = useMemo(() => {
    return agentes.filter((agente) => {
      const matchesQuery =
        searchQuery === "" ||
        agente.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agente.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole =
        selectedRole === "all" ||
        agente.role === selectedRole;

      return matchesQuery && matchesRole;
    });
  }, [agentes, searchQuery, selectedRole]);

  // Datos para el gráfico circular de distribución de roles
  const roleDistribution = useMemo(() => {
    const roleCounts: Record<string, number> = {
      admin: 0,
      admin_empresa: 0,
      agente: 0,
    };

    agentes.forEach((agente) => {
      roleCounts[agente.role as keyof typeof roleCounts]++;
    });

    return [
      { name: "Administradores", value: roleCounts.admin, color: "#f43f5e" },
      { name: "Admin Empresa", value: roleCounts.admin_empresa, color: "#f59e0b" },
      { name: "Agentes", value: roleCounts.agente, color: "#6366f1" },
    ];
  }, [agentes]);

  // Datos para el gráfico circular de estado de actividad
  const statusDistribution = useMemo(() => {
    let activeCount = 0;
    let inactiveCount = 0;

    agentes.forEach((agente) => {
      if (agente.is_active) {
        activeCount++;
      } else {
        inactiveCount++;
      }
    });

    return [
      { name: "Activos", value: activeCount, color: "#10b981" },
      { name: "Inactivos", value: inactiveCount, color: "#6b7280" },
    ];
  }, [agentes]);

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setTimeout(() => {
      setSelectedAgente(null);
    }, 200);
  };

  const handleOpenEdit = (agente?: Agente) => {
    setSelectedAgente(agente || null);
    setIsEditDialogOpen(true);
  };

  const handleDetailOpen = (agente: Agente) => {
    setSelectedAgente(agente);
    setIsDetailOpen(true);
  };

  const handleSaveAgente = async (values: any, avatar?: File | null) => {
    try {
      if (selectedAgente) {
        // Actualizar agente existente
        await updateAgente.mutateAsync({
          ...values,
          avatar,
        });
        toast.success("Agente actualizado correctamente");
        setIsEditDialogOpen(false);
      } else {
        // Crear nuevo agente
        const nuevoAgente = await createAgente.mutateAsync({
          ...values,
          avatar,
        });
        toast.success("Agente creado correctamente");
        setIsEditDialogOpen(false);
        
        // Generar mensaje de bienvenida
        generateWelcomeMessage(values);
        setIsWelcomeDialogOpen(true);
      }
    } catch (error) {
      console.error("Error al guardar el agente:", error);
      toast.error("Error al guardar el agente");
    }
  };

  const generateWelcomeMessage = (agente: any) => {
    const roleName = {
      admin: "Administrador",
      admin_empresa: "Administrador de Empresa", 
      agente: "Agente"
    }[agente.role] || "Usuario";
    
    const message = `# ¡Bienvenido/a al equipo de Prometeo!

**¡Hola ${agente.full_name}!** 🎉

Nos complace darte la bienvenida a nuestra plataforma. Tu cuenta ha sido creada exitosamente y ya puedes comenzar a utilizar todas las funcionalidades que tenemos disponibles para ti.

## Datos de acceso

- **Correo electrónico:** ${agente.email}
- **Contraseña:** ${agente.password}
- **Rol:** ${roleName}

## Pasos para comenzar:

1. Inicia sesión en la plataforma con tus credenciales
2. Completa tu perfil con tu información profesional
3. Explora las funcionalidades disponibles según tu rol
4. Si tienes alguna duda, consulta nuestra documentación o contacta a soporte

¡Esperamos que tengas una excelente experiencia con nosotros!

*El equipo de Prometeo*
`;

    setWelcomeMessage(message);
  };

  const copyToClipboard = () => {
    if (textAreaRef.current) {
      textAreaRef.current.select();
      document.execCommand('copy');
      setHasCopied(true);
      toast.success("Mensaje copiado al portapapeles");
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  const handleActivate = async (id: string, active: boolean) => {
    try {
      await updateAgente.mutateAsync({ id, is_active: active });
      toast.success(
        active
          ? "Cuenta de agente activada correctamente"
          : "Cuenta de agente desactivada correctamente"
      );
    } catch (error) {
      console.error("Error al cambiar el estado del agente:", error);
      toast.error("Error al cambiar el estado del agente");
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await resetPassword.mutateAsync(email);
    } catch (error) {
      console.error("Error al resetear la contraseña:", error);
      toast.error("Error al enviar el correo de restablecimiento");
    }
  };

  return (
    <div className="px-6  py-6 space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Agentes Humanos</h2>
          <p className="text-muted-foreground">
            Gestiona los usuarios con acceso a la plataforma
          </p>
        </div>
        <Button onClick={() => handleOpenEdit()}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo agente
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de usuarios
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {agentes.filter(a => a.is_active).length} activos ·{" "}
              {agentes.filter(a => !a.is_active).length} inactivos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Distribución por roles
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="h-[100px] w-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={roleDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={40}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter className="pt-0 pb-2 flex justify-center">
            <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-xs">
              {roleDistribution.map((entry, index) => (
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
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Estado de las cuentas
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
                    <Label
                      content={({ viewBox }) => {
                        const totalCount = agentes.length;
                        const activeCount = statusDistribution[0].value;
                        const percentage = totalCount
                          ? Math.round((activeCount / totalCount) * 100)
                          : 0;

                        if (
                          viewBox &&
                          "cx" in viewBox &&
                          "cy" in viewBox
                        ) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                className="text-xl font-bold fill-current"
                                x={viewBox.cx}
                                y={viewBox.cy}
                              >
                                {percentage}%
                              </tspan>
                            </text>
                          );
                        }
                        return null;
                      }}
                    />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter className="pt-0 pb-2 flex justify-center">
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
          </CardFooter>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[280px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar agentes..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={selectedRole}
            onValueChange={setSelectedRole}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Filtrar por rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              <SelectItem value="admin">Administradores</SelectItem>
              <SelectItem value="admin_empresa">Admin Empresa</SelectItem>
              <SelectItem value="agente">Agentes</SelectItem>
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
          <div className="animate-pulse text-muted-foreground">Cargando agentes...</div>
        </div>
      ) : filteredAgentes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <UserPlus className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
          <h3 className="text-lg font-medium">No se encontraron agentes</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery || selectedRole !== "all"
              ? "Prueba a cambiar los filtros de búsqueda"
              : "Comienza creando un nuevo agente"}
          </p>
          {(searchQuery || selectedRole !== "all") && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                setSelectedRole("all");
              }}
            >
              Limpiar filtros
            </Button>
          )}
          {!searchQuery && selectedRole === "all" && (
            <Button className="mt-4" onClick={() => handleOpenEdit()}>
              <UserPlus className="mr-2 h-4 w-4" />
              Crear nuevo agente
            </Button>
          )}
        </div>
      ) : (
        <>
          {activeView === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredAgentes.map((agente) => (
                <div key={agente.id} onClick={() => handleDetailOpen(agente)}>
                  <AgenteCard
                    agente={agente}
                    onEdit={(a) => {
                      handleOpenEdit(a);
                      // Prevenir que se abra el drawer al editar
                      event?.stopPropagation();
                    }}
                    onActivate={handleActivate}
                    onResetPassword={handleResetPassword}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden md:table-cell">Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="hidden lg:table-cell">Último Acceso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgentes.map((agente) => (
                    <AgenteCard
                      key={agente.id}
                      agente={agente}
                      onEdit={handleOpenEdit}
                      onActivate={handleActivate}
                      onResetPassword={handleResetPassword}
                      variant="row"
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      <AgenteEditDialog
        agente={selectedAgente || undefined}
        open={isEditDialogOpen}
        onOpenChange={handleEditDialogClose}
        onSave={handleSaveAgente}
        isLoading={createAgente.isPending || updateAgente.isPending || isUploading}
      />

      <AgenteDetailDrawer
        agente={selectedAgente}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onEdit={handleOpenEdit}
      />

      {/* Diálogo de Mensaje de Bienvenida */}
      <Dialog open={isWelcomeDialogOpen} onOpenChange={setIsWelcomeDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Mensaje de Bienvenida</DialogTitle>
            <DialogDescription>
              Copia este mensaje para enviarlo al nuevo agente con sus credenciales de acceso.
            </DialogDescription>
          </DialogHeader>
          
          <div className="border rounded-md p-4 relative bg-muted/50">
            <Textarea
              ref={textAreaRef}
              value={welcomeMessage}
              readOnly
              className="min-h-[300px] font-mono text-sm"
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2"
              onClick={copyToClipboard}
            >
              {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="sr-only">Copiar al portapapeles</span>
            </Button>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={copyToClipboard}
              className="w-full sm:w-auto"
            >
              {hasCopied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copiado
                </>
              ) : (
                <>
                  <Clipboard className="mr-2 h-4 w-4" />
                  Copiar mensaje
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}