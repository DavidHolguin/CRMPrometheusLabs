
import { Lead } from "@/hooks/useLeads";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageSquare, User, Star, ChevronDown, ChevronUp, Edit, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface LeadCardProps {
  lead: Lead;
  isDragging?: boolean;
}

export function LeadCard({ lead, isDragging }: LeadCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Setup form with default values from the lead
  const form = useForm({
    defaultValues: {
      nombre: lead.nombre || "",
      apellido: lead.apellido || "",
      email: lead.email || "",
      telefono: lead.telefono || "",
    }
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    try {
      return formatDistanceToNow(new Date(dateStr), { 
        addSuffix: true,
        locale: es
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Fecha inválida";
    }
  };

  // Normalize score to a range of 0-10 (assuming the original score might be in a different range)
  const normalizedScore = Math.min(10, Math.max(0, Math.round(lead.score / 10)));
  
  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-green-500 text-white";
    if (score >= 5) return "bg-yellow-500 text-white";
    if (score >= 3) return "bg-orange-500 text-white";
    return "bg-red-500 text-white";
  };

  const scoreColorClass = getScoreColor(normalizedScore);

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-200 mb-2 w-full cursor-move", 
        isDragging 
          ? "opacity-80 shadow-lg ring-2 ring-primary ring-opacity-50 scale-[1.02] border-dashed" 
          : "hover:shadow-md hover:border-primary/30",
        expanded && "shadow-md"
      )}
    >
      <CardHeader className="pb-2 pt-3">
        <div className="flex justify-between items-start">
          <div className="flex gap-2 items-center">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all",
              scoreColorClass
            )}>
              {normalizedScore}
            </div>
            <div>
              <h3 className="font-semibold">
                {lead.nombre} {lead.apellido}
              </h3>
              <p className="text-xs text-muted-foreground">
                {lead.email || lead.telefono || "Sin contacto"}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/dashboard/conversations/${lead.id}`;
              }}
            >
              <MessageSquare size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="pt-0 pb-4">
          <Tabs defaultValue="datos" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-2">
              <TabsTrigger value="datos">Datos y Progreso</TabsTrigger>
              <TabsTrigger value="mensajes">Mensajes</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
            </TabsList>
            <TabsContent value="datos" className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <h4 className="text-sm font-medium mb-2">Información personal</h4>
                  <Form {...form}>
                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="nombre"
                        render={({ field }) => (
                          <FormItem className="grid grid-cols-3 items-center gap-1">
                            <FormLabel className="text-xs">Nombre</FormLabel>
                            <FormControl>
                              <Input 
                                className="col-span-2 h-8 text-sm" 
                                placeholder="Nombre"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="apellido"
                        render={({ field }) => (
                          <FormItem className="grid grid-cols-3 items-center gap-1">
                            <FormLabel className="text-xs">Apellido</FormLabel>
                            <FormControl>
                              <Input 
                                className="col-span-2 h-8 text-sm" 
                                placeholder="Apellido"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="grid grid-cols-3 items-center gap-1">
                            <FormLabel className="text-xs">Email</FormLabel>
                            <FormControl>
                              <Input 
                                className="col-span-2 h-8 text-sm" 
                                placeholder="Email"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="telefono"
                        render={({ field }) => (
                          <FormItem className="grid grid-cols-3 items-center gap-1">
                            <FormLabel className="text-xs">Teléfono</FormLabel>
                            <FormControl>
                              <Input 
                                className="col-span-2 h-8 text-sm" 
                                placeholder="Teléfono"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </Form>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Progreso</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Etapa:</span>
                      <Badge style={{ backgroundColor: lead.stage_color }}>{lead.stage_name}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Puntuación:</span>
                      <span className="text-sm font-medium">{lead.score} puntos</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Mensajes:</span>
                      <span className="text-sm">{lead.message_count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Interacciones:</span>
                      <span className="text-sm">{lead.interaction_count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Origen:</span>
                      <span className="text-sm">{lead.canal_origen || "Desconocido"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Creado:</span>
                      <span className="text-sm">{formatDate(lead.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Etiquetas</h4>
                    <div className="flex flex-wrap gap-1">
                      {lead.tags && lead.tags.map(tag => (
                        <Badge 
                          key={tag.id} 
                          variant="outline" 
                          style={{ borderColor: tag.color, color: tag.color }}
                        >
                          {tag.nombre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit size={14} className="mr-1" />
                      Cambiar Etapa
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="mensajes">
              <div className="space-y-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={`/dashboard/conversations/${lead.id}`}>
                    <MessageSquare size={14} className="mr-1" />
                    Ver conversaciones
                  </a>
                </Button>
                
                <div className="text-sm">
                  <p>Último mensaje: {formatDate(lead.ultima_interaccion)}</p>
                  <p>Total mensajes: {lead.message_count}</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="historial">
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground flex items-center">
                  <Clock size={12} className="mr-1" />
                  Creado {formatDate(lead.created_at)}
                </div>
                <div className="text-xs text-muted-foreground flex items-center">
                  <Clock size={12} className="mr-1" />
                  Última interacción {formatDate(lead.ultima_interaccion)}
                </div>
                
                <p className="text-sm mt-4 text-muted-foreground">
                  Historial detallado de actividades disponible próximamente.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
}
