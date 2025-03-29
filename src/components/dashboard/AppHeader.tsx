
import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { BellIcon, MenuIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppHeaderProps {
  toggleSidebar: () => void;
}

export function AppHeader({ toggleSidebar }: AppHeaderProps) {
  const { logout } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
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
      'canales': 'Canales'
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
    <header className="sticky top-0 z-20 w-full bg-[#020817] border-b">
      <div className="flex h-16 items-center px-4 md:px-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className="mr-2 md:hidden"
        >
          <MenuIcon className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
        
        <div className="flex items-center gap-2">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbItems.map((item, index) => (
                <BreadcrumbItem key={index}>
                  {item.isLast ? (
                    <BreadcrumbPage>{item.name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={item.path}>{item.name}</Link>
                    </BreadcrumbLink>
                  )}
                  {!item.isLast && <BreadcrumbSeparator />}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        
        <div className="flex items-center space-x-2 ml-auto">
          {showSearch ? (
            <div className="relative">
              <Input
                className="w-[200px] md:w-[300px] pl-8"
                placeholder="Buscar..."
                autoFocus
                onBlur={() => setShowSearch(false)}
              />
              <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          ) : (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowSearch(true)}
            >
              <SearchIcon className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
              >
                <BellIcon className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center text-[10px] text-white">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-auto">
                {[1, 2, 3].map((i) => (
                  <DropdownMenuItem key={i} className="p-3 cursor-pointer">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-sm">Nuevo lead registrado</p>
                      <p className="text-xs text-muted-foreground">
                        Juan Pérez ha iniciado una conversación con tu chatbot
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Hace {i*5} minutos
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center text-primary">
                Ver todas las notificaciones
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
