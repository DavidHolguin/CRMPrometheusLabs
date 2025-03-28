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
  loginWithGoogle: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<UserWithMeta>) => void;
  setOnboardingCompleted: () => void;
  createCompany: (companyData: any) => Promise<string>;
  createChatbot: (chatbotData: any) => Promise<string>;
  saveServices: (servicesData: any[]) => Promise<void>;
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
      async (event, newSession) => {
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

  // Función para iniciar sesión con Google
  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      console.error("Error logging in with Google:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo iniciar sesión con Google",
        variant: "destructive"
      });
      throw error;
    }
  };

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

  // Función de registro - modificada para mantener la sesión
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
          // No require email confirmation
          emailRedirectTo: `${window.location.origin}/onboarding`
        }
      });

      if (error) throw error;
      
      toast({
        title: "Registro exitoso",
        description: "Bienvenido a Prometheus CRM Nexus"
      });
      
      // No hace falta iniciar sesión porque signUp ya establece la sesión
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

  // Función para crear empresa
  const createCompany = async (companyData: any) => {
    if (!session?.user) throw new Error("Usuario no autenticado");
    
    try {
      const { data, error } = await supabase
        .from('empresas')
        .insert([{
          nombre: companyData.name,
          descripcion: companyData.description,
          email: companyData.email,
          telefono: companyData.phone,
          sitio_web: companyData.website,
          direccion: companyData.address,
          logo_url: companyData.logoUrl,
          ciudad: companyData.city,
          pais: companyData.country,
          codigo_postal: companyData.postalCode
        }])
        .select('id')
        .single();
        
      if (error) throw error;
      
      // Actualizamos el usuario con el ID de la empresa
      if (data.id) {
        updateUser({ companyId: data.id });
      }
      
      toast({
        title: "Empresa creada",
        description: "Información de empresa guardada correctamente"
      });
      
      return data.id;
    } catch (error: any) {
      console.error("Error creating company:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la información de la empresa",
        variant: "destructive"
      });
      throw error;
    }
  };
  
  // Función para guardar servicios
  const saveServices = async (servicesData: any[]) => {
    if (!user?.companyId) throw new Error("No hay empresa asociada al usuario");
    
    try {
      // Convertir servicios al formato correcto para empresa_productos
      const formattedServices = servicesData.map(service => ({
        empresa_id: user.companyId,
        nombre: service.name,
        descripcion: service.description,
        caracteristicas: service.features
      }));
      
      const { error } = await supabase
        .from('empresa_productos')
        .insert(formattedServices);
        
      if (error) throw error;
      
      toast({
        title: "Servicios guardados",
        description: "Los servicios se han guardado correctamente"
      });
    } catch (error: any) {
      console.error("Error saving services:", error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los servicios",
        variant: "destructive"
      });
      throw error;
    }
  };
  
  // Función para crear chatbot y contextos
  const createChatbot = async (chatbotData: any) => {
    if (!user?.companyId) throw new Error("No hay empresa asociada al usuario");
    
    try {
      // Verificar existencia del bucket de avatars antes de intentar subir
      let uploadedAvatarUrl = null;
      if (chatbotData.avatarUrl) {
        // Si ya tenemos una URL, usarla directamente
        uploadedAvatarUrl = chatbotData.avatarUrl;
      } else if (chatbotData.avatarFile) {
        try {
          // Verificar que el bucket exista antes de intentar subir
          const { data: bucketData, error: bucketError } = await supabase.storage
            .getBucket('avatars');
            
          if (!bucketError) {
            // Solo intentar subir si el bucket existe
            const fileExt = chatbotData.avatarFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `chatbot-avatars/${fileName}`;
            
            const { error: uploadError, data } = await supabase.storage
              .from('avatars')
              .upload(filePath, chatbotData.avatarFile);
              
            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);
                
              uploadedAvatarUrl = publicUrl;
            } else {
              console.error("Error uploading avatar:", uploadError);
            }
          } else {
            console.warn("Avatars bucket not available, skipping avatar upload");
          }
        } catch (uploadError) {
          console.error("Error during avatar upload process:", uploadError);
          // Continuar con la creación del chatbot incluso si falla la subida del avatar
        }
      }
      
      // 1. Crear el chatbot
      const { data: chatbotResult, error: chatbotError } = await supabase
        .from('chatbots')
        .insert([{
          empresa_id: user.companyId,
          nombre: chatbotData.name,
          personalidad: chatbotData.persona,
          instrucciones: chatbotData.customInstructions,
          avatar_url: uploadedAvatarUrl
        }])
        .select('id')
        .single();
        
      if (chatbotError) throw chatbotError;
      
      const chatbotId = chatbotResult.id;
      
      // 2. Verificar si la tabla canales existe y tiene el registro para website
      const { data: canalData, error: canalQueryError } = await supabase
        .from('canales')
        .select('id')
        .eq('tipo', 'website')
        .single();
        
      if (canalQueryError) {
        console.error("Error fetching website channel:", canalQueryError);
        // Crear un registro para website en la tabla canales si no existe
        const { data: newCanalData, error: newCanalError } = await supabase
          .from('canales')
          .insert([{
            tipo: 'website',
            nombre: 'Sitio Web',
            descripcion: 'Canal para chatbot en sitio web'
          }])
          .select('id')
          .single();
          
        if (newCanalError) {
          console.error("Error creating website channel:", newCanalError);
          throw new Error("No se pudo configurar el canal para el chatbot");
        }
        
        // Usar el nuevo canal creado
        const { error: canalError } = await supabase
          .from('chatbot_canales')
          .insert([{
            chatbot_id: chatbotId,
            canal_id: newCanalData.id,
            configuracion: {
              mensaje_bienvenida: chatbotData.welcomeMessage
            },
            is_active: true
          }]);
            
        if (canalError) throw canalError;
      } else {
        // Usar el canal existente
        const { error: canalError } = await supabase
          .from('chatbot_canales')
          .insert([{
            chatbot_id: chatbotId,
            canal_id: canalData.id,
            configuracion: {
              mensaje_bienvenida: chatbotData.welcomeMessage
            },
            is_active: true
          }]);
            
        if (canalError) throw canalError;
      }
      
      // 3. Crear contextos del chatbot si hay FAQs
      if (chatbotData.faqs && chatbotData.faqs.length > 0) {
        // Crear FAQs de empresa
        const { error: faqError } = await supabase
          .from('empresa_faqs')
          .insert(chatbotData.faqs.map((faq: any, index: number) => ({
            empresa_id: user.companyId,
            pregunta: faq.question,
            respuesta: faq.answer,
            orden: index
          })));
          
        if (faqError) throw faqError;
        
        // Añadir contexto de preguntas frecuentes
        const faqsText = chatbotData.faqs.map((faq: any) => 
          `Pregunta: ${faq.question}\nRespuesta: ${faq.answer}`
        ).join('\n\n');
        
        const { error: contextoError } = await supabase
          .from('chatbot_contextos')
          .insert([{
            chatbot_id: chatbotId,
            tipo: 'faqs',
            contenido: faqsText,
            orden: 1
          }]);
          
        if (contextoError) throw contextoError;
      }
      
      toast({
        title: "Chatbot creado",
        description: "El chatbot ha sido configurado correctamente"
      });
      
      return chatbotId;
    } catch (error: any) {
      console.error("Error creating chatbot:", error);
      toast({
        title: "Error",
        description: "No se pudo configurar el chatbot",
        variant: "destructive"
      });
      throw error;
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
    loginWithGoogle,
    register,
    logout,
    updateUser,
    setOnboardingCompleted,
    createCompany,
    saveServices,
    createChatbot
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
