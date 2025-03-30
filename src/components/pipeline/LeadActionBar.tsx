
import { Lead } from "@/hooks/useLeads";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface LeadActionBarProps {
  lead: Lead;
  pipelines: { value: string; label: string }[];
  stages: { value: string; label: string; color: string }[];
  tags: any[]; // Tipo de tags específico para tu app
  onStageChange: (stageId: string) => void;
  onPipelineChange: (pipelineId: string) => void;
  onTagToggle: (tagId: string) => void;
  className?: string;
}

export function LeadActionBar({
  lead,
  pipelines,
  stages,
  tags,
  onStageChange,
  onPipelineChange,
  onTagToggle,
  className
}: LeadActionBarProps) {
  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 h-16 bg-background border-t flex items-center justify-between px-4 z-50",
      className
    )}>
      <div className="flex items-center gap-2">
        <Select onValueChange={onPipelineChange} defaultValue={lead.pipeline_id || ''}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Pipeline" />
          </SelectTrigger>
          <SelectContent>
            {pipelines.map((pipeline) => (
              <SelectItem key={pipeline.value} value={pipeline.value}>
                {pipeline.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={onStageChange} defaultValue={lead.stage_id || ''}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Etapa" />
          </SelectTrigger>
          <SelectContent>
            {stages.map((stage) => (
              <SelectItem key={stage.value} value={stage.value}>
                <div className="flex items-center gap-2">
                  <span>{stage.label}</span>
                  {stage.color && (
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                      style={{ backgroundColor: stage.color, color: 'white' }}
                    >
                      {stage.label}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center gap-2">
        {tags && tags.length > 0 && (
          <div className="flex items-center gap-1">
            {tags.map(tag => (
              <Badge
                key={tag.id}
                variant={lead.tags?.some(t => t.id === tag.id) ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => onTagToggle(tag.id)}
                style={{
                  borderColor: tag.color || undefined,
                  color: lead.tags?.some(t => t.id === tag.id) ? 'white' : tag.color,
                  backgroundColor: lead.tags?.some(t => t.id === tag.id) ? tag.color : undefined,
                }}
              >
                {tag.nombre}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
