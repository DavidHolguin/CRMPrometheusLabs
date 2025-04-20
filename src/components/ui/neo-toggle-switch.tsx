import React from 'react';
import { cn } from "@/lib/utils";

interface NeoToggleSwitchProps {
  isOn: boolean;
  onToggle: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

const NeoToggleSwitch = ({
  isOn,
  onToggle,
  isLoading = false,
  disabled = false,
  className
}: NeoToggleSwitchProps) => {
  const uniqueId = React.useId();
  
  return (
    <div className={cn("neo-toggle-container", className)}>
      <input 
        className="neo-toggle-input sr-only"
        id={`neo-toggle-${uniqueId}`}
        type="checkbox"
        checked={isOn}
        onChange={onToggle}
        disabled={disabled || isLoading}
      />
      <label 
        className={cn(
          "relative block w-[70px] h-[30px] rounded-full cursor-pointer",
          "transition-transform duration-300 ease-out",
          disabled && "cursor-not-allowed opacity-60"
        )}
        htmlFor={`neo-toggle-${uniqueId}`}
      >
        {/* Track */}
        <div className={cn(
          "absolute inset-0 rounded-full overflow-hidden",
          "shadow-[0_2px_10px_rgba(0,0,0,0.2),inset_0_0_0_1px_rgba(255,255,255,0.1)]",
          "bg-[#181c20]",
          "before:absolute before:inset-0",
          "before:bg-gradient-to-tr before:from-[rgba(20,20,20,0.8)] before:via-[rgba(30,30,30,0.3)] before:to-[rgba(20,20,20,0.8)]",
          "transition-all duration-300 ease-out"
        )}>
          {/* Grid layer */}
          <div className={cn(
            "absolute inset-0",
            "bg-[linear-gradient(to_right,rgba(71,80,87,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(71,80,87,0.05)_1px,transparent_1px)]",
            "bg-[length:5px_5px]",
            "opacity-0 transition-opacity duration-300 ease-out",
            isOn && "opacity-100"
          )}></div>
          
          {/* Spectrum analyzer */}
          <div className={cn(
            "absolute bottom-[6px] right-[10px] h-[8px] flex items-end gap-[2px]",
            "opacity-0 transition-opacity duration-300 ease-out",
            isOn && "opacity-100"
          )}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i}
                className={cn(
                  "w-[2px] h-[3px] bg-[#36f9c7] opacity-80",
                  isOn && `animate-[neo-spectrum_${0.7 + Math.random() * 0.4}s_${Math.random() * 0.2}s_infinite]`
                )}
              ></div>
            ))}
          </div>
          
          {/* Track highlight */}
          <div className={cn(
            "absolute inset-[1px] rounded-full",
            "bg-gradient-to-r from-transparent to-[rgba(54,249,199,0)]",
            "opacity-0 transition-all duration-300 ease-out",
            isOn && "opacity-100 bg-gradient-to-r from-transparent to-[rgba(54,249,199,0.2)]"
          )}></div>
        </div>
        
        {/* Thumb */}
        <div className={cn(
          "absolute top-[3px] left-[3px] w-[24px] h-[24px]",
          "flex items-center justify-center",
          "rounded-full",
          "transition-transform duration-300 ease-out",
          isOn && "translate-x-[40px]"
        )}>
          {isLoading ? (
            <svg className="animate-spin h-4 w-4 text-[#475057]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <>
              {/* Thumb ring */}
              <div className={cn(
                "absolute inset-0 rounded-full",
                "border border-[rgba(255,255,255,0.1)]",
                "bg-[#475057] shadow-[0_2px_10px_rgba(0,0,0,0.2)]",
                "transition-all duration-300 ease-out",
                isOn && "bg-[#36f9c7] border-[rgba(54,249,199,0.3)] shadow-[0_0_15px_rgba(54,249,199,0.3)]"
              )}></div>
              
              {/* Thumb core */}
              <div className={cn(
                "absolute inset-[5px] rounded-full",
                "bg-gradient-to-br from-[rgba(255,255,255,0.1)] to-transparent",
                "transition-all duration-300 ease-out overflow-hidden",
                "flex items-center justify-center"
              )}>
                {/* Thumb icon */}
                <div className="relative w-[10px] h-[10px] transition-all duration-300 ease-out">
                  <div className={cn(
                    "absolute top-1/2 left-1/2 w-[10px] h-[2px]",
                    "bg-[#475057]",
                    "transform -translate-x-1/2 -translate-y-1/2",
                    "transition-all duration-300 ease-out",
                    isOn && "w-[8px] h-[8px] rounded-full bg-transparent border border-white"
                  )}></div>
                  
                  {/* Pulse */}
                  <div className={cn(
                    "absolute inset-0 rounded-full",
                    "border border-[#475057]",
                    "transform scale-0 opacity-0",
                    "transition-all duration-300 ease-out",
                    isOn && "transform scale-[1.2] opacity-30 animate-[neo-pulse_1.5s_infinite]"
                  )}></div>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Status */}
        <div className="absolute bottom-[-20px] left-0 w-full flex justify-center">
          <div className="flex items-center gap-[4px]">
            <div className={cn(
              "w-[6px] h-[6px] rounded-full",
              "bg-[#475057] transition-all duration-300 ease-out",
              isOn && "bg-[#36f9c7] shadow-[0_0_8px_#36f9c7]"
            )}></div>
            <div className={cn(
              "text-[9px] font-semibold text-[#475057] tracking-wider uppercase",
              "transition-all duration-300 ease-out",
              isOn && "text-[#36f9c7]"
            )}>
              {isOn ? 'ACTIVO' : 'INACTIVO'}
            </div>
          </div>
        </div>
      </label>
      
      <style>{`
        @keyframes neo-pulse {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.5); opacity: 0.2; }
          100% { transform: scale(1); opacity: 0.5; }
        }
        
        @keyframes neo-spectrum {
          0% { height: 3px; }
          50% { height: 8px; }
          100% { height: 3px; }
        }
        
        .neo-toggle-container {
          position: relative;
          display: inline-flex;
          flex-direction: column;
          user-select: none;
        }
      `}</style>
    </div>
  );
};

export default NeoToggleSwitch;