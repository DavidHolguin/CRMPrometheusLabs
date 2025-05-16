import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useMarketingForms } from "@/hooks/marketing/useMarketingForms";

interface CrearFormularioProps {
  onClose: () => void;
  onSuccess: (formId: string) => void;
}

const CrearFormulario = ({ onClose, onSuccess }: CrearFormularioProps) => {
  const [nombre, setNombre] = useState("Nuevo Formulario");
  const [descripcion, setDescripcion] = useState("Descripción del nuevo formulario");
  const [isCreating, setIsCreating] = useState(false);
  const { createForm } = useMarketingForms();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    // Usar los IDs correctos para pipeline y stage
    const pipelineId = "c645af13-8a8b-4cd3-b52d-f67fcd7ef018";
    const stageId = "1a0bc962-1fe3-43aa-a2b9-45f432f8a977";
    
    const nuevoFormulario = {
      nombre,
      descripcion,
      pipeline_id: pipelineId,
      stage_id: stageId,
      codigo_integracion: "",
      redirect_url: "",
      is_active: true
    };

    try {
      createForm.mutate(nuevoFormulario, {
        onSuccess: (data) => {
          toast({
            title: "Formulario creado",
            description: "Se ha creado el formulario correctamente."
          });
          onSuccess(data.id);
          setIsCreating(false);
        },
        onError: (error) => {
          console.error('Error al crear formulario:', error);
          toast({
            title: "Error",
            description: "No se pudo crear el formulario. Inténtalo de nuevo.",
            variant: "destructive"
          });
          setIsCreating(false);
        }
      });
    } catch (error) {
      console.error('Error al crear formulario:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el formulario. Inténtalo de nuevo.",
        variant: "destructive"
      });
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-white">
      <h2 className="text-xl font-semibold">Crear nuevo formulario</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <Input 
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Descripción</label>
          <Textarea 
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isCreating}>
            {isCreating ? "Creando..." : "Crear formulario"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CrearFormulario;
