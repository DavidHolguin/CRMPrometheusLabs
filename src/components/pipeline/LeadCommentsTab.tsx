
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lead } from "@/hooks/useLeads";
import { useAuth } from "@/context/AuthContext";
import { Send } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Comment {
  id: string;
  author: {
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  replies?: Comment[];
}

interface LeadCommentsTabProps {
  lead: Lead;
  formatDate: (dateStr: string | null) => string;
}

export function LeadCommentsTab({ lead, formatDate }: LeadCommentsTabProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  
  // Mock comments for demonstration
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      author: {
        name: "Alex Rodriguez",
        avatar: "",
      },
      content: "Cliente interesado en el plan premium. Llamar mañana para confirmar detalles.",
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      replies: [
        {
          id: "2",
          author: {
            name: "María Gómez",
            avatar: "",
          },
          content: "Acabo de llamar y confirmó su interés. Ya envié la cotización por email.",
          timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        }
      ]
    },
    {
      id: "3",
      author: {
        name: "Carlos Mendez",
        avatar: "",
      },
      content: "Cliente solicitó información sobre plazos de entrega y garantías.",
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    }
  ]);
  
  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: Date.now().toString(),
      author: {
        name: user?.name || "Usuario",
        avatar: user?.avatarUrl,
      },
      content: newComment,
      timestamp: new Date().toISOString(),
    };
    
    setComments([comment, ...comments]);
    setNewComment("");
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
        {comments.map((comment) => (
          <div key={comment.id} className="space-y-3">
            <div className="bg-card rounded-md p-4 border shadow-sm">
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.author.avatar || ""} />
                  <AvatarFallback>{getInitials(comment.author.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className="font-medium">{comment.author.name}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(comment.timestamp)}</span>
                  </div>
                  <p className="mt-1 text-sm">{comment.content}</p>
                </div>
              </div>
            </div>
            
            {comment.replies?.map((reply) => (
              <div key={reply.id} className="bg-muted/50 rounded-md p-3 border shadow-sm ml-8">
                <div className="flex gap-3">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={reply.author.avatar || ""} />
                    <AvatarFallback>{getInitials(reply.author.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-sm">{reply.author.name}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(reply.timestamp)}</span>
                    </div>
                    <p className="mt-1 text-xs">{reply.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
