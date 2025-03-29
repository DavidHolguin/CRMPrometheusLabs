
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chatbot } from "@/hooks/useChatbots";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EditChatbotDrawer } from "./EditChatbotDrawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ChatbotCardProps {
  chatbot: Chatbot;
  onDelete: () => void;
  onEdit: () => void;
  onLiveView: () => void;
}

export function ChatbotCard({ chatbot, onDelete, onEdit, onLiveView }: ChatbotCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Primero eliminar los contextos asociados
      const { error: contextError } = await supabase
        .from("chatbot_contextos")
        .delete()
        .eq("chatbot_id", chatbot.id);

      if (contextError) throw contextError;

      // Luego eliminar el chatbot
      const { error } = await supabase
        .from("chatbots")
        .delete()
        .eq("id", chatbot.id);

      if (error) throw error;

      setDeleteDialogOpen(false);
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
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 bg-primary/10">
                <AvatarImage src={chatbot.avatar_url || ""} alt={chatbot.nombre} />
                <AvatarFallback>{getInitials(chatbot.nombre)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{chatbot.nombre}</CardTitle>
                <CardDescription className="line-clamp-1">
                  {chatbot.descripcion || "Sin descripción"}
                </CardDescription>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditDrawerOpen(true)}>
                  <Pencil size={14} className="mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLiveView}>
                  <Eye size={14} className="mr-2" />
                  Ver en vivo
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 size={14} className="mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant={chatbot.is_active ? "default" : "outline"}>
              {chatbot.is_active ? "Activo" : "Inactivo"}
            </Badge>
            {chatbot.tono && (
              <Badge variant="outline">
                Tono: {chatbot.tono}
              </Badge>
            )}
            {chatbot.personalidad && (
              <Badge variant="outline">
                {chatbot.personalidad}
              </Badge>
            )}
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            <p className="line-clamp-3">
              {chatbot.contexto?.generalContext || chatbot.descripcion || "Sin información de contexto adicional."}
            </p>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4 flex justify-between">
          <Button variant="outline" size="sm" onClick={() => setEditDrawerOpen(true)}>
            <Pencil size={14} className="mr-2" />
            Editar
          </Button>
          <Button size="sm" onClick={onLiveView}>
            <Eye size={14} className="mr-2" />
            Ver en vivo
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Confirmar eliminación?</DialogTitle>
            <DialogDescription>
              Estás a punto de eliminar el chatbot "{chatbot.nombre}". Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditChatbotDrawer
        chatbot={chatbot}
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        onSuccess={onEdit}
      />
    </>
  );
}
