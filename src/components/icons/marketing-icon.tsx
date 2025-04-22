import React from "react";

interface MarketingIconProps {
  className?: string;
  width?: number;
  height?: number;
}

export function MarketingIcon({ className, width = 24, height = 24 }: MarketingIconProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={width} 
      height={height} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M16 22h4a2 2 0 0 0 2-2v-4"></path>
      <path d="M12 18a2 2 0 0 0 2-2v-1h2.5"></path>
      <path d="M12 18v3"></path>
      <path d="M16 12V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h8"></path>
      <path d="M10.5 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"></path>
      <path d="M12 13c-.96.6-2.18 1-3.5 1-1.32 0-2.54-.4-3.5-1"></path>
    </svg>
  );
}