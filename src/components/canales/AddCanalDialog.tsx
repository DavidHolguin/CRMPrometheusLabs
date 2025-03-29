
import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Canal } from "@/hooks/useCanales";
import { CanalIcon, getCanalColor } from "./CanalIcon";
import { Plus } from "lucide-react";
import { useChatbots } from "@/hooks/useChatbots";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type AddCanalDialogProps = {
  canales: Canal[];
  onAdd: (canalId: string, chatbotId: string) => void;
};

export default function AddCanalDialog({ canales, onAdd }: AddCanalDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedCanalId, setSelectedCanalId] = useState<string>("");
  const [selectedChatbotId, setSelectedChatbotId] = useState<string>("");
  
  const { useChatbotsQuery } = useChatbots();
  const { data: chatbots = [] } = useChatbotsQuery();

  // Reset selecciones al abrir
  useEffect(() => {
    if (open) {
      setSelectedCanalId("");
      setSelectedChatbotId("");
    }
  }, [open]);

  // Manejar agregar
  const handleAdd = () => {
    if (selectedCanalId && selectedChatbotId) {
      onAdd(selectedCanalId, selectedChatbotId);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus size={16} />
          Conectar nuevo canal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Conectar nuevo canal</DialogTitle>
          <DialogDescription>
            Selecciona el canal que deseas conectar y el chatbot al que estará asociado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="chatbot-select">Selecciona un chatbot</Label>
            <Select value={selectedChatbotId} onValueChange={setSelectedChatbotId}>
              <SelectTrigger id="chatbot-select">
                <SelectValue placeholder="Seleccionar chatbot" />
              </SelectTrigger>
              <SelectContent>
                {chatbots.map((chatbot) => (
                  <SelectItem key={chatbot.id} value={chatbot.id}>
                    {chatbot.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Selecciona un canal</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {canales.map((canal) => {
                const bgColor = getCanalColor(canal.tipo);
                const isSelected = selectedCanalId === canal.id;
                
                return (
                  <Card 
                    key={canal.id}
                    className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedCanalId(canal.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${bgColor}`}>
                        <CanalIcon tipo={canal.tipo} size={20} />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{canal.nombre}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">{canal.descripcion}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleAdd}
            disabled={!selectedCanalId || !selectedChatbotId}
          >
            Conectar canal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
