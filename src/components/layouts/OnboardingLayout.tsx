
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { StepIndicator } from "../onboarding/StepIndicator";

const OnboardingLayout = () => {
  const { user, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-pulse text-primary">Cargando...</div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect if onboarding already completed
  if (user.onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <StepIndicator />
      <main className="flex-1 container max-w-4xl py-6 px-4 md:py-12">
        <Outlet />
      </main>
    </div>
  );
};

export default OnboardingLayout;
