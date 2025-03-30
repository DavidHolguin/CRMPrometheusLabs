
import { Lead } from "@/hooks/useLeads";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface LeadDataTabProps {
  lead: Lead;
  formatDate: (dateStr: string | null) => string;
}

export function LeadDataTab({ lead, formatDate }: LeadDataTabProps) {
  // Setup form with default values from the lead
  const form = useForm({
    defaultValues: {
      nombre: lead.nombre || "",
      apellido: lead.apellido || "",
      email: lead.email || "",
      telefono: lead.telefono || "",
    }
  });
  
  return (
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
  );
}
