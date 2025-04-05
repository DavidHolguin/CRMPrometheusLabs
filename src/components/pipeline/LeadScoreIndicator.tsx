
import React from 'react';
import { cn } from "@/lib/utils";
import { getScoreColorClass } from "./LeadScoreUtils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pencil } from "lucide-react";
import { Button } from "../ui/button";

interface LeadScoreIndicatorProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  editable?: boolean;
  onEdit?: () => void;
}

export function LeadScoreIndicator({ 
  score, 
  showLabel = true,
  size = 'md',
  className,
  editable = false,
  onEdit
}: LeadScoreIndicatorProps) {
  const normalizedScore = Math.min(100, Math.max(0, score));
  const colorClass = getScoreColorClass(normalizedScore / 10);
  
  // Size classes
  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3"
  };
  
  // Extract the background color from the colorClass
  const bgColorMatch = colorClass.match(/bg-([a-z]+-[0-9]+)/);
  const bgColorClass = bgColorMatch ? bgColorMatch[0] : 'bg-gray-500';
  
  return (
    <div className={cn("w-full group", className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1 text-xs">
          <span className="font-medium">Score</span>
          <div className="flex items-center gap-1">
            <span className="font-semibold">{normalizedScore}/100</span>
            {editable && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={onEdit}
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Pencil size={12} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Editar score</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      )}
      <div className={cn("w-full bg-muted/50 rounded-full overflow-hidden", sizeClasses[size])}>
        <div 
          className={cn("h-full rounded-full transition-all duration-500 ease-out", bgColorClass)}
          style={{ width: `${normalizedScore}%` }}
        />
      </div>
    </div>
  );
}
