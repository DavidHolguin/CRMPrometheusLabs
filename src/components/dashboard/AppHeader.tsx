import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { MenuIcon, Search, Bell, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Importamos nuestros componentes
import { UserProfileMenu } from "@/components/dashboard/UserProfileMenu";

interface AppHeaderProps {
  toggleSidebar: () => void;
}

export function AppHeader({ toggleSidebar }: AppHeaderProps) {
  const location = useLocation();

  // Function to get breadcrumb items based on current route
  const getBreadcrumbItems = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    
    // Map of route segments to display names
    const routeNames: Record<string, string> = {
      'dashboard': 'Dashboard',
      'leads': 'Leads',
      'conversations': 'Conversaciones',
      'chatbots': 'Chatbots',
      'settings': 'Configuración',
      'crm': 'CRM',
      'canales': 'Canales',
      'marketing': 'Marketing',
      'analytics': 'Analíticas',
      'campaigns': 'Campañas',
      'content': 'Contenido',
      'audience': 'Audiencias',
      'competition': 'Competencia',
      'insights': 'Insights',
      'documentation': 'Documentación'
    };

    return segments.map((segment, index) => {
      const displayName = routeNames[segment] || segment;
      const isLast = index === segments.length - 1;
      const linkPath = `/${segments.slice(0, index + 1).join('/')}`;
      
      return {
        name: displayName,
        path: linkPath,
        isLast
      };
    });
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#020817] border-b">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Sección izquierda: Menú móvil y breadcrumbs */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar} 
            className="mr-2 md:hidden"
          >
            <MenuIcon className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar} 
            className="hidden md:flex"
          >
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        </div>
        
        {/* Sección derecha: Menú de marketing, notificaciones, buscador y perfil de usuario */}
        <div className="flex items-center space-x-4">

          
          {/* Botón de notificaciones */}
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-2 -right-2 flex items-center justify-center h-5 w-5 rounded-full p-0">
              <span className="text-xs">3</span>
            </Badge>
          </Button>
          
          {/* Buscador */}
          <div className="relative hidden md:block">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar..."
                className="w-[180px] appearance-none bg-background pl-8 shadow-none h-9 focus-visible:ring-1"
              />
            </div>
          </div>
          
          {/* Menu del perfil de usuario */}
          <UserProfileMenu />
        </div>
      </div>
    </header>
  );
}
