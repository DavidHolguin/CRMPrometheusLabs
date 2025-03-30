import React from 'react';
import { cn } from "@/lib/utils";
import { getScoreColorClass } from "./LeadScoreUtils";

interface LeadScoreIndicatorProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LeadScoreIndicator({ 
  score, 
  showLabel = true,
  size = 'md',
  className 
}: LeadScoreIndicatorProps) {
  const normalizedScore = Math.min(100, Math.max(0, score));
  const colorClass = getScoreColorClass(normalizedScore / 10);
  
  // Remove 'text-white' and other classes, just keep the background color
  const bgColorClass = colorClass.split(' ')[0];
  
  // Size classes
  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3"
  };
  
  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1 text-xs">
          <span className="font-medium">Score</span>
          <span className="font-semibold">{normalizedScore}/100</span>
        </div>
      )}
      <div className={cn("w-full bg-muted/50 rounded-full overflow-hidden", sizeClasses[size])}>
        <div 
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ 
            width: `${normalizedScore}%`, 
            backgroundColor: bgColorClass ? `var(--${bgColorClass})` : undefined
          }}
        />
      </div>
    </div>
  );
}
