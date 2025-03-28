
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { BellIcon, MenuIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
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

  // Función para obtener el título basado en la ruta actual
  const getTitle = () => {
    const path = location.pathname;
    if (path.includes("/dashboard")) return "Dashboard";
    if (path.includes("/leads")) return "Leads";
    if (path.includes("/conversations")) return "Conversaciones";
    if (path.includes("/chatbots")) return "Chatbots";
    if (path.includes("/settings")) return "Configuración";
    return "Dashboard";
  };

  return (
    <header className="sticky top-0 z-20 w-full bg-background border-b">
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
        
        <div className="hidden md:flex">
          <h1 className="text-xl font-semibold">{getTitle()}</h1>
        </div>

        <div className="md:hidden flex-1 items-center justify-center flex">
          <h1 className="text-xl font-semibold">{getTitle()}</h1>
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
