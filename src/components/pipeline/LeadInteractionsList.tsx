
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Interaction {
  id: string;
  created_at: string;
  valor_score: number;
  lead_interaction_types?: {
    id: string;
    nombre: string;
    color: string;
  };
  notas?: string;
}

interface LeadInteractionsListProps {
  interactions: Interaction[];
  isLoading: boolean;
  formatDate: (date: string | null) => string;
}

export function LeadInteractionsList({ 
  interactions, 
  isLoading, 
  formatDate 
}: LeadInteractionsListProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Interacciones Recientes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start">
                <Skeleton className="h-5 w-5 rounded-full mr-3" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : interactions.length === 0 ? (
          <div className="text-center py-3 text-muted-foreground text-sm">
            No hay interacciones registradas
          </div>
        ) : (
          <div className="space-y-3">
            {interactions.slice(0, 5).map((interaction) => (
              <div 
                key={interaction.id} 
                className="flex items-start gap-3 p-3 border rounded-md hover:bg-muted/30 transition-colors"
                style={{ borderLeftWidth: 3, borderLeftColor: interaction.lead_interaction_types?.color || '#cccccc' }}
              >
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="text-sm font-medium flex items-center">
                      {interaction.lead_interaction_types?.nombre || "Interacción"}
                      <Badge 
                        variant="outline" 
                        className="ml-2 text-xs"
                        style={{ backgroundColor: `${interaction.lead_interaction_types?.color}20` }}
                      >
                        Valor: {interaction.valor_score}/10
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(interaction.created_at)}
                    </div>
                  </div>
                  
                  {interaction.notas && (
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {interaction.notas}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {interactions.length > 5 && (
              <Button variant="outline" size="sm" className="w-full">
                Ver todas las interacciones ({interactions.length})
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
