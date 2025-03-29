
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading, session } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Timeout para evitar carga infinita
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimeout(true);
    }, 3000); // Reducimos a 3 segundos para mejor experiencia

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log("Index - Auth state:", { 
      isLoading, 
      session: session ? "exists" : "none", 
      user: user ? "exists" : "none",
      onboardingCompleted: user?.onboardingCompleted
    });

    if (!isLoading) {
      if (session) {
        if (user) {
          if (!user.onboardingCompleted) {
            console.log("Index - Redirecting to onboarding");
            navigate("/onboarding");
          } else {
            console.log("Index - Redirecting to dashboard");
            navigate("/dashboard");
          }
        } else if (loadingTimeout) {
          // Si hay sesión pero no hay usuario después del timeout, mostramos un error
          toast({
            title: "Error de carga",
            description: "No se pudo cargar el perfil de usuario. Intente nuevamente.",
            variant: "destructive",
          });
        }
      } else {
        console.log("Index - Redirecting to login");
        navigate("/login");
      }
    }
  }, [user, isLoading, session, navigate, loadingTimeout]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <h1 className="text-2xl font-semibold text-primary">Cargando aplicación</h1>
        </div>
        
        {loadingTimeout && (
          <div className="max-w-md space-y-4 px-4">
            <p className="text-muted-foreground">
              La aplicación está tardando más de lo esperado en cargar.
            </p>
            <Button 
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
              variant="outline"
              className="mt-2"
            >
              Reiniciar sesión
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
