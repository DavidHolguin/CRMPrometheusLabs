
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

const OnboardingCompany = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  
  const [company, setCompany] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    description: ""
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompany(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!company.name || !company.email) {
      toast({
        title: "Error",
        description: "Por favor, complete los campos obligatorios",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulamos guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Actualizamos el usuario con la compañía
      updateUser({ 
        companyId: "company-1",
      });
      
      // Navegamos al siguiente paso
      navigate("/onboarding/services");
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los datos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Información de la empresa</h1>
        <p className="text-muted-foreground">
          Ingrese los detalles de su empresa para personalizar el sistema CRM
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre de la empresa <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={company.name}
              onChange={handleChange}
              placeholder="Mi Empresa S.A."
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">
              Correo electrónico <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={company.email}
              onChange={handleChange}
              placeholder="contacto@miempresa.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              name="phone"
              value={company.phone}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="website">Sitio web</Label>
            <Input
              id="website"
              name="website"
              value={company.website}
              onChange={handleChange}
              placeholder="https://www.miempresa.com"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address">Dirección</Label>
          <Input
            id="address"
            name="address"
            value={company.address}
            onChange={handleChange}
            placeholder="Av. Principal #123, Ciudad"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Descripción de la empresa</Label>
          <Textarea
            id="description"
            name="description"
            value={company.description}
            onChange={handleChange}
            placeholder="Describa brevemente a qué se dedica su empresa..."
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Esta información ayudará a los chatbots a entender mejor su negocio.
          </p>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => navigate("/onboarding")}>
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

export default OnboardingCompany;
