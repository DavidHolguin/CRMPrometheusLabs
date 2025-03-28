
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

// Tipos
type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  onboardingCompleted: boolean;
  companyId?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  setOnboardingCompleted: () => void;
};

// Creamos el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Proveedor de autenticación
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simulamos la carga del usuario desde localStorage al iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem('prometheus-user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing user data from localStorage', error);
        localStorage.removeItem('prometheus-user');
      }
    }
    setIsLoading(false);
  }, []);

  // Función de login
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulamos una llamada a la API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Usuario simulado para desarrollo
      const mockUser: User = {
        id: '1',
        email,
        name: email.split('@')[0],
        onboardingCompleted: false
      };

      setUser(mockUser);
      localStorage.setItem('prometheus-user', JSON.stringify(mockUser));
      
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido a Prometheus CRM Nexus"
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error de inicio de sesión",
        description: "Credenciales inválidas",
        variant: "destructive"
      });
      throw new Error('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  // Función de registro
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulamos una llamada a la API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Usuario simulado para desarrollo
      const mockUser: User = {
        id: '1',
        email,
        name,
        onboardingCompleted: false
      };

      setUser(mockUser);
      localStorage.setItem('prometheus-user', JSON.stringify(mockUser));
      
      toast({
        title: "Registro exitoso",
        description: "Bienvenido a Prometheus CRM Nexus"
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error de registro",
        description: "No se pudo crear la cuenta",
        variant: "destructive"
      });
      throw new Error('Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Función de logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem('prometheus-user');
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente"
    });
  };

  // Actualizar datos del usuario
  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('prometheus-user', JSON.stringify(updatedUser));
    }
  };

  // Marcar onboarding como completado
  const setOnboardingCompleted = () => {
    if (user) {
      const updatedUser = { ...user, onboardingCompleted: true };
      setUser(updatedUser);
      localStorage.setItem('prometheus-user', JSON.stringify(updatedUser));
      
      toast({
        title: "Configuración completada",
        description: "¡Ahora puedes comenzar a utilizar todas las funciones!"
      });
    }
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    setOnboardingCompleted
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
