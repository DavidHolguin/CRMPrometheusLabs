import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Pipeline {
  id: string;
  nombre: string;
  descripcion: string;
}

interface Stage {
  id: string;
  nombre: string;
  pipeline_id: string;
  color: string;
}

interface PipelineSelectorProps {
  onPipelineChange: (pipelineId: string) => void;
  onStageChange: (stageId: string) => void;
  empresaId?: string;
  defaultPipelineId?: string;
  defaultStageId?: string;
}

export function PipelineSelector({
  onPipelineChange,
  onStageChange,
  empresaId,
  defaultPipelineId,
  defaultStageId,
}: PipelineSelectorProps) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(defaultPipelineId || "");
  const [selectedStageId, setSelectedStageId] = useState<string>(defaultStageId || "");

  // Cargar los pipelines
  useEffect(() => {
    const fetchPipelines = async () => {
      if (!empresaId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("pipelines")
          .select("id, nombre, descripcion")
          .eq("empresa_id", empresaId)
          .eq("is_active", true);

        if (error) throw error;

        if (data && data.length > 0) {
          setPipelines(data);
          // Si hay un pipeline por defecto, usarlo, de lo contrario usar el primer pipeline
          const pipelineId = defaultPipelineId || data[0].id;
          setSelectedPipelineId(pipelineId);
          onPipelineChange(pipelineId);
        }
      } catch (error) {
        console.error("Error cargando pipelines:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPipelines();
  }, [empresaId, defaultPipelineId, onPipelineChange]);

  // Cargar las etapas cuando cambie el pipeline seleccionado
  useEffect(() => {
    const fetchStages = async () => {
      if (!selectedPipelineId) {
        setStages([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("pipeline_stages")
          .select("id, nombre, color, pipeline_id")
          .eq("pipeline_id", selectedPipelineId)
          .eq("is_active", true)
          .order("posicion", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setStages(data);
          // Si hay un stage por defecto, usarlo, de lo contrario usar el primer stage
          const stageId = defaultStageId || data[0].id;
          setSelectedStageId(stageId);
          onStageChange(stageId);
        } else {
          setStages([]);
          setSelectedStageId("");
          onStageChange("");
        }
      } catch (error) {
        console.error("Error cargando etapas:", error);
      }
    };

    fetchStages();
  }, [selectedPipelineId, defaultStageId, onStageChange]);

  // Manejar cambio de pipeline
  const handlePipelineChange = (value: string) => {
    setSelectedPipelineId(value);
    onPipelineChange(value);
    // Resetear el stage seleccionado
    setSelectedStageId("");
  };

  // Manejar cambio de stage
  const handleStageChange = (value: string) => {
    setSelectedStageId(value);
    onStageChange(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Cargando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Select
          value={selectedPipelineId}
          onValueChange={handlePipelineChange}
          disabled={pipelines.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar pipeline" />
          </SelectTrigger>
          <SelectContent>
            {pipelines.length === 0 ? (
              <SelectItem value="no-pipelines" disabled>
                No hay pipelines disponibles
              </SelectItem>
            ) : (
              pipelines.map((pipeline) => (
                <SelectItem key={pipeline.id} value={pipeline.id}>
                  {pipeline.nombre}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Select
          value={selectedStageId}
          onValueChange={handleStageChange}
          disabled={stages.length === 0 || !selectedPipelineId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar etapa" />
          </SelectTrigger>
          <SelectContent>
            {stages.length === 0 ? (
              <SelectItem value="no-stages" disabled>
                No hay etapas disponibles
              </SelectItem>
            ) : (
              stages.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  <div className="flex items-center">
                    {stage.color && (
                      <span
                        className="h-3 w-3 rounded-full mr-2"
                        style={{ backgroundColor: stage.color }}
                      ></span>
                    )}
                    {stage.nombre}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}