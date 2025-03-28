
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
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

// Layout
import DashboardLayout from "./components/layouts/DashboardLayout";
import AuthLayout from "./components/layouts/AuthLayout";
import OnboardingLayout from "./components/layouts/OnboardingLayout";

// Context
import { AuthProvider } from "./context/AuthContext";

const queryClient = new QueryClient();

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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="prometheus-theme">
        <BrowserRouter>
          <AuthProvider>
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
                  <Route path="leads" element={<Dashboard />} />
                  <Route path="conversations" element={<Dashboard />} />
                  <Route path="chatbots" element={<Dashboard />} />
                  <Route path="settings" element={<Dashboard />} />
                </Route>

                {/* Default routes */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
