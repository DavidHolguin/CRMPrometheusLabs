
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown, Tag, MessageSquare, Edit, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Lead } from "@/hooks/useLeads";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface LeadActionBarProps {
  lead: Lead;
  pipelines: {value: string, label: string}[];
  stages: {value: string, label: string, color?: string}[];
  tags: {id: string, nombre: string, color: string}[];
  onStageChange: (stageId: string) => void;
  onPipelineChange: (pipelineId: string) => void;
  onTagToggle: (tagId: string) => void;
}

export function LeadActionBar({ 
  lead, 
  pipelines, 
  stages, 
  tags,
  onStageChange,
  onPipelineChange,
  onTagToggle 
}: LeadActionBarProps) {
  const [pipelineOpen, setPipelineOpen] = useState(false);
  const [stageOpen, setStageOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#10b981");
  const queryClient = useQueryClient();
  
  // Array of predefined colors for tags
  const colorOptions = [
    "#10b981", // Green
    "#3b82f6", // Blue
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#6b7280", // Gray
  ];
  
  const handleNewTagSubmit = () => {
    if (!newTagName.trim()) return;
    
    // Here you'd normally make an API call to create a new tag
    toast.success(`Tag "${newTagName}" creado`);
    setNewTagName("");
    
    // Invalidate the tags query to refresh data
    queryClient.invalidateQueries({ queryKey: ["lead_tags"] });
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-3 flex flex-wrap md:flex-nowrap justify-between gap-2 z-10">
      <div className="flex gap-2 items-center">
        <Popover open={pipelineOpen} onOpenChange={setPipelineOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={pipelineOpen}
              className="justify-between min-w-[150px] text-xs md:text-sm"
            >
              {pipelines.find(p => p.value === lead.pipeline_id)?.label || "Pipeline..."}
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Buscar pipeline..." className="h-9" />
              <CommandList>
                <CommandEmpty>No hay resultados.</CommandEmpty>
                <CommandGroup>
                  {pipelines.map((pipeline) => (
                    <CommandItem
                      key={pipeline.value}
                      value={pipeline.value}
                      onSelect={() => {
                        onPipelineChange(pipeline.value);
                        setPipelineOpen(false);
                      }}
                    >
                      {pipeline.label}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          lead.pipeline_id === pipeline.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        <Popover open={stageOpen} onOpenChange={setStageOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={stageOpen}
              className="justify-between min-w-[150px] text-xs md:text-sm"
            >
              {stages.find(s => s.value === lead.stage_id)?.label || "Etapa..."}
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Buscar etapa..." className="h-9" />
              <CommandList>
                <CommandEmpty>No hay resultados.</CommandEmpty>
                <CommandGroup>
                  {stages.map((stage) => (
                    <CommandItem
                      key={stage.value}
                      value={stage.value}
                      onSelect={() => {
                        onStageChange(stage.value);
                        setStageOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color || "#ccc" }}></div>
                        {stage.label}
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          lead.stage_id === stage.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="flex gap-2 items-center flex-wrap">
        <div className="flex flex-wrap gap-1 max-w-[300px]">
          {lead.tags?.map(tag => (
            <Badge 
              key={tag.id} 
              style={{ backgroundColor: tag.color }}
              className="cursor-pointer"
              onClick={() => onTagToggle(tag.id)}
            >
              {tag.nombre}
            </Badge>
          ))}
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Tag className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Gestionar etiquetas</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Etiquetas disponibles</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <Badge 
                      key={tag.id} 
                      style={{ backgroundColor: tag.color }}
                      className={cn(
                        "cursor-pointer",
                        lead.tags?.some(t => t.id === tag.id) ? "opacity-100" : "opacity-60"
                      )}
                      onClick={() => onTagToggle(tag.id)}
                    >
                      {tag.nombre}
                      <Check
                        className={cn(
                          "ml-1 h-3 w-3",
                          lead.tags?.some(t => t.id === tag.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Añadir nueva etiqueta</h3>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Nombre de la etiqueta"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                  />
                  <div className="flex gap-1">
                    {colorOptions.map(color => (
                      <button 
                        key={color}
                        type="button"
                        className={cn(
                          "w-6 h-6 rounded-full",
                          selectedColor === color ? "ring-2 ring-offset-2 ring-primary" : ""
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleNewTagSubmit} disabled={!newTagName.trim()}>
                Crear etiqueta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex items-center">
        <Input
          placeholder="Enviar mensaje a este lead..."
          className="mr-2 h-9"
        />
        <Button size="sm" className="h-9">
          <Send className="h-4 w-4 mr-2" />
          Enviar
        </Button>
      </div>
    </div>
  );
}
