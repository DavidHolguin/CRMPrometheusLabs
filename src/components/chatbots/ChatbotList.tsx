
import { useState } from "react";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chatbot } from "@/hooks/useChatbots";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { EditChatbotDrawer } from "./EditChatbotDrawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ChatbotListProps {
  chatbots: Chatbot[];
  onDelete: () => void;
  onEdit: () => void;
  onLiveView: (id: string) => void;
}

export function ChatbotList({ chatbots, onDelete, onEdit, onLiveView }: ChatbotListProps) {
  const [deletingChatbot, setDeletingChatbot] = useState<Chatbot | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingChatbot, setEditingChatbot] = useState<Chatbot | null>(null);

  const handleDelete = async () => {
    if (!deletingChatbot) return;
    
    setIsDeleting(true);
    try {
      // Primero eliminar los contextos asociados
      const { error: contextError } = await supabase
        .from("chatbot_contextos")
        .delete()
        .eq("chatbot_id", deletingChatbot.id);

      if (contextError) throw contextError;

      // Luego eliminar el chatbot
      const { error } = await supabase
        .from("chatbots")
        .delete()
        .eq("id", deletingChatbot.id);

      if (error) throw error;

      setDeletingChatbot(null);
      toast.success("Chatbot eliminado exitosamente");
      onDelete();
    } catch (error) {
      console.error("Error eliminando chatbot:", error);
      toast.error("Error al eliminar el chatbot. Inténtelo de nuevo.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <>
      <div className="rounded-md border bg-card">
        <div className="p-3 border-b bg-muted/50 grid grid-cols-12 gap-2 font-medium text-sm">
          <div className="col-span-6">Chatbot</div>
          <div className="col-span-3">Estado</div>
          <div className="col-span-3 text-right">Acciones</div>
        </div>
        <div className="divide-y">
          {chatbots.map((chatbot) => (
            <div key={chatbot.id} className="p-3 grid grid-cols-12 gap-2 items-center hover:bg-muted/30">
              <div className="col-span-6 flex items-center gap-3">
                <Avatar className="h-9 w-9 bg-primary/10">
                  <AvatarImage src={chatbot.avatar_url || ""} alt={chatbot.nombre} />
                  <AvatarFallback>{getInitials(chatbot.nombre)}</AvatarFallback>
                </Avatar>
                <div className="space-y-0.5">
                  <div className="font-medium text-sm">{chatbot.nombre}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{chatbot.descripcion || "Sin descripción"}</div>
                </div>
              </div>
              <div className="col-span-3">
                <Badge variant={chatbot.is_active ? "default" : "outline"}>
                  {chatbot.is_active ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <div className="col-span-3 flex justify-end gap-2">
                <Button variant="outline" size="icon" onClick={() => onLiveView(chatbot.id)} title="Ver en vivo">
                  <Eye size={16} />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setEditingChatbot(chatbot)} title="Editar">
                  <Pencil size={16} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreHorizontal size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingChatbot(chatbot)}>
                      <Pencil size={14} className="mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onLiveView(chatbot.id)}>
                      <Eye size={14} className="mr-2" />
                      Ver en vivo
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setDeletingChatbot(chatbot)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 size={14} className="mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingChatbot} onOpenChange={(open) => !open && setDeletingChatbot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Confirmar eliminación?</DialogTitle>
            <DialogDescription>
              Estás a punto de eliminar el chatbot "{deletingChatbot?.nombre}". Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingChatbot(null)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Drawer */}
      {editingChatbot && (
        <EditChatbotDrawer
          chatbot={editingChatbot}
          open={!!editingChatbot}
          onOpenChange={(open) => !open && setEditingChatbot(null)}
          onSuccess={() => {
            setEditingChatbot(null);
            onEdit();
          }}
        />
      )}
    </>
  );
}
