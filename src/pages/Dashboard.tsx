
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Bar, BarChart, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Users, MessageSquare, BotIcon, TrendingUp, ArrowUpRight, ArrowDownRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tooltip as TooltipComponent,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Datos de ejemplo
const statsData = [
  { name: "Lun", leads: 4, conversations: 12 },
  { name: "Mar", leads: 7, conversations: 18 },
  { name: "Mie", leads: 5, conversations: 15 },
  { name: "Jue", leads: 8, conversations: 21 },
  { name: "Vie", leads: 12, conversations: 28 },
  { name: "Sab", leads: 9, conversations: 22 },
  { name: "Dom", leads: 6, conversations: 14 },
];

const channelData = [
  { name: "Sitio web", value: 65 },
  { name: "Facebook", value: 25 },
  { name: "WhatsApp", value: 10 },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [recentLeads, setRecentLeads] = useState([
    { id: "1", name: "Juan Pérez", email: "juan@example.com", source: "Website", status: "Nuevo", date: "Hace 2 horas" },
    { id: "2", name: "María García", email: "maria@example.com", source: "Facebook", status: "Cualificado", date: "Hace 5 horas" },
    { id: "3", name: "Carlos López", email: "carlos@example.com", source: "Website", status: "Contactado", date: "Hace 1 día" },
  ]);

  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Estadísticas
  const stats = [
    {
      title: "Total de leads",
      value: "125",
      change: "+12.5%",
      trend: "up",
      icon: <Users className="h-4 w-4" />,
    },
    {
      title: "Conversaciones",
      value: "483",
      change: "+18.2%",
      trend: "up",
      icon: <MessageSquare className="h-4 w-4" />,
    },
    {
      title: "Tasa de conversión",
      value: "24.8%",
      change: "-2.3%",
      trend: "down",
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      title: "Interacciones con chatbot",
      value: "1,254",
      change: "+32.1%",
      trend: "up",
      icon: <BotIcon className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen de actividad y estadísticas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            Exportar datos
          </Button>
          <TooltipProvider>
            <TooltipComponent>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Datos actualizados en tiempo real</p>
              </TooltipContent>
            </TooltipComponent>
          </TooltipProvider>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  stat.trend === "up" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                }`}>
                  {stat.icon}
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={stat.trend === "up" ? "text-green-500" : "text-red-500"}>
                  {stat.change}
                </span>
                <span className="text-muted-foreground ml-1">vs mes anterior</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Leads y Conversaciones</CardTitle>
            <CardDescription>Actividad de la última semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={statsData}
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      borderColor: "hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      color: "hsl(var(--card-foreground))"
                    }} 
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="leads"
                    name="Leads"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="conversations"
                    name="Conversaciones"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Leads por canal</CardTitle>
            <CardDescription>Distribución por origen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      borderColor: "hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      color: "hsl(var(--card-foreground))"
                    }} 
                    formatter={(value) => [`${value}%`, "Porcentaje"]}
                  />
                  <Bar dataKey="value" name="Porcentaje" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Leads recientes</CardTitle>
          <CardDescription>Últimos contactos registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Nombre</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Origen</th>
                  <th className="text-left py-3 px-4 font-medium">Estado</th>
                  <th className="text-left py-3 px-4 font-medium">Registrado</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">{lead.name}</td>
                    <td className="py-3 px-4">{lead.email}</td>
                    <td className="py-3 px-4">
                      <span 
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          lead.source === "Website" 
                            ? "bg-blue-500/10 text-blue-500" 
                            : "bg-purple-500/10 text-purple-500"
                        }`}
                      >
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span 
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          lead.status === "Nuevo" 
                            ? "bg-green-500/10 text-green-500" 
                            : lead.status === "Contactado"
                            ? "bg-orange-500/10 text-orange-500"
                            : "bg-blue-500/10 text-blue-500"
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{lead.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
