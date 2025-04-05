
import { Lead } from "@/hooks/useLeads";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { toast } from "sonner";

interface Comment {
  id: string;
  lead_id: string;
  usuario_id: string;
  contenido: string;
  created_at: string;
  usuario_nombre?: string;
  usuario_apellido?: string;
}

interface LeadCommentsTabProps {
  lead: Lead;
  formatDate: (date: string | null) => string;
}

export function LeadCommentsTab({ lead, formatDate }: LeadCommentsTabProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (lead.id) {
      fetchComments();
    }
  }, [lead.id]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      // Get comments
      const { data: commentsData, error: commentsError } = await supabase
        .from("lead_comentarios")
        .select("*")
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false });

      if (commentsError) throw commentsError;

      // Get user information
      const userIds = commentsData
        .map((item) => item.usuario_id)
        .filter(Boolean);

      if (userIds.length > 0) {
        const { data: userData, error: userError } = await supabase
          .from("usuarios")
          .select("id, nombre, apellido")
          .in("id", userIds);

        if (userError) throw userError;

        // Map user info to comments
        const commentsWithUsers = commentsData.map((comment) => {
          const user = userData?.find((u) => u.id === comment.usuario_id);
          return {
            ...comment,
            usuario_nombre: user?.nombre || "Usuario",
            usuario_apellido: user?.apellido || "",
          };
        });

        setComments(commentsWithUsers);
      } else {
        setComments(commentsData);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Error al cargar los comentarios");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user?.id) return;
    
    setIsSending(true);
    try {
      // Insert comment
      const { error } = await supabase.from("lead_comentarios").insert({
        lead_id: lead.id,
        usuario_id: user.id,
        contenido: newComment.trim(),
      });

      if (error) throw error;

      // Insert into history
      await supabase.from("lead_history").insert({
        lead_id: lead.id,
        campo: "comentario",
        valor_nuevo: "Nuevo comentario agregado",
        usuario_id: user.id,
      });

      // Update last interaction
      await supabase
        .from("leads")
        .update({ ultima_interaccion: new Date().toISOString() })
        .eq("id", lead.id);

      // Refresh comments and clear input
      await fetchComments();
      setNewComment("");
      
      // Invalidate leads query to refresh data
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-leads'] });
      
      toast.success("Comentario agregado correctamente");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Error al agregar el comentario");
    } finally {
      setIsSending(false);
    }
  };

  const getInitials = (nombre?: string, apellido?: string) => {
    if (!nombre) return "U";
    return `${nombre.charAt(0)}${apellido ? apellido.charAt(0) : ''}`;
  };

  return (
    <div className="space-y-4">
      {/* Add comment form */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Agregar un comentario..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px]"
              />
              
              <div className="flex justify-end">
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isSending}
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSending ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments list */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-medium mb-4">Comentarios</h3>
          
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Cargando comentarios...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay comentarios para este lead</p>
              <p className="text-sm">Sé el primero en agregar un comentario</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                      {getInitials(comment.usuario_nombre, comment.usuario_apellido)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium">
                        {comment.usuario_nombre} {comment.usuario_apellido}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(comment.created_at)}
                      </p>
                    </div>
                    
                    <p className="text-sm whitespace-pre-line">
                      {comment.contenido}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
