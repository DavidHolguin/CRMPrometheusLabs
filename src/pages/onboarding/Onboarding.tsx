
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">¡Bienvenido a Prometheus CRM Nexus!</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Vamos a configurar su cuenta paso a paso para que pueda comenzar a utilizar
          todas las funcionalidades de nuestro CRM con IA.
        </p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 my-8">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="bg-primary/10 rounded-full p-4 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="m12 16 4-4-4-4"/>
              <path d="M8 12h8"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium">Configuración en 3 pasos simples</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Necesitamos algunos datos para personalizar su experiencia y configurar su primer chatbot IA.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">1</div>
                <span className="text-sm">Datos de su empresa</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">2</div>
                <span className="text-sm">Productos y servicios</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">3</div>
                <span className="text-sm">Configuración del chatbot</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button 
          size="lg" 
          onClick={() => navigate("/onboarding/company")}
          className="px-8"
        >
          Comenzar
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
