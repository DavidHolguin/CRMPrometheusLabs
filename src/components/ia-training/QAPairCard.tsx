import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Star, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

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
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState(pair.feedback || "");
  const [isExpanded, setIsExpanded] = useState(!pair.rating);

  const handleRate = (rating: number) => {
    onRate(rating);
    if (rating > 0) {
      setShowFeedback(true);
    }
  };

  const handleSubmitFeedback = () => {
    if (feedback.trim()) {
      onFeedback(feedback);
      setShowFeedback(false);
      setIsExpanded(false);
    }
  };

  if (!isExpanded && pair.rating) {
    return (
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= (pair.rating || 0)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium truncate max-w-[200px]">
              {pair.question}
            </span>
            {pair.evaluatedAt && (
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(pair.evaluatedAt), { locale: es, addSuffix: true })}
              </span>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={() => setIsExpanded(true)}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium">Pregunta:</p>
            <p className="text-sm text-muted-foreground">{pair.question}</p>
          </div>
          {pair.rating && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={() => setIsExpanded(false)}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium">Respuesta:</p>
          <p className="text-sm text-muted-foreground">{pair.answer}</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  className="hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-5 w-5 ${
                      star <= (pair.rating || 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {showFeedback && (
            <div className="space-y-2">
              <Textarea
                placeholder="¿Por qué diste esta calificación? (opcional)"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[80px] text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowFeedback(false);
                    setIsExpanded(false);
                  }}
                >
                  Omitir
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSubmitFeedback}
                  disabled={!feedback.trim()}
                >
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}