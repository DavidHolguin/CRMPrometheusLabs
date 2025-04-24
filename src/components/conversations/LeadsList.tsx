import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SortDesc, ArrowDown, ArrowUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LeadCardModern } from "./LeadCardModern";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

interface LeadsListProps {
  isLoading: boolean;
  groupedConversations: any[];
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string) => void;
  canales: any[];
  user?: any;
  initialFilters?: {
    sortOrder?: SortOrder;
  };
  onFilterChange?: (filters: {
    sortOrder: SortOrder;
  }) => void;
  onSearch?: (query: string) => void;
}

type SortOrder = 'date_desc' | 'date_asc' | 'score_desc' | 'score_asc' | 'messages_desc' | 'messages_asc' | 'unread_desc';

const LeadsList = ({
  isLoading,
  groupedConversations,
  selectedLeadId,
  setSelectedLeadId,
  canales,
  user,
  initialFilters,
  onFilterChange,
  onSearch
}: LeadsListProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialFilters?.sortOrder || 'date_desc');
  const [leadsData, setLeadsData] = useState<any[]>([]);
  const [isLoadingLeadsData, setIsLoadingLeadsData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Llamar a onFilterChange solo cuando cambie sortOrder
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        sortOrder
      });
    }
  }, [sortOrder, onFilterChange]);

  // Cargar datos de leads directamente desde vista_leads_detalle_empresa
  useEffect(() => {
    const fetchLeadsData = async () => {
      // Usar companyId (que viene del campo empresa_id en profiles)
      const empresaId = user?.companyId || user?.empresa_id;
      
      // Log para depuración
      console.log("Datos de usuario:", {
        userId: user?.id,
        companyId: user?.companyId,
        empresa_id: user?.empresa_id,
        empresaId: empresaId
      });
      
      if (!empresaId) {
        console.error("No se encontró ID de empresa para el usuario. Detalles:", user);
        setError("No se encontró ID de empresa para el usuario. Puede ser necesario cerrar sesión y volver a iniciar.");
        setIsLoadingLeadsData(false);
        return;
      }
      
      try {
        setIsLoadingLeadsData(true);
        setError(null);
        
        console.log(`Consultando vista_leads_detalle_empresa para empresa ${empresaId}`);
        
        const { data, error } = await supabase
          .from('vista_leads_detalle_empresa')
          .select('*')
          .eq('empresa_id', empresaId)
          .order('ultima_interaccion', { ascending: false })
          .limit(50); // Limitar resultados para mejor rendimiento
          
        if (error) {
          console.error('Error fetching leads data:', error);
          setError(`Error al cargar los datos: ${error.message}`);
          setIsLoadingLeadsData(false);
          return;
        }
        
        console.log(`Obtenidos ${data?.length || 0} leads de la vista`);
        
        if (!data || data.length === 0) {
          console.log("No se encontraron datos de leads");
          setLeadsData([]);
          setIsLoadingLeadsData(false);
          return;
        }
        
        // Agrupar conversaciones por lead_id para manejar múltiples conversaciones por lead
        const leadsMap = new Map();
        
        data.forEach(lead => {
          if (!leadsMap.has(lead.lead_id)) {
            leadsMap.set(lead.lead_id, {
              ...lead,
              conversations: []
            });
          }
          
          // Agregar conversación al lead
          if (lead.conversacion_id) {
            const leadData = leadsMap.get(lead.lead_id);
            leadData.conversations.push({
              id: lead.conversacion_id,
              ultimo_mensaje: lead.conversacion_ultimo_mensaje,
              canal_id: lead.canal_id
            });
          }
        });
        
        const processedLeadsData = Array.from(leadsMap.values());
        console.log(`Procesados ${processedLeadsData.length} leads únicos`);
        
        setLeadsData(processedLeadsData);
      } catch (error: any) {
        console.error('Error loading leads data:', error);
        setError(`Error al procesar los datos: ${error.message || 'Error desconocido'}`);
      } finally {
        setIsLoadingLeadsData(false);
      }
    };
    
    fetchLeadsData();
  }, [user]);

  const getSortOrderLabel = () => {
    switch(sortOrder) {
      case 'date_desc': return 'Más recientes primero';
      case 'date_asc': return 'Más antiguos primero';
      case 'score_desc': return 'Mayor score primero';
      case 'score_asc': return 'Menor score primero';
      case 'messages_desc': return 'Más mensajes primero';
      case 'messages_asc': return 'Menos mensajes primero';
      case 'unread_desc': return 'No leídos primero';
      default: return 'Más recientes primero';
    }
  };

  const processedLeads = leadsData
    .filter(lead => {
      const leadName = `${lead.nombre_lead || ''} ${lead.apellido_lead || ''}`.toLowerCase();
      const matchesSearch = searchTerm ? leadName.includes(searchTerm.toLowerCase()) : true;
      
      return matchesSearch;
    })
    .sort((a, b) => {
      switch(sortOrder) {
        case 'date_desc':
          return new Date(b.ultima_interaccion).getTime() - new Date(a.ultima_interaccion).getTime();
        case 'date_asc':
          return new Date(a.ultima_interaccion).getTime() - new Date(b.ultima_interaccion).getTime();
        case 'score_desc':
          return (b.lead_score || 0) - (a.lead_score || 0);
        case 'score_asc':
          return (a.lead_score || 0) - (b.lead_score || 0);
        case 'messages_desc':
          // Para simplificar, asumimos que el número de mensajes no está disponible en la vista
          return 0;
        case 'messages_asc':
          // Para simplificar, asumimos que el número de mensajes no está disponible en la vista
          return 0;
        case 'unread_desc':
          // Para simplificar, asumimos que los mensajes no leídos no están disponibles en la vista
          return 0;
        default:
          return new Date(b.ultima_interaccion).getTime() - new Date(a.ultima_interaccion).getTime();
      }
    });

  return (
    <div className="w-100 border-r flex flex-col h-full">
      <div className="p-4 border-b bg-card/50 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar lead..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (onSearch) onSearch(e.target.value);
              }}
              className="pl-8"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                title="Ordenar"
              >
                <SortDesc className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => setSortOrder('date_desc')}
              >
                <ArrowDown className="h-4 w-4 mr-2" />
                Más recientes primero
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortOrder('date_asc')}
              >
                <ArrowUp className="h-4 w-4 mr-2" />
                Más antiguos primero
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setSortOrder('score_desc')}
              >
                <ArrowDown className="h-4 w-4 mr-2" />
                Mayor score primero
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortOrder('score_asc')}
              >
                <ArrowUp className="h-4 w-4 mr-2" />
                Menor score primero
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setSortOrder('messages_desc')}
              >
                <ArrowDown className="h-4 w-4 mr-2" />
                Más mensajes primero
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortOrder('messages_asc')}
              >
                <ArrowUp className="h-4 w-4 mr-2" />
                Menos mensajes primero
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setSortOrder('unread_desc')}
              >
                <ArrowDown className="h-4 w-4 mr-2" />
                No leídos primero
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
       
      </div>

      <ScrollArea className="flex-1">
        {isLoadingLeadsData || isLoading ? (
          <div className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-primary rounded-full border-t-transparent" />
              <p className="text-muted-foreground">Cargando conversaciones...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-destructive">Error: {error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => {
                setIsLoadingLeadsData(true);
                setError(null);
                // Intentar cargar los datos nuevamente
                const fetchData = async () => {
                  try {
                    const { data, error } = await supabase
                      .from('vista_leads_detalle_empresa')
                      .select('*')
                      .eq('empresa_id', user?.empresa_id || '')
                      .order('ultima_interaccion', { ascending: false })
                      .limit(50);
                      
                    if (error) throw error;
                    
                    const leadsMap = new Map();
                    data?.forEach(lead => {
                      if (!leadsMap.has(lead.lead_id)) {
                        leadsMap.set(lead.lead_id, { ...lead, conversations: [] });
                      }
                      if (lead.conversacion_id) {
                        leadsMap.get(lead.lead_id).conversations.push({
                          id: lead.conversacion_id,
                          ultimo_mensaje: lead.conversacion_ultimo_mensaje,
                          canal_id: lead.canal_id
                        });
                      }
                    });
                    setLeadsData(Array.from(leadsMap.values()));
                  } catch (err: any) {
                    setError(`Error al reintentar: ${err.message || 'Error desconocido'}`);
                  } finally {
                    setIsLoadingLeadsData(false);
                  }
                };
                fetchData();
              }}
            >
              Reintentar
            </Button>
          </div>
        ) : processedLeads.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-muted-foreground">No hay conversaciones que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div className="py-2">
            {processedLeads.map((lead) => {
              const leadData = {
                lead_id: lead.lead_id,
                lead_nombre: lead.nombre_lead,
                lead_apellido: lead.apellido_lead,
                lead_score: lead.lead_score,
                ultima_actualizacion: lead.ultima_interaccion,
                total_mensajes_sin_leer: 0, // No disponible en la vista, podría añadirse
                ultimo_mensaje_contenido: lead.ultimo_mensaje_contenido,
                temperatura_actual: lead.lead_score >= 70 ? 'Hot' : (lead.lead_score >= 40 ? 'Warm' : 'Cold'),
                
                // Información del canal
                canal_id: lead.canal_id,
                canal_nombre: lead.canal_nombre,
                canal_logo: lead.canal_logo,
                canal_color: lead.canal_color,
                
                // Información del agente asignado
                asignado_a: lead.asignado_a,
                nombre_asignado: lead.nombre_asignado,
                avatar_asignado: lead.avatar_asignado,
                
                conversations: lead.conversations || [{
                  id: lead.conversacion_id,
                  ultimo_mensaje: lead.conversacion_ultimo_mensaje
                }],
                lead: {
                  id: lead.lead_id,
                  asignado_a: lead.asignado_a
                }
              };
              
              return (
                <LeadCardModern 
                  key={lead.lead_id}
                  lead={leadData}
                  canales={canales}
                  isSelected={selectedLeadId === lead.lead_id}
                  onClick={() => {
                    setSelectedLeadId(lead.lead_id);
                    if (lead.conversacion_id) {
                      navigate(`/dashboard/conversations/${lead.conversacion_id}`);
                    }
                  }}
                />
              );
            })}
          </div>
        )}
      </ScrollArea>

      <div className="p-2 border-t text-xs text-muted-foreground text-center">
        {processedLeads.length} 
        {processedLeads.length === 1 ? ' lead encontrado' : ' leads encontrados'}
      </div>
    </div>
  );
};

export default LeadsList;