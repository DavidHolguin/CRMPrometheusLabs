
import { useState } from "react";
import { Chatbot } from "@/hooks/useChatbots";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Edit, Trash2, MessageSquare, Bot, Copy, Share2, Globe, Mail, Instagram, Facebook } from "lucide-react";
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

export function ChatbotList({ chatbots, onDelete, onEdit, onLiveView }: ChatbotListProps) {
  const [deletingChatbot, setDeletingChatbot] = useState<Chatbot | null>(null);
  const [editingChatbot, setEditingChatbot] = useState<Chatbot | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Mock data para estadísticas
  const getMockStats = (id: string) => ({
    messages: Math.floor(Math.random() * 500) + 10,
    leads: Math.floor(Math.random() * 50) + 1,
  });

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
              <TableHead className="w-[100px]">Mensajes</TableHead>
              <TableHead className="w-[100px]">Leads</TableHead>
              <TableHead className="w-[150px]">Creado</TableHead>
              <TableHead className="w-[180px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chatbots.map((chatbot) => {
              const creationDate = chatbot.created_at ? 
                format(new Date(chatbot.created_at), "dd MMM yyyy", { locale: es }) : "Fecha desconocida";
              const stats = getMockStats(chatbot.id);
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
                    <span className="font-medium">{stats.messages}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{stats.leads}</span>
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
