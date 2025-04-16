import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { NavLink } from "react-router-dom";
import { Users, Cpu, FileText, BarChartHorizontal } from "lucide-react";

export function AdminNavbar() {
  const { user } = useAuth();

  // Depuración: Mostrar información del usuario
  console.log("AdminNavbar - User info:", {
    userExists: !!user,
    userRole: user?.role,
    shouldShow: user && (user.role === "admin" || user.role === "admin_empresa")
  });

  // Solo mostrar la barra de navegación para roles admin y admin_empresa
  if (!user || (user.role !== "admin" && user.role !== "admin_empresa")) {
    return null;
  }

  const navItems = [
    {
      href: "/dashboard/admin/agentes",
      label: "Agentes Humanos",
      icon: <Users className="h-4 w-4" />,
    },
    {
      href: "/dashboard/admin/llm",
      label: "LLM",
      icon: <Cpu className="h-4 w-4" />,
    },
    {
      href: "/dashboard/admin/prompts",
      label: "Prompt Template",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      href: "/dashboard/admin/evaluaciones",
      label: "Evaluaciones IA",
      icon: <BarChartHorizontal className="h-4 w-4" />,
    },
  ];

  return (
    <div className="sticky z-30 border-b border-muted bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-12 items-center px-4">
        <ul className="flex gap-4 text-sm overflow-x-auto">
          {navItems.map((item) => (
            <li key={item.href}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex h-8 items-center gap-1 rounded-md px-3 transition-colors hover:bg-accent hover:text-accent-foreground font-medium",
                    isActive
                      ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                      : "text-muted-foreground"
                  )
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}