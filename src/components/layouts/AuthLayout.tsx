import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const AuthLayout = () => {
  const { user, session, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-pulse text-primary">Cargando...</div>
      </div>
    );
  }

  // Redirect if already authenticated
  if (session) {
    if (user && !user.onboardingCompleted) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-primary/20" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <img src="/logo.svg" alt="Logo" className="h-8 w-8 mr-2" />
          Prometheus CRM
        </div>
        <div className="relative z-20 mt-auto">
          <h2 className="text-lg font-semibold tracking-tight">
            Simplifica tu atención al cliente con IA
          </h2>
          <p className="text-sm text-muted">
            Automatiza, analiza y mejora la experiencia de tus clientes con nuestro CRM potenciado con inteligencia artificial.
          </p>
        </div>
      </div>
      <div className="p-4 lg:p-8 h-full flex items-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
