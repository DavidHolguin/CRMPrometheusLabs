
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, subMonths, eachDayOfInterval, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ActivityData {
  date: string;
  messages: number;
  interactions: number;
}

interface LeadActivityChartProps {
  leadId: string;
}

export function LeadActivityChart({ leadId }: LeadActivityChartProps) {
  const [chartData, setChartData] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => subMonths(startOfMonth(new Date()), 2));
  const [totalCounts, setTotalCounts] = useState({ messages: 0, interactions: 0 });
  
  useEffect(() => {
    if (leadId) {
      fetchActivityData();
    }
  }, [leadId, startDate]);
  
  const fetchActivityData = async () => {
    setIsLoading(true);
    
    try {
      // Get interactions for this lead in the time period
      const endDate = endOfMonth(startDate);
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();
      
      // Fetch interactions
      const { data: interactionsData, error: interactionsError } = await supabase
        .from("lead_interactions")
        .select("created_at")
        .eq("lead_id", leadId)
        .gte("created_at", startDateStr)
        .lte("created_at", endDateStr);
        
      if (interactionsError) throw interactionsError;
      
      // Fetch messages
      const { data: conversationsData, error: convError } = await supabase
        .from("conversaciones")
        .select("id")
        .eq("lead_id", leadId);
        
      if (convError) throw convError;
      
      let messagesData: any[] = [];
      
      if (conversationsData && conversationsData.length > 0) {
        const conversationIds = conversationsData.map(c => c.id);
        
        const { data: messages, error: msgError } = await supabase
          .from("mensajes")
          .select("created_at")
          .in("conversacion_id", conversationIds)
          .gte("created_at", startDateStr)
          .lte("created_at", endDateStr);
          
        if (msgError) throw msgError;
        messagesData = messages || [];
      }
      
      // Create a map of dates to count activities
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      const activityMap = new Map<string, { messages: number, interactions: number }>();
      
      // Initialize all dates with zero counts
      dateRange.forEach(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        activityMap.set(dateStr, { messages: 0, interactions: 0 });
      });
      
      // Count messages per day
      messagesData.forEach(msg => {
        const date = format(new Date(msg.created_at), "yyyy-MM-dd");
        if (activityMap.has(date)) {
          const current = activityMap.get(date)!;
          activityMap.set(date, { ...current, messages: current.messages + 1 });
        }
      });
      
      // Count interactions per day
      interactionsData?.forEach(interaction => {
        const date = format(new Date(interaction.created_at), "yyyy-MM-dd");
        if (activityMap.has(date)) {
          const current = activityMap.get(date)!;
          activityMap.set(date, { ...current, interactions: current.interactions + 1 });
        }
      });
      
      // Convert map to array for chart data
      const formattedData: ActivityData[] = Array.from(activityMap.entries())
        .map(([date, counts]) => ({
          date,
          messages: counts.messages,
          interactions: counts.interactions
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      // Calculate totals
      const totalMessages = messagesData.length;
      const totalInteractions = interactionsData?.length || 0;
      
      setTotalCounts({
        messages: totalMessages,
        interactions: totalInteractions
      });
      setChartData(formattedData);
    } catch (error) {
      console.error("Error fetching activity data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const navigatePrevMonth = () => {
    setStartDate(prev => subMonths(prev, 3));
  };
  
  const navigateNextMonth = () => {
    const nextDate = subMonths(new Date(), 2);
    // Only allow navigating up to current month - 2
    if (startDate < nextDate) {
      setStartDate(prev => subMonths(endOfMonth(prev), -3));
    }
  };
  
  const canNavigateNext = startDate < subMonths(new Date(), 2);
  
  // Get formatted month range for display
  const monthRangeDisplay = `${format(startDate, 'MMMM yyyy', { locale: es })} - ${format(endOfMonth(startDate), 'MMMM yyyy', { locale: es })}`;
  
  const chartConfig = {
    messages: {
      label: "Mensajes",
      color: "hsl(var(--chart-1))"
    },
    interactions: {
      label: "Interacciones",
      color: "hsl(var(--chart-3))"
    }
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">Actividad del Lead</CardTitle>
          <CardDescription>
            Mensajes e interacciones
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={navigatePrevMonth}
            className="h-7 w-7"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {monthRangeDisplay}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={navigateNextMonth}
            disabled={!canNavigateNext}
            className="h-7 w-7"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 mb-4 text-center">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Total Mensajes</span>
            <span className="text-xl font-semibold">{totalCounts.messages}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Total Interacciones</span>
            <span className="text-xl font-semibold">{totalCounts.interactions}</span>
          </div>
        </div>
        
        {isLoading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : (
          <ChartContainer
            config={chartConfig}
            className="h-[200px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={20}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return format(date, "dd MMM", { locale: es });
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  allowDecimals={false}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="w-[150px]"
                      labelFormatter={(value) => {
                        return format(new Date(value), "dd MMMM yyyy", { locale: es });
                      }}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="messages"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="interactions"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
