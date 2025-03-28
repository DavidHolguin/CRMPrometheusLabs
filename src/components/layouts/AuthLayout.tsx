
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const AuthLayout = () => {
  const { user, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-pulse text-primary">Cargando...</div>
      </div>
    );
  }

  // Redirect if already authenticated
  if (user) {
    if (!user.onboardingCompleted) {
      return <Navigate to="/onboarding" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return (
    <div className="h-full w-full">
      <div className="flex h-full w-full flex-col md:flex-row">
        {/* Lado izquierdo - Imagen/Branding */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary/20 to-primary/5 items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          <div className="relative z-10 text-center p-8">
            <div className="mb-6">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Prometheus CRM Nexus
              </h1>
              <p className="text-muted-foreground mt-2">
                La plataforma de CRM con IA más avanzada
              </p>
            </div>
            <div className="space-y-4 text-left max-w-md mx-auto">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <p className="text-sm text-foreground/80">Integración con múltiples canales</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="14" x="2" y="3" rx="2" />
                    <line x1="8" x2="16" y1="21" y2="21" />
                    <line x1="12" x2="12" y1="17" y2="21" />
                  </svg>
                </div>
                <p className="text-sm text-foreground/80">Chatbots impulsados por IA</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                </div>
                <p className="text-sm text-foreground/80">Gestión avanzada de leads</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lado derecho - Formulario */}
        <div className="flex flex-1 items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
