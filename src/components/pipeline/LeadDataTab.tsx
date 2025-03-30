
import { Lead } from "@/hooks/useLeads";
import { LeadScoreChart } from "./LeadScoreChart";
import { getScoreColorClass } from "./LeadScoreUtils";
import { badgeVariants } from "@/components/ui/badge";
import { Info, Mail, Phone, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadActivityChart } from "./LeadActivityChart";
import { LeadPersonalDataTab } from "./LeadPersonalDataTab";

interface LeadDataTabProps {
  lead: Lead;
  formatDate: (dateStr: string | null) => string;
}

export function LeadDataTab({ lead, formatDate }: LeadDataTabProps) {
  const email = lead.email;
  const phone = lead.telefono;
  const location = lead.ciudad || lead.pais;
  
  // Información básica del lead
  const contactInfo = [
    ...(email ? [{ 
      icon: <Mail className="h-4 w-4" />,
      label: "Email", 
      value: email,
      href: `mailto:${email}`,
    }] : []),
    ...(phone ? [{ 
      icon: <Phone className="h-4 w-4" />,
      label: "Teléfono", 
      value: phone,
      href: `tel:${phone}`,
    }] : []),
    ...(location ? [{ 
      icon: <MapPin className="h-4 w-4" />,
      label: "Ubicación", 
      value: location,
    }] : []),
  ];
  
  // Para la etapa actual del pipeline
  const stageBadge = (
    <div 
      className={cn(
        badgeVariants({ variant: "outline" }),
        "whitespace-nowrap border-2 py-1 px-3 font-medium text-xs",
        lead.stage_color ? "border-opacity-50" : ""
      )}
      style={{ 
        borderColor: lead.stage_color || undefined,
        backgroundColor: lead.stage_color ? `${lead.stage_color}15` : undefined
      }}
    >
      {lead.stage_name || "Sin etapa"}
    </div>
  );
  
  // Tags del lead
  const tags = lead.tags || [];
  
  // Usar el score normalizado del lead para la visualización
  const normalizedScore = lead.score || 0;
  
  return (
    <div className="space-y-6">
      {/* Información básica del Lead */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Datos de contacto */}
        <div className="rounded-lg border bg-card shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Información de contacto</h3>
          </div>
          
          <div className="space-y-3">
            {contactInfo.map((info, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="text-muted-foreground">
                  {info.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">{info.label}</span>
                  {info.href ? (
                    <a href={info.href} className="hover:underline">{info.value}</a>
                  ) : (
                    <span>{info.value}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Pipeline stage */}
          <div className="flex flex-col gap-1 mt-4 pt-3 border-t">
            <span className="text-xs text-muted-foreground">Etapa actual</span>
            <div className="flex items-center gap-2">
              {stageBadge}
            </div>
          </div>
          
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-col gap-1 mt-4 pt-3 border-t">
              <span className="text-xs text-muted-foreground">Etiquetas</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {tags.map((tag) => (
                  <span 
                    key={tag.id} 
                    className={cn(
                      badgeVariants({ variant: "outline" }),
                      "whitespace-nowrap text-xs"
                    )}
                    style={{ 
                      borderColor: tag.color || undefined,
                      backgroundColor: tag.color ? `${tag.color}15` : undefined
                    }}
                  >
                    {tag.nombre}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Score chart */}
        <LeadScoreChart 
          score={normalizedScore} 
          interactionCount={lead.interaction_count || 0}
          stageName={lead.stage_name || "Sin etapa"}
        />
      </div>
      
      {/* Tabs para separar diferentes métricas */}
      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="activity">Actividad</TabsTrigger>
          <TabsTrigger value="personalData">Datos Personales</TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity" className="mt-4">
          <LeadActivityChart leadId={lead.id} />
        </TabsContent>
        
        <TabsContent value="personalData" className="mt-4">
          <LeadPersonalDataTab lead={lead} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
