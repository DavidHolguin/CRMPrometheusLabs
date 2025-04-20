import { TrendingUp, AlertCircle, ThumbsUp } from "lucide-react";
import {
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  Label,
  ResponsiveContainer
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface LeadScoreChartProps {
  score: number;
  interactionCount: number;
  stageName: string;
}

// Helper function to get score color
function getScoreColor(score: number): string {
  if (score > 75) return "hsl(var(--chart-3))"; // Green
  if (score > 50) return "hsl(var(--chart-1))"; // Orange
  if (score > 25) return "hsl(var(--chart-4))"; // Yellow
  return "hsl(var(--chart-5))"; // Red
}

// Función para normalizar la puntuación y asegurar que está en el rango 0-100
function normalizeScore(score: number | null | undefined): number {
  if (score === null || score === undefined) return 0;
  if (isNaN(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function LeadScoreChart({ score, interactionCount, stageName }: LeadScoreChartProps) {
  const [normalizedScore, setNormalizedScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Procesar el score cuando cambia
  useEffect(() => {
    try {
      const processedScore = normalizeScore(score);
      setNormalizedScore(processedScore);
      setIsLoading(false);
      setIsError(false);
    } catch (error) {
      console.error("Error processing score:", error);
      setIsError(true);
      setIsLoading(false);
    }
  }, [score]);

  // Forzar re-renderizado del gráfico cuando la ventana cambia de tamaño
  useEffect(() => {
    const handleResize = () => {
      // Forzar una actualización del DOM para el contenedor del gráfico
      if (chartRef.current) {
        chartRef.current.style.display = 'none';
        setTimeout(() => {
          if (chartRef.current) {
            chartRef.current.style.display = '';
          }
        }, 10);
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Trigger initial render
    setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const scoreChartConfig = {
    score: {
      label: "Puntuación",
      color: getScoreColor(normalizedScore),
    },
  } satisfies ChartConfig;

  const scoreChartData = [
    { name: "score", value: normalizedScore, fill: getScoreColor(normalizedScore) }
  ];

  // Determinar el mensaje de estado según la puntuación
  const getScoreMessage = () => {
    if (normalizedScore > 75) return { 
      text: "Lead caliente - Alta prioridad", 
      icon: <ThumbsUp className="h-4 w-4 text-green-500" />,
      color: "text-green-500"
    };
    if (normalizedScore > 50) return { 
      text: "Lead interesado - Seguimiento activo", 
      icon: <TrendingUp className="h-4 w-4 text-amber-500" />,
      color: "text-amber-500"
    };
    if (normalizedScore > 25) return { 
      text: "Lead en desarrollo - Requiere atención", 
      icon: <AlertCircle className="h-4 w-4 text-yellow-500" />,
      color: "text-yellow-500"
    };
    return { 
      text: "Lead frío - Requiere reactivación", 
      icon: <AlertCircle className="h-4 w-4 text-red-500" />,
      color: "text-red-500"
    };
  };

  const scoreStatus = getScoreMessage();

  if (isError) {
    return (
      <Card className="flex flex-col shadow-sm">
        <CardHeader className="items-center pb-0">
          <CardTitle className="text-lg">Puntuación del Lead</CardTitle>
          <CardDescription>Puntaje basado en actividades e interacciones</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 flex items-center justify-center">
          <div className="text-center py-10">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-2" />
            <p className="text-muted-foreground">Error al cargar el gráfico de puntuación</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col shadow-sm">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-lg">Puntuación del Lead</CardTitle>
        <CardDescription>Puntaje basado en actividades e interacciones</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0" ref={chartRef}>
        {isLoading ? (
          <div className="flex items-center justify-center h-[220px]">
            <Skeleton className="w-[200px] h-[200px] rounded-full" />
          </div>
        ) : (
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                data={scoreChartData}
                startAngle={0}
                endAngle={360}
                innerRadius={80}
                outerRadius={110}
                barSize={20}
                cx="50%"
                cy="50%"
              >
                <PolarGrid
                  gridType="circle"
                  radialLines={false}
                  stroke="none"
                  fill="#f1f5f9"
                  polarRadius={[86, 74]}
                />
                <RadialBar 
                  dataKey="value" 
                  background={{ fill: '#e2e8f0' }}
                  cornerRadius={10} 
                  animationDuration={800}
                  animationBegin={300}
                />
                <PolarRadiusAxis 
                  tick={false} 
                  tickLine={false} 
                  axisLine={false}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-4xl font-bold"
                            >
                              {normalizedScore}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground text-base"
                            >
                              puntos
                            </tspan>
                          </text>
                        );
                      }
                      return null;
                    }}
                  />
                </PolarRadiusAxis>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm pt-2">
        <div className={cn("flex items-center gap-2 font-medium leading-none", scoreStatus.color)}>
          {scoreStatus.icon}
          {scoreStatus.text}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="font-medium">{interactionCount || 0}</span> interacciones registradas
          </div>
          <div className="leading-none text-xs text-muted-foreground">
            Etapa actual: <span className="font-medium">{stageName || "Sin etapa"}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
