import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

// Componente que protege rutas administrativas verificando el rol del usuario
export const ProtectedAdminRoute = () => {
  const { user, isLoading } = useAuth();
  
  // Mostrar estado de carga mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="animate-pulse text-primary">Cargando...</div>
      </div>
    );
  }

  // Verificar si el usuario está autenticado y tiene los roles necesarios
  const isAdmin = user && (user.role === "admin" || user.role === "admin_empresa");
  
  // Si no es admin, redirigir al dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Si es admin, permitir acceso a las rutas protegidas
  return <Outlet />;
};