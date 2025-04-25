import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  Users,
  Building,
  LogOut,
  MessagesSquare,
  Database,
  Link2,
  Brain,
  UserCircle,
  ChevronDown,
  ChevronUp,
  Sparkles
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
        <SidebarHeader className="px-3 py-2">
          <div className="flex items-center justify-between">
            {!isCollapsed ? (
              <svg className="h-9 w-9 logo-animation" viewBox="0 0 687 950" fill="currentColor" stroke="white" strokeWidth="6" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M334.285 24.772c21.759-7.49 78.815 33.13 97.652 43.307 32.754 17.692 61.04 34.963 92.984 52.201 155.797 84.068 137.902 67.655 137.902 153.164v148.463c0 135.443 18.342 105.008-111.409 179.669-163.09 93.842-148.751 105.057-148.747 10.75l.008-435.716c.072-34.627-3.537-86.725-59.864-85.898-26.093.38-161.118 80.112-192.197 97.254-33.238 18.336-68.952 27.595-69.249 75.633-.248 39.632-3.525 272.184 3.044 290.489 10.033 27.969 54.734 44.744 84.336 60.8 91.63 49.693 114.987 40.876 114.743 103.922l-.015 148.486c.007 86.699 11.493 78.401-189.565-55.063-57.465-38.146-69.805-33.202-69.68-77.109l.076-435.856c.005-86.63-8.964-96.952 29.157-117.796l70.068-39.526c41.23-22.4 184.816-108.24 210.756-117.171v-.003Zm-216.49 212.093c5.12-8.691 14.295-13.057 25.441-16.583.396-.423 1.133-1.619 1.304-1.165L336.428 114.97c56.436-10.201 43.221 70.712 43.221 103.609 0 58.467-2.713 427.771.539 451.962 2.754 20.515 18.935 34.314 42.17 30.728L659.947 564.84c35.625-27.817 25.817-74.661 25.817-126.797l.245-222.942c-.596-22.067-12.436-36.35-30.579-47.851L366.309 4.228c-37.971-16.349-79.11 18.922-107.258 34.087-66.35 35.748-126.992 71.508-191.717 108.605-37.09 21.26-66.33 27.08-66.028 81.256L1.359 680.1c0 58.041-10.841 89.211 28.728 118.475l226.804 148.06c72.065 25.597 49.683-101.013 49.683-172.94 0-137.879 14.424-106.937-171.295-202.879-23.61-12.199-30.747-13.125-30.804-45.458l.14-226.094c-.003-31.201-5.759-55.063 13.18-62.401v.002Z" clipRule="evenodd"/>
              </svg>
            ) : (
              <svg className="h-9 w-9 logo-animation" viewBox="0 0 687 950" fill="currentColor" stroke="white" strokeWidth="6" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M334.285 24.772c21.759-7.49 78.815 33.13 97.652 43.307 32.754 17.692 61.04 34.963 92.984 52.201 155.797 84.068 137.902 67.655 137.902 153.164v148.463c0 135.443 18.342 105.008-111.409 179.669-163.09 93.842-148.751 105.057-148.747 10.75l.008-435.716c.072-34.627-3.537-86.725-59.864-85.898-26.093.38-161.118 80.112-192.197 97.254-33.238 18.336-68.952 27.595-69.249 75.633-.248 39.632-3.525 272.184 3.044 290.489 10.033 27.969 54.734 44.744 84.336 60.8 91.63 49.693 114.987 40.876 114.743 103.922l-.015 148.486c.007 86.699 11.493 78.401-189.565-55.063-57.465-38.146-69.805-33.202-69.68-77.109l.076-435.856c.005-86.63-8.964-96.952 29.157-117.796l70.068-39.526c41.23-22.4 184.816-108.24 210.756-117.171v-.003Zm-216.49 212.093c5.12-8.691 14.295-13.057 25.441-16.583.396-.423 1.133-1.619 1.304-1.165L336.428 114.97c56.436-10.201 43.221 70.712 43.221 103.609 0 58.467-2.713 427.771.539 451.962 2.754 20.515 18.935 34.314 42.17 30.728L659.947 564.84c35.625-27.817 25.817-74.661 25.817-126.797l.245-222.942c-.596-22.067-12.436-36.35-30.579-47.851L366.309 4.228c-37.971-16.349-79.11 18.922-107.258 34.087-66.35 35.748-126.992 71.508-191.717 108.605-37.09 21.26-66.33 27.08-66.028 81.256L1.359 680.1c0 58.041-10.841 89.211 28.728 118.475l226.804 148.06c72.065 25.597 49.683-101.013 49.683-172.94 0-137.879 14.424-106.937-171.295-202.879-23.61-12.199-30.747-13.125-30.804-45.458l.14-226.094c-.003-31.201-5.759-55.063 13.18-62.401v.002Z" clipRule="evenodd"/>
              </svg>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              onClick={toggleCollapse}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="mt-6 flex items-center gap-3">
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
          <nav className="flex flex-col gap-1">
            <NavLink
              to="/dashboard"
              icon={<LayoutDashboard size={20} />}
              label="Dashboard"
              isActive={location.pathname === "/dashboard"}
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
              icon={<MessageSquare size={20} />}
              label="Conversaciones"
              isActive={location.pathname.includes("conversations")}
              isCollapsed={isCollapsed}
              onClick={handleLinkClick}
              badge={3}
            />
            <NavLink
              to="/dashboard/chatbots"
              icon={<MessagesSquare size={20} />}
              label="Chatbots"
              isActive={location.pathname.includes("chatbots")}
              isCollapsed={isCollapsed}
              onClick={handleLinkClick}
            />
            <NavLink
              to="/dashboard/agentes-ia"
              icon={<Sparkles size={20} />}
              label="Agentes IA"
              isActive={location.pathname.includes("agentes-ia")}
              isCollapsed={isCollapsed}
              onClick={handleLinkClick}
            />
            <NavLink
              to="/dashboard/entrenamiento-ia"
              icon={<Brain size={20} />}
              label="Entrenamiento IA"
              isActive={location.pathname.includes("entrenamiento-ia")}
              isCollapsed={isCollapsed}
              onClick={handleLinkClick}
            />
            <NavLink
              to="/dashboard/crm"
              icon={<Database size={20} />}
              label="CRM"
              isActive={location.pathname.includes("crm")}
              isCollapsed={isCollapsed}
              onClick={handleLinkClick}
            />
            <NavLink
              to="/dashboard/canales"
              icon={<Link2 size={20} />}
              label="Integraciones"
              isActive={location.pathname.includes("canales")}
              isCollapsed={isCollapsed}
              onClick={handleLinkClick}
            />
            <NavLink
              to="/dashboard/settings"
              icon={<Settings size={20} />}
              label="Configuración"
              isActive={location.pathname.includes("settings")}
              isCollapsed={isCollapsed}
              onClick={handleLinkClick}
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
                      {companyInfo?.nombre || "Mi Empresa"}
                    </span>
                    <span className="truncate text-xs btn-shine">
                      CRM PROMETHEUS
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
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
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
        <span className="flex-1 truncate">{label}</span>
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
