import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { 
  Star, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare, 
  MessageCircle, 
  Edit, 
  Check, 
  X,
  CornerDownRight
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";

interface QAPairProps {
  pair: {
    id: string;
    question: string;
    answer: string;
    rating?: number;
    feedback?: string;
    evaluatedAt?: string;
    evaluatedBy?: string;
  };
  onRate: (rating: number) => void;
  onFeedback: (feedback: string) => void;
}

export function QAPairCard({ pair, onRate, onFeedback }: QAPairProps) {
  const [isExpanded, setIsExpanded] = useState(!pair.rating);
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);
  const [feedback, setFeedback] = useState(pair.feedback || "");
  const [localRating, setLocalRating] = useState<number | undefined>(pair.rating);
  const [isRatingHovered, setIsRatingHovered] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  // Actualizar estado local cuando cambien las props
  useEffect(() => {
    setFeedback(pair.feedback || "");
    setLocalRating(pair.rating);
  }, [pair.feedback, pair.rating]);

  const handleRate = (rating: number) => {
    setLocalRating(rating);
    onRate(rating);
    
    // Si no hay feedback y es una calificación baja (1-2), sugerir añadir feedback
    if (!feedback && rating <= 2 && !isEditingFeedback) {
      setIsEditingFeedback(true);
    }
  };

  const handleFeedbackSave = () => {
    onFeedback(feedback);
    setIsEditingFeedback(false);
  };

  const handleFeedbackCancel = () => {
    setFeedback(pair.feedback || "");
    setIsEditingFeedback(false);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && !pair.feedback) {
      setIsEditingFeedback(true);
    }
  };

  const getStarLabel = (rating: number) => {
    switch(rating) {
      case 1: return "Deficiente";
      case 2: return "Regular";
      case 3: return "Bueno";
      case 4: return "Muy bueno";
      case 5: return "Excelente";
      default: return "";
    }
  };

  const renderStars = (interactive = true) => (
    <div className="flex gap-1 items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <TooltipProvider key={star}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={interactive ? () => handleRate(star) : undefined}
                onMouseEnter={interactive ? () => {
                  setIsRatingHovered(true);
                  setHoveredRating(star);
                } : undefined}
                onMouseLeave={interactive ? () => setIsRatingHovered(false) : undefined}
                className={cn(
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary",
                  interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"
                )}
                disabled={!interactive}
              >
                <Star
                  className={cn(
                    "h-5 w-5 transition-all", 
                    (isRatingHovered ? star <= hoveredRating : star <= (localRating || 0))
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  )}
                  strokeWidth={1.5}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {getStarLabel(star)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      {localRating && !isRatingHovered && (
        <span className="text-xs font-medium text-muted-foreground ml-1.5">
          {getStarLabel(localRating)}
        </span>
      )}
    </div>
  );

  // Versión comprimida para pares ya evaluados
  if (!isExpanded && pair.rating) {
    return (
      <Card className="border-l-4 border-l-primary/50 overflow-hidden hover:shadow-md transition-shadow">
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0">
              {renderStars(false)}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <p className="text-sm font-medium truncate">
                  {pair.question.length > 60 
                    ? pair.question.substring(0, 60) + "..."
                    : pair.question}
                </p>
              </div>
              
              {pair.feedback && (
                <div className="flex items-center gap-2 mt-1">
                  <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <p className="text-xs text-muted-foreground truncate">
                    {pair.feedback.length > 65
                      ? pair.feedback.substring(0, 65) + "..."
                      : pair.feedback}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
            {pair.evaluatedAt && (
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(pair.evaluatedAt), { locale: es, addSuffix: true })}
              </span>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={toggleExpand}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Versión expandida para evaluación y edición
  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200",
      pair.rating 
        ? "border-l-4 border-l-primary/50"
        : "border-l-4 border-l-yellow-500"
    )}>
      <div className="p-4 space-y-4">
        {/* Cabecera con pregunta */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold">Pregunta:</h4>
            </div>
            <p className="text-sm ml-6">{pair.question}</p>
          </div>
          
          {pair.rating && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 ml-2" 
              onClick={toggleExpand}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Respuesta */}
        <div className="space-y-2 border-l-2 border-primary/20 pl-4">
          <div className="flex items-center gap-2">
            <CornerDownRight className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Respuesta:</h4>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm whitespace-pre-wrap">{pair.answer}</p>
          </div>
        </div>

        {/* Sección de evaluación */}
        <div className="border-t pt-3 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Tu calificación</p>
              {renderStars(true)}
            </div>
            
            {pair.rating && !isEditingFeedback && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-2 gap-1"
                onClick={() => setIsEditingFeedback(true)}
              >
                <Edit className="h-3 w-3" />
                <span>{pair.feedback ? "Editar comentario" : "Añadir comentario"}</span>
              </Button>
            )}
          </div>

          {/* Sección de retroalimentación */}
          {(isEditingFeedback || pair.feedback) && (
            <div className="space-y-2">
              {isEditingFeedback ? (
                <div className="space-y-2">
                  <Textarea
                    placeholder="¿Por qué diste esta calificación? Tu retroalimentación ayudará a mejorar las respuestas del chatbot."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="min-h-[100px] text-sm"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleFeedbackCancel}
                      className="h-8 gap-1"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Cancelar</span>
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={handleFeedbackSave}
                      className="h-8 gap-1"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Guardar</span>
                    </Button>
                  </div>
                </div>
              ) : pair.feedback && (
                <div className="rounded-lg bg-muted/40 p-3 text-sm">
                  <p className="text-xs font-medium mb-1 text-muted-foreground">Tu comentario:</p>
                  <p>{pair.feedback}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}