import { useState, useEffect } from "react";
import { Chatbot } from "@/hooks/useChatbots";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Edit, Trash2, MessageSquare, Bot, Copy, Share2, Globe, Mail, Instagram, Facebook, ArrowUpRight, ArrowDownRight, Settings } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EditChatbotModal } from "./EditChatbotModal";
import { useNavigate } from "react-router-dom";

interface ChatbotCardProps {
  chatbot: Chatbot;
  onDelete: () => void;
  onEdit: () => void;
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

export function ChatbotCard({ chatbot, onDelete, onEdit, onLiveView }: ChatbotCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState<ChatbotStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchChatbotStats();
  }, [chatbot.id]);

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
      
      // Count leads created yesterday (approximate way since we can't directly query without the lead creation date)
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Primero eliminar los contextos del chatbot
      await supabase
        .from("chatbot_contextos")
        .delete()
        .eq("chatbot_id", chatbot.id);
        
      // Luego eliminar el chatbot
      const { error } = await supabase
        .from("chatbots")
        .delete()
        .eq("id", chatbot.id);
      
      if (error) throw error;
      
      toast.success("Chatbot eliminado exitosamente");
      onDelete();
    } catch (error) {
      console.error("Error eliminando chatbot:", error);
      toast.error("Error al eliminar el chatbot");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const creationDate = chatbot.created_at ? 
    format(new Date(chatbot.created_at), "dd MMM yyyy", { locale: es }) : "Fecha desconocida";

  // Función para copiar enlace del chatbot
  const copyEmbedCode = () => {
    const embedCode = `<script src="https://your-domain.com/embed/${chatbot.id}.js"></script>`;
    navigator.clipboard.writeText(embedCode);
    toast.success("Código de embebido copiado al portapapeles");
  };

  // Función para compartir enlace del chatbot
  const shareChatbot = () => {
    // URL de chat para compartir
    const chatUrl = `${window.location.origin}/chat/${chatbot.id}`;
    navigator.clipboard.writeText(chatUrl);
    toast.success("Enlace copiado al portapapeles");
  };

  // Mock canales conectados - En una implementación real, esto vendría de la base de datos
  const channels = [
    { type: "web", active: true },
    { type: "email", active: Math.random() > 0.5 },
    { type: "instagram", active: Math.random() > 0.5 },
    { type: "facebook", active: Math.random() > 0.7 },
  ];

  const getChannelIcon = (type: string) => {
    switch (type) {
      case "web": return <Globe size={12} />;
      case "email": return <Mail size={12} />;
      case "instagram": return <Instagram size={12} />;
      case "facebook": return <Facebook size={12} />;
      default: return <Globe size={12} />;
    }
  };

  return (
    <>
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onLiveView} className="gap-2 text-sm">
                <MessageSquare size={14} />
                Chat rápido
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditModalOpen(true)} className="gap-2 text-sm">
                <Edit size={14} />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyEmbedCode} className="gap-2 text-sm">
                <Copy size={14} />
                Copiar código
              </DropdownMenuItem>
              <DropdownMenuItem onClick={shareChatbot} className="gap-2 text-sm">
                <Share2 size={14} />
                Compartir enlace
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => navigate(`/chatbots/${chatbot.id}/settings`)}
                className="gap-2 text-sm"
              >
                <Settings size={14} />
                Configuración avanzada
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-destructive gap-2 text-sm"
              >
                <Trash2 size={14} />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          
          {/* Input de código embebido */}
          <div className="relative mt-2 mb-3">
            <input 
              type="text" 
              value={`<script src="embed/${chatbot.id}.js"></script>`}
              readOnly
              className="w-full py-1.5 pl-2 pr-8 text-xs bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700"
            />
            <Button 
              size="icon" 
              variant="ghost" 
              className="absolute right-0.5 top-0.5 h-5 w-5"
              onClick={copyEmbedCode}
            >
              <Copy size={12} />
            </Button>
          </div>
          
          {/* Canales conectados */}
          <div className="flex items-center gap-1.5 mt-3">
            <span className="text-xs text-muted-foreground mr-1">Canales:</span>
            {channels.map((channel, index) => (
              channel.active && (
                <div 
                  key={index}
                  className="h-5 w-5 flex items-center justify-center bg-primary/10 text-primary rounded-full"
                  title={`Conectado a ${channel.type}`}
                >
                  {getChannelIcon(channel.type)}
                </div>
              )
            ))}
          </div>
        </CardContent>
        
        <CardFooter className="p-2 bg-slate-50 dark:bg-slate-800 border-t dark:border-slate-700 flex justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs gap-1.5 border-slate-300 dark:border-slate-600"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit size={12} />
            Editar
          </Button>
          
          <div className="flex gap-1.5">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 w-7 p-0 border-slate-300 dark:border-slate-600"
              onClick={shareChatbot}
              title="Compartir enlace"
            >
              <Share2 size={12} />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 w-7 p-0 border-slate-300 dark:border-slate-600"
              onClick={copyEmbedCode}
              title="Copiar código"
            >
              <Copy size={12} />
            </Button>
            <Button 
              size="sm" 
              className="h-7 text-xs gap-1.5"
              onClick={onLiveView}
            >
              <MessageSquare size={12} />
              Chat rápido
            </Button>
          </div>
        </CardFooter>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar chatbot?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el chatbot "{chatbot.nombre}" y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditChatbotModal
        chatbot={chatbot}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={onEdit}
      />
    </>
  );
}
