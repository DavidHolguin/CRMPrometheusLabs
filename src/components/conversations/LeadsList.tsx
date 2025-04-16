import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, MessageSquare, X, SortDesc, ArrowDown, ArrowUp, ChevronDown, User, UserCheck, UserMinus, Hash } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CanalIcon } from "@/components/canales/CanalIcon";
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
}

type SortOrder = 'date_desc' | 'date_asc' | 'score_desc' | 'score_asc' | 'messages_desc' | 'messages_asc' | 'unread_desc';
type FilterAssignment = 'all' | 'assigned_to_me' | 'unassigned';

const LeadsList = ({
  isLoading,
  groupedConversations,
  selectedLeadId,
  setSelectedLeadId,
  canales
}: LeadsListProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('date_desc');
  const [assignmentFilter, setAssignmentFilter] = useState<FilterAssignment>('all');
  const [selectedCanal, setSelectedCanal] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Cargar etiquetas disponibles
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

  // Obtener texto descriptivo para el filtro de asignación
  const getAssignmentFilterLabel = () => {
    switch(assignmentFilter) {
      case 'assigned_to_me': return 'Asignados a mí';
      case 'unassigned': return 'Sin asignar';
      default: return 'Todos';
    }
  };

  // Obtener texto descriptivo para el orden
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

  // Filtrar y ordenar las conversaciones
  const processedConversations = groupedConversations
    .filter(group => {
      // Para depuración - verificar la estructura de los datos de cada lead
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

      // Filtro de búsqueda por nombre
      const leadName = `${group.lead_nombre || ''} ${group.lead_apellido || ''}`.toLowerCase();
      const matchesSearch = searchTerm ? leadName.includes(searchTerm.toLowerCase()) : true;
      
      // Filtro de mensajes no leídos
      const matchesUnread = showUnreadOnly ? group.total_mensajes_sin_leer > 0 : true;
      
      // Filtro de asignación - utilizando la propiedad lead para acceder a los datos de asignación
      let matchesAssignment = true;
      if (assignmentFilter === 'assigned_to_me') {
        matchesAssignment = group.lead?.asignado_a === user?.id;
      } else if (assignmentFilter === 'unassigned') {
        matchesAssignment = !group.lead?.asignado_a;
      }
      
      // Filtro de canal - verificando todos los canales de las conversaciones en el grupo
      const matchesCanal = selectedCanal ? 
        group.conversations.some((conv: any) => conv.canal_id === selectedCanal) : 
        true;
      
      // Filtro de etiquetas - verificando si tiene alguna de las etiquetas seleccionadas
      const matchesTags = selectedTags.length > 0 ? 
        group.lead?.tags && group.lead.tags.some((tag: any) => selectedTags.includes(tag.id)) : 
        true;
      
      return matchesSearch && matchesUnread && matchesAssignment && matchesCanal && matchesTags;
    })
    .sort((a, b) => {
      // Ordenar según el criterio seleccionado
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
  
  // Eliminar un filtro activo
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

  // Comprobar si hay algún filtro activo
  const hasActiveFilters = showUnreadOnly || assignmentFilter !== 'all' || selectedCanal !== null || selectedTags.length > 0;
  
  // Obtener el nombre de un tag por su ID
  const getTagName = (tagId: string) => {
    // Buscamos el tag correspondiente en el array de tags disponibles
    const tag = availableTags.find(t => t.id === tagId);
    // Si encontramos el tag, devolvemos su nombre, si no un valor por defecto
    return tag ? tag.nombre : 'Sin nombre';
  };
  
  // Obtener el color de un tag por su ID
  const getTagColor = (tagId: string) => {
    // Buscamos el tag correspondiente en el array de tags disponibles
    const tag = availableTags.find(t => t.id === tagId);
    // Si encontramos el tag, devolvemos su color, si no un color por defecto
    return tag ? tag.color : '#6b7280';
  };

  return (
    <div className="w-80 border-r flex flex-col h-full">
      <div className="p-4 border-b bg-card/50 space-y-3">
        {/* Buscador con filtro */}
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
              
              {/* Filtro de mensajes no leídos */}
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
              
              {/* Filtro de asignación */}
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
                  
                  {/* Filtro de canales */}
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
                  
                  {/* Filtro de etiquetas */}
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
              
              {/* Opciones de ordenación */}
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
        
        {/* Mostrar etiquetas de filtros activos */}
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
              const leadName = `${group.lead_nombre || ''} ${group.lead_apellido || ''}`.trim() || 'Sin nombre';
              const hasUnread = group.total_mensajes_sin_leer > 0;
              const latestConversation = group.conversations[0];
              
              return (
                <div key={group.lead_id} className="mb-1">
                  <div
                    className={`
                      p-3 cursor-pointer hover:bg-muted transition-colors
                      ${selectedLeadId === group.lead_id ? 'bg-muted' : ''}
                      ${hasUnread ? 'border-l-4 border-primary' : ''}
                    `}
                    onClick={() => {
                      setSelectedLeadId(group.lead_id);
                      if (group.conversations.length > 0) {
                        navigate(`/dashboard/conversations/${group.conversations[0].id}`);
                      }
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(leadName)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <h3 className="font-medium text-sm truncate">
                            {leadName}
                            {hasUnread && (
                              <Badge variant="default" className="ml-2 text-xs">
                                {group.total_mensajes_sin_leer}
                              </Badge>
                            )}
                          </h3>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(group.ultima_actualizacion)}
                          </span>
                        </div>
                        
                        <div className="mt-1 flex flex-wrap gap-2">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <CanalIcon 
                              tipo={getChannelType(latestConversation?.canal_id || null)} 
                              size={12} 
                              className="mr-1" 
                            />
                            <span className="truncate max-w-[90px]">
                              {getChannelName(latestConversation?.canal_id || null)}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            <span>{group.conversations.reduce((acc: number, conv: any) => acc + (conv.message_count || 0), 0)}</span>
                          </div>
                          
                          {group.lead_score !== undefined && (
                            <div className="flex items-center text-xs">
                              <Badge 
                                variant={group.lead_score > 70 ? "default" : 
                                      (group.lead_score > 40 ? "secondary" : "outline")}
                                className="px-1.5 py-0 h-4"
                              >
                                {group.lead_score || 0}
                              </Badge>
                            </div>
                          )}
                        </div>
                        
                        {group.lead?.asignado_a && (
                          <div className="mt-1 text-xs flex items-center text-muted-foreground">
                            <UserCheck className="h-3 w-3 mr-1" />
                            <span className="truncate">{
                              group.lead?.asignado_a === user?.id ? 
                                'Asignado a ti' : 
                                group.lead?.agente_nombre ? 
                                  `Asignado a ${group.lead.agente_nombre}` : 
                                  'Asignado'
                            }</span>
                          </div>
                        )}
                        
                        {/* Mostrar etiquetas si tiene */}
                        {group.lead?.tags && group.lead.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {group.lead.tags.slice(0, 2).map((tag: any) => (
                              <Badge 
                                key={tag.id}
                                variant="outline" 
                                className="text-xs px-1 py-0 h-4"
                                style={{ 
                                  backgroundColor: `${tag.color}20`, 
                                  color: tag.color,
                                  borderColor: `${tag.color}50`
                                }}
                              >
                                {tag.nombre}
                              </Badge>
                            ))}
                            {group.lead.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                                +{group.lead.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        {group.conversations.length > 1 && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {group.conversations.length} conversaciones
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default LeadsList;