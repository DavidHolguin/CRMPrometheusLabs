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
  role?: string; // Añadir el campo role al tipo UserWithMeta
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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event);
        setSession(newSession);
        
        if (newSession?.user) {
          setTimeout(async () => {
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', newSession.user.id)
                .single();
              
              setUser({
                ...newSession.user,
                name: profileData?.full_name || newSession.user.email?.split('@')[0] || '',
                onboardingCompleted: profileData?.onboarding_completed || false,
                companyId: profileData?.empresa_id || undefined,
                avatarUrl: profileData?.avatar_url || undefined,
                role: profileData?.role // Incluir el rol del usuario
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

    const checkSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        
        if (currentSession?.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentSession.user.id)
            .single();
          
          setUser({
            ...currentSession.user,
            name: profileData?.full_name || currentSession.user.email?.split('@')[0] || '',
            onboardingCompleted: profileData?.onboarding_completed || false,
            companyId: profileData?.empresa_id || undefined,
            avatarUrl: profileData?.avatar_url || undefined,
            role: profileData?.role // Incluir el rol del usuario
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

  const logout = async () => {
    try {
      // First clear session state locally
      setUser(null);
      setSession(null);
      
      // Then try to sign out from Supabase
      const { error } = await supabase.auth.signOut({
        scope: 'local' // Use 'local' instead of 'global' to avoid requiring a valid session
      });
      
      if (error) {
        console.warn("Error from Supabase during logout:", error);
        // Continue with client-side logout even if there's a server error
      }
      
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente"
      });
    } catch (error) {
      console.error("Error during logout:", error);
      // Still consider the user logged out on the client side
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión localmente"
      });
    }
  };

  const updateUser = (data: Partial<UserWithMeta>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
    }
  };

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
          codigo_postal: companyData.postalCode,
          created_by: session.user.id // Set the created_by field to the current user's ID
        }])
        .select('id')
        .single();
        
      if (error) throw error;
      
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
  
  const saveServices = async (servicesData: any[]) => {
    if (!user?.companyId) throw new Error("No hay empresa asociada al usuario");
    
    try {
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
  
  const createChatbot = async (chatbotData: any) => {
    if (!user?.companyId) throw new Error("No hay empresa asociada al usuario");
    
    try {
      let uploadedAvatarUrl = null;
      
      if (chatbotData.avatarFile) {
        try {
          console.log("Preparing to upload avatar file to storage");
          
          const { data: bucketData, error: bucketError } = await supabase.storage
            .getBucket('avatars');
            
          if (bucketError) {
            console.error("Error checking avatars bucket:", bucketError.message);
            
            // Create the bucket if it doesn't exist
            if (bucketError.message.includes('The resource was not found')) {
              const { error: createError } = await supabase.storage.createBucket('avatars', {
                public: true
              });
              
              if (createError) {
                console.error("Error creating avatars bucket:", createError);
              } else {
                console.log("Created avatars bucket");
              }
            } else {
              console.log("Will continue without avatar upload");
            }
          } 
          
          // Proceed with file upload
          console.log("Proceeding with file upload");
          
          const fileExt = chatbotData.avatarFile.name.split('.').pop();
          const fileName = `chatbot-${Date.now()}.${fileExt}`;
          const filePath = `${fileName}`;
          
          const { error: uploadError, data } = await supabase.storage
            .from('avatars')
            .upload(filePath, chatbotData.avatarFile);
            
          if (uploadError) {
            console.error("Error uploading avatar:", uploadError);
          } else {
            console.log("Avatar uploaded successfully");
            
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(filePath);
              
            uploadedAvatarUrl = publicUrl;
            console.log("Public URL for avatar:", uploadedAvatarUrl);
          }
        } catch (uploadError) {
          console.error("Error during avatar upload process:", uploadError);
          // Continue with chatbot creation even if avatar upload fails
        }
      }
      
      let websiteChannelId = null;
      const { data: channelData, error: channelError } = await supabase
        .from('canales')
        .select('id')
        .eq('tipo', 'website')
        .maybeSingle();
        
      if (channelError) {
        console.error("Error fetching website channel:", channelError);
      } else if (channelData) {
        websiteChannelId = channelData.id;
        console.log("Found website channel with ID:", websiteChannelId);
      } else {
        console.log("No website channel found in database");
      }
      
      console.log("Creating chatbot with data:", {
        empresa_id: user.companyId,
        nombre: chatbotData.name,
        personalidad: chatbotData.persona,
        instrucciones: chatbotData.customInstructions,
        avatar_url: uploadedAvatarUrl
      });
      
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
        
      if (chatbotError) {
        console.error("Error creating chatbot:", chatbotError);
        throw chatbotError;
      }
      
      console.log("Chatbot created with ID:", chatbotResult.id);
      const chatbotId = chatbotResult.id;
      
      if (websiteChannelId) {
        console.log("Setting up chatbot channel integration with channel ID:", websiteChannelId);
        
        const { error: canalError } = await supabase
          .from('chatbot_canales')
          .insert([{
            chatbot_id: chatbotId,
            canal_id: websiteChannelId,
            configuracion: {
              mensaje_bienvenida: chatbotData.welcomeMessage
            },
            is_active: true
          }]);
            
        if (canalError) {
          console.error("Error creating chatbot channel integration:", canalError);
        } else {
          console.log("Chatbot channel integration created successfully");
        }
      }
      
      // Create chatbot context with all the new fields
      console.log("Creating chatbot context with general context, key points, and FAQs");
      
      const { error: contextoError } = await supabase
        .from('chatbot_contextos')
        .insert([{
          chatbot_id: chatbotId,
          tipo: 'general',
          contenido: chatbotData.contextData?.generalContext || '',
          welcome_message: chatbotData.welcomeMessage,
          personality: chatbotData.persona,
          general_context: chatbotData.contextData?.generalContext || '',
          communication_tone: chatbotData.communicationTone,
          main_purpose: chatbotData.mainPurpose,
          special_instructions: chatbotData.specialInstructions || chatbotData.customInstructions,
          key_points: chatbotData.keyPoints || [],
          qa_examples: chatbotData.faqs.map((faq: any) => ({
            question: faq.question,
            answer: faq.answer
          })),
          orden: 1
        }]);
          
      if (contextoError) {
        console.error("Error creating chatbot context:", contextoError);
      } else {
        console.log("Chatbot context created successfully");
      }
      
      const validFaqs = chatbotData.faqs.filter((faq: any) => 
        faq.question.trim() && faq.answer.trim()
      );
      
      if (validFaqs.length > 0) {
        console.log("Creating FAQs for the company");
        
        const { error: faqError } = await supabase
          .from('empresa_faqs')
          .insert(validFaqs.map((faq: any, index: number) => ({
            empresa_id: user.companyId,
            pregunta: faq.question,
            respuesta: faq.answer,
            orden: index
          })));
            
        if (faqError) {
          console.error("Error creating FAQs:", faqError);
        } else {
          console.log("FAQs created successfully");
        }
      }
      
      await setOnboardingCompleted();
      
      toast({
        title: "Chatbot creado",
        description: "El chatbot ha sido configurado correctamente"
      });
      
      return chatbotId;
    } catch (error: any) {
      console.error("Error creating chatbot:", error);
      toast({
        title: "Error",
        description: "No se pudo configurar el chatbot: " + (error.message || "Error desconocido"),
        variant: "destructive"
      });
      throw error;
    }
  };

  const setOnboardingCompleted = async () => {
    if (!user) {
      console.error("No user found when trying to complete onboarding");
      return Promise.reject("No user found");
    }
    
    try {
      console.log(`Marking onboarding as completed for user ${user.id}`);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_step: 'completed'
        })
        .eq('id', user.id);
        
      if (error) {
        console.error("Error updating profile:", error);
        return Promise.reject(error);
      }
      
      // Update local user state
      const updatedUser = { ...user, onboardingCompleted: true };
      setUser(updatedUser);
      
      console.log("Onboarding completed successfully");
      
      toast({
        title: "Configuración completada",
        description: "¡Ahora puedes comenzar a utilizar todas las funciones!"
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error("Error in setOnboardingCompleted:", error);
      return Promise.reject(error);
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
