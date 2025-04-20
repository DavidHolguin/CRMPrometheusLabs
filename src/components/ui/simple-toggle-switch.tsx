import React from 'react';
import { cn } from "@/lib/utils";

interface SimpleToggleSwitchProps {
  isOn: boolean;
  onToggle: (status?: boolean) => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

const SimpleToggleSwitch = ({
  isOn,
  onToggle,
  isLoading = false,
  disabled = false,
  className
}: SimpleToggleSwitchProps) => {
  const uniqueId = React.useId();
  
  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Pasar el nuevo estado como un booleano, no el evento completo
    onToggle(!isOn);
    // Esto evita pasar el evento SyntheticBaseEvent que causa el error de serialización circular
  };
  
  return (
    <label className={cn("relative inline-block", className)}>
      <input 
        type="checkbox" 
        className="sr-only" 
        checked={isOn}
        onChange={handleToggle}
        disabled={disabled || isLoading}
        id={`toggle-${uniqueId}`}
      />
      <div 
        className={cn(
          "slider w-[60px] h-[30px] bg-gray-300 rounded-[20px] overflow-hidden flex items-center",
          "border-4 border-transparent transition-all duration-300",
          "shadow-[inset_0_0_10px_0_rgba(0,0,0,0.25)] cursor-pointer",
          isOn && "bg-blue-500",
          (disabled || isLoading) && "opacity-60 cursor-not-allowed"
        )}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <div 
            className={cn(
              "slider-button w-full h-full bg-white rounded-[20px]",
              "transform -translate-x-[30px] transition-transform duration-300",
              "shadow-[0_0_10px_3px_rgba(0,0,0,0.25)]",
              isOn ? "translate-x-[30px]" : "-translate-x-[30px]",
            )}
          />
        )}
      </div>
    </label>
  );
};

export default SimpleToggleSwitch;