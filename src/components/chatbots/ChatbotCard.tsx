
import { useState } from "react";
import { Chatbot } from "@/hooks/useChatbots";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Edit, Trash2, ExternalLink, Bot } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EditChatbotModal } from "./EditChatbotModal";

interface ChatbotCardProps {
  chatbot: Chatbot;
  onDelete: () => void;
  onEdit: () => void;
  onLiveView: () => void;
}

export function ChatbotCard({ chatbot, onDelete, onEdit, onLiveView }: ChatbotCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border">
                {chatbot.avatar_url ? (
                  <AvatarImage src={chatbot.avatar_url} alt={chatbot.nombre} />
                ) : (
                  <AvatarFallback className="bg-primary-foreground">
                    <Bot size={24} className="text-primary" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <CardTitle className="text-lg">{chatbot.nombre}</CardTitle>
                <CardDescription className="text-xs">
                  Creado el {creationDate}
                </CardDescription>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onLiveView} className="gap-2">
                  <ExternalLink size={16} />
                  Ver en vivo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsEditModalOpen(true)} className="gap-2">
                  <Edit size={16} />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-destructive gap-2"
                >
                  <Trash2 size={16} />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-20 overflow-hidden">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {chatbot.descripcion || "Sin descripción"}
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant={chatbot.is_active ? "default" : "outline"}>
              {chatbot.is_active ? "Activo" : "Inactivo"}
            </Badge>
            {chatbot.tono && (
              <Badge variant="secondary">{chatbot.tono}</Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
            <Edit size={14} className="mr-2" />
            Editar
          </Button>
          <Button size="sm" onClick={onLiveView}>
            <ExternalLink size={14} className="mr-2" />
            Ver en vivo
          </Button>
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
