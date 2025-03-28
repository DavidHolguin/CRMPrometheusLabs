
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
import Onboarding from "./pages/onboarding/Onboarding";
import OnboardingCompany from "./pages/onboarding/OnboardingCompany";
import OnboardingServices from "./pages/onboarding/OnboardingServices";
import OnboardingChatbot from "./pages/onboarding/OnboardingChatbot";

// Layout
import DashboardLayout from "./components/layouts/DashboardLayout";
import AuthLayout from "./components/layouts/AuthLayout";
import OnboardingLayout from "./components/layouts/OnboardingLayout";

// Context
import { AuthProvider, useAuth } from "./context/AuthContext";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center">
      <div className="animate-pulse text-primary">Cargando...</div>
    </div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Onboarding check route
const OnboardingCheck = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center">
      <div className="animate-pulse text-primary">Cargando...</div>
    </div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if onboarding is completed
  if (!user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    {/* Auth routes */}
    <Route element={<AuthLayout />}>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Route>

    {/* Onboarding routes */}
    <Route element={
      <ProtectedRoute>
        <OnboardingLayout />
      </ProtectedRoute>
    }>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/onboarding/company" element={<OnboardingCompany />} />
      <Route path="/onboarding/services" element={<OnboardingServices />} />
      <Route path="/onboarding/chatbot" element={<OnboardingChatbot />} />
    </Route>

    {/* Dashboard routes */}
    <Route element={
      <OnboardingCheck>
        <DashboardLayout />
      </OnboardingCheck>
    }>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/leads" element={<Dashboard />} />
      <Route path="/conversations" element={<Dashboard />} />
      <Route path="/chatbots" element={<Dashboard />} />
      <Route path="/settings" element={<Dashboard />} />
    </Route>

    {/* Default routes */}
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

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
        <AuthProvider>
          <TooltipProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
