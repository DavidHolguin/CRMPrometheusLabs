
import React from "react";
import { cn } from "@/lib/utils";

interface TimelineProps {
  children: React.ReactNode;
  className?: string;
}

export function Timeline({ children, className }: TimelineProps) {
  return (
    <div className={cn("space-y-4 relative", className)}>
      {children}
    </div>
  );
}

interface TimelineItemProps {
  children: React.ReactNode;
  className?: string;
}

function TimelineItem({ children, className }: TimelineItemProps) {
  return (
    <div className={cn("grid grid-cols-[24px_1fr] gap-4", className)}>
      {children}
    </div>
  );
}

interface TimelineIndicatorProps {
  children?: React.ReactNode;
  className?: string;
}

function TimelineIndicator({ children, className }: TimelineIndicatorProps) {
  return (
    <div className="relative flex h-6 w-6 items-center justify-center rounded-full border bg-background">
      {children}
      <div className="absolute bottom-0 top-6 w-px -mb-px bg-border mx-auto h-full"></div>
    </div>
  );
}

interface TimelineContentProps {
  children: React.ReactNode;
  className?: string;
}

function TimelineContent({ children, className }: TimelineContentProps) {
  return (
    <div className={cn("pb-8", className)}>
      {children}
    </div>
  );
}

interface TimelineTitleProps {
  children: React.ReactNode;
  className?: string;
}

function TimelineTitle({ children, className }: TimelineTitleProps) {
  return (
    <div className={cn("font-medium", className)}>
      {children}
    </div>
  );
}

interface TimelineDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

function TimelineDescription({ children, className }: TimelineDescriptionProps) {
  return (
    <div className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </div>
  );
}

TimelineItem.Indicator = TimelineIndicator;
TimelineItem.Content = TimelineContent;
TimelineItem.Title = TimelineTitle;
TimelineItem.Description = TimelineDescription;

export { TimelineItem };
