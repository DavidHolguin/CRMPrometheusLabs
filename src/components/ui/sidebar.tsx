
import * as React from "react";
import * as SidebarPrimitive from "@/components/ui/sidebar-primitive";
import { cn } from "@/lib/utils";

const SidebarContext = React.createContext<{
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  isCollapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  expanded: false,
  setExpanded: () => {},
  isCollapsed: false,
  setCollapsed: () => {},
});

const Sidebar = React.forwardRef<
  React.ElementRef<typeof SidebarPrimitive.Sidebar>,
  React.ComponentPropsWithoutRef<typeof SidebarPrimitive.Sidebar> & {
    defaultCollapsed?: boolean;
  }
>(({ className, defaultCollapsed = false, ...props }, ref) => {
  const [expanded, setExpanded] = React.useState(false);
  const [isCollapsed, setCollapsed] = React.useState(defaultCollapsed);

  return (
    <SidebarContext.Provider
      value={{ expanded, setExpanded, isCollapsed, setCollapsed }}
    >
      <SidebarPrimitive.Sidebar
        ref={ref}
        className={cn(className)}
        {...props}
      />
    </SidebarContext.Provider>
  );
});
Sidebar.displayName = "Sidebar";

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof SidebarPrimitive.SidebarTrigger>,
  React.ComponentPropsWithoutRef<typeof SidebarPrimitive.SidebarTrigger>
>(({ className, ...props }, ref) => {
  const { expanded, setExpanded } = React.useContext(SidebarContext);
  return (
    <SidebarPrimitive.SidebarTrigger
      ref={ref}
      onClick={() => setExpanded(!expanded)}
      className={cn(className)}
      {...props}
    />
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

const SidebarContent = React.forwardRef<
  React.ElementRef<typeof SidebarPrimitive.SidebarContent>,
  React.ComponentPropsWithoutRef<typeof SidebarPrimitive.SidebarContent>
>(({ className, ...props }, ref) => (
  <SidebarPrimitive.SidebarContent
    ref={ref}
    className={cn(
      "flex flex-col h-full bg-background p-2 pt-8 shadow-lg data-[expanded]:animate-in data-[expanded]:fade-in-0 data-[expanded]:zoom-in-95",
      className
    )}
    {...props}
  />
));
SidebarContent.displayName = "SidebarContent";

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-2 pb-4", className)} {...props} />
));
SidebarHeader.displayName = "SidebarHeader";

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-2 pt-2 mt-auto", className)} {...props} />
));
SidebarFooter.displayName = "SidebarFooter";

const SidebarProvider = ({
  children,
  defaultCollapsed = false,
}: {
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const [isCollapsed, setCollapsed] = React.useState(defaultCollapsed);

  return (
    <SidebarContext.Provider
      value={{ expanded, setExpanded, isCollapsed, setCollapsed }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

const useSidebar = () => {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export {
  Sidebar,
  SidebarTrigger,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  useSidebar,
};
