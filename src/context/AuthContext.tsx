
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

// Tipos
type UserWithMeta = User & {
  onboardingCompleted: boolean;
  companyId?: string;
  name?: string;
  avatarUrl?: string;
};

type AuthContextType = {
  user: UserWithMeta | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<UserWithMeta>) => void;
  setOnboardingCompleted: () => void;
};

// Creamos el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Proveedor de autenticación
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserWithMeta | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar sesión y configurar listener de autenticación
  useEffect(() => {
    // Establecer listener para cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", event);
        setSession(newSession);
        
        if (newSession?.user) {
          // Obtener datos del perfil
          setTimeout(async () => {
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', newSession.user.id)
                .single();
              
              // Combinar datos de usuario y perfil
              setUser({
                ...newSession.user,
                name: profileData?.full_name || newSession.user.email?.split('@')[0] || '',
                onboardingCompleted: profileData?.onboarding_completed || false,
                companyId: profileData?.empresa_id || undefined,
                avatarUrl: profileData?.avatar_url || undefined
              });
            } catch (error) {
              console.error("Error fetching profile:", error);
            }
          }, 0);
        } else {
          setUser(null);
        }
      }
    );

    // Verificar sesión existente
    const checkSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Obtener datos del perfil
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentSession.user.id)
            .single();
          
          // Combinar datos de usuario y perfil
          setUser({
            ...currentSession.user,
            name: profileData?.full_name || currentSession.user.email?.split('@')[0] || '',
            onboardingCompleted: profileData?.onboarding_completed || false,
            companyId: profileData?.empresa_id || undefined,
            avatarUrl: profileData?.avatar_url || undefined
          });
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Función de login
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido a Prometheus CRM Nexus"
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error de inicio de sesión",
        description: error.message || "Credenciales inválidas",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Función de registro
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      });

      if (error) throw error;
      
      toast({
        title: "Registro exitoso",
        description: "Bienvenido a Prometheus CRM Nexus"
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error de registro",
        description: error.message || "No se pudo crear la cuenta",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Función de logout
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente"
      });
    } catch (error) {
      console.error("Error during logout:", error);
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive"
      });
    }
  };

  // Actualizar datos del usuario
  const updateUser = (data: Partial<UserWithMeta>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
    }
  };

  // Marcar onboarding como completado
  const setOnboardingCompleted = () => {
    if (user) {
      // Actualizar perfil en Supabase
      supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_step: 'completed'
        })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) {
            console.error("Error updating profile:", error);
            return;
          }
          
          // Actualizar estado local
          const updatedUser = { ...user, onboardingCompleted: true };
          setUser(updatedUser);
          
          toast({
            title: "Configuración completada",
            description: "¡Ahora puedes comenzar a utilizar todas las funciones!"
          });
        });
    }
  };

  const value = {
    user,
    session,
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
