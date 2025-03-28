
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { StepIndicator } from "../onboarding/StepIndicator";
import { useEffect } from "react";

const OnboardingLayout = () => {
  const { user, isLoading, session } = useAuth();
  const location = useLocation();
  
  // Determine current step based on URL path
  const getCurrentStep = () => {
    const path = location.pathname;
    if (path === "/onboarding") return 0;
    if (path === "/onboarding/company") return 1;
    if (path === "/onboarding/services") return 2;
    if (path === "/onboarding/chatbot") return 3;
    return 0;
  };

  // Redirect logic
  useEffect(() => {
    // Este efecto es para manejar redirecciones basadas en el estado del onboarding
    if (user && !isLoading) {
      console.log("OnboardingLayout - User:", user);
      console.log("OnboardingLayout - Current step:", getCurrentStep());
    }
  }, [user, isLoading, location]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-pulse text-primary">Cargando...</div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!session) {
    console.log("OnboardingLayout - No session, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Redirect if onboarding already completed
  if (user?.onboardingCompleted) {
    console.log("OnboardingLayout - Onboarding completed, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <StepIndicator currentStep={getCurrentStep()} />
      <main className="flex-1 container max-w-4xl py-6 px-4 md:py-12">
        <Outlet />
      </main>
    </div>
  );
};

export default OnboardingLayout;
