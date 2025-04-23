import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useLLMConfigs } from "@/hooks/useLLMConfigs";
import { usePipelines } from "@/hooks/usePipelines";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bot, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BasicConfigTabProps {
  value: {
    nombre: string;
    descripcion: string;
    avatar_url: string;
    llm_configuracion_id: string;
    pipeline_id: string;
    stage_id: string;
  };
  onChange: (value: BasicConfigTabProps["value"]) => void;
}

export function BasicConfigTab({ value, onChange }: BasicConfigTabProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState(value.stage_id);
  const { llmConfigs = [], isLoading: isLoadingLLM } = useLLMConfigs();
  const { data: pipelines = [], isLoading: isLoadingPipelines } = usePipelines();
  
  // Encuentra el pipeline seleccionado
  const selectedPipeline = pipelines.find(p => p.id === value.pipeline_id);
  
  // Actualizar el stage_id cuando cambia el pipeline
  useEffect(() => {
    // Si hay un pipeline seleccionado y hay stages disponibles, seleccionar el primero por defecto
    if (value.pipeline_id && selectedPipeline?.stages?.length) {
      const firstStage = selectedPipeline.stages[0];
      setSelectedStageId(firstStage.id);
      handleChange("stage_id", firstStage.id);
    } else {
      setSelectedStageId("");
      handleChange("stage_id", "");
    }
  }, [value.pipeline_id, selectedPipeline]);

  const handleChange = (field: string, newValue: string) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.companyId) return;
    
    // Validar si es imagen
    if (!file.type.startsWith('image/')) {
      toast.error('El archivo debe ser una imagen');
      return;
    }
    
    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 2MB');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `chatbot-avatars/${Date.now()}.${fileExt}`;
      
      // Subir a Supabase Storage usando el bucket 'avatars' en lugar de 'public'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`chatbots/${user.companyId}/${fileName}`, file);
        
      if (uploadError) throw uploadError;
      
      // Obtener la URL pública desde el bucket 'avatars'
      const { data: publicUrl } = supabase.storage
        .from('avatars')
        .getPublicUrl(`chatbots/${user.companyId}/${fileName}`);
        
      if (publicUrl) {
        handleChange("avatar_url", publicUrl.publicUrl);
        toast.success('Avatar actualizado correctamente');
      }
    } catch (error) {
      console.error('Error al subir imagen:', error);
      toast.error('Error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <Avatar className="h-20 w-20 rounded-md border">
                {value.avatar_url ? (
                  <AvatarImage 
                    src={value.avatar_url} 
                    alt="Avatar del chatbot" 
                    className="object-cover"
                  />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary rounded-md">
                    <Bot size={30} />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="absolute -right-2 -bottom-2">
                <div className="relative">
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="h-8 w-8 rounded-full bg-background shadow-sm"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Upload size={16} />
                    )}
                  </Button>
                  <input
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-lg mb-1">Información básica</h3>
              <p className="text-sm text-muted-foreground">
                Configura información básica para identificar tu chatbot
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del chatbot</Label>
              <Input
                id="nombre"
                placeholder="Nombre del asistente virtual"
                value={value.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
                className="w-full"
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                Este nombre será visible para los usuarios
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                placeholder="Describe brevemente cuál es el propósito de este chatbot"
                value={value.descripcion || ""}
                onChange={(e) => handleChange("descripcion", e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                Máximo 200 caracteres
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-4">Configuración del modelo de IA</h3>
          
          <div className="space-y-2">
            <Label htmlFor="llm">Modelo de lenguaje (LLM)</Label>
            <Select
              value={value.llm_configuracion_id}
              onValueChange={(newValue) => handleChange("llm_configuracion_id", newValue)}
              disabled={isLoadingLLM}
            >
              <SelectTrigger className="w-full" id="llm">
                <SelectValue placeholder="Selecciona un modelo" />
              </SelectTrigger>
              <SelectContent>
                {llmConfigs.map((config) => (
                  <SelectItem key={config.id} value={config.id}>
                    {config.nombre} - {config.modelo}
                  </SelectItem>
                ))}
                {llmConfigs.length === 0 && !isLoadingLLM && (
                  <SelectItem value="none" disabled>
                    No hay modelos configurados
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Selecciona qué modelo de lenguaje usará este chatbot para generar respuestas
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-4">Configuración de pipeline</h3>
          
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="pipeline">Pipeline de leads</Label>
              <Select
                value={value.pipeline_id}
                onValueChange={(newValue) => handleChange("pipeline_id", newValue)}
                disabled={isLoadingPipelines}
              >
                <SelectTrigger className="w-full" id="pipeline">
                  <SelectValue placeholder="Selecciona un pipeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_pipeline">Ninguno (sin asignar)</SelectItem>
                  {pipelines.map((pipeline) => (
                    <SelectItem key={pipeline.id} value={pipeline.id}>
                      {pipeline.nombre}
                    </SelectItem>
                  ))}
                  {pipelines.length === 0 && !isLoadingPipelines && (
                    <SelectItem value="no_pipelines_available" disabled>
                      No hay pipelines disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Los leads generados por este chatbot serán asignados a este pipeline
              </p>
            </div>
            
            {value.pipeline_id && (
              <div className="space-y-2">
                <Label htmlFor="stage">Etapa inicial</Label>
                <Select
                  value={selectedStageId}
                  onValueChange={(newValue) => {
                    setSelectedStageId(newValue);
                    handleChange("stage_id", newValue);
                  }}
                  disabled={!selectedPipeline?.stages?.length}
                >
                  <SelectTrigger className="w-full" id="stage">
                    <SelectValue placeholder="Selecciona una etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedPipeline?.stages?.map((stage) => (
                      <SelectItem 
                        key={stage.id} 
                        value={stage.id}
                      >
                        <div className="flex items-center gap-2">
                          <span 
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: stage.color || '#888' }}
                          />
                          {stage.nombre}
                        </div>
                      </SelectItem>
                    ))}
                    {(!selectedPipeline?.stages || selectedPipeline.stages.length === 0) && (
                      <SelectItem value="none" disabled>
                        No hay etapas en este pipeline
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Etapa inicial en la que se ubicarán los leads
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}