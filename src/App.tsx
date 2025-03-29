
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

// Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import Onboarding from "./pages/onboarding/Onboarding";
import OnboardingCompany from "./pages/onboarding/OnboardingCompany";
import OnboardingServices from "./pages/onboarding/OnboardingServices";
import OnboardingChatbot from "./pages/onboarding/OnboardingChatbot";
import Chatbots from "./pages/Chatbots";
import ChatInterface from "./pages/ChatInterface";
import ConversationsPage from "./pages/Conversations";
import Leads from "./pages/Leads";
import PipelineManagement from "./pages/PipelineManagement";
import Canales from "./pages/Canales";

// Layout
import DashboardLayout from "./components/layouts/DashboardLayout";
import AuthLayout from "./components/layouts/AuthLayout";
import OnboardingLayout from "./components/layouts/OnboardingLayout";

const App = () => {
  const [mounted, setMounted] = useState(false);

  // Fix for hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fix for missing agent messages - this will run once on app load
  useEffect(() => {
    const syncAgentMessages = async () => {
      try {
        // Check for agent messages that haven't been synchronized
        const { data: agentMessages, error } = await supabase
          .from("mensajes")
          .select("*")
          .eq("origen", "agent")
          .order("created_at", { ascending: false })
          .limit(20);
        
        if (error) {
          console.error("Error checking for unsynchronized agent messages:", error);
          return;
        }
        
        if (!agentMessages || agentMessages.length === 0) {
          console.log("No agent messages found to synchronize");
          return;
        }
        
        console.log(`Found ${agentMessages.length} agent messages to check`);
        
        // For each agent message, check if it exists in mensajes_agentes
        for (const message of agentMessages) {
          const { data: exists, error: checkError } = await supabase
            .from("mensajes_agentes")
            .select("id")
            .eq("id", message.id)
            .maybeSingle();
            
          if (checkError) {
            console.error("Error checking message existence:", checkError);
            continue;
          }
          
          // If message doesn't exist in mensajes_agentes, insert it
          if (!exists) {
            console.log(`Synchronizing missing agent message: ${message.id}`);
            const { error: insertError } = await supabase
              .from("mensajes_agentes")
              .insert({
                id: message.id,
                conversacion_id: message.conversacion_id,
                contenido: message.contenido,
                created_at: message.created_at,
                metadata: message.metadata,
                remitente_id: message.remitente_id,
                origen: "agente"
              });
              
            if (insertError) {
              console.error("Error inserting agent message:", insertError);
            } else {
              console.log(`Successfully synchronized agent message: ${message.id}`);
            }
          }
        }
      } catch (e) {
        console.error("Error in syncAgentMessages:", e);
      }
    };
    
    if (mounted) {
      syncAgentMessages();
    }
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <TooltipProvider>
      <Routes>
        {/* Index Route */}
        <Route path="/" element={<Index />} />

        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Onboarding routes */}
        <Route path="/onboarding" element={<OnboardingLayout />}>
          <Route index element={<Onboarding />} />
          <Route path="company" element={<OnboardingCompany />} />
          <Route path="services" element={<OnboardingServices />} />
          <Route path="chatbot" element={<OnboardingChatbot />} />
        </Route>

        {/* Dashboard routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="leads" element={<Leads />} />
          <Route path="crm" element={<PipelineManagement />} />
          <Route path="canales" element={<Canales />} />
          <Route path="conversations" element={<ConversationsPage />} />
          <Route path="conversations/:conversationId" element={<ConversationsPage />} />
          <Route path="chatbots" element={<Chatbots />} />
          <Route path="settings" element={<Dashboard />} />
        </Route>
        
        {/* Standalone Chat Interface - No Dashboard Layout */}
        <Route path="/chat/:chatbotId" element={<ChatInterface />} />

        {/* Default routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
      <Sonner />
    </TooltipProvider>
  );
};

export default App;
