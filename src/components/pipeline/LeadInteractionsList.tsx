
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Interaction {
  id: string;
  created_at: string;
  valor_score: number;
  lead_interaction_types?: {
    id: string;
    nombre: string;
    color: string;
  };
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Interacciones Recientes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-pulse h-24 w-full bg-muted rounded" />
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
                className="flex items-start gap-3 p-2 border-l-2 rounded-sm"
                style={{ borderLeftColor: interaction.lead_interaction_types?.color || '#cccccc' }}
              >
                <div>
                  <div className="text-sm font-medium">
                    {interaction.lead_interaction_types?.nombre || "Interacción"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(interaction.created_at)} · Valor: {interaction.valor_score}/10
                  </div>
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
