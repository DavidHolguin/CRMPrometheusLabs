// filepath: c:\Users\Juliana\Videos\laboratorio prometeo\crmPrometeoFront\src\components\conversations\LeadCardModern.tsx
import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CanalIcon } from "@/components/canales/CanalIcon";
import { MessageSquare } from "lucide-react";

interface LeadCardModernProps {
  lead: {
    lead_id: string;
    lead_nombre?: string;
    lead_apellido?: string;
    lead_score?: number;
    ultima_actualizacion: string;
    total_mensajes_sin_leer: number;
    ultimo_mensaje?: string;
    temperatura_actual?: string; // Cambiado de temperatura a temperatura_actual para usar el campo de vista_leads_completa
    canal_origen?: string; // ID del canal de origen
    conversations: Array<{
      id: string;
      canal_id: string;
      canal_identificador?: string;
      message_count?: number;
    }>;
    lead?: {
      asignado_a?: string;
      agente_nombre?: string;
      tags?: Array<{
        id: string;
        nombre: string;
        color: string;
      }>;
    };
  };
  canales: Array<{
    id: string;
    nombre: string;
    tipo: string;
    color?: string;
  }>;
  isSelected: boolean;
  onClick: () => void;
}

export const LeadCardModern = ({
  lead,
  canales,
  isSelected,
  onClick,
}: LeadCardModernProps) => {
  const leadName = `${lead.lead_nombre || ''} ${lead.lead_apellido || ''}`.trim() || 'Sin nombre';
  const hasUnread = lead.total_mensajes_sin_leer > 0;
  const latestConversation = lead.conversations[0];
  const totalMessages = lead.conversations.reduce((acc, conv) => acc + (conv.message_count || 0), 0);
  
  // Obtener las iniciales del nombre del lead
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Obtener información del canal
  const getChannelInfo = (canalId: string | null) => {
    if (!canalId) return { name: "N/A", type: "default", color: "#6b7280" };
    const canal = canales.find(c => c.id === canalId);
    return {
      name: canal ? canal.nombre : "N/A",
      type: canal ? canal.tipo.toLowerCase() : "default",
      color: canal?.color || "#6b7280"
    };
  };

  // Formatear la fecha del último mensaje
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Verificar si el lead tiene temperatura HOT para mostrar el gradiente
  const isHot = lead.temperatura_actual === 'Hot';
  
  // Determinar el color del score basado en su valor
  const getScoreColor = () => {
    if (!lead.lead_score && lead.lead_score !== 0) return { bg: 'bg-gray-500/10', text: 'text-gray-400' };
    
    if (lead.lead_score >= 70) {
      return { bg: 'bg-emerald-950', text: 'text-emerald-400', fill: 'fill-emerald-400' };
    } else if (lead.lead_score >= 40) {
      return { bg: 'bg-amber-950', text: 'text-amber-400', fill: 'fill-amber-400' };
    } else {
      return { bg: 'bg-slate-800/80', text: 'text-slate-300', fill: 'fill-slate-300' };
    }
  };

  const canalOrigen = lead.canal_origen ? getChannelInfo(lead.canal_origen) : 
                      latestConversation?.canal_id ? getChannelInfo(latestConversation.canal_id) : 
                      getChannelInfo(null);
  const scoreColors = getScoreColor();
  
  return (
    <div className="group relative w-full mb-2 px-1 transition-all duration-150 hover:-translate-y-0.5">
      <div
        className={cn(
          "relative overflow-hidden rounded-xl bg-slate-950 shadow-2xl transition-all duration-300",
          isSelected ? "ring-1 ring-primary" : "hover:shadow-emerald-500/10",
          hasUnread ? "border-l-2 border-primary" : ""
        )}
      >
        {/* Mostrar el gradiente solo si temperatura_actual es HOT */}
        {isHot && (
          <>
            <div
              className="absolute -left-16 -top-16 h-32 w-32 rounded-full bg-gradient-to-br from-red-500/20 to-orange-400/10 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-70"
            ></div>
            <div
              className="absolute -right-16 -bottom-16 h-32 w-32 rounded-full bg-gradient-to-br from-teal-500/20 to-emerald-500/0 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-70"
            ></div>
          </>
        )}

        <div className="relative p-4 cursor-pointer" onClick={onClick}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div
                  className={cn(
                    "absolute -inset-1 rounded-xl bg-gradient-to-r opacity-30 blur-sm transition-opacity duration-300 group-hover:opacity-40",
                    isHot ? "from-red-500 to-orange-500" :
                    lead.temperatura_actual === 'Warm' ? "from-amber-500 to-yellow-500" :
                    lead.temperatura_actual === 'Cold' ? "from-blue-500 to-cyan-500" :
                    "from-emerald-500 to-teal-500"
                  )}
                ></div>
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900">
                  <span className={cn(
                    "text-lg font-medium",
                    isHot ? "text-red-500" :
                    lead.temperatura_actual === 'Warm' ? "text-amber-500" :
                    lead.temperatura_actual === 'Cold' ? "text-blue-500" :
                    "text-emerald-500"
                  )}>
                    {getInitials(leadName)}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-white">{leadName}</h3>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {/* Score - Ahora muestra texto "Score: X%" sin icono */}
                  <div className={`flex items-center rounded-md px-1.5 py-0.5 ${scoreColors.bg}`}>
                    <span className={`text-xs font-medium ${scoreColors.text}`}>
                      Score: {lead.lead_score || 0}%
                    </span>
                  </div>
                  
                  {/* Canal Badge con logo más prominente */}
                  <div className="flex items-center rounded-md px-1.5 py-0.5 bg-slate-800/80">
                    <CanalIcon 
                      tipo={canalOrigen.type} 
                      size={14} 
                      className="text-slate-300" 
                    />
                    <span className="text-xs text-slate-300 ml-1">{canalOrigen.name}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              {/* Fecha con resaltado si hay mensajes sin leer */}
              <span className={cn(
                "text-xs",
                hasUnread ? "text-emerald-400 font-medium" : "text-slate-400"
              )}>
                {formatDate(lead.ultima_actualizacion)}
              </span>
              
              {/* Total de mensajes - resaltado si hay sin leer */}
              <div className="flex items-center">
                <MessageSquare className={cn(
                  "h-3 w-3 mr-1",
                  hasUnread ? "text-emerald-400" : "text-slate-400"
                )} />
                <span className={cn(
                  "text-xs",
                  hasUnread ? "text-emerald-400 font-medium" : "text-slate-400"
                )}>
                  {totalMessages}
                </span>
              </div>
              
              {/* Badge de mensajes sin leer */}
              {hasUnread && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-500 mt-1"
                >
                  <span className="h-1 w-1 rounded-full bg-emerald-500"></span>
                  {lead.total_mensajes_sin_leer}
                </span>
              )}
            </div>
          </div>

          {/* Tags del lead */}
          {lead.lead?.tags && lead.lead.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {lead.lead.tags.map(tag => (
                <div 
                  key={tag.id}
                  className="flex items-center rounded-md p-1.5"
                  style={{ 
                    backgroundColor: `${tag.color}20`,
                  }}
                >
                  <svg viewBox="0 -0.5 25 25" height="14px" width="14px" className="mr-1.5" xmlns="http://www.w3.org/2000/svg">
                    <path 
                      strokeLinejoin="round" 
                      strokeLinecap="round" 
                      strokeWidth="1.5" 
                      d="M18.507 19.853V6.034C18.5116 5.49905 18.3034 4.98422 17.9283 4.60277C17.5532 4.22131 17.042 4.00449 16.507 4H8.50705C7.9721 4.00449 7.46085 4.22131 7.08577 4.60277C6.7107 4.98422 6.50252 5.49905 6.50705 6.034V19.853C6.45951 20.252 6.65541 20.6407 7.00441 20.8399C7.35342 21.039 7.78773 21.0099 8.10705 20.766L11.907 17.485C12.2496 17.1758 12.7705 17.1758 13.113 17.485L16.9071 20.767C17.2265 21.0111 17.6611 21.0402 18.0102 20.8407C18.3593 20.6413 18.5551 20.2522 18.507 19.853Z" 
                      clipRule="evenodd" 
                      fillRule="evenodd"
                      style={{ fill: tag.color }}
                    />
                  </svg>
                  <span 
                    className="text-xs font-medium"
                    style={{ color: tag.color }}
                  >
                    {tag.nombre}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadCardModern;