
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePipelines, PipelineStage } from "@/hooks/usePipelines";
import { Pencil } from "lucide-react";

interface EditStageDialogProps {
  stage: PipelineStage;
}

export function EditStageDialog({ stage }: EditStageDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(stage.nombre);
  const [description, setDescription] = useState(stage.descripcion || "");
  const [color, setColor] = useState(stage.color);
  const [probability, setProbability] = useState(stage.probabilidad.toString());
  const { updateStage } = usePipelines();

  useEffect(() => {
    if (open) {
      setName(stage.nombre);
      setDescription(stage.descripcion || "");
      setColor(stage.color);
      setProbability(stage.probabilidad.toString());
    }
  }, [open, stage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return;
    }
    
    updateStage(
      {
        id: stage.id,
        nombre: name,
        descripcion: description,
        color: color,
        probabilidad: parseInt(probability, 10) || 0,
      },
      {
        onSuccess: () => {
          setOpen(false);
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Pencil size={14} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Etapa</DialogTitle>
            <DialogDescription>
              Modifica la configuración de esta etapa.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descripción
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">
                Color
              </Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-14 h-10 p-1"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1"
                  placeholder="#RRGGBB"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="probability" className="text-right">
                Probabilidad (%)
              </Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                value={probability}
                onChange={(e) => setProbability(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Guardar Cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
