import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CanalIcon } from "@/components/canales/CanalIcon";

interface LeadsListProps {
  isLoading: boolean;
  groupedConversations: any[];
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string) => void;
  canales: any[];
}

const LeadsList = ({
  isLoading,
  groupedConversations,
  selectedLeadId,
  setSelectedLeadId,
  canales
}: LeadsListProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState(false);

  const filteredGroupedConversations = groupedConversations.filter(group => {
    const leadName = `${group.lead_nombre || ''} ${group.lead_apellido || ''}`.toLowerCase();
    const matchesSearch = searchTerm ? leadName.includes(searchTerm.toLowerCase()) : true;
    const matchesFilter = filterActive ? group.total_mensajes_sin_leer > 0 : true;
    return matchesSearch && matchesFilter;
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

  return (
    <div className="w-80 border-r flex flex-col h-full">
      <div className="p-4 border-b bg-card/50">
        <h2 className="font-semibold text-lg mb-4">Conversaciones</h2>
        
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar lead..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button
            variant={filterActive ? "default" : "outline"}
            size="icon"
            onClick={() => setFilterActive(!filterActive)}
            title={filterActive ? "Mostrar todas" : "Solo no leídos"}
          >
            <Filter className="h-4 w-4" />
          </Button>
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
        ) : filteredGroupedConversations.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-muted-foreground">No hay conversaciones.</p>
          </div>
        ) : (
          <div className="py-2">
            {filteredGroupedConversations.map((group) => {
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