
import { useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/components/theme-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  BotIcon, 
  Settings, 
  LogOut, 
  Moon, 
  Sun,
  Building
} from "lucide-react";

type AppSidebarProps = {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
};

export function AppSidebar({ isMobileOpen, setIsMobileOpen }: AppSidebarProps) {
  const { user, logout } = useAuth();
  const { setCollapsed, isCollapsed } = useSidebar();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Cerrar sidebar en móvil cuando se navega
  useEffect(() => {
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  }, [location, setIsMobileOpen, isMobileOpen]);

  // Cerrar sidebar en móvil cuando se hace clic fuera de ella
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobileOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileOpen, setIsMobileOpen]);

  // Clase para móvil
  const mobileClass = isMobileOpen
    ? "translate-x-0 fixed inset-y-0 left-0 z-50"
    : "-translate-x-full fixed inset-y-0 left-0 z-50 md:translate-x-0 md:relative md:inset-y-auto md:left-auto";

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div 
      ref={sidebarRef}
      className={`transition-transform duration-300 ${mobileClass}`}
    >
      <Sidebar className="h-screen border-r">
        {/* Perfil del usuario */}
        <div className="p-4 border-b border-border flex flex-col space-y-2">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={user?.avatarUrl} alt={user?.name} />
              <AvatarFallback>{user?.name ? getInitials(user.name) : "UN"}</AvatarFallback>
            </Avatar>
            <div className={`flex-1 overflow-hidden transition-opacity ${isCollapsed ? "opacity-0" : "opacity-100"}`}>
              <p className="font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          
          {!isCollapsed && (
            <div className="mt-2 flex items-center space-x-2">
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary">
                Pro
              </Badge>
              <span className="text-xs text-muted-foreground">14 días restantes</span>
            </div>
          )}
        </div>

        {/* Contenido del sidebar */}
        <SidebarContent className="p-0">
          {/* Navegación principal */}
          <SidebarGroup>
            {!isCollapsed && <SidebarGroupLabel className="px-4 pt-4">Principal</SidebarGroupLabel>}
            <SidebarGroupContent className="p-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/dashboard" 
                      className={({ isActive }) => 
                        `flex items-center space-x-3 p-2 rounded-md ${isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                    >
                      <LayoutDashboard size={20} />
                      <span className={`transition-opacity ${isCollapsed ? "opacity-0 hidden" : "opacity-100"}`}>Dashboard</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/leads" 
                      className={({ isActive }) => 
                        `flex items-center space-x-3 p-2 rounded-md ${isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                    >
                      <Users size={20} />
                      <span className={`transition-opacity ${isCollapsed ? "opacity-0 hidden" : "opacity-100"}`}>Leads</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/conversations" 
                      className={({ isActive }) => 
                        `flex items-center space-x-3 p-2 rounded-md ${isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                    >
                      <MessageSquare size={20} />
                      <span className={`transition-opacity ${isCollapsed ? "opacity-0 hidden" : "opacity-100"}`}>Conversaciones</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/chatbots" 
                      className={({ isActive }) => 
                        `flex items-center space-x-3 p-2 rounded-md ${isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                    >
                      <BotIcon size={20} />
                      <span className={`transition-opacity ${isCollapsed ? "opacity-0 hidden" : "opacity-100"}`}>Chatbots</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Configuración */}
          <SidebarGroup>
            {!isCollapsed && <SidebarGroupLabel className="px-4 pt-4">Configuración</SidebarGroupLabel>}
            <SidebarGroupContent className="p-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/settings" 
                      className={({ isActive }) => 
                        `flex items-center space-x-3 p-2 rounded-md ${isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                    >
                      <Settings size={20} />
                      <span className={`transition-opacity ${isCollapsed ? "opacity-0 hidden" : "opacity-100"}`}>Configuración</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Perfil de la empresa */}
        <div className={`mt-auto border-t border-border p-4 ${isCollapsed ? "pt-4" : ""}`}>
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src="/company-logo.png" alt="Company" />
              <AvatarFallback><Building size={18} /></AvatarFallback>
            </Avatar>
            <div className={`flex-1 overflow-hidden transition-opacity ${isCollapsed ? "opacity-0" : "opacity-100"}`}>
              <p className="font-medium truncate">Mi Empresa</p>
              <p className="text-xs text-muted-foreground truncate">info@miempresa.com</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <SidebarFooter className="border-t p-2">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme} 
              title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCollapsed(!isCollapsed)} 
              className="hidden md:flex"
              title={isCollapsed ? "Expandir" : "Colapsar"}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className={`transition-transform ${isCollapsed ? "rotate-180" : ""}`}
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={logout} 
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}
