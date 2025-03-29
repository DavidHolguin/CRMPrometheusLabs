
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft } from "lucide-react";
import { CreateStageDialog } from "@/components/pipeline/CreateStageDialog";
import { Pipeline } from "@/hooks/usePipelines";

interface AddStageCardProps {
  showForm: boolean;
  onToggleForm: () => void;
  pipeline: Pipeline | undefined;
  onComplete: () => void;
}

export function AddStageCard({ showForm, onToggleForm, pipeline, onComplete }: AddStageCardProps) {
  if (showForm) {
    return (
      <div className="flex flex-col h-full overflow-hidden rounded-lg border border-border/40 shadow-sm bg-card/90 backdrop-blur-sm">
        <div className="p-3 border-b border-border/20 flex justify-between">
          <h3 className="font-medium">Nueva Etapa</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={onToggleForm}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4 flex-1">
          {pipeline && (
            <CreateStageDialog 
              pipeline={pipeline} 
              onComplete={onComplete} 
            />
          )}
        </div>
      </div>
    );
  }
  
  return (
    <Button 
      variant="outline" 
      className="h-full w-full border-dashed flex flex-col items-center justify-center gap-2 rounded-lg hover:bg-muted/50"
      onClick={onToggleForm}
    >
      <Plus className="h-8 w-8 text-muted-foreground" />
      <span className="text-muted-foreground">Agregar Etapa</span>
    </Button>
  );
}
