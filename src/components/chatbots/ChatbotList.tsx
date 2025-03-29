
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  Copy, 
  Edit2, 
  ExternalLink, 
  MoreHorizontal, 
  Trash2 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { EditChatbotDialog } from "./EditChatbotDialog";
import { Chatbot } from "@/hooks/useChatbots";
import { supabase } from "@/integrations/supabase/client";

interface ChatbotListProps {
  chatbots: Chatbot[];
  onDelete: () => void;
  onEdit: () => void;
  onLiveView: (id: string) => void;
}

export function ChatbotList({ chatbots, onDelete, onEdit, onLiveView }: ChatbotListProps) {
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null);
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenEmbedDialog = (chatbot: Chatbot) => {
    setSelectedChatbot(chatbot);
    setEmbedDialogOpen(true);
  };

  const handleOpenDeleteDialog = (chatbot: Chatbot) => {
    setSelectedChatbot(chatbot);
    setDeleteDialogOpen(true);
  };

  const handleOpenEditDialog = (chatbot: Chatbot) => {
    setSelectedChatbot(chatbot);
    setEditDialogOpen(true);
  };

  const handleCopyEmbed = () => {
    if (!selectedChatbot) return;
    
    const chatbotUrl = `${window.location.origin}/chat/${selectedChatbot.id}`;
    const embedCode = `<iframe src="${chatbotUrl}" width="100%" height="600" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    toast.success("Código de inserción copiado al portapapeles");
  };

  const handleDelete = async () => {
    if (!selectedChatbot) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("chatbots")
        .delete()
        .eq("id", selectedChatbot.id);
      
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

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha de creación</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chatbots.map((chatbot) => (
              <TableRow key={chatbot.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {chatbot.avatar_url ? (
                      <img 
                        src={chatbot.avatar_url} 
                        alt={chatbot.nombre} 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center" />
                    )}
                    {chatbot.nombre}
                  </div>
                </TableCell>
                <TableCell className="max-w-[300px] truncate">
                  {chatbot.descripcion || "Sin descripción"}
                </TableCell>
                <TableCell>
                  <Badge variant={chatbot.is_active ? "default" : "outline"}>
                    {chatbot.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(chatbot.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleOpenEditDialog(chatbot)}>
                        <Edit2 size={16} className="mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenEmbedDialog(chatbot)}>
                        <Copy size={16} className="mr-2" />
                        Código de inserción
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onLiveView(chatbot.id)}>
                        <ExternalLink size={16} className="mr-2" />
                        Ver en vivo
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleOpenDeleteDialog(chatbot)} 
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 size={16} className="mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Embed Dialog */}
      {selectedChatbot && (
        <>
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
                value={`<iframe src="${window.location.origin}/chat/${selectedChatbot.id}" width="100%" height="600" frameborder="0"></iframe>`}
              />
              <div className="bg-muted p-3 rounded-md text-sm">
                <div className="font-semibold mb-1">URL directa del chatbot:</div>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-background p-1 rounded flex-1 overflow-hidden text-ellipsis">
                    {`${window.location.origin}/chat/${selectedChatbot.id}`}
                  </code>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/chat/${selectedChatbot.id}`);
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
                  Esta acción no se puede deshacer. Esto eliminará permanentemente el chatbot <strong>{selectedChatbot.nombre}</strong> y todas sus conversaciones.
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
            chatbot={selectedChatbot}
            onSuccess={() => {
              onEdit();
              toast.success("Chatbot actualizado exitosamente");
            }}
          />
        </>
      )}
    </>
  );
}
