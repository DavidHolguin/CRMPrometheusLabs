import { useState, useEffect } from "react";
import { Chatbot } from "@/hooks/useChatbots";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Bot, Copy, Globe, Mail, Instagram, Facebook, ArrowUpRight, ArrowDownRight, Settings } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ChatbotListProps {
  chatbots: Chatbot[];
  onLiveView: (id: string) => void;
}

interface ChatbotStats {
  messages: number;
  messagesChange: number;
  leads: number;
  leadsChange: number;
}

interface Canal {
  id: string;
  tipo: string;
  nombre: string;
  color: string | null;
  logo_url: string | null;
}

export function ChatbotList({ chatbots, onLiveView }: ChatbotListProps) {
  const [chatbotStats, setChatbotStats] = useState<Record<string, ChatbotStats>>({});
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [chatbotCanales, setChatbotCanales] = useState<Record<string, Canal[]>>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (chatbots.length > 0) {
      fetchAllChatbotStats();
      fetchAllChatbotCanales();
    }
  }, [chatbots]);

  const fetchAllChatbotCanales = async () => {
    try {
      const canalesPorChatbot: Record<string, Canal[]> = {};
      
      for (const chatbot of chatbots) {
        // Obtener los canales conectados a este chatbot desde chatbot_canales con todos sus detalles
        const { data, error } = await supabase
          .from("chatbot_canales")
          .select(`
            canal_id,
            canales (
              id,
              tipo,
              nombre,
              color,
              logo_url
            )
          `)
          .eq("chatbot_id", chatbot.id)
          .eq("is_active", true);
          
        if (!error && data && data.length > 0) {
          // Extraer los detalles del canal de la respuesta anidada
          canalesPorChatbot[chatbot.id] = data.flatMap(item => item.canales) as Canal[];
        } else {
          // Si no hay canales, al menos mostramos el canal web por defecto
          canalesPorChatbot[chatbot.id] = [{ id: "default", tipo: "web", nombre: "Web", color: "#3b82f6", logo_url: null }];
        }
      }
      
      setChatbotCanales(canalesPorChatbot);
    } catch (error) {
      console.error("Error obteniendo canales:", error);
    }
  };

  const fetchAllChatbotStats = async () => {
    setIsLoadingStats(true);
    
    try {
      const stats: Record<string, ChatbotStats> = {};
      
      // Get current date and yesterday
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();
      const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString();
      const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999)).toISOString();
      
      for (const chatbot of chatbots) {
        // Get all conversations for this chatbot
        const { data: conversations } = await supabase
          .from("conversaciones")
          .select("id, lead_id")
          .eq("chatbot_id", chatbot.id);
        
        const conversationIds = conversations ? conversations.map(conv => conv.id) : [];
        const leadIds = conversations ? conversations.map(conv => conv.lead_id).filter(Boolean) : [];
        
        // Count total messages
        const { count: messagesCount } = await supabase
          .from("mensajes")
          .select("id", { count: "exact", head: true })
          .in("conversacion_id", conversationIds.length > 0 ? conversationIds : ['no-conversations']);
        
        // Count yesterday's messages
        const { count: messagesYesterdayCount } = await supabase
          .from("mensajes")
          .select("id", { count: "exact", head: true })
          .in("conversacion_id", conversationIds.length > 0 ? conversationIds : ['no-conversations'])
          .gte("created_at", yesterdayStart)
          .lte("created_at", yesterdayEnd);
        
        // Calculate leads
        const leadsCount = leadIds.length;
        
        // Count leads created yesterday
        const { count: leadsYesterdayCount } = await supabase
          .from("conversaciones")
          .select("lead_id", { count: "exact", head: true })
          .eq("chatbot_id", chatbot.id)
          .gte("created_at", yesterdayStart)
          .lte("created_at", yesterdayEnd);
        
        // Calculate percentage change
        const messagesChange = messagesYesterdayCount > 0 
          ? Math.round((messagesCount - messagesYesterdayCount) / messagesYesterdayCount * 100) 
          : 0;
        
        const leadsChange = leadsYesterdayCount > 0 
          ? Math.round((leadsCount - leadsYesterdayCount) / leadsYesterdayCount * 100) 
          : 0;
        
        stats[chatbot.id] = {
          messages: messagesCount || 0,
          messagesChange,
          leads: leadsCount,
          leadsChange
        };
      }
      
      setChatbotStats(stats);
    } catch (error) {
      console.error("Error fetching chatbot stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Función para compartir enlace del chatbot
  const shareChatbot = (id: string) => {
    // URL de chat para compartir
    const chatUrl = `${window.location.origin}/chat/${id}`;
    navigator.clipboard.writeText(chatUrl);
    toast.success("Enlace copiado al portapapeles");
  };

  const getChannelIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case "web": return <Globe size={14} />;
      case "email": return <Mail size={14} />;
      case "instagram": return <Instagram size={14} />;
      case "facebook": return <Facebook size={14} />;
      case "messenger": return <Facebook size={14} />;
      default: return <Globe size={14} />;
    }
  };

  return (
    <div className="rounded-md border dark:border-slate-700">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Nombre</TableHead>
            <TableHead className="w-[180px]">Canales</TableHead>
            <TableHead className="w-[120px]">Mensajes</TableHead>
            <TableHead className="w-[120px]">Leads</TableHead>
            <TableHead className="w-[150px]">Creado</TableHead>
            <TableHead className="w-[200px] text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chatbots.map((chatbot) => {
            const creationDate = chatbot.created_at ? 
              format(new Date(chatbot.created_at), "dd MMM yyyy", { locale: es }) : "Fecha desconocida";
            const stats = chatbotStats[chatbot.id];
            const canales = chatbotCanales[chatbot.id] || [{ id: "default", tipo: "web", nombre: "Web", color: "#3b82f6", logo_url: null }];

            return (
              <TableRow key={chatbot.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border rounded-md">
                      {chatbot.avatar_url ? (
                        <AvatarImage src={chatbot.avatar_url} alt={chatbot.nombre} />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary rounded-md">
                          <Bot size={16} className="text-primary" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="font-medium">{chatbot.nombre}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {canales.map((canal, index) => (
                      <div 
                        key={index} 
                        className="h-5 w-5 flex items-center justify-center rounded-full"
                        style={{ 
                          backgroundColor: canal.color ? `${canal.color}20` : '#3b82f620', 
                          color: canal.color || '#3b82f6' 
                        }}
                        title={`Conectado a ${canal.nombre || canal.tipo}`}
                      >
                        {canal.logo_url ? (
                          <img 
                            src={canal.logo_url} 
                            alt={canal.nombre || canal.tipo}
                            className="h-3.5 w-3.5 object-contain"
                          />
                        ) : (
                          getChannelIcon(canal.tipo)
                        )}
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {isLoadingStats ? (
                    <span className="font-medium">...</span>
                  ) : stats ? (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{stats.messages}</span>
                      {stats.messagesChange !== 0 && (
                        <div className="flex items-center text-xs">
                          {stats.messagesChange > 0 ? (
                            <ArrowUpRight className="h-3 w-3 text-green-500 mr-0.5" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 text-red-500 mr-0.5" />
                          )}
                          <span className={stats.messagesChange > 0 ? "text-green-500" : "text-red-500"}>
                            {stats.messagesChange > 0 ? '+' : ''}{stats.messagesChange}%
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="font-medium">0</span>
                  )}
                </TableCell>
                <TableCell>
                  {isLoadingStats ? (
                    <span className="font-medium">...</span>
                  ) : stats ? (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{stats.leads}</span>
                      {stats.leadsChange !== 0 && (
                        <div className="flex items-center text-xs">
                          {stats.leadsChange > 0 ? (
                            <ArrowUpRight className="h-3 w-3 text-green-500 mr-0.5" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 text-red-500 mr-0.5" />
                          )}
                          <span className={stats.leadsChange > 0 ? "text-green-500" : "text-red-500"}>
                            {stats.leadsChange > 0 ? '+' : ''}{stats.leadsChange}%
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="font-medium">0</span>
                  )}
                </TableCell>
                <TableCell>{creationDate}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="relative flex items-center">
                      <input 
                        type="text" 
                        value={`${window.location.origin}/chat/${chatbot.id}`}
                        readOnly
                        className="w-[140px] h-8 py-1 px-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700"
                      />
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="absolute right-1 h-6 w-6"
                        onClick={() => shareChatbot(chatbot.id)}
                      >
                        <Copy size={12} />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => navigate(`/dashboard/chatbots/${chatbot.id}/settings`)}
                    >
                      <Settings size={14} className="mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 text-xs whitespace-nowrap"
                      onClick={() => onLiveView(chatbot.id)}
                    >
                      <MessageSquare size={14} className="mr-1" />
                      Chat rápido
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
