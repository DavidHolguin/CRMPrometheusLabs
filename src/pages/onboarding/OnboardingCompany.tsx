
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Upload, ImageIcon, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

const OnboardingCompany = () => {
  const navigate = useNavigate();
  const { createCompany } = useAuth();
  
  const [company, setCompany] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    description: "",
    city: "",
    country: "",
    postalCode: ""
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompany(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo es demasiado grande. Máximo 5MB.",
        variant: "destructive",
      });
      return;
    }
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen.",
        variant: "destructive",
      });
      return;
    }
    
    setLogoFile(file);
    
    // Mostrar vista previa
    const objectUrl = URL.createObjectURL(file);
    setLogoUrl(objectUrl);
  };
  
  const removeLogo = () => {
    setLogoFile(null);
    if (logoUrl) URL.revokeObjectURL(logoUrl);
    setLogoUrl(null);
  };
  
  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return null;
    
    setLogoUploading(true);
    try {
      // Crear un nombre único para el archivo
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `company-logos/${fileName}`;
      
      // Subir a Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('logos')
        .upload(filePath, logoFile);
        
      if (uploadError) throw uploadError;
      
      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);
        
      return publicUrl;
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el logotipo",
        variant: "destructive",
      });
      return null;
    } finally {
      setLogoUploading(false);
    }
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
      // Subir logotipo si existe
      let uploadedLogoUrl = null;
      if (logoFile) {
        uploadedLogoUrl = await uploadLogo();
      }
      
      // Guardar datos de empresa en Supabase
      const companyId = await createCompany({
        ...company,
        logoUrl: uploadedLogoUrl
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
      
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Ejemplos de información</CardTitle>
          <CardDescription>
            Estos son ejemplos de información que podría incluir:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Empresa:</strong> TechSolutions S.A.</p>
            <p><strong>Descripción:</strong> Ofrecemos soluciones tecnológicas y servicios de consultoría para empresas en crecimiento.</p>
            <p><strong>Contacto:</strong> contacto@techsolutions.com | (555) 123-4567</p>
            <p><strong>Web:</strong> www.techsolutions.com</p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-2/3 space-y-6">
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
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  name="country"
                  value={company.country}
                  onChange={handleChange}
                  placeholder="España"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  name="city"
                  value={company.city}
                  onChange={handleChange}
                  placeholder="Madrid"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="postalCode">Código postal</Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  value={company.postalCode}
                  onChange={handleChange}
                  placeholder="28001"
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
          </div>
          
          <div className="w-full md:w-1/3 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo">Logotipo de la empresa</Label>
              <div className="border rounded-lg overflow-hidden">
                {logoUrl ? (
                  <div className="relative">
                    <img 
                      src={logoUrl} 
                      alt="Vista previa del logo" 
                      className="w-full aspect-square object-contain p-2 bg-slate-50 dark:bg-slate-900"
                    />
                    <button 
                      type="button"
                      onClick={removeLogo}
                      className="absolute top-2 right-2 p-1 rounded-full bg-destructive/90 text-white hover:bg-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label 
                    htmlFor="logo-upload" 
                    className="flex flex-col items-center justify-center h-48 cursor-pointer bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                    <span className="text-sm font-medium">Subir logotipo</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Formato JPG, PNG o SVG (máx. 5MB)
                    </span>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                      disabled={logoUploading}
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                El logotipo se mostrará en los chatbots y correos electrónicos.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => navigate("/onboarding")}>
            Anterior
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || logoUploading}
          >
            {isLoading || logoUploading ? "Guardando..." : "Continuar"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OnboardingCompany;
