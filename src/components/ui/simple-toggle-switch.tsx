import React from "react";

interface SimpleToggleSwitchProps {
  isOn: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const SimpleToggleSwitch: React.FC<SimpleToggleSwitchProps> = ({
  isOn,
  onToggle,
  size = 'md',
  disabled = false
}) => {
  // Determinar tamaños según la prop 'size'
  const getSizes = () => {
    switch(size) {
      case 'sm':
        return {
          switch: 'w-8 h-4',
          handle: 'w-3 h-3',
          translate: 'translate-x-4'
        };
      case 'lg':
        return {
          switch: 'w-14 h-7',
          handle: 'w-6 h-6',
          translate: 'translate-x-7'
        };
      default: // md
        return {
          switch: 'w-11 h-6',
          handle: 'w-4 h-4',
          translate: 'translate-x-5'
        };
    }
  };

  const sizes = getSizes();
  
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      disabled={disabled}
      className={`
        ${sizes.switch} 
        relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent 
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 
        focus:ring-offset-2 focus:ring-primary ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${isOn ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}
      `}
      onClick={disabled ? undefined : onToggle}
    >
      <span className="sr-only">{isOn ? 'On' : 'Off'}</span>
      <span
        className={`
          ${isOn ? sizes.translate : 'translate-x-0'} 
          ${sizes.handle}
          pointer-events-none inline-block transform rounded-full bg-white 
          shadow ring-0 transition duration-200 ease-in-out
        `}
      />
    </button>
  );
};

export default SimpleToggleSwitch;