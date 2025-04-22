import React from "react";
import { Link } from "react-router-dom";
import { MarketingIcon } from "@/components/icons/marketing-icon";
import { PieChart, BarChart, Target, LineChart, Users2, Search, BookOpen } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

export function MarketingNavigationMenu() {
  return (
    <NavigationMenu className="hidden lg:flex">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent">Marketing</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[600px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-6">
                <div className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md">
                  <MarketingIcon className="h-8 w-8" />
                  <div className="mb-2 mt-4 text-lg font-medium">
                    Marketing Prometheus
                  </div>
                  <p className="text-sm leading-tight text-muted-foreground">
                    Suite completa de herramientas para gestionar y optimizar todas tus campañas de marketing.
                  </p>
                </div>
              </li>
              <ListItem 
                to="/dashboard/marketing" 
                title="Dashboard"
                icon={<PieChart className="mr-2 h-4 w-4" />}
              >
                Vista general de métricas, campañas activas y rendimiento
              </ListItem>
              <ListItem 
                to="/dashboard/marketing/campaigns" 
                title="Campañas"
                icon={<Target className="mr-2 h-4 w-4" />}
                badge={2}
              >
                Gestión de campañas de marketing en diversas plataformas
              </ListItem>
              <ListItem 
                to="/dashboard/marketing/content" 
                title="Contenido"
                icon={<LineChart className="mr-2 h-4 w-4" />}
              >
                Biblioteca de activos y plantillas para tus campañas
              </ListItem>
              <ListItem 
                to="/dashboard/marketing/audience" 
                title="Audiencias"
                icon={<Users2 className="mr-2 h-4 w-4" />}
              >
                Segmentación y análisis de audiencias objetivo
              </ListItem>
              <ListItem 
                to="/dashboard/marketing/intelligence" 
                title="Inteligencia de Mercado"
                icon={<Search className="mr-2 h-4 w-4" />}
                badge={1}
              >
                Análisis competitivo y tendencias de mercado
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent">Análisis</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:grid-cols-2">
              <ListItem 
                to="/dashboard/marketing/analytics" 
                title="Analíticas"
                icon={<BarChart className="mr-2 h-4 w-4" />}
              >
                Métricas detalladas y análisis de rendimiento
              </ListItem>
              <ListItem 
                to="/dashboard/marketing/insights" 
                title="Insights"
                icon={<PieChart className="mr-2 h-4 w-4" />}
              >
                Descubrimientos y recomendaciones
              </ListItem>
              <ListItem 
                to="/dashboard/marketing/trends" 
                title="Tendencias"
                icon={<LineChart className="mr-2 h-4 w-4" />}
              >
                Análisis temporal y evolución
              </ListItem>
              <ListItem 
                to="/dashboard/marketing/kpis" 
                title="KPIs"
                icon={<Target className="mr-2 h-4 w-4" />}
              >
                Indicadores clave
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <Link to="/dashboard/marketing/documentation" className={navigationMenuTriggerStyle({ className: "bg-transparent" })}>
            <BookOpen className="mr-2 h-4 w-4" />
            Docs
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

interface ListItemProps {
  to: string;
  children: React.ReactNode;
  title: string;
  icon?: React.ReactNode;
  badge?: number;
  className?: string;
}

const ListItem = React.forwardRef<React.ElementRef<"a">, ListItemProps>(
  ({ className, to, title, children, icon, badge, ...props }, ref) => {
    return (
      <li>
        <Link
          to={to}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="flex items-center">
            {icon && <span className="mr-2">{icon}</span>}
            <span className="text-sm font-medium leading-none">{title}</span>
            {badge && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {badge}
              </span>
            )}
          </div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground mt-1">
            {children}
          </p>
        </Link>
      </li>
    );
  }
);
ListItem.displayName = "ListItem";