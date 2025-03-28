
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
    if (path === "/dashboard") return "Dashboard";
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
        
        <div className="hidden md:flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground mr-2">
            <svg className="h-6 w-6" viewBox="0 0 687 950" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" fillRule="evenodd" d="M334.285 24.772c21.759-7.49 78.815 33.13 97.652 43.307 32.754 17.692 61.04 34.963 92.984 52.201 155.797 84.068 137.902 67.655 137.902 153.164v148.463c0 135.443 18.342 105.008-111.409 179.669-163.09 93.842-148.751 105.057-148.747 10.75l.008-435.716c.072-34.627-3.537-86.725-59.864-85.898-26.093.38-161.118 80.112-192.197 97.254-33.238 18.336-68.952 27.595-69.249 75.633-.248 39.632-3.525 272.184 3.044 290.489 10.033 27.969 54.734 44.744 84.336 60.8 91.63 49.693 114.987 40.876 114.743 103.922l-.015 148.486c.007 86.699 11.493 78.401-189.565-55.063-57.465-38.146-69.805-33.202-69.68-77.109l.076-435.856c.005-86.63-8.964-96.952 29.157-117.796l70.068-39.526c41.23-22.4 184.816-108.24 210.756-117.171v-.003Zm-216.49 212.093c5.12-8.691 14.295-13.057 25.441-16.583.396-.423 1.133-1.619 1.304-1.165L336.428 114.97c56.436-10.201 43.221 70.712 43.221 103.609 0 58.467-2.713 427.771.539 451.962 2.754 20.515 18.935 34.314 42.17 30.728L659.947 564.84c35.625-27.817 25.817-74.661 25.817-126.797l.245-222.942c-.596-22.067-12.436-36.35-30.579-47.851L366.309 4.228c-37.971-16.349-79.11 18.922-107.258 34.087-66.35 35.748-126.992 71.508-191.717 108.605-37.09 21.26-66.33 27.08-66.028 81.256L1.359 680.1c0 58.041-10.841 89.211 28.728 118.475l226.804 148.06c72.065 25.597 49.683-101.013 49.683-172.94 0-137.879 14.424-106.937-171.295-202.879-23.61-12.199-30.747-13.125-30.804-45.458l.14-226.094c-.003-31.201-5.759-55.063 13.18-62.401v.002Z" clipRule="evenodd"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold">{getTitle()}</h1>
        </div>

        <div className="md:hidden flex-1 items-center justify-center flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground mr-2">
            <svg className="h-6 w-6" viewBox="0 0 687 950" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" fillRule="evenodd" d="M334.285 24.772c21.759-7.49 78.815 33.13 97.652 43.307 32.754 17.692 61.04 34.963 92.984 52.201 155.797 84.068 137.902 67.655 137.902 153.164v148.463c0 135.443 18.342 105.008-111.409 179.669-163.09 93.842-148.751 105.057-148.747 10.75l.008-435.716c.072-34.627-3.537-86.725-59.864-85.898-26.093.38-161.118 80.112-192.197 97.254-33.238 18.336-68.952 27.595-69.249 75.633-.248 39.632-3.525 272.184 3.044 290.489 10.033 27.969 54.734 44.744 84.336 60.8 91.63 49.693 114.987 40.876 114.743 103.922l-.015 148.486c.007 86.699 11.493 78.401-189.565-55.063-57.465-38.146-69.805-33.202-69.68-77.109l.076-435.856c.005-86.63-8.964-96.952 29.157-117.796l70.068-39.526c41.23-22.4 184.816-108.24 210.756-117.171v-.003Zm-216.49 212.093c5.12-8.691 14.295-13.057 25.441-16.583.396-.423 1.133-1.619 1.304-1.165L336.428 114.97c56.436-10.201 43.221 70.712 43.221 103.609 0 58.467-2.713 427.771.539 451.962 2.754 20.515 18.935 34.314 42.17 30.728L659.947 564.84c35.625-27.817 25.817-74.661 25.817-126.797l.245-222.942c-.596-22.067-12.436-36.35-30.579-47.851L366.309 4.228c-37.971-16.349-79.11 18.922-107.258 34.087-66.35 35.748-126.992 71.508-191.717 108.605-37.09 21.26-66.33 27.08-66.028 81.256L1.359 680.1c0 58.041-10.841 89.211 28.728 118.475l226.804 148.06c72.065 25.597 49.683-101.013 49.683-172.94 0-137.879 14.424-106.937-171.295-202.879-23.61-12.199-30.747-13.125-30.804-45.458l.14-226.094c-.003-31.201-5.759-55.063 13.18-62.401v.002Z" clipRule="evenodd"/>
            </svg>
          </div>
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
