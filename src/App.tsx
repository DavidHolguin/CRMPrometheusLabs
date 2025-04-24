import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Analytics } from '@vercel/analytics/react';

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
import EntrenamientoIA from "./pages/EntrenamientoIA";
import PerfilEmpresa from "./pages/PerfilEmpresa";
import ChatbotConfig from "./pages/ChatbotConfig";

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

// Layout
import DashboardLayout from "./components/layouts/DashboardLayout";
import AuthLayout from "./components/layouts/AuthLayout";
import OnboardingLayout from "./components/layouts/OnboardingLayout";

// Auth
import { ProtectedAdminRoute } from "./components/auth/ProtectedAdminRoute";

const App = () => {
  const [mounted, setMounted] = useState(false);

  // Fix for hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

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
          <Route path="chatbots/:chatbotId/settings" element={<ChatbotConfig />} />
          <Route path="entrenamiento-ia" element={<EntrenamientoIA />} />
          <Route path="perfil-empresa" element={<PerfilEmpresa />} />
          <Route path="settings" element={<Dashboard />} />

          {/* Marketing routes */}
          <Route path="marketing">
            <Route index element={<MarketingDashboard />} />
            <Route path="analytics" element={<MarketingAnalytics />} />
            <Route path="campaigns" element={<MarketingCampanias />} />
            <Route path="content" element={<MarketingContenido />} />
            <Route path="audience" element={<MarketingAudiencias />} />
            <Route path="intelligence" element={<MarketingInteligencia />} />
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
          </Route>
        </Route>
        
        {/* Standalone Chat Interface - No Dashboard Layout */}
        <Route path="/chat/:chatbotId" element={<ChatInterface />} />

        {/* Default routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
      <Sonner />
      <Analytics />
    </TooltipProvider>
  );
};

export default App;
