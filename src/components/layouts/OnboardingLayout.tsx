
import { Outlet } from "react-router-dom";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { useLocation } from "react-router-dom";

const OnboardingLayout = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Determinar el paso actual
  const getCurrentStep = () => {
    switch (currentPath) {
      case "/onboarding":
        return 0;
      case "/onboarding/company":
        return 1;
      case "/onboarding/services":
        return 2;
      case "/onboarding/chatbot":
        return 3;
      default:
        return 0;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <header className="border-b p-4">
        <div className="container flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Prometheus CRM Nexus
          </h1>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto">
        <div className="container py-6 md:py-10 max-w-4xl">
          <div className="mb-8">
            <StepIndicator currentStep={getCurrentStep()} />
          </div>
          
          <div className="bg-card rounded-lg border shadow-sm p-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default OnboardingLayout;
