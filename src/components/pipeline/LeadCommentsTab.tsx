
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lead } from "@/hooks/useLeads";
import { useAuth } from "@/context/AuthContext";
import { Send, Reply } from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Skeleton } from "@/components/ui/skeleton";

interface Comment {
  id: string;
  contenido: string;
  created_at: string;
  is_private: boolean;
  parent_id: string | null;
  usuario: {
    id: string;
    full_name: string;
    avatar_url?: string;
    email: string;
  };
  replies?: Comment[];
}

interface LeadCommentsTabProps {
  lead: Lead;
  formatDate: (dateStr: string | null) => string;
}

export function LeadCommentsTab({ lead, formatDate }: LeadCommentsTabProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  
  useEffect(() => {
    if (lead?.id) {
      fetchComments();
    }
  }, [lead?.id]);
  
  const fetchComments = async () => {
    setIsLoading(true);
    try {
      // Fetch all comments for this lead
      const { data, error } = await supabase
        .from("lead_comments")
        .select(`
          id,
          contenido,
          created_at,
          is_private,
          parent_id,
          usuario:usuario_id(id, full_name, avatar_url, email)
        `)
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Organize comments into a tree structure (top-level comments and replies)
      const commentMap: Record<string, Comment> = {};
      const topLevelComments: Comment[] = [];
      
      data.forEach(comment => {
        commentMap[comment.id] = { ...comment, replies: [] };
      });
      
      data.forEach(comment => {
        if (comment.parent_id && commentMap[comment.parent_id]) {
          if (!commentMap[comment.parent_id].replies) {
            commentMap[comment.parent_id].replies = [];
          }
          commentMap[comment.parent_id].replies!.push(commentMap[comment.id]);
        } else if (!comment.parent_id) {
          topLevelComments.push(commentMap[comment.id]);
        }
      });
      
      setComments(topLevelComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Error al cargar los comentarios");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddComment = async () => {
    if (!newComment.trim() || !user?.id) return;
    
    try {
      const commentId = uuidv4();
      const { error } = await supabase
        .from("lead_comments")
        .insert({
          id: commentId,
          lead_id: lead.id,
          usuario_id: user.id,
          contenido: newComment,
          is_private: false
        });
        
      if (error) throw error;
      
      // Fetch the user info
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, email")
        .eq("id", user.id)
        .single();
        
      if (userError) throw userError;
      
      // Add new comment to state
      const newCommentObj: Comment = {
        id: commentId,
        contenido: newComment,
        created_at: new Date().toISOString(),
        is_private: false,
        parent_id: null,
        usuario: {
          id: userData.id,
          full_name: userData.full_name,
          avatar_url: userData.avatar_url,
          email: userData.email
        }
      };
      
      setComments(prev => [newCommentObj, ...prev]);
      setNewComment("");
      toast.success("Comentario añadido");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Error al añadir el comentario");
    }
  };
  
  const handleAddReply = async () => {
    if (!replyContent.trim() || !replyingTo || !user?.id) return;
    
    try {
      const replyId = uuidv4();
      const { error } = await supabase
        .from("lead_comments")
        .insert({
          id: replyId,
          lead_id: lead.id,
          usuario_id: user.id,
          contenido: replyContent,
          is_private: false,
          parent_id: replyingTo
        });
        
      if (error) throw error;
      
      // Fetch the user info
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, email")
        .eq("id", user.id)
        .single();
        
      if (userError) throw userError;
      
      // Add reply to state
      const newReply: Comment = {
        id: replyId,
        contenido: replyContent,
        created_at: new Date().toISOString(),
        is_private: false,
        parent_id: replyingTo,
        usuario: {
          id: userData.id,
          full_name: userData.full_name,
          avatar_url: userData.avatar_url,
          email: userData.email
        }
      };
      
      setComments(prevComments => {
        return prevComments.map(comment => {
          if (comment.id === replyingTo) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newReply]
            };
          }
          return comment;
        });
      });
      
      setReplyContent("");
      setReplyingTo(null);
      toast.success("Respuesta añadida");
    } catch (error) {
      console.error("Error adding reply:", error);
      toast.error("Error al añadir la respuesta");
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatarUrl || ""} />
            <AvatarFallback>{user?.name ? getInitials(user.name) : "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="Añadir un comentario sobre este lead..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] mb-2"
            />
            <div className="flex justify-end">
              <Button 
                size="sm"
                disabled={!newComment.trim()}
                onClick={handleAddComment}
              >
                <Send className="mr-2 h-4 w-4" />
                Enviar
              </Button>
            </div>
          </div>
        </div>
      </Card>
      
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-3">
                <div className="bg-card rounded-md p-4 border shadow-sm">
                  <div className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-3 w-1/6" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                </div>
                <div className="ml-8">
                  <Skeleton className="h-20 w-full rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No hay comentarios registrados
          </div>
        ) : (
          <div>
            {comments.map((comment) => (
              <div key={comment.id} className="space-y-3 mb-6">
                <div className="bg-card rounded-md p-4 border shadow-sm">
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.usuario?.avatar_url || ""} />
                      <AvatarFallback>{getInitials(comment.usuario?.full_name || "Usuario")}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="font-medium">{comment.usuario?.full_name || "Usuario"}</span>
                          <div className="text-xs text-muted-foreground">{comment.usuario?.email}</div>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                      </div>
                      <p className="mt-2 text-sm">{comment.contenido}</p>
                      <div className="mt-2 flex justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        >
                          <Reply className="mr-1 h-3 w-3" />
                          Responder
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {replyingTo === comment.id && (
                  <div className="ml-8 bg-muted/50 rounded-md p-3 border">
                    <div className="flex gap-3">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user?.avatarUrl || ""} />
                        <AvatarFallback>{user?.name ? getInitials(user.name) : "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea
                          placeholder="Escribe tu respuesta..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          className="min-h-[60px] mb-2 text-sm"
                        />
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent("");
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            size="sm"
                            disabled={!replyContent.trim()}
                            onClick={handleAddReply}
                          >
                            <Send className="mr-2 h-3 w-3" />
                            Responder
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-8 space-y-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="bg-muted/50 rounded-md p-3 border shadow-sm">
                        <div className="flex gap-3">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={reply.usuario?.avatar_url || ""} />
                            <AvatarFallback>{getInitials(reply.usuario?.full_name || "Usuario")}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <span className="font-medium text-sm">{reply.usuario?.full_name || "Usuario"}</span>
                                <div className="text-xs text-muted-foreground">{reply.usuario?.email}</div>
                              </div>
                              <span className="text-xs text-muted-foreground">{formatDate(reply.created_at)}</span>
                            </div>
                            <p className="mt-1 text-sm">{reply.contenido}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
