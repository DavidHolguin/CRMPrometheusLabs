
import * as React from "react";
import { cn } from "@/lib/utils";

interface SidebarContextValue {
  open: boolean;
}

const SidebarContext = React.createContext<SidebarContextValue>({
  open: false,
});

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    open?: boolean;
  }
>(({ className, children, open = false, ...props }, ref) => {
  return (
    <SidebarContext.Provider value={{ open }}>
      <div
        ref={ref}
        data-state={open ? "open" : "closed"}
        className={cn(className)}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
});
Sidebar.displayName = "Sidebar";

const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn("sidebar-trigger", className)}
    {...props}
  />
));
SidebarTrigger.displayName = "SidebarTrigger";

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    expanded?: boolean;
  }
>(({ className, expanded = false, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-expanded={expanded}
      className={cn("sidebar-content", className)}
      {...props}
    />
  );
});
SidebarContent.displayName = "SidebarContent";

export { Sidebar, SidebarTrigger, SidebarContent };
