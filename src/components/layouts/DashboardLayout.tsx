
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { AppHeader } from "@/components/dashboard/AppHeader";
import { useAuth } from "@/context/AuthContext";

const DashboardLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user, isLoading, session } = useAuth();
  const location = useLocation();

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-pulse text-primary">Cargando...</div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!session) {
    console.log("DashboardLayout - No session, redirecting to login");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Redirect if onboarding not completed
  if (user && !user.onboardingCompleted) {
    console.log("DashboardLayout - Onboarding not completed, redirecting to onboarding");
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar isMobileOpen={isMobileSidebarOpen} setIsMobileOpen={setIsMobileSidebarOpen} />
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <AppHeader toggleSidebar={toggleMobileSidebar} />
          
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
