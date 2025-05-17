import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useMarketingForms } from "@/hooks/marketing/useMarketingForms";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Trash2, ArrowRight, Save, X, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CampoFormulario {
  id: string;
  label: string;
  tipo: string;
  requerido: boolean;
  opciones?: string[];
}

interface CrearFormularioProps {
  onClose: () => void;
  onSuccess: (formId: string) => void;
  formularioExistente?: any; // Para edición
}

const tiposCampo = [
  { value: 'texto', label: 'Texto' },
  { value: 'email', label: 'Email' },
  { value: 'numero', label: 'Número' },
  { value: 'telefono', label: 'Teléfono' },
  { value: 'fecha', label: 'Fecha' },
  { value: 'checkbox', label: 'Casilla de verificación' },
  { value: 'select', label: 'Desplegable' },
  { value: 'textarea', label: 'Área de texto' },
];

const CrearFormulario = ({ onClose, onSuccess, formularioExistente }: CrearFormularioProps) => {
  const [activeTab, setActiveTab] = useState("informacion");
  const [nombre, setNombre] = useState(formularioExistente?.nombre || "Nuevo Formulario");
  const [descripcion, setDescripcion] = useState(formularioExistente?.descripcion || "Descripción del nuevo formulario");
  const [isActive, setIsActive] = useState(formularioExistente?.is_active !== false);
  const [campos, setCampos] = useState<CampoFormulario[]>(formularioExistente?.campos || []);
  const [nuevoCampo, setNuevoCampo] = useState<{label: string; tipo: string; requerido: boolean; opciones: string}>({
    label: '',
    tipo: 'texto',
    requerido: false,
    opciones: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const { createForm, updateForm } = useMarketingForms();
  const { toast } = useToast();

  // Generar ID u00fanico para nuevos campos
  const generarId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  };

  // Agregar un nuevo campo al formulario
  const agregarCampo = () => {
    if (!nuevoCampo.label.trim()) {
      toast({
        title: "Error",
        description: "El nombre del campo es obligatorio",
        variant: "destructive"
      });
      return;
    }

    const campoFormateado: CampoFormulario = {
      id: generarId(),
      label: nuevoCampo.label,
      tipo: nuevoCampo.tipo,
      requerido: nuevoCampo.requerido,
      ...(nuevoCampo.tipo === 'select' && { opciones: nuevoCampo.opciones.split(',').map(o => o.trim()) })
    };

    setCampos([...campos, campoFormateado]);
    setNuevoCampo({
      label: '',
      tipo: 'texto',
      requerido: false,
      opciones: ''
    });
  };

  // Eliminar un campo existente
  const eliminarCampo = (id: string) => {
    setCampos(campos.filter(campo => campo.id !== id));
  };

  // Manejar el envu00edo del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    // Usar los IDs correctos para pipeline y stage
    const pipelineId = "c645af13-8a8b-4cd3-b52d-f67fcd7ef018";
    const stageId = "1a0bc962-1fe3-43aa-a2b9-45f432f8a977";
    
    const formularioData = {
      nombre,
      descripcion,
      pipeline_id: pipelineId,
      stage_id: stageId,
      campos,
      codigo_integracion: "",
      redirect_url: "",
      is_active: isActive
    };

    try {
      if (formularioExistente?.id) {
        // Estamos editando un formulario existente
        updateForm.mutate(
          { id: formularioExistente.id, ...formularioData },
          {
            onSuccess: (data) => {
              toast({
                title: "Formulario actualizado",
                description: "Se ha actualizado el formulario correctamente."
              });
              onSuccess(data.id);
              setIsCreating(false);
            },
            onError: (error) => {
              console.error('Error al actualizar formulario:', error);
              toast({
                title: "Error",
                description: "No se pudo actualizar el formulario. Inténtalo de nuevo.",
                variant: "destructive"
              });
              setIsCreating(false);
            }
          }
        );
      } else {
        // Estamos creando un nuevo formulario
        createForm.mutate(formularioData, {
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
      }
    } catch (error) {
      console.error('Error al procesar formulario:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al procesar el formulario. Inténtalo de nuevo.",
        variant: "destructive"
      });
      setIsCreating(false);
    }
  };

  return (
    <Card className="w-full shadow-lg border-none">
      <CardHeader className="bg-gradient-to-r from-[#002AE0] to-[#0040FF] text-white rounded-t-lg">
        <CardTitle className="text-xl font-bold">
          {formularioExistente?.id ? "Editar formulario" : "Crear nuevo formulario"}
        </CardTitle>
        <CardDescription className="text-gray-100">
          {formularioExistente?.id ? "Actualiza la información del formulario existente" : "Configura un nuevo formulario para capturar leads"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100">
            <TabsTrigger value="informacion" className="data-[state=active]:bg-white data-[state=active]:text-[#002AE0]">
              Información básica
            </TabsTrigger>
            <TabsTrigger value="campos" className="data-[state=active]:bg-white data-[state=active]:text-[#002AE0]">
              Campos del formulario
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="informacion" className="p-6 space-y-6">
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setActiveTab("campos"); }}>
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-gray-700 font-medium">Nombre del formulario</Label>
                <Input 
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  placeholder="Ej: Formulario de contacto"
                  className="border-gray-300 focus:border-[#002AE0] focus:ring-2 focus:ring-[#002AE0] focus:ring-opacity-30 transition-all duration-200"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descripcion" className="text-gray-700 font-medium">Descripción</Label>
                <Textarea 
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                  placeholder="Describe el propósito de este formulario"
                  className="border-gray-300 focus:border-[#002AE0] focus:ring-2 focus:ring-[#002AE0] focus:ring-opacity-30 transition-all duration-200"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="isActive" 
                  checked={isActive} 
                  onCheckedChange={setIsActive}
                  className="data-[state=checked]:bg-[#002AE0]"
                />
                <Label htmlFor="isActive" className="text-gray-700">
                  Formulario activo
                </Label>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-[#002AE0] hover:bg-blue-700 text-white"
              >
                Continuar <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="campos" className="p-6 space-y-6">
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h3 className="font-medium text-gray-800">Agregar nuevo campo</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="campoLabel" className="text-gray-700">Nombre del campo</Label>
                    <Input 
                      id="campoLabel"
                      value={nuevoCampo.label}
                      onChange={(e) => setNuevoCampo({...nuevoCampo, label: e.target.value})}
                      placeholder="Ej: Nombre completo"
                      className="border-gray-300 focus:border-[#002AE0] focus:ring-2 focus:ring-[#002AE0] focus:ring-opacity-30"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="campoTipo" className="text-gray-700">Tipo de campo</Label>
                    <Select 
                      value={nuevoCampo.tipo}
                      onValueChange={(value) => setNuevoCampo({...nuevoCampo, tipo: value})}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-[#002AE0] focus:ring-2 focus:ring-[#002AE0] focus:ring-opacity-30">
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposCampo.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {nuevoCampo.tipo === 'select' && (
                  <div className="space-y-2">
                    <Label htmlFor="campoOpciones" className="text-gray-700">Opciones (separadas por comas)</Label>
                    <Input 
                      id="campoOpciones"
                      value={nuevoCampo.opciones}
                      onChange={(e) => setNuevoCampo({...nuevoCampo, opciones: e.target.value})}
                      placeholder="Opción 1, Opción 2, Opción 3"
                      className="border-gray-300 focus:border-[#002AE0] focus:ring-2 focus:ring-[#002AE0] focus:ring-opacity-30"
                    />
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="campoRequerido" 
                    checked={nuevoCampo.requerido} 
                    onCheckedChange={(checked) => setNuevoCampo({...nuevoCampo, requerido: checked})}
                    className="data-[state=checked]:bg-[#002AE0]"
                  />
                  <Label htmlFor="campoRequerido" className="text-gray-700">
                    Campo obligatorio
                  </Label>
                </div>
                
                <Button 
                  type="button" 
                  onClick={agregarCampo}
                  className="bg-[#002AE0] hover:bg-blue-700 text-white"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Agregar campo
                </Button>
              </div>
              
              {/* Lista de campos */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-800">Campos configurados ({campos.length})</h3>
                
                {campos.length === 0 && (
                  <div className="text-center p-6 border border-dashed rounded-lg">
                    <p className="text-gray-500">No hay campos configurados. Agrega al menos un campo.</p>
                  </div>
                )}
                
                {campos.length > 0 && (
                  <div className="space-y-2">
                    {campos.map((campo) => (
                      <div key={campo.id} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-all">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-medium">{campo.label}</p>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <span>{tiposCampo.find(t => t.value === campo.tipo)?.label || campo.tipo}</span>
                              {campo.requerido && (
                                <Badge className="bg-[#002AE0]/10 text-[#002AE0] hover:bg-[#002AE0]/20 border-none">Obligatorio</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => eliminarCampo(campo.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setActiveTab("informacion")}
                className="border-[#002AE0] text-[#002AE0]"
              >
                Volver
              </Button>
              <Button 
                type="button" 
                onClick={handleSubmit} 
                disabled={isCreating || campos.length === 0}
                className="bg-[#002AE0] hover:bg-blue-700 text-white"
              >
                {isCreating ? (
                  <>Procesando...</>
                ) : formularioExistente?.id ? (
                  <>Guardar cambios <Save className="ml-2 h-4 w-4" /></>
                ) : (
                  <>Crear formulario <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CrearFormulario;
