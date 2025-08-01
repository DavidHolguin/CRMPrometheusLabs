import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { inject } from '@vercel/analytics';

// Layout
import AuthLayout from "@/components/layouts/AuthLayout";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import OnboardingLayout from "@/components/layouts/OnboardingLayout";

// Pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Onboarding from "@/pages/onboarding/Onboarding";
import OnboardingCompany from "@/pages/onboarding/OnboardingCompany";
import OnboardingChatbot from "@/pages/onboarding/OnboardingChatbot";
import OnboardingServices from "@/pages/onboarding/OnboardingServices";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import Leads from "@/pages/Leads";
import Conversations from "@/pages/Conversations";
import PipelineManagement from "@/pages/PipelineManagement";
import Canales from "@/pages/Canales";
import ChatbotConfig from "@/pages/ChatbotConfig";
import Chatbots from "@/pages/Chatbots";
import ChatInterface from "@/pages/ChatInterface";
import EntrenamientoIA from "@/pages/EntrenamientoIA";
import AgentesIA from "@/pages/AgentesIA";
import EditAgenteIA from "@/pages/agentes/EditAgenteIA";
import NotFound from "@/pages/NotFound";
import PerfilEmpresa from "@/pages/PerfilEmpresa";
import ImageOptimization from "@/pages/ImageOptimization";

// Admin pages
import AdminAgentes from "./pages/admin/AdminAgentes";
import AdminLLM from "./pages/admin/AdminLLM";
import AdminPrompts from "./pages/admin/AdminPrompts";
import AdminLeads from "./pages/admin/AdminLeads";

// Marketing pages
import MarketingDashboard from "./pages/marketing/MarketingDashboard";
import MarketingAnalytics from "./pages/marketing/MarketingAnalytics";
import MarketingCampanias from "./pages/marketing/MarketingCampanias";
import MarketingContenido from "./pages/marketing/MarketingContenido";
import MarketingAudiencias from "./pages/marketing/MarketingAudiencias";
import MarketingInteligencia from "./pages/marketing/MarketingInteligencia";
import MarketingFormularios from "./pages/marketing/MarketingFormularios";

// Auth
import { ProtectedAdminRoute } from "@/components/auth/ProtectedAdminRoute";

export const App = () => {
  const [mounted, setMounted] = useState(false);

  // Fix for hydration issues
  useEffect(() => {
    setMounted(true);
    // Inicializar Vercel Analytics
    inject();
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <TooltipProvider>
      <Routes>
        {/* Index Route */}
        <Route path="/" element={<Navigate to="/dashboard/crm" replace />} />

        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Onboarding routes */}
        <Route element={<OnboardingLayout />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/onboarding/company" element={<OnboardingCompany />} />
          <Route path="/onboarding/services" element={<OnboardingServices />} />
          <Route path="/onboarding/chatbot" element={<OnboardingChatbot />} />
        </Route>

        {/* Dashboard routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard/crm" replace />} />
          <Route path="leads" element={<Leads />} />
          <Route path="crm" element={<PipelineManagement />} />
          <Route path="conversations" element={<Conversations />} />
          <Route path="conversations/:conversationId" element={<Conversations />} />
          <Route path="entrenamiento-ia" element={<EntrenamientoIA />} />
          <Route path="agentes-ia" element={<AgentesIA />} />
          <Route path="agentes-ia/:agenteId/edit" element={<EditAgenteIA />} />
          <Route path="perfil-empresa" element={<PerfilEmpresa />} />
          <Route path="settings" element={<Dashboard />} />
          <Route path="image-optimization" element={<ImageOptimization />} />

          {/* Marketing routes */}
          <Route path="marketing">
            <Route index element={<MarketingDashboard />} />
            <Route path="analytics" element={<MarketingAnalytics />} />
            <Route path="campaigns" element={<MarketingCampanias />} />
            <Route path="content" element={<MarketingContenido />} />
            <Route path="audience" element={<MarketingAudiencias />} />
            <Route path="intelligence" element={<MarketingInteligencia />} />
            <Route path="forms" element={<MarketingFormularios />} />
            <Route path="insights" element={<Navigate to="/dashboard/marketing/analytics" replace />} />
            <Route path="trends" element={<Navigate to="/dashboard/marketing/analytics" replace />} />
            <Route path="kpis" element={<Navigate to="/dashboard/marketing/analytics" replace />} />
            <Route path="documentation" element={<Navigate to="/dashboard/marketing" replace />} />
          </Route>

          {/* Admin routes - Protegidas */}
          <Route element={<ProtectedAdminRoute />}>
            <Route path="admin/agentes" element={<AdminAgentes />} />
            <Route path="admin/llm" element={<AdminLLM />} />
            <Route path="admin/prompts" element={<AdminPrompts />} />
            <Route path="admin/leads" element={<AdminLeads />} />
            <Route path="chatbots" element={<Chatbots />} />
            <Route path="chatbots/:chatbotId/settings" element={<ChatbotConfig />} />
            <Route path="canales" element={<Canales />} />
          </Route>
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
