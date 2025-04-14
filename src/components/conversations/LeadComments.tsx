import React from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LeadCommentProps {
  comment: any;
}

export const LeadComment: React.FC<LeadCommentProps> = ({ comment }) => {
  return (
    <div className="bg-accent/20 border border-accent rounded-md p-3 my-2">
      <div className="flex items-center gap-2 mb-1">
        <Avatar className="h-6 w-6">
          <AvatarImage src={comment.usuario?.avatar_url} />
          <AvatarFallback>{comment.usuario?.full_name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium">{comment.usuario?.full_name}</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {new Date(comment.created_at).toLocaleString()}
        </span>
      </div>
      <p className="text-sm">{comment.contenido}</p>
    </div>
  );
};

interface LeadCommentsProps {
  isLoading: boolean;
  comments: any[];
  onAddComment: () => void;
}

const LeadComments: React.FC<LeadCommentsProps> = ({ isLoading, comments, onAddComment }) => {
  return (
    <ScrollArea className="flex-1 p-4">
      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Cargando comentarios...</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center p-8">
          <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No hay comentarios registrados</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onAddComment}
            className="mt-3"
          >
            Añadir primer comentario
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map(comment => (
            <LeadComment key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </ScrollArea>
  );
};

export default LeadComments;