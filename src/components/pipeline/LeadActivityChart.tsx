
import { useState, useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ActivityData {
  date: string;
  messages: number;
  interactions: number;
}

interface LeadActivityChartProps {
  activityData: ActivityData[];
}

export function LeadActivityChart({ activityData }: LeadActivityChartProps) {
  const [activeChart, setActiveChart] = useState<'messages' | 'interactions'>('messages');

  const activityChartConfig = {
    activity: {
      label: "Actividad",
    },
    messages: {
      label: "Mensajes",
      color: "hsl(var(--chart-1))",
    },
    interactions: {
      label: "Interacciones",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  // Calculate totals for activity data
  const activityTotals = useMemo(() => ({
    messages: activityData.reduce((acc, curr) => acc + curr.messages, 0),
    interactions: activityData.reduce((acc, curr) => acc + curr.interactions, 0),
  }), [activityData]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Actividad del Lead</CardTitle>
          <CardDescription>
            Historial de mensajes e interacciones
          </CardDescription>
        </div>
        <div className="flex">
          {["messages", "interactions"].map((key) => {
            const chart = key as keyof typeof activityTotals;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart as 'messages' | 'interactions')}
              >
                <span className="text-xs text-muted-foreground">
                  {activityChartConfig[chart]?.label || chart}
                </span>
                <span className="text-lg font-bold leading-none sm:text-3xl">
                  {activityTotals[chart].toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={activityChartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <LineChart
            accessibilityLayer
            data={activityData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("es-ES", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="activity"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("es-ES", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                />
              }
            />
            <Line
              dataKey={activeChart}
              type="monotone"
              stroke={`var(--color-${activeChart})`}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
