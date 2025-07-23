import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { AppHeader } from "@/components/dashboard/AppHeader";
import { AdminNavbar } from "@/components/layouts/AdminNavbar";
import { useAuth } from "@/context/AuthContext";

const DashboardContent = () => {
  const { isCollapsed, setCollapsed } = useSidebar();
  const toggleCollapse = () => setCollapsed(!isCollapsed);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const {
    user,
    isLoading,
    session
  } = useAuth();
  const location = useLocation();
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center bg-[#020817]">
        <div className="animate-pulse text-primary">Cargando...</div>
      </div>;
  }

  // Redirect if not authenticated
  if (!session) {
    console.log("DashboardLayout - No session, redirecting to login");
    return <Navigate to="/login" replace state={{
      from: location
    }} />;
  }

  // Redirect if onboarding not completed
  // Solo redirigimos al onboarding si el usuario no es un agente
  if (user && !user.onboardingCompleted && user.role !== 'agente') {
    console.log("DashboardLayout - Onboarding not completed, redirecting to onboarding");
    return <Navigate to="/onboarding" replace />;
  }
  
  // Si el usuario es un agente pero no tiene el onboarding completado,
  // lo marcamos como completado automáticamente para evitar problemas futuros
  if (user && !user.onboardingCompleted && user.role === 'agente' && user.companyId) {
    // Solo registramos esto para debugging, la actualización real se hizo durante la creación
    console.log("DashboardLayout - Agent detected, onboarding auto-completed");
  }
  
  return (
      <div className="min-h-screen flex w-full bg-[#020817]">
        <AppSidebar isMobileOpen={isMobileSidebarOpen} setIsMobileOpen={setIsMobileSidebarOpen} />
        
        <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${isCollapsed ? 'ml-[70px] md:ml-[70px] max-w-[calc(100%-70px)]' : 'ml-[70px] md:ml-[250px] max-w-[calc(100%-250px)]'}`}>
          <AppHeader toggleSidebar={toggleCollapse} />
          <AdminNavbar />
          
          <main className="flex-1 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
  );
};

const DashboardLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const {
    user,
    isLoading,
    session
  } = useAuth();
  const location = useLocation();
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center bg-[#020817]">
        <div className="animate-pulse text-primary">Cargando...</div>
      </div>;
  }

  // Redirect if not authenticated
  if (!session) {
    console.log("DashboardLayout - No session, redirecting to login");
    return <Navigate to="/login" replace state={{
      from: location
    }} />;
  }

  // Redirect if onboarding not completed
  // Solo redirigimos al onboarding si el usuario no es un agente
  if (user && !user.onboardingCompleted && user.role !== 'agente') {
    console.log("DashboardLayout - Onboarding not completed, redirecting to onboarding");
    return <Navigate to="/onboarding" replace />;
  }
  
  // Si el usuario es un agente pero no tiene el onboarding completado,
  // lo marcamos como completado automáticamente para evitar problemas futuros
  if (user && !user.onboardingCompleted && user.role === 'agente' && user.companyId) {
    // Solo registramos esto para debugging, la actualización real se hizo durante la creación
    console.log("DashboardLayout - Agent detected, onboarding auto-completed");
  }
  
  return (
    <SidebarProvider defaultCollapsed={true}>
      <DashboardContent />
    </SidebarProvider>
  );
};

export default DashboardLayout;
