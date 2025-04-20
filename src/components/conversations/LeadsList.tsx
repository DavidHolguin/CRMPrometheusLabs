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
  onFilterChange
}: LeadsListProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialFilters?.sortOrder || 'date_desc');
  const [fullLeadData, setFullLeadData] = useState<Record<string, any>>({});

  // Llamar a onFilterChange solo cuando cambie sortOrder
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        sortOrder
      });
    }
  }, [sortOrder, onFilterChange]);

  useEffect(() => {
    const fetchLeadCompleteData = async () => {
      if (groupedConversations.length === 0) return;
      
      try {
        const leadIds = groupedConversations.map(group => group.lead_id);
        
        const { data, error } = await supabase
          .from('vista_leads_completa')
          .select('*')
          .in('lead_id', leadIds);
          
        if (error) {
          console.error('Error fetching complete lead data:', error);
          return;
        }
        
        const leadsMap: Record<string, any> = {};
        data?.forEach(lead => {
          leadsMap[lead.lead_id] = lead;
        });
        
        setFullLeadData(leadsMap);
      } catch (error) {
        console.error('Error loading complete lead data:', error);
      }
    };
    
    fetchLeadCompleteData();
  }, [groupedConversations]);

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

  const processedConversations = groupedConversations
    .filter(group => {
      const leadName = `${group.lead_nombre || ''} ${group.lead_apellido || ''}`.toLowerCase();
      const matchesSearch = searchTerm ? leadName.includes(searchTerm.toLowerCase()) : true;
      
      return matchesSearch;
    })
    .sort((a, b) => {
      switch(sortOrder) {
        case 'date_desc':
          return new Date(b.ultima_actualizacion).getTime() - new Date(a.ultima_actualizacion).getTime();
        case 'date_asc':
          return new Date(a.ultima_actualizacion).getTime() - new Date(b.ultima_actualizacion).getTime();
        case 'score_desc':
          return (b.lead_score || 0) - (a.lead_score || 0);
        case 'score_asc':
          return (a.lead_score || 0) - (b.lead_score || 0);
        case 'messages_desc':
          return (b.conversations.reduce((acc: number, conv: any) => acc + (conv.message_count || 0), 0)) - 
                 (a.conversations.reduce((acc: number, conv: any) => acc + (conv.message_count || 0), 0));
        case 'messages_asc':
          return (a.conversations.reduce((acc: number, conv: any) => acc + (conv.message_count || 0), 0)) - 
                 (b.conversations.reduce((acc: number, conv: any) => acc + (conv.message_count || 0), 0));
        case 'unread_desc':
          return (b.total_mensajes_sin_leer || 0) - (a.total_mensajes_sin_leer || 0);
        default:
          return new Date(b.ultima_actualizacion).getTime() - new Date(a.ultima_actualizacion).getTime();
      }
    });

  return (
    <div className="w-80 border-r flex flex-col h-full">
      <div className="p-4 border-b bg-card/50 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar lead..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
        
        <div className="text-xs text-muted-foreground">
          Ordenando por: {getSortOrderLabel()}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-primary rounded-full border-t-transparent" />
              <p className="text-muted-foreground">Cargando conversaciones...</p>
            </div>
          </div>
        ) : processedConversations.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-muted-foreground">No hay conversaciones que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div className="py-2">
            {processedConversations.map((group) => {
              const completeLeadData = fullLeadData[group.lead_id] || {};
              
              const leadData = {
                lead_id: group.lead_id,
                lead_nombre: group.lead_nombre,
                lead_apellido: group.lead_apellido,
                lead_score: group.lead_score,
                ultima_actualizacion: group.ultima_actualizacion,
                total_mensajes_sin_leer: group.total_mensajes_sin_leer,
                ultimo_mensaje: group.ultimo_mensaje,
                temperatura_actual: completeLeadData?.temperatura_actual || 
                                   group.temperatura_actual ||
                                   (group.lead_score >= 70 ? 'Hot' : 
                                   (group.lead_score >= 40 ? 'Warm' : 'Cold')),
                canal_origen: completeLeadData?.canal_id || group.canal_origen || group.conversations[0]?.canal_id,
                conversations: group.conversations,
                lead: group.lead
              };
              
              return (
                <LeadCardModern 
                  key={group.lead_id}
                  lead={leadData}
                  canales={canales}
                  isSelected={selectedLeadId === group.lead_id}
                  onClick={() => {
                    setSelectedLeadId(group.lead_id);
                    if (group.conversations.length > 0) {
                      navigate(`/dashboard/conversations/${group.conversations[0].id}`);
                    }
                  }}
                />
              );
            })}
          </div>
        )}
      </ScrollArea>

      <div className="p-2 border-t text-xs text-muted-foreground text-center">
        {processedConversations.length} 
        {processedConversations.length === 1 ? ' lead encontrado' : ' leads encontrados'}
      </div>
    </div>
  );
};

export default LeadsList;