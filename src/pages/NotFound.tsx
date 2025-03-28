
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: Usuario intentó acceder a una ruta inexistente:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-center space-y-6 max-w-md px-6">
        <div className="space-y-2">
          <h1 className="text-7xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-semibold">Página no encontrada</h2>
          <p className="text-muted-foreground">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>
        </div>
        
        <div className="bg-card p-6 rounded-lg border max-w-sm mx-auto">
          <p className="text-sm text-muted-foreground mb-4">
            ¿Quieres volver a una página existente?
          </p>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link to="/dashboard">Ir al Dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Volver al inicio</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
