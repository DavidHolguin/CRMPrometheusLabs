
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
  Mail,
  LogOut
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

interface AppSidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export function AppSidebar({ isMobileOpen, setIsMobileOpen }: AppSidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
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
        defaultCollapsed={true}
      >
        <SidebarHeader className="px-3 py-2">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <svg className="h-6 w-6" viewBox="0 0 687 950" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill="currentColor" fillRule="evenodd" d="M334.285 24.772c21.759-7.49 78.815 33.13 97.652 43.307 32.754 17.692 61.04 34.963 92.984 52.201 155.797 84.068 137.902 67.655 137.902 153.164v148.463c0 135.443 18.342 105.008-111.409 179.669-163.09 93.842-148.751 105.057-148.747 10.75l.008-435.716c.072-34.627-3.537-86.725-59.864-85.898-26.093.38-161.118 80.112-192.197 97.254-33.238 18.336-68.952 27.595-69.249 75.633-.248 39.632-3.525 272.184 3.044 290.489 10.033 27.969 54.734 44.744 84.336 60.8 91.63 49.693 114.987 40.876 114.743 103.922l-.015 148.486c.007 86.699 11.493 78.401-189.565-55.063-57.465-38.146-69.805-33.202-69.68-77.109l.076-435.856c.005-86.63-8.964-96.952 29.157-117.796l70.068-39.526c41.23-22.4 184.816-108.24 210.756-117.171v-.003Zm-216.49 212.093c5.12-8.691 14.295-13.057 25.441-16.583.396-.423 1.133-1.619 1.304-1.165L336.428 114.97c56.436-10.201 43.221 70.712 43.221 103.609 0 58.467-2.713 427.771.539 451.962 2.754 20.515 18.935 34.314 42.17 30.728L659.947 564.84c35.625-27.817 25.817-74.661 25.817-126.797l.245-222.942c-.596-22.067-12.436-36.35-30.579-47.851L366.309 4.228c-37.971-16.349-79.11 18.922-107.258 34.087-66.35 35.748-126.992 71.508-191.717 108.605-37.09 21.26-66.33 27.08-66.028 81.256L1.359 680.1c0 58.041-10.841 89.211 28.728 118.475l226.804 148.06c72.065 25.597 49.683-101.013 49.683-172.94 0-137.879 14.424-106.937-171.295-202.879-23.61-12.199-30.747-13.125-30.804-45.458l.14-226.094c-.003-31.201-5.759-55.063 13.18-62.401v.002Z" clipRule="evenodd"/>
                </svg>
              </div>
            )}
            {isCollapsed && (
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <svg className="h-6 w-6" viewBox="0 0 687 950" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill="currentColor" fillRule="evenodd" d="M334.285 24.772c21.759-7.49 78.815 33.13 97.652 43.307 32.754 17.692 61.04 34.963 92.984 52.201 155.797 84.068 137.902 67.655 137.902 153.164v148.463c0 135.443 18.342 105.008-111.409 179.669-163.09 93.842-148.751 105.057-148.747 10.75l.008-435.716c.072-34.627-3.537-86.725-59.864-85.898-26.093.38-161.118 80.112-192.197 97.254-33.238 18.336-68.952 27.595-69.249 75.633-.248 39.632-3.525 272.184 3.044 290.489 10.033 27.969 54.734 44.744 84.336 60.8 91.63 49.693 114.987 40.876 114.743 103.922l-.015 148.486c.007 86.699 11.493 78.401-189.565-55.063-57.465-38.146-69.805-33.202-69.68-77.109l.076-435.856c.005-86.63-8.964-96.952 29.157-117.796l70.068-39.526c41.23-22.4 184.816-108.24 210.756-117.171v-.003Zm-216.49 212.093c5.12-8.691 14.295-13.057 25.441-16.583.396-.423 1.133-1.619 1.304-1.165L336.428 114.97c56.436-10.201 43.221 70.712 43.221 103.609 0 58.467-2.713 427.771.539 451.962 2.754 20.515 18.935 34.314 42.17 30.728L659.947 564.84c35.625-27.817 25.817-74.661 25.817-126.797l.245-222.942c-.596-22.067-12.436-36.35-30.579-47.851L366.309 4.228c-37.971-16.349-79.11 18.922-107.258 34.087-66.35 35.748-126.992 71.508-191.717 108.605-37.09 21.26-66.33 27.08-66.028 81.256L1.359 680.1c0 58.041-10.841 89.211 28.728 118.475l226.804 148.06c72.065 25.597 49.683-101.013 49.683-172.94 0-137.879 14.424-106.937-171.295-202.879-23.61-12.199-30.747-13.125-30.804-45.458l.14-226.094c-.003-31.201-5.759-55.063 13.18-62.401v.002Z" clipRule="evenodd"/>
                </svg>
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
          {/* Información de la empresa */}
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              {user?.companyId ? "B" : "E"}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-medium">Mi Empresa</span>
                <span className="truncate text-xs text-muted-foreground">
                  Plan Básico
                </span>
              </div>
            )}
          </div>
          
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start",
              isCollapsed && "justify-center"
            )}
            onClick={() => logout()}
          >
            {isCollapsed ? (
              <LogOut size={18} />
            ) : (
              <>
                <LogOut size={18} className="mr-2" />
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
