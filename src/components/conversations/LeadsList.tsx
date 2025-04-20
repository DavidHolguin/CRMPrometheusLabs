import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, MessageSquare, X, SortDesc, ArrowDown, ArrowUp, ChevronDown, User, UserCheck, UserMinus, Hash } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CanalIcon } from "@/components/canales/CanalIcon";
import { LeadCardModern } from "./LeadCardModern";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface LeadsListProps {
  isLoading: boolean;
  groupedConversations: any[];
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string) => void;
  canales: any[];
  user?: any;
  initialFilters?: {
    showUnreadOnly?: boolean;
    assignmentFilter?: 'all' | 'assigned_to_me' | 'unassigned';
    selectedCanal?: string | null;
    selectedTags?: string[];
    sortOrder?: SortOrder;
  };
  onFilterChange?: (filters: {
    showUnreadOnly: boolean;
    assignmentFilter: 'all' | 'assigned_to_me' | 'unassigned';
    selectedCanal: string | null;
    selectedTags: string[];
    sortOrder: SortOrder;
  }) => void;
}

type SortOrder = 'date_desc' | 'date_asc' | 'score_desc' | 'score_asc' | 'messages_desc' | 'messages_asc' | 'unread_desc';
type FilterAssignment = 'all' | 'assigned_to_me' | 'unassigned';

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
  const [showUnreadOnly, setShowUnreadOnly] = useState(initialFilters?.showUnreadOnly || false);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialFilters?.sortOrder || 'date_desc');
  const [assignmentFilter, setAssignmentFilter] = useState<FilterAssignment>(initialFilters?.assignmentFilter || 'all');
  const [selectedCanal, setSelectedCanal] = useState<string | null>(initialFilters?.selectedCanal || null);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialFilters?.selectedTags || []);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [fullLeadData, setFullLeadData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        showUnreadOnly,
        assignmentFilter,
        selectedCanal,
        selectedTags,
        sortOrder
      });
    }
  }, [showUnreadOnly, assignmentFilter, selectedCanal, selectedTags, sortOrder, onFilterChange]);

  useEffect(() => {
    const fetchTags = async () => {
      if (!user?.companyId) return;
      
      try {
        const { data, error } = await supabase
          .from('lead_tags')
          .select('*')
          .eq('empresa_id', user.companyId)
          .order('nombre', { ascending: true });
          
        if (error) {
          console.error('Error fetching tags:', error);
          return;
        }
        
        setAvailableTags(data || []);
      } catch (error) {
        console.error('Error loading tags:', error);
      }
    };
    
    fetchTags();
  }, [user?.companyId]);

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

  const getAssignmentFilterLabel = () => {
    switch(assignmentFilter) {
      case 'assigned_to_me': return 'Asignados a mí';
      case 'unassigned': return 'Sin asignar';
      default: return 'Todos';
    }
  };

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
      if (assignmentFilter !== 'all' && process.env.NODE_ENV === 'development') {
        console.log("Filtrando lead:", {
          id: group.lead_id,
          nombre: group.lead_nombre,
          asignado_a: group.lead?.asignado_a,
          user_id: user?.id,
          matchesAssignment: assignmentFilter === 'assigned_to_me' ? 
            group.lead?.asignado_a === user?.id : 
            assignmentFilter === 'unassigned' ? 
              !group.lead?.asignado_a : true
        });
      }

      const leadName = `${group.lead_nombre || ''} ${group.lead_apellido || ''}`.toLowerCase();
      const matchesSearch = searchTerm ? leadName.includes(searchTerm.toLowerCase()) : true;
      
      const matchesUnread = showUnreadOnly ? group.total_mensajes_sin_leer > 0 : true;
      
      let matchesAssignment = true;
      if (assignmentFilter === 'assigned_to_me') {
        matchesAssignment = group.lead?.asignado_a === user?.id;
      } else if (assignmentFilter === 'unassigned') {
        matchesAssignment = !group.lead?.asignado_a;
      }
      
      const matchesCanal = selectedCanal ? 
        group.conversations.some((conv: any) => conv.canal_id === selectedCanal) || 
        group.canal_origen === selectedCanal : 
        true;
      
      const matchesTags = selectedTags.length > 0 ? 
        group.lead?.tags && group.lead.tags.some((tag: any) => selectedTags.includes(tag.id)) : 
        true;
      
      return matchesSearch && matchesUnread && matchesAssignment && matchesCanal && matchesTags;
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getChannelName = (canalId: string | null) => {
    if (!canalId) return "N/A";
    const canal = canales.find(c => c.id === canalId);
    return canal ? canal.nombre : "N/A";
  };

  const getChannelType = (canalId: string | null) => {
    if (!canalId) return "default";
    const canal = canales.find(c => c.id === canalId);
    return canal ? canal.tipo.toLowerCase() : "default";
  };

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
  
  const removeFilter = (type: string, value?: string) => {
    switch(type) {
      case 'unread':
        setShowUnreadOnly(false);
        break;
      case 'assignment':
        setAssignmentFilter('all');
        break;
      case 'canal':
        setSelectedCanal(null);
        break;
      case 'tag':
        if (value) {
          setSelectedTags(prev => prev.filter(id => id !== value));
        }
        break;
      default:
        break;
    }
  };

  const hasActiveFilters = showUnreadOnly || assignmentFilter !== 'all' || selectedCanal !== null || selectedTags.length > 0;
  
  const getTagName = (tagId: string) => {
    const tag = availableTags.find(t => t.id === tagId);
    return tag ? tag.nombre : 'Sin nombre';
  };
  
  const getTagColor = (tagId: string) => {
    const tag = availableTags.find(t => t.id === tagId);
    return tag ? tag.color : '#6b7280';
  };

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
          <DropdownMenu open={isFilterDropdownOpen} onOpenChange={setIsFilterDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant={hasActiveFilters ? "default" : "outline"}
                size="icon"
                title="Filtros"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
              
              <DropdownMenuGroup>
                <DropdownMenuItem 
                  onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                  className="flex items-center justify-between"
                >
                  <span>Solo no leídos</span>
                  {showUnreadOnly && <Badge variant="outline" className="ml-2 px-1 h-5">✓</Badge>}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>Asignación</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem 
                  onClick={() => setAssignmentFilter('all')}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Todos
                  </span>
                  {assignmentFilter === 'all' && <Badge variant="outline" className="ml-2 px-1 h-5">✓</Badge>}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setAssignmentFilter('assigned_to_me')}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Asignados a mí
                  </span>
                  {assignmentFilter === 'assigned_to_me' && <Badge variant="outline" className="ml-2 px-1 h-5">✓</Badge>}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setAssignmentFilter('unassigned')}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center">
                    <UserMinus className="h-4 w-4 mr-2" />
                    Sin asignar
                  </span>
                  {assignmentFilter === 'unassigned' && <Badge variant="outline" className="ml-2 px-1 h-5">✓</Badge>}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              
              {canales.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuLabel>Canal</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    {canales.map(canal => (
                      <DropdownMenuItem 
                        key={canal.id}
                        onClick={() => setSelectedCanal(selectedCanal === canal.id ? null : canal.id)}
                        className="flex items-center justify-between"
                      >
                        <span className="flex items-center truncate">
                          <CanalIcon tipo={canal.tipo.toLowerCase()} size={14} className="mr-2" />
                          <span className="truncate">{canal.nombre}</span>
                        </span>
                        {selectedCanal === canal.id && <Badge variant="outline" className="ml-2 px-1 h-5">✓</Badge>}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </>
              )}
              
              {availableTags.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuLabel>Etiquetas</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    {availableTags.map(tag => (
                      <DropdownMenuItem 
                        key={tag.id}
                        onClick={() => {
                          setSelectedTags(prev => 
                            prev.includes(tag.id) 
                              ? prev.filter(id => id !== tag.id)
                              : [...prev, tag.id]
                          );
                        }}
                        className="flex items-center justify-between"
                      >
                        <span className="flex items-center">
                          <div 
                            className="h-3 w-3 rounded-full mr-2" 
                            style={{ backgroundColor: tag.color || '#6b7280' }} 
                          />
                          <span className="truncate">{tag.nombre}</span>
                        </span>
                        {selectedTags.includes(tag.id) && <Badge variant="outline" className="ml-2 px-1 h-5">✓</Badge>}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem 
                  onClick={() => setSortOrder('date_desc')}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center">
                    <ArrowDown className="h-4 w-4 mr-2" />
                    Más recientes primero
                  </span>
                  {sortOrder === 'date_desc' && <Badge variant="outline" className="ml-2 px-1 h-5">✓</Badge>}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortOrder('date_asc')}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center">
                    <ArrowUp className="h-4 w-4 mr-2" />
                    Más antiguos primero
                  </span>
                  {sortOrder === 'date_asc' && <Badge variant="outline" className="ml-2 px-1 h-5">✓</Badge>}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortOrder('score_desc')}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center">
                    <ArrowDown className="h-4 w-4 mr-2" />
                    Mayor score primero
                  </span>
                  {sortOrder === 'score_desc' && <Badge variant="outline" className="ml-2 px-1 h-5">✓</Badge>}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortOrder('score_asc')}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center">
                    <ArrowUp className="h-4 w-4 mr-2" />
                    Menor score primero
                  </span>
                  {sortOrder === 'score_asc' && <Badge variant="outline" className="ml-2 px-1 h-5">✓</Badge>}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortOrder('messages_desc')}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center">
                    <ArrowDown className="h-4 w-4 mr-2" />
                    Más mensajes primero
                  </span>
                  {sortOrder === 'messages_desc' && <Badge variant="outline" className="ml-2 px-1 h-5">✓</Badge>}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortOrder('messages_asc')}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center">
                    <ArrowUp className="h-4 w-4 mr-2" />
                    Menos mensajes primero
                  </span>
                  {sortOrder === 'messages_asc' && <Badge variant="outline" className="ml-2 px-1 h-5">✓</Badge>}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortOrder('unread_desc')}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center">
                    <ArrowDown className="h-4 w-4 mr-2" />
                    No leídos primero
                  </span>
                  {sortOrder === 'unread_desc' && <Badge variant="outline" className="ml-2 px-1 h-5">✓</Badge>}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {showUnreadOnly && (
              <Badge variant="secondary" className="flex items-center gap-1 h-6 pr-1.5">
                <span>No leídos</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 p-0 hover:bg-transparent" 
                  onClick={() => removeFilter('unread')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            {assignmentFilter !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1 h-6 pr-1.5">
                <span>{getAssignmentFilterLabel()}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 p-0 hover:bg-transparent" 
                  onClick={() => removeFilter('assignment')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            {selectedCanal && (
              <Badge variant="secondary" className="flex items-center gap-1 h-6 pr-1.5">
                <span>{getChannelName(selectedCanal)}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 p-0 hover:bg-transparent" 
                  onClick={() => removeFilter('canal')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            {selectedTags.map(tagId => (
              <Badge 
                key={tagId}
                variant="secondary" 
                className="flex items-center gap-1 h-6 pr-1.5"
                style={{ backgroundColor: `${getTagColor(tagId)}30`, color: getTagColor(tagId) }}
              >
                <Hash className="h-3 w-3" />
                <span>{getTagName(tagId)}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 p-0 hover:bg-transparent" 
                  onClick={() => removeFilter('tag', tagId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
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
            <p className="text-muted-foreground">No hay conversaciones que coincidan con los filtros.</p>
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
        {hasActiveFilters && ' con los filtros aplicados'}
      </div>
    </div>
  );
};

export default LeadsList;