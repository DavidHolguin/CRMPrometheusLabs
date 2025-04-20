import { useState, useMemo, useRef } from "react";
import { useLeads, Lead } from "@/hooks/useLeads";
import { useAgentes } from "@/hooks/useAgentes";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Filter,
  Trash2,
  MoreVertical,
  UserPlus,
  AlertTriangle,
  AlertCircle,
  Users,
} from "lucide-react";

export default function AdminLeads() {
  const { user } = useAuth();
  const { data: leads = [], isLoading } = useLeads();
  const { agentes } = useAgentes();
  const queryClient = useQueryClient();

  // Estados para manejo de filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  
  // Estados para diálogos
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  
  // Estado para indicar operaciones en curso
  const [isProcessing, setIsProcessing] = useState(false);

  // Filtrado de leads basado en la búsqueda y filtros
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Filtro por texto (nombre, email, etc.)
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === "" || (
        (lead.nombre && lead.nombre.toLowerCase().includes(searchLower)) ||
        (lead.apellido && lead.apellido.toLowerCase().includes(searchLower)) ||
        (lead.email && lead.email.toLowerCase().includes(searchLower)) ||
        (lead.telefono && lead.telefono.toLowerCase().includes(searchLower)) ||
        (lead.canal_origen && lead.canal_origen.toLowerCase().includes(searchLower))
      );
      
      // Filtro por estado
      const matchesStatus = selectedStatus === "all" || 
        (selectedStatus === "assigned" && lead.asignado_a) ||
        (selectedStatus === "unassigned" && !lead.asignado_a);
      
      return matchesSearch && matchesStatus;
    });
  }, [leads, searchQuery, selectedStatus]);

  // Mutación para eliminar un lead
  const deleteLead = useMutation({
    mutationFn: async (leadId: string) => {
      setIsProcessing(true);
      
      try {
        // 1. Obtener conversaciones asociadas al lead
        const { data: conversaciones, error: convError } = await supabase
          .from("conversaciones")
          .select("id")
          .eq("lead_id", leadId);
          
        if (convError) throw convError;
        
        if (conversaciones && conversaciones.length > 0) {
          const conversacionIds = conversaciones.map(conv => conv.id);
          
          // 2. Obtener IDs de mensajes para eliminar evaluaciones relacionadas
          const { data: mensajes, error: mensajesQueryError } = await supabase
            .from("mensajes")
            .select("id")
            .in("conversacion_id", conversacionIds);
            
          if (mensajesQueryError) console.error("Error obteniendo IDs de mensajes:", mensajesQueryError);
          
          if (mensajes && mensajes.length > 0) {
            const mensajeIds = mensajes.map(msg => msg.id);
            
            // 3. Primero eliminar evaluaciones de los mensajes
            const { error: evalMensajesError } = await supabase
              .from("evaluaciones_llm")
              .delete()
              .in("mensaje_id", mensajeIds);
            
            if (evalMensajesError) console.error("Error eliminando evaluaciones de mensajes:", evalMensajesError);
            
            // 4. Eliminar evaluaciones de respuestas si existen
            const { error: evalRespuestasError } = await supabase
              .from("evaluaciones_respuestas")
              .delete()
              .in("mensaje_id", mensajeIds);
              
            if (evalRespuestasError) console.error("Error eliminando evaluaciones de respuestas:", evalRespuestasError);
          }
        }
        
        // 5. Eliminar interacciones del lead que referencian mensajes
        const { data: interacciones, error: interaccionesError } = await supabase
          .from("lead_interactions")
          .select("id")
          .eq("lead_id", leadId);
          
        if (interaccionesError) console.error("Error obteniendo interacciones:", interaccionesError);
        
        if (interacciones && interacciones.length > 0) {
          const { error: deleteInteraccionesError } = await supabase
            .from("lead_interactions")
            .delete()
            .eq("lead_id", leadId);
          
          if (deleteInteraccionesError) {
            console.error("Error eliminando interacciones del lead:", deleteInteraccionesError);
          }
        }
        
        // 6. Eliminar evaluaciones LLM directamente relacionadas con el lead
        const { error: evalLeadError } = await supabase
          .from("evaluaciones_llm")
          .delete()
          .eq("lead_id", leadId);
        
        if (evalLeadError) console.error("Error eliminando evaluaciones del lead:", evalLeadError);
        
        if (conversaciones && conversaciones.length > 0) {
          const conversacionIds = conversaciones.map(conv => conv.id);
          
          // 7. Eliminar mensajes de audio relacionados
          const { error: audioError } = await supabase
            .from("mensajes_audio")
            .delete()
            .in("conversacion_id", conversacionIds);
          
          if (audioError) console.error("Error eliminando mensajes de audio:", audioError);
          
          // 8. Eliminar mensajes de agentes
          const { error: mensajesAgentesError } = await supabase
            .from("mensajes_agentes")
            .delete()
            .in("conversacion_id", conversacionIds);
            
          if (mensajesAgentesError) console.error("Error eliminando mensajes de agentes:", mensajesAgentesError);
          
          // 9. Eliminar mensajes normales después de todas las dependencias
          const { error: mensajesError } = await supabase
            .from("mensajes")
            .delete()
            .in("conversacion_id", conversacionIds);
          
          if (mensajesError) {
            console.error("Error eliminando mensajes:", mensajesError);
            throw mensajesError;
          }
          
          // 10. Finalmente eliminar las conversaciones
          const { error: deleteConvError } = await supabase
            .from("conversaciones")
            .delete()
            .eq("lead_id", leadId);
          
          if (deleteConvError) throw deleteConvError;
        }
        
        // 11. Eliminar historial de etapas del lead
        const { error: stageHistoryError } = await supabase
          .from("lead_stage_history")
          .delete()
          .eq("lead_id", leadId);
        
        if (stageHistoryError) console.error("Error eliminando historial de etapas:", stageHistoryError);
        
        // 12. Eliminar historial del lead
        const { error: historyError } = await supabase
          .from("lead_history")
          .delete()
          .eq("lead_id", leadId);
        
        if (historyError) console.error("Error eliminando historial del lead:", historyError);
        
        // 13. Eliminar relaciones de etiquetas
        const { error: tagError } = await supabase
          .from("lead_tag_relation")
          .delete()
          .eq("lead_id", leadId);
        
        if (tagError) console.error("Error eliminando relaciones de etiquetas:", tagError);
        
        // 14. Eliminar comentarios del lead
        const { error: commentsError } = await supabase
          .from("lead_comments")
          .delete()
          .eq("lead_id", leadId);
        
        if (commentsError) console.error("Error eliminando comentarios:", commentsError);
        
        // 15. Eliminar historial de temperatura del lead
        const { error: tempHistoryError } = await supabase
          .from("lead_temperature_history")
          .delete()
          .eq("lead_id", leadId);
          
        if (tempHistoryError) console.error("Error eliminando historial de temperatura:", tempHistoryError);
        
        // 16. Eliminar tokens PII asociados al lead
        const { error: piiError } = await supabase
          .from("pii_tokens")
          .delete()
          .eq("lead_id", leadId);
        
        if (piiError) console.error("Error eliminando tokens PII:", piiError);
        
        // 17. Eliminar datos personales del lead
        const { error: personalDataError } = await supabase
          .from("lead_datos_personales")
          .delete()
          .eq("lead_id", leadId);
        
        if (personalDataError) console.error("Error eliminando datos personales:", personalDataError);
        
        // 18. Finalmente, eliminar el lead
        const { error: leadError } = await supabase
          .from("leads")
          .delete()
          .eq("id", leadId);
        
        if (leadError) throw leadError;
        
        return { success: true, leadId };
      } catch (error) {
        console.error("Error completo eliminando lead:", error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    onSuccess: () => {
      toast.success("Lead eliminado correctamente");
      setIsDeleteDialogOpen(false);
      
      // Actualizar la caché para reflejar los cambios
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error) => {
      console.error("Error eliminando lead:", error);
      toast.error("Error al eliminar el lead");
    }
  });

  // Mutación para asignar o reasignar un lead
  const assignLead = useMutation({
    mutationFn: async ({ leadId, agentId }: { leadId: string, agentId: string }) => {
      setIsProcessing(true);
      
      try {
        // Registrar el cambio en el historial si hay un usuario actual
        if (user?.id) {
          const { data: lead } = await supabase
            .from("leads")
            .select("asignado_a")
            .eq("id", leadId)
            .single();
          
          if (lead?.asignado_a !== undefined) {
            await supabase
              .from("lead_history")
              .insert({
                lead_id: leadId,
                campo: "asignado_a",
                valor_anterior: lead.asignado_a || null,
                valor_nuevo: agentId || null,
                usuario_id: user.id
              });
          }
        }
        
        // Actualizar la asignación del lead
        const { data, error } = await supabase
          .from("leads")
          .update({ 
            asignado_a: agentId || null,
            ultima_interaccion: new Date().toISOString() 
          })
          .eq("id", leadId)
          .select()
          .single();
          
        if (error) throw error;
        
        return data;
      } finally {
        setIsProcessing(false);
      }
    },
    onSuccess: () => {
      toast.success("Lead asignado correctamente");
      setIsAssignDialogOpen(false);
      
      // Actualizar la caché para reflejar los cambios
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error) => {
      console.error("Error asignando lead:", error);
      toast.error("Error al asignar el lead");
    }
  });

  const handleOpenDeleteDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDeleteDialogOpen(true);
  };

  const handleOpenAssignDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setSelectedAgentId(lead.asignado_a || "unassigned");
    setIsAssignDialogOpen(true);
  };

  // Función para obtener el color del canal o usar uno predeterminado
  const getChannelColor = (color?: string) => {
    return color || "#6E7681"; // Color gris por defecto si no hay color definido
  };

  const handleDelete = () => {
    if (selectedLead) {
      deleteLead.mutate(selectedLead.id);
    }
  };

  const handleAssign = () => {
    if (selectedLead) {
      // Si el valor es "unassigned", lo convertimos a null para la base de datos
      const finalAgentId = selectedAgentId === "unassigned" ? null : selectedAgentId;
      
      assignLead.mutate({
        leadId: selectedLead.id,
        agentId: finalAgentId || null
      });
    }
  };

  // Componente para formato de fecha
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  // Función para obtener las iniciales de un nombre
  const getInitials = (name?: string, lastName?: string) => {
    if (!name) return "?";
    const initial1 = name.charAt(0).toUpperCase();
    const initial2 = lastName ? lastName.charAt(0).toUpperCase() : "";
    return initial1 + initial2;
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Administración de Leads</h2>
          <p className="text-muted-foreground">
            Gestiona los leads registrados en la plataforma
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Leads
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {leads.filter(lead => lead.asignado_a).length} asignados ·{" "}
              {leads.filter(lead => !lead.asignado_a).length} sin asignar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Canales más comunes
            </CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {Array.from(new Set(leads.map(lead => lead.canal_origen)))
                .filter(Boolean)
                .slice(0, 4)
                .map((canal, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {canal}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Leads por agente
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-xs">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(
                  leads.reduce((acc: Record<string, number>, lead) => {
                    if (lead.asignado_a) {
                      acc[lead.asignado_a] = (acc[lead.asignado_a] || 0) + 1;
                    }
                    return acc;
                  }, {})
                )
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([agenteId, count]) => {
                    const agente = agentes.find(a => a.id === agenteId);
                    return (
                      <div key={agenteId} className="flex justify-between">
                        <span>{agente?.full_name || "Agente desconocido"}</span>
                        <span>{count} leads</span>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[280px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar leads..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={selectedStatus}
            onValueChange={setSelectedStatus}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los leads</SelectItem>
              <SelectItem value="assigned">Asignados</SelectItem>
              <SelectItem value="unassigned">Sin asignar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Cargando leads...</div>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
          <h3 className="text-lg font-medium">No se encontraron leads</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery || selectedStatus !== "all"
              ? "Prueba a cambiar los filtros de búsqueda"
              : "No hay leads registrados en la plataforma"}
          </p>
          {(searchQuery || selectedStatus !== "all") && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                setSelectedStatus("all");
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead className="hidden md:table-cell">Canal</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="hidden lg:table-cell">Creado</TableHead>
                <TableHead>Asignado a</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(lead.nombre, lead.apellido)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {lead.nombre} {lead.apellido || ''}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center">
                          {lead.telefono || lead.email || 'Sin contacto'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center space-x-2">
                      {lead.canal_logo_url ? (
                        <div className="h-8 w-8 rounded-full flex items-center justify-center overflow-hidden border-2" 
                             style={{borderColor: getChannelColor(lead.canal_color)}}>
                          <img src={lead.canal_logo_url} alt={lead.canal_nombre_detalle || lead.canal_origen} className="h-4 w-4 object-contain" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full flex items-center justify-center border-2" 
                             style={{borderColor: getChannelColor(lead.canal_color)}}>
                          <span className="text-[10px] text-gray-800 uppercase">{(lead.canal_tipo_detalle || lead.canal_origen || '?').charAt(0)}</span>
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-medium">{lead.canal_nombre_detalle || lead.canal_origen || 'Desconocido'}</div>
                        {lead.canal_descripcion && (
                          <div className="text-[10px] text-muted-foreground line-clamp-1">{lead.canal_descripcion}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={lead.score && lead.score > 50 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {lead.score || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs">
                    {formatDate(lead.lead_creado || lead.created_at)}
                  </TableCell>
                  <TableCell>
                    {lead.asignado_a ? (
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          {lead.agente_avatar ? (
                            <AvatarImage src={lead.agente_avatar} alt={lead.agente_nombre || 'Agente'} />
                          ) : null}
                          <AvatarFallback className="bg-green-100 text-green-800 text-xs">
                            {(lead.agente_nombre || 'AG').substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-xs font-medium line-clamp-1">
                            {lead.agente_nombre || 
                             agentes.find(a => a.id === lead.asignado_a)?.full_name || 
                             'Agente'}
                          </div>
                          {lead.agente_email && (
                            <div className="text-[10px] text-muted-foreground line-clamp-1">
                              {lead.agente_email}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-xs">
                        <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                        <span className="text-muted-foreground">Sin asignar</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Abrir menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleOpenAssignDialog(lead)}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Asignar agente
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleOpenDeleteDialog(lead)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar lead
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Diálogo de eliminación */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>Eliminar lead</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span>¿Estás seguro de que deseas eliminar el lead </span>
              <span className="font-semibold">{selectedLead?.nombre} {selectedLead?.apellido || ''}?</span>
              <p className="mt-2">Esta acción eliminará todos los datos asociados al lead, incluyendo conversaciones, mensajes, evaluaciones y otros registros relacionados. Esta acción no se puede deshacer.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-red-600 hover:bg-red-700"
              disabled={isProcessing}
            >
              {isProcessing ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de asignación */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar agente al lead</DialogTitle>
            <DialogDescription>
              Selecciona un agente para asignar o reasignar el lead {selectedLead?.nombre} {selectedLead?.apellido || ''}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Select
              value={selectedAgentId}
              onValueChange={setSelectedAgentId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un agente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Sin asignar</SelectItem>
                {agentes
                  .filter(agente => agente.is_active)
                  .map((agente) => (
                    <SelectItem key={agente.id} value={agente.id}>
                      {agente.full_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={isProcessing}
            >
              {isProcessing ? "Asignando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}