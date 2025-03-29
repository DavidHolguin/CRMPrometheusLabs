
import { useState } from "react";
import { Chatbot } from "@/hooks/useChatbots";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Edit, Trash2, ExternalLink, Bot } from "lucide-react";
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

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="w-[100px]">Estado</TableHead>
              <TableHead className="w-[150px]">Creado</TableHead>
              <TableHead className="w-[100px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chatbots.map((chatbot) => {
              const creationDate = chatbot.created_at ? 
                format(new Date(chatbot.created_at), "dd MMM yyyy", { locale: es }) : "Fecha desconocida";

              return (
                <TableRow key={chatbot.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border">
                        {chatbot.avatar_url ? (
                          <AvatarImage src={chatbot.avatar_url} alt={chatbot.nombre} />
                        ) : (
                          <AvatarFallback className="bg-primary-foreground">
                            <Bot size={16} className="text-primary" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="font-medium">{chatbot.nombre}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <p className="truncate text-sm text-muted-foreground">
                      {chatbot.descripcion || "Sin descripción"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={chatbot.is_active ? "default" : "outline"}>
                      {chatbot.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>{creationDate}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal size={18} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onLiveView(chatbot.id)} className="gap-2">
                          <ExternalLink size={16} />
                          Ver en vivo
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingChatbot(chatbot)} className="gap-2">
                          <Edit size={16} />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeletingChatbot(chatbot)}
                          className="text-destructive gap-2"
                        >
                          <Trash2 size={16} />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
