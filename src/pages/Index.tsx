
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading, session } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Timeout para evitar carga infinita
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimeout(true);
    }, 5000); // 5 segundos de espera máxima

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
        } else {
          // Si hay sesión pero no hay usuario, puede ser un problema de carga del perfil
          console.log("Index - Session exists but no user, waiting...");
        }
      } else {
        console.log("Index - Redirecting to login");
        navigate("/login");
      }
    }
  }, [user, isLoading, session, navigate]);

  // Si pasa demasiado tiempo en carga, ofrecer reset manual
  if (loadingTimeout && isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <div className="text-primary mb-4">Carga prolongada...</div>
        <button 
          onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors"
        >
          Reiniciar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <div className="animate-pulse text-primary mb-4">Cargando...</div>
      <div className="text-xs text-muted-foreground">
        Si la página no carga, intenta <button 
          onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}
          className="text-primary underline hover:text-primary/90"
        >
          reiniciar la sesión
        </button>
      </div>
    </div>
  );
};

export default Index;
