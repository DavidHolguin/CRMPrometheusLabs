import { useState, useEffect } from "react";
import { Chatbot } from "@/hooks/useChatbots";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Bot, Copy, Share2, Globe, Mail, Instagram, Facebook, ArrowUpRight, ArrowDownRight, Settings } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ChatbotCardProps {
  chatbot: Chatbot;
  onLiveView: () => void;
}

interface ChatbotStats {
  messages: number;
  messagesYesterday: number;
  messagesChange: number;
  leads: number;
  leadsYesterday: number;
  leadsChange: number;
}

interface Canal {
  id: string;
  tipo: string;
  nombre: string;
  color: string | null;
  logo_url: string | null;
}

export function ChatbotCard({ chatbot, onLiveView }: ChatbotCardProps) {
  const [stats, setStats] = useState<ChatbotStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [canales, setCanales] = useState<Canal[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchChatbotStats();
    fetchCanales();
  }, [chatbot.id]);

  const fetchCanales = async () => {
    try {
      // Obtener los canales conectados a este chatbot desde chatbot_canales con sus detalles completos
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
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Extraer los detalles del canal de la respuesta anidada
        const canalesData = data.flatMap(item => item.canales) as Canal[];
        setCanales(canalesData);
      } else {
        // Si no hay canales, al menos mostramos el canal web por defecto
        setCanales([{ id: "default", tipo: "web", nombre: "Web", color: "#3b82f6", logo_url: null }]);
      }
    } catch (error) {
      console.error("Error obteniendo canales:", error);
      // Canal web por defecto en caso de error
      setCanales([{ id: "default", tipo: "web", nombre: "Web", color: "#3b82f6", logo_url: null }]);
    }
  };

  const fetchChatbotStats = async () => {
    setIsLoadingStats(true);
    try {
      // Get current date and yesterday
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();
      const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString();
      const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999)).toISOString();
      
      // Get all conversations for this chatbot
      const { data: conversations } = await supabase
        .from("conversaciones")
        .select("id, lead_id")
        .eq("chatbot_id", chatbot.id);
      
      const conversationIds = conversations ? conversations.map(conv => conv.id) : [];
      const leadIds = conversations ? conversations.map(conv => conv.lead_id).filter(Boolean) : [];
      
      // Count today's messages
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
      
      setStats({
        messages: messagesCount || 0,
        messagesYesterday: messagesYesterdayCount || 0,
        messagesChange,
        leads: leadsCount,
        leadsYesterday: leadsYesterdayCount || 0,
        leadsChange
      });
    } catch (error) {
      console.error("Error fetching chatbot stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const creationDate = chatbot.created_at ? 
    format(new Date(chatbot.created_at), "dd MMM yyyy", { locale: es }) : "Fecha desconocida";

  // Función para compartir enlace del chatbot
  const shareChatbot = () => {
    // URL de chat para compartir
    const chatUrl = `${window.location.origin}/chat/${chatbot.id}`;
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
    <Card className="overflow-hidden border border-slate-200 dark:border-slate-700 transition-all duration-200 hover:shadow-md hover:border-primary/40 dark:hover:border-primary/40 group">
      <CardHeader className="p-4 pb-0 flex-row items-center justify-between gap-2 space-y-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border rounded-md">
            {chatbot.avatar_url ? (
              <AvatarImage src={chatbot.avatar_url} alt={chatbot.nombre} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary rounded-md">
                <Bot size={20} />
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <CardTitle className="text-base font-semibold">{chatbot.nombre}</CardTitle>
            <p className="text-xs text-muted-foreground">{creationDate}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-3">
        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-2 mt-2 mb-3">
          <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-md">
            <div className="text-xs text-muted-foreground">Mensajes</div>
            <div className="flex justify-between items-center">
              <div className="text-lg font-semibold">{isLoadingStats ? '...' : stats?.messages || 0}</div>
              {!isLoadingStats && stats && (
                <div className="flex items-center text-xs">
                  {stats.messagesChange > 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  ) : stats.messagesChange < 0 ? (
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                  ) : null}
                  <span className={
                    stats.messagesChange > 0 ? "text-green-500" : 
                    stats.messagesChange < 0 ? "text-red-500" : 
                    "text-muted-foreground"
                  }>
                    {stats.messagesChange > 0 ? '+' : ''}{stats.messagesChange}%
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-md">
            <div className="text-xs text-muted-foreground">Leads</div>
            <div className="flex justify-between items-center">
              <div className="text-lg font-semibold">{isLoadingStats ? '...' : stats?.leads || 0}</div>
              {!isLoadingStats && stats && (
                <div className="flex items-center text-xs">
                  {stats.leadsChange > 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  ) : stats.leadsChange < 0 ? (
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                  ) : null}
                  <span className={
                    stats.leadsChange > 0 ? "text-green-500" : 
                    stats.leadsChange < 0 ? "text-red-500" : 
                    "text-muted-foreground"
                  }>
                    {stats.leadsChange > 0 ? '+' : ''}{stats.leadsChange}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Canales conectados */}
        <div className="flex items-center gap-1.5 mt-3 mb-2">
          <span className="text-xs text-muted-foreground mr-1">Canales:</span>
          {canales.map((canal, index) => (
            <div 
              key={index}
              className="h-6 w-6 flex items-center justify-center rounded-full"
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
                  className="h-4 w-4 object-contain"
                />
              ) : (
                getChannelIcon(canal.tipo)
              )}
            </div>
          ))}
        </div>

        {/* URL de chat compartible */}
        <div className="relative mt-3 mb-3">
          <input 
            type="text" 
            value={`${window.location.origin}/chat/${chatbot.id}`}
            readOnly
            className="w-full py-1.5 pl-2 pr-8 text-xs bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700"
          />
          <Button 
            size="icon" 
            variant="ghost" 
            className="absolute right-0.5 top-0.5 h-5 w-5"
            onClick={shareChatbot}
          >
            <Copy size={12} />
          </Button>
        </div>
      </CardContent>
      
      <CardFooter className="p-2 bg-slate-50 dark:bg-slate-800 border-t dark:border-slate-700 flex justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 text-xs gap-1.5 border-slate-300 dark:border-slate-600"
          onClick={() => navigate(`/dashboard/chatbots/${chatbot.id}/settings`)}
        >
          <Settings size={14} />
          Editar
        </Button>
        
        <Button 
          size="sm" 
          className="h-8 text-xs gap-1.5"
          onClick={onLiveView}
        >
          <MessageSquare size={14} />
          Chat rápido
        </Button>
      </CardFooter>
    </Card>
  );
}
