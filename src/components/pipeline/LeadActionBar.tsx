
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown, Tag, Edit, Send, Plus, X, ArrowLeft, ArrowRight, GripVertical } from "lucide-react";
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
  const [isEditingTag, setIsEditingTag] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState("");
  const [editingTagColor, setEditingTagColor] = useState("");
  const [showTagManager, setShowTagManager] = useState(false);
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
  
  const startEditingTag = (tag: {id: string, nombre: string, color: string}) => {
    setIsEditingTag(true);
    setEditingTagId(tag.id);
    setEditingTagName(tag.nombre);
    setEditingTagColor(tag.color);
  };
  
  const saveTagEdit = () => {
    if (!editingTagId || !editingTagName.trim()) return;
    
    // Here you'd make an API call to update the tag
    toast.success(`Tag "${editingTagName}" actualizado`);
    setIsEditingTag(false);
    setEditingTagId(null);
    
    // Invalidate the tags query to refresh data
    queryClient.invalidateQueries({ queryKey: ["lead_tags"] });
  };
  
  const deleteTag = (tagId: string) => {
    // Here you'd make an API call to delete the tag
    toast.success(`Tag eliminado`);
    
    // Invalidate the tags query to refresh data
    queryClient.invalidateQueries({ queryKey: ["lead_tags"] });
  };
  
  const moveTag = (tagId: string, direction: 'left' | 'right') => {
    // This is just a UI representation. In a real app, you'd update the order in the database
    toast.info(`Reordenando etiquetas`);
    
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
              className="cursor-pointer group flex items-center gap-1"
              onClick={() => onTagToggle(tag.id)}
            >
              {tag.nombre}
              <span className="opacity-0 group-hover:opacity-100 transition-opacity pl-1">
                <X className="h-3 w-3" />
              </span>
            </Badge>
          ))}
        </div>
        
        <Dialog open={showTagManager} onOpenChange={setShowTagManager}>
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
                    <div 
                      key={tag.id}
                      className={cn(
                        "flex items-center gap-1 p-1 rounded transition-shadow",
                        editingTagId === tag.id ? "ring-2 ring-primary" : "hover:shadow"
                      )}
                    >
                      {isEditingTag && editingTagId === tag.id ? (
                        <>
                          <div className="flex items-center bg-background rounded border overflow-hidden">
                            <div 
                              className="w-5 h-5"
                              style={{ backgroundColor: editingTagColor }}
                            />
                            <Input 
                              value={editingTagName} 
                              onChange={(e) => setEditingTagName(e.target.value)}
                              className="h-7 w-[100px] border-0 focus-visible:ring-0"
                            />
                            <div className="flex">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 rounded-none"
                                onClick={saveTagEdit}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 rounded-none"
                                onClick={() => setIsEditingTag(false)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <Badge 
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
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => startEditingTag(tag)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => moveTag(tag.id, 'left')}
                            >
                              <ArrowLeft className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => moveTag(tag.id, 'right')}
                            >
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
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
                          "w-6 h-6 rounded-full transition-all",
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
