
import { Lead } from "@/hooks/useLeads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, PlusCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LeadPersonalDataTabProps {
  lead: Lead;
}

export function LeadPersonalDataTab({ lead }: LeadPersonalDataTabProps) {
  // Datos personales estructurados del lead
  const personalData = {
    "Información Básica": [
      { label: "Nombre", value: lead.nombre || "No especificado" },
      { label: "Apellido", value: lead.apellido || "No especificado" },
      { label: "Email", value: lead.email || "No especificado" },
      { label: "Teléfono", value: lead.telefono || "No especificado" },
    ],
    "Ubicación": [
      { label: "Dirección", value: lead.direccion || "No especificado" },
      { label: "Ciudad", value: lead.ciudad || "No especificado" },
      { label: "País", value: lead.pais || "No especificado" },
    ],
    "Datos Adicionales": Object.entries(lead.datos_adicionales || {}).map(([key, value]) => ({
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      value: value?.toString() || "No especificado",
      customField: true
    }))
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Datos Personales</CardTitle>
        <Button size="sm" variant="outline" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="text-xs">Añadir campo</span>
        </Button>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={["personal", "location"]}>
          <AccordionItem value="personal" className="border-b">
            <AccordionTrigger className="text-sm font-medium py-2">
              Información Básica
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-1">
                {personalData["Información Básica"].map((item, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2">
                    <div className="text-sm text-muted-foreground">{item.label}:</div>
                    <div className="text-sm">{item.value}</div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="location" className="border-b">
            <AccordionTrigger className="text-sm font-medium py-2">
              Ubicación
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-1">
                {personalData["Ubicación"].map((item, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2">
                    <div className="text-sm text-muted-foreground">{item.label}:</div>
                    <div className="text-sm">{item.value}</div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="additional" className={cn(
            !personalData["Datos Adicionales"].length && "hidden"
          )}>
            <AccordionTrigger className="text-sm font-medium py-2">
              Campos Personalizados
              {personalData["Datos Adicionales"].length > 0 && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {personalData["Datos Adicionales"].length}
                </Badge>
              )}
            </AccordionTrigger>
            <AccordionContent>
              {personalData["Datos Adicionales"].length > 0 ? (
                <div className="space-y-3 pt-1">
                  {personalData["Datos Adicionales"].map((item, index) => (
                    <div key={index} className="grid grid-cols-2 gap-2">
                      <div className="text-sm text-muted-foreground">{item.label}:</div>
                      <div className="text-sm">{item.value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No hay campos personalizados
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <div className="mt-4 text-xs text-muted-foreground text-center">
          Utiliza el botón 'Añadir campo' para agregar información personalizada para este lead.
        </div>
      </CardContent>
    </Card>
  );
}
