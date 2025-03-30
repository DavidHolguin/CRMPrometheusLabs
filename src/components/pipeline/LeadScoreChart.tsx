
import { TrendingUp } from "lucide-react";
import {
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  Label
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

export function LeadScoreChart({ score, interactionCount, stageName }: LeadScoreChartProps) {
  const scoreChartConfig = {
    score: {
      label: "Puntuación",
      color: getScoreColor(score),
    },
  } satisfies ChartConfig;

  const scoreChartData = [
    { name: "score", value: score, fill: getScoreColor(score) }
  ];

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-lg">Puntuación del Lead</CardTitle>
        <CardDescription>Puntaje basado en actividades e interacciones</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={scoreChartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart
            data={scoreChartData}
            startAngle={0}
            endAngle={360}
            innerRadius={80}
            outerRadius={110}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[86, 74]}
            />
            <RadialBar dataKey="value" background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
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
                          {score}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
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
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm pt-2">
        <div className="flex items-center gap-2 font-medium leading-none">
          <TrendingUp className="h-4 w-4 text-green-500" />
          Mejorando con {interactionCount} interacciones recientes
        </div>
        <div className="leading-none text-muted-foreground">
          Etapa actual: {stageName || "Sin etapa"}
        </div>
      </CardFooter>
    </Card>
  );
}
