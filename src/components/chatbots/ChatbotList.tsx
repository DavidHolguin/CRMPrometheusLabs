
import { useState, useEffect } from "react";
import { Chatbot } from "@/hooks/useChatbots";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Edit, Trash2, MessageSquare, Bot, Copy, Share2, Globe, Mail, Instagram, Facebook, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EditChatbotModal } from "./EditChatbotModal";

interface ChatbotListProps {
  chatbots: Chatbot[];
  onDelete: () => void;
  onEdit: () => void;
  onLiveView: (id: string) => void;
}

interface ChatbotStats {
  messages: number;
  messagesChange: number;
  leads: number;
  leadsChange: number;
}

export function ChatbotList({ chatbots, onDelete, onEdit, onLiveView }: ChatbotListProps) {
  const [deletingChatbot, setDeletingChatbot] = useState<Chatbot | null>(null);
  const [editingChatbot, setEditingChatbot] = useState<Chatbot | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [chatbotStats, setChatbotStats] = useState<Record<string, ChatbotStats>>({});
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (chatbots.length > 0) {
      fetchAllChatbotStats();
    }
  }, [chatbots]);

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

  const handleDelete = async () => {
    if (!deletingChatbot) return;
    
    setIsDeleting(true);
    try {
      // Primero eliminar los contextos del chatbot
      await supabase
        .from("chatbot_contextos")
        .delete()
        .eq("chatbot_id", deletingChatbot.id);
        
      // Luego eliminar el chatbot
      const { error } = await supabase
        .from("chatbots")
        .delete()
        .eq("id", deletingChatbot.id);
      
      if (error) throw error;
      
      toast.success("Chatbot eliminado exitosamente");
      onDelete();
    } catch (error) {
      console.error("Error eliminando chatbot:", error);
      toast.error("Error al eliminar el chatbot");
    } finally {
      setIsDeleting(false);
      setDeletingChatbot(null);
    }
  };

  // Función para copiar enlace del chatbot
  const copyEmbedCode = (id: string) => {
    const embedCode = `<script src="https://your-domain.com/embed/${id}.js"></script>`;
    navigator.clipboard.writeText(embedCode);
    toast.success("Código de embebido copiado al portapapeles");
  };

  // Función para compartir enlace del chatbot
  const shareChatbot = (id: string) => {
    // URL de chat para compartir
    const chatUrl = `${window.location.origin}/chat/${id}`;
    navigator.clipboard.writeText(chatUrl);
    toast.success("Enlace copiado al portapapeles");
  };

  // Mock canales conectados - En una implementación real, esto vendría de la base de datos
  const getChannels = (id: string) => [
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
      <div className="rounded-md border dark:border-slate-700">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Nombre</TableHead>
              <TableHead className="w-[150px]">Canales</TableHead>
              <TableHead className="w-[120px]">Mensajes</TableHead>
              <TableHead className="w-[120px]">Leads</TableHead>
              <TableHead className="w-[150px]">Creado</TableHead>
              <TableHead className="w-[180px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chatbots.map((chatbot) => {
              const creationDate = chatbot.created_at ? 
                format(new Date(chatbot.created_at), "dd MMM yyyy", { locale: es }) : "Fecha desconocida";
              const stats = chatbotStats[chatbot.id];
              const channels = getChannels(chatbot.id);

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
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => copyEmbedCode(chatbot.id)}
                        title="Copiar código de embebido"
                      >
                        <Copy size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => shareChatbot(chatbot.id)}
                        title="Compartir enlace"
                      >
                        <Share2 size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => setEditingChatbot(chatbot)}
                        title="Editar chatbot"
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => onLiveView(chatbot.id)}
                      >
                        <MessageSquare size={14} />
                        Chat rápido
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal size={14} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onLiveView(chatbot.id)} className="gap-2 text-sm">
                            <MessageSquare size={14} />
                            Chat rápido
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingChatbot(chatbot)} className="gap-2 text-sm">
                            <Edit size={14} />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeletingChatbot(chatbot)}
                            className="text-destructive gap-2 text-sm"
                          >
                            <Trash2 size={14} />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deletingChatbot} onOpenChange={(open) => !open && setDeletingChatbot(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar chatbot?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el chatbot "{deletingChatbot?.nombre}" y todos sus datos asociados.
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

      {editingChatbot && (
        <EditChatbotModal
          chatbot={editingChatbot}
          open={!!editingChatbot}
          onOpenChange={(open) => !open && setEditingChatbot(null)}
          onSuccess={onEdit}
        />
      )}
    </>
  );
}
