
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  Copy, 
  Edit2, 
  ExternalLink, 
  MessageSquare, 
  MoreVertical, 
  Trash2 
} from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { EditChatbotDialog } from "./EditChatbotDialog";
import { Chatbot } from "@/hooks/useChatbots";
import { supabase } from "@/integrations/supabase/client";

interface ChatbotCardProps {
  chatbot: Chatbot;
  onDelete: () => void;
  onEdit: () => void;
  onLiveView: () => void;
}

export function ChatbotCard({ chatbot, onDelete, onEdit, onLiveView }: ChatbotCardProps) {
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopyEmbed = () => {
    const embedCode = `<iframe src="${window.location.origin}/chat/${chatbot.id}" width="100%" height="600" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    toast.success("Código de inserción copiado al portapapeles");
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
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
      setDeleteDialogOpen(false);
    }
  };

  const chatbotUrl = `${window.location.origin}/chat/${chatbot.id}`;

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              {chatbot.avatar_url ? (
                <img 
                  src={chatbot.avatar_url} 
                  alt={chatbot.nombre} 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare size={20} className="text-primary" />
                </div>
              )}
              <div>
                <CardTitle className="text-xl">{chatbot.nombre}</CardTitle>
                <Badge variant={chatbot.is_active ? "default" : "outline"} className="mt-1">
                  {chatbot.is_active ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                  <Edit2 size={16} className="mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEmbedDialogOpen(true)}>
                  <Copy size={16} className="mr-2" />
                  Código de inserción
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLiveView}>
                  <ExternalLink size={16} className="mr-2" />
                  Ver en vivo
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setDeleteDialogOpen(true)} 
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 size={16} className="mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="line-clamp-2 h-10">
            {chatbot.descripcion || "Sin descripción"}
          </CardDescription>
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          <div className="text-xs text-muted-foreground">
            Creado: {new Date(chatbot.created_at).toLocaleDateString()}
          </div>
          <Button size="sm" variant="outline" onClick={onLiveView}>
            Ver chatbot
          </Button>
        </CardFooter>
      </Card>

      {/* Embed Dialog */}
      <Dialog open={embedDialogOpen} onOpenChange={setEmbedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Código de inserción</DialogTitle>
            <DialogDescription>
              Copia este código HTML para insertar el chatbot en tu sitio web
            </DialogDescription>
          </DialogHeader>
          <Textarea 
            className="font-mono text-sm"
            readOnly 
            value={`<iframe src="${chatbotUrl}" width="100%" height="600" frameborder="0"></iframe>`}
          />
          <div className="bg-muted p-3 rounded-md text-sm">
            <div className="font-semibold mb-1">URL directa del chatbot:</div>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-background p-1 rounded flex-1 overflow-hidden text-ellipsis">
                {chatbotUrl}
              </code>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  navigator.clipboard.writeText(chatbotUrl);
                  toast.success("URL copiada al portapapeles");
                }}
              >
                <Copy size={14} />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCopyEmbed}>
              Copiar código
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar chatbot?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el chatbot <strong>{chatbot.nombre}</strong> y todas sus conversaciones.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Eliminando..." : "Eliminar chatbot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <EditChatbotDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
        chatbot={chatbot}
        onSuccess={() => {
          onEdit();
          toast.success("Chatbot actualizado exitosamente");
        }}
      />
    </>
  );
}
