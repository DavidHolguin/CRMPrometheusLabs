
import { useState, useEffect } from "react";
import { Lead } from "@/hooks/useLeads";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface LeadHistoryTabProps {
  lead: Lead;
  formatDate: (dateStr: string | null) => string;
}

interface HistoryItem {
  id: string;
  campo: string;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  created_at: string;
  usuario_nombre: string;
}

export function LeadHistoryTab({ lead, formatDate }: LeadHistoryTabProps) {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (lead?.id) {
      fetchLeadHistory();
    }
  }, [lead?.id]);
  
  const fetchLeadHistory = async () => {
    setIsLoading(true);
    try {
      // Fetch lead history
      const { data, error } = await supabase
        .from("lead_history")
        .select("*")
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false });
        
      if (error) {
        throw error;
      }
      
      // Create history items with user data
      const historyWithUsers = await Promise.all(
        data.map(async (item) => {
          let userName = "Sistema";
          
          if (item.usuario_id) {
            // Get user profile
            const { data: userData } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", item.usuario_id)
              .single();
              
            if (userData) {
              userName = userData.full_name || "Usuario";
            }
          }
          
          return {
            ...item,
            usuario_nombre: userName
          };
        })
      );
      
      setHistoryItems(historyWithUsers);
    } catch (error) {
      console.error("Error fetching lead history:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to get human-readable field names
  const getFieldLabel = (field: string): string => {
    const fieldLabels: Record<string, string> = {
      nombre: "Nombre",
      apellido: "Apellido", 
      email: "Correo electrónico",
      telefono: "Teléfono",
      score: "Score",
      stage_id: "Etapa",
      asignado_a: "Asignado a",
      ciudad: "Ciudad",
      pais: "País",
      direccion: "Dirección"
    };
    
    return fieldLabels[field] || field;
  };
  
  return (
    <div className="space-y-2">
      <div className="flow-root">
        <ul className="space-y-4">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <li key={i} className="bg-card/50 border rounded-lg p-3">
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  </div>
                </li>
              ))}
            </>
          ) : historyItems.length === 0 ? (
            <li className="text-center py-6 text-muted-foreground">
              No hay historial de cambios registrados
            </li>
          ) : (
            historyItems.map((item) => (
              <li key={item.id} className="bg-card/50 border rounded-lg p-3">
                <div className="flex flex-col space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">
                      {getFieldLabel(item.campo)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1 text-sm">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Valor anterior:</p>
                      <div className="bg-muted/50 p-1.5 rounded text-xs mt-1">
                        {item.valor_anterior || <span className="text-muted-foreground italic">Sin valor</span>}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Valor nuevo:</p>
                      <div className="bg-muted/50 p-1.5 rounded text-xs mt-1">
                        {item.valor_nuevo || <span className="text-muted-foreground italic">Sin valor</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    Modificado por: <span className="font-medium">{item.usuario_nombre}</span>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
