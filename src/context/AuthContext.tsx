import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Profile } from "@/types/profile";
import { ChatbotCreationData } from "@/types/chatbot";

interface AuthContextType {
  user: Profile | null;
  session: any | null;
  isLoading: boolean;
  signUp: (data: any) => Promise<any>;
  signIn: (data: any) => Promise<any>;
  signOut: () => Promise<void>;
  updateUser: (data: any) => Promise<void>;
  createChatbot: (chatbotData: ChatbotCreationData) => Promise<void>;
  setOnboardingCompleted: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [isLoading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        if (session) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            throw profileError;
          }

          setUser(profileData);
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          throw profileError;
        }
        setUser(profileData);
      } else {
        setUser(null);
      }
    });
  }, []);

  const signUp = async (data: any) => {
    try {
      setLoading(true);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user?.id,
          email: data.email,
          full_name: data.fullName,
        })
        .select()
        .single();

      if (profileError) {
        throw profileError;
      }

      setUser(profileData);
      navigate('/onboarding');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (data: any) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      navigate('/login');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (data: any) => {
    try {
      setLoading(true);

      const updates = {
        id: user?.id,
        full_name: data.fullName,
        avatar_url: data.avatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) {
        throw error;
      }

      setUser({ ...user, ...data });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createChatbot = async (chatbotData: ChatbotCreationData) => {
    try {
      setLoading(true);
      
      // Upload avatar if provided
      let avatarUrl = null;
      if (chatbotData.avatarFile) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(`chatbot-${Date.now()}`, chatbotData.avatarFile, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(uploadData.path);
          
        avatarUrl = urlData.publicUrl;
      }
      
      // Create the chatbot
      const { data: chatbotData, error: chatbotError } = await supabase
        .from('chatbots')
        .insert({
          nombre: chatbotData.name,
          personalidad: chatbotData.persona,
          instrucciones: chatbotData.customInstructions || null,
          avatar_url: avatarUrl,
          empresa_id: user?.companyId
        })
        .select()
        .single();
        
      if (chatbotError) throw chatbotError;
      
      // Create the chatbot context with the new fields
      const { error: contextError } = await supabase
        .from('chatbot_contextos')
        .insert({
          chatbot_id: chatbotData.id,
          tipo: 'primary',
          contenido: chatbotData.customInstructions || '',
          welcome_message: chatbotData.welcomeMessage,
          personality: chatbotData.persona,
          communication_tone: 'professional',
          main_purpose: 'customer_support',
          key_points: JSON.stringify(chatbotData.faqs.map(faq => faq.question)),
          special_instructions: chatbotData.customInstructions || '',
          orden: 0
        });
        
      if (contextError) throw contextError;
      
      // Create FAQs as additional context entries if provided
      if (chatbotData.faqs && chatbotData.faqs.length > 0) {
        const validFaqs = chatbotData.faqs.filter(faq => faq.question.trim() && faq.answer.trim());
        
        if (validFaqs.length > 0) {
          // Add FAQs to empresa_faqs table
          const { error: faqsError } = await supabase
            .from('empresa_faqs')
            .insert(
              validFaqs.map((faq, index) => ({
                empresa_id: user?.companyId,
                pregunta: faq.question,
                respuesta: faq.answer,
                orden: index
              }))
            );
            
          if (faqsError) throw faqsError;
          
          // Also add FAQ examples to qa_examples in the context
          const { error: qaError } = await supabase
            .from('chatbot_contextos')
            .update({ 
              qa_examples: JSON.stringify(validFaqs.map(faq => ({
                question: faq.question,
                answer: faq.answer
              })))
            })
            .eq('chatbot_id', chatbotData.id)
            .eq('tipo', 'primary');
            
          if (qaError) throw qaError;
        }
      }
      
      toast({
        title: "Chatbot creado",
        description: "Su chatbot ha sido configurado correctamente"
      });
      
    } catch (error) {
      console.error("Error al crear chatbot:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el chatbot. Por favor, intente nuevamente.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const setOnboardingCompleted = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('empresas')
        .update({ onboarding_completed: true })
        .eq('id', user?.companyId);

      if (error) {
        throw error;
      }

      setUser({ ...user, onboardingCompleted: true } as Profile);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    updateUser,
    createChatbot,
    setOnboardingCompleted,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
