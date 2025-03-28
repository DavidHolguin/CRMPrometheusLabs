
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

interface Service {
  id: string;
  name: string;
  description: string;
  features: string[];
}

const OnboardingServices = () => {
  const navigate = useNavigate();
  const { saveServices } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([
    {
      id: "1",
      name: "",
      description: "",
      features: [""]
    }
  ]);

  // Agregar un nuevo servicio
  const addService = () => {
    setServices([
      ...services,
      {
        id: crypto.randomUUID(),
        name: "",
        description: "",
        features: [""]
      }
    ]);
  };

  // Eliminar un servicio
  const removeService = (serviceId: string) => {
    if (services.length === 1) {
      toast({
        title: "Advertencia",
        description: "Debe tener al menos un servicio o producto",
        variant: "destructive"
      });
      return;
    }
    
    setServices(services.filter(s => s.id !== serviceId));
  };

  // Actualizar un servicio
  const updateService = (serviceId: string, field: string, value: string) => {
    setServices(services.map(service => {
      if (service.id === serviceId) {
        return { ...service, [field]: value };
      }
      return service;
    }));
  };

  // Agregar una característica a un servicio
  const addFeature = (serviceId: string) => {
    setServices(services.map(service => {
      if (service.id === serviceId) {
        return {
          ...service,
          features: [...service.features, ""]
        };
      }
      return service;
    }));
  };

  // Eliminar una característica de un servicio
  const removeFeature = (serviceId: string, index: number) => {
    setServices(services.map(service => {
      if (service.id === serviceId) {
        const features = [...service.features];
        if (features.length > 1) {
          features.splice(index, 1);
          return { ...service, features };
        }
      }
      return service;
    }));
  };

  // Actualizar una característica
  const updateFeature = (serviceId: string, index: number, value: string) => {
    setServices(services.map(service => {
      if (service.id === serviceId) {
        const features = [...service.features];
        features[index] = value;
        return { ...service, features };
      }
      return service;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que todos los servicios tengan nombre
    const invalidServices = services.filter(s => !s.name.trim());
    if (invalidServices.length > 0) {
      toast({
        title: "Error",
        description: "Todos los servicios deben tener un nombre",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Guardar servicios/productos en Supabase
      await saveServices(services);
      
      // Navegamos al siguiente paso
      navigate("/onboarding/chatbot");
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los datos",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Productos y servicios</h1>
        <p className="text-muted-foreground">
          Ingrese los productos y servicios que ofrece su empresa
        </p>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Ejemplos de servicios</CardTitle>
          <CardDescription>
            Estos son ejemplos de cómo puede organizar sus servicios:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <p><strong>Nombre:</strong> Consultoría Marketing Digital</p>
              <p><strong>Descripción:</strong> Estrategias personalizadas para mejorar su presencia online.</p>
              <p><strong>Características:</strong></p>
              <ul className="list-disc list-inside ml-2 text-muted-foreground">
                <li>Análisis de competencia</li>
                <li>Estrategia de contenidos</li>
                <li>Optimización SEO</li>
                <li>Análisis de métricas</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {services.map((service, serviceIndex) => (
          <div 
            key={service.id} 
            className="p-6 border rounded-lg bg-card space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">
                {service.name ? service.name : `Producto/Servicio ${serviceIndex + 1}`}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeService(service.id)}
                disabled={services.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`service-name-${service.id}`}>
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`service-name-${service.id}`}
                  value={service.name}
                  onChange={(e) => updateService(service.id, "name", e.target.value)}
                  placeholder="Ej: Consultoría de Marketing"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`service-desc-${service.id}`}>
                  Descripción breve
                </Label>
                <Input
                  id={`service-desc-${service.id}`}
                  value={service.description}
                  onChange={(e) => updateService(service.id, "description", e.target.value)}
                  placeholder="Ej: Servicios de consultoría para mejorar su presencia digital"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label>Características clave</Label>
              
              {service.features.map((feature, featureIndex) => (
                <div key={featureIndex} className="flex items-center gap-2">
                  <Input
                    value={feature}
                    onChange={(e) => updateFeature(service.id, featureIndex, e.target.value)}
                    placeholder={`Característica ${featureIndex + 1}`}
                  />
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFeature(service.id, featureIndex)}
                    disabled={service.features.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => addFeature(service.id)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar característica
              </Button>
            </div>
          </div>
        ))}
        
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={addService}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar otro producto/servicio
          </Button>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => navigate("/onboarding/company")}>
            Anterior
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Continuar"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OnboardingServices;
