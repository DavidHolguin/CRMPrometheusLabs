
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  BarChart2,
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  User, 
  Users,
  Mail
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
import { useMediaQuery } from "@/hooks/use-mobile";

interface AppSidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export function AppSidebar({ isMobileOpen, setIsMobileOpen }: AppSidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { isCollapsed, setCollapsed } = useSidebar();

  // Cambiar ancho del sidebar
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

  // Cerrar sidebar en móvil cuando se hace clic en un enlace
  const handleLinkClick = () => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Overlay para móviles */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r bg-card transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[70px]" : "w-[250px]",
          isMobile && !isMobileOpen && "translate-x-[-100%]",
          isMobile && isMobileOpen && "translate-x-0"
        )}
      >
        <SidebarHeader className="px-3 py-2">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  P
                </div>
                <span className="text-lg font-bold">Prometheus</span>
              </div>
            )}
            {isCollapsed && (
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                P
              </div>
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

          {/* Perfil del usuario */}
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

          {!isCollapsed && (
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                B
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-medium">Mi Empresa</span>
                <span className="truncate text-xs text-muted-foreground">
                  Plan Básico
                </span>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="mt-4 flex justify-center">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                B
              </div>
            </div>
          )}
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
              icon={<Mail size={20} />}
              label="Chatbots"
              isActive={location.pathname.includes("chatbots")}
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
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start",
              isCollapsed && "justify-center"
            )}
            onClick={() => logout()}
          >
            {isCollapsed ? (
              <User size={18} />
            ) : (
              <>
                <User size={18} className="mr-2" />
                Cerrar sesión
              </>
            )}
          </Button>
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
