import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Settings, 
  Users,
  Building,
  LogOut,
  MessagesSquare,
  UserCircle,
  ChevronUp
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  useSidebar 
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppSidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

interface CompanyInfo {
  id: string;
  nombre: string;
  logo_url?: string | null;
  plan?: string;
}

export function AppSidebar({ isMobileOpen, setIsMobileOpen }: AppSidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { isCollapsed, setCollapsed } = useSidebar();
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      if (user?.companyId) {
        try {
          const { data, error } = await supabase
            .from('empresas')
            .select('id, nombre, logo_url')
            .eq('id', user.companyId)
            .single();
          
          if (error) {
            console.error("Error fetching company:", error);
            return;
          }
          
          if (data) {
            setCompanyInfo({
              id: data.id,
              nombre: data.nombre,
              logo_url: data.logo_url,
              plan: "Plan Básico"
            });
          }
        } catch (error) {
          console.error("Error in company fetch:", error);
        }
      }
    };

    fetchCompanyInfo();
  }, [user?.companyId]);

  // Efecto para cerrar el sidebar cuando se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        // Cerrar el sidebar cuando se hace clic fuera de él (en móvil)
        if (isMobile && isMobileOpen) {
          setIsMobileOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile, isMobileOpen, setIsMobileOpen]);

  const toggleCollapse = () => {
    setCollapsed(!isCollapsed);
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Modificado para que siempre cierre el sidebar móvil al hacer clic en un elemento
  const handleLinkClick = () => {
    // Siempre cerrar en móvil cuando se selecciona un elemento
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <Sidebar
        ref={sidebarRef}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r bg-card transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[70px]" : "w-[250px]",
          isMobile && !isMobileOpen && "translate-x-[-100%]",
          isMobile && isMobileOpen && "translate-x-0"
        )}
        defaultCollapsed={true}
      >
        <SidebarHeader className="h-16 px-3 py-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-medium">{user?.name || "Usuario"}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            )}
          </div>
        </SidebarHeader>

        <Separator />

        <SidebarContent className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1 p-2">
            <NavLink
              to="/dashboard/crm"
              icon={<LayoutDashboard size={20} />}
              label="CRM"
              isActive={location.pathname.includes("crm")}
              isCollapsed={isCollapsed}
              onClick={handleLinkClick}
            />
            <NavLink
              to="/dashboard/leads"
              icon={<Users size={20} />}
              label="Leads"
              isActive={location.pathname.includes("leads")}
              isCollapsed={isCollapsed}
              onClick={handleLinkClick}
            />
            <NavLink
              to="/dashboard/conversations"
              icon={<MessagesSquare size={20} />}
              label="Conversaciones"
              isActive={location.pathname.includes("conversations")}
              isCollapsed={isCollapsed}
              onClick={handleLinkClick}
              badge={5}
            />
          </nav>
        </SidebarContent>

        <SidebarFooter className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="mb-3 flex items-center gap-3 cursor-pointer hover:bg-accent/50 rounded-md p-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-md text-primary">
                  {companyInfo?.logo_url ? (
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={companyInfo.logo_url} alt={companyInfo.nombre} />
                      <AvatarFallback>
                        <Building size={16} />
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Building size={16} />
                  )}
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate text-base font-semibold">
                      CRM EAM
                    </span>
                    <span className="truncate text-xs btn-shine">
                      Versión 2.0
                    </span>
                  </div>
                )}
                {!isCollapsed && <ChevronUp size={14} className="ml-auto text-muted-foreground" />}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side={isCollapsed ? "right" : "top"} align="center" className="w-[200px]">
              <DropdownMenuItem className="gap-2" asChild>
                <Link to="/dashboard/perfil-empresa" onClick={handleLinkClick}>
                  <UserCircle size={16} />
                  <span>Perfil de empresa</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={handleLinkClick}>
                <Settings size={16} />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  handleLinkClick(); // Cerrar el sidebar
                  logout();
                }}
                className="gap-2 text-red-600 focus:text-red-600"
              >
                <LogOut size={16} />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
  badge?: number;
}

function NavLink({
  to,
  icon,
  label,
  isActive,
  isCollapsed,
  onClick,
  badge,
}: NavLinkProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
        isCollapsed && "justify-center"
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center",
          isActive && "text-foreground"
        )}
      >
        {icon}
      </span>
      {!isCollapsed && (
        <span className="flex-1 truncate transition-opacity duration-200 ease-in-out opacity-100">{label}</span>
      )}
      {!isCollapsed && badge && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          {badge}
        </span>
      )}
      {isCollapsed && badge && (
        <span className="absolute right-2 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          {badge}
        </span>
      )}
    </Link>
  );
}
