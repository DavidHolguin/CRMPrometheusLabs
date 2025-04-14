"use client"

import * as React from "react"
import { cva } from "class-variance-authority"
import { Tooltip as RechartsTooltip } from "recharts"

import { cn } from "@/lib/utils"

// Tipos para la configuración del gráfico
export type ChartConfig = Record<
  string,
  {
    label: string
    color?: string
  }
>

interface ChartContextValue {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextValue | undefined>(undefined)

function useChartContext() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChartContext debe ser usado dentro de un ChartProvider")
  }
  return context
}

// Componente contenedor para el gráfico
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config: ChartConfig
  }
>(({ className, children, config, ...props }, ref) => {
  const cssVars = React.useMemo(() => {
    const entries = Object.entries(config)
      .filter(([, value]) => Boolean(value.color))
      .map(([key, value]) => [`--color-${key}`, value.color])

    return Object.fromEntries(entries)
  }, [config])

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={ref}
        className={cn("h-80", className)}
        style={cssVars as React.CSSProperties}
        {...props}
      >
        {children}
      </div>
    </ChartContext.Provider>
  )
})

ChartContainer.displayName = "ChartContainer"

// Estilos para el tooltip
const tooltipVariants = cva(
  "overflow-hidden bg-background text-foreground border rounded-md shadow-md",
  {
    variants: {
      size: {
        default: "p-3 w-56",
        sm: "p-2 w-48",
        lg: "p-4 w-64",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

// Componente para el tooltip del gráfico
const ChartTooltip = React.forwardRef<
  React.ElementRef<typeof RechartsTooltip>,
  React.ComponentPropsWithoutRef<typeof RechartsTooltip>
>((props, ref) => (
  <RechartsTooltip ref={ref} {...props} />
))

ChartTooltip.displayName = "ChartTooltip"

// Tipos para el contenido del tooltip
type TooltipRenderProps = {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    payload: Record<string, any>
  }>
  label?: string
}

interface ChartTooltipContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Pick<TooltipRenderProps, "label" | "payload"> {
  labelFormatter?: (value: any) => React.ReactNode
  valueFormatter?: (value: number) => React.ReactNode
  renderItem?: (props: {
    name: string
    color?: string
    label: string
    value: number
    formattedValue: React.ReactNode
  }) => React.ReactNode
  size?: "default" | "sm" | "lg"
  indicator?: "line" | "dashed"
  nameKey?: string
  hideLabel?: boolean
}

// Componente para el contenido del tooltip
function ChartTooltipContent({
  label,
  payload = [],
  labelFormatter,
  valueFormatter = (value) => value,
  renderItem,
  className,
  size,
  indicator = "line",
  nameKey,
  hideLabel = false,
  ...props
}: ChartTooltipContentProps) {
  const { config } = useChartContext()

  if (!payload?.length) {
    return null
  }

  return (
    <div className={cn(tooltipVariants({ size }), className)} {...props}>
      {!hideLabel && (
        <div className="border-b mb-2 pb-2 font-medium">
          {labelFormatter?.(label) ?? label}
        </div>
      )}
      <div className="flex flex-col gap-2">
        {payload.map((item) => {
          const { name, value } = item
          const key = nameKey ?? name
          const formattedValue = valueFormatter(value)
          const configEntry = config?.[key]
          const itemLabel = configEntry?.label ?? key

          if (renderItem) {
            return renderItem({
              name: key,
              color: configEntry?.color,
              label: itemLabel,
              value,
              formattedValue,
            })
          }

          return (
            <div key={name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background:
                      configEntry?.color ?? `var(--color-${name})` ?? "#888",
                  }}
                />
                <span className="truncate text-sm">{itemLabel}</span>
              </div>
              <span className="text-right font-medium">{formattedValue}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Componente para la leyenda del gráfico
interface ChartLegendProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  items: Array<{
    name: string;
    value?: number | string;
    color?: string;
    label?: string;
  }>;
  size?: "default" | "sm" | "lg";
  horizontal?: boolean;
}

function ChartLegend({
  className,
  items,
  size = "default",
  horizontal = false,
  ...props
}: ChartLegendProps) {
  const { config } = useChartContext();
  
  return (
    <div 
      className={cn(
        "flex gap-4 items-start", 
        horizontal ? "flex-row flex-wrap" : "flex-col",
        className
      )} 
      {...props}
    >
      {items.map((item) => {
        const configEntry = config?.[item.name];
        const label = item.label || configEntry?.label || item.name;
        const color = item.color || configEntry?.color || `var(--color-${item.name})` || "#888";
        
        return (
          <div key={item.name} className="flex items-center gap-2">
            <div 
              className={cn(
                "rounded-full", 
                size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4"
              )} 
              style={{ backgroundColor: color }}
            />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{label}</span>
              {item.value !== undefined && (
                <span className="text-sm text-muted-foreground">({item.value})</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Componente para el contenido de la leyenda
interface ChartLegendContentProps {
  payload?: Array<{
    value: string;
    type: string;
    id: string;
    color: string;
    payload: {
      stroke?: string;
      fill?: string;
      name?: string;
      value?: number;
      dataKey?: string;
    };
  }>;
}

function ChartLegendContent({ payload }: ChartLegendContentProps) {
  const { config } = useChartContext();
  
  if (!payload || payload.length === 0) {
    return null;
  }
  
  return (
    <div className="flex items-center gap-4 justify-center flex-wrap">
      {payload.map((entry, index) => {
        const dataKey = entry.payload.dataKey || entry.value;
        const configEntry = dataKey ? config[dataKey] : undefined;
        const label = configEntry?.label || entry.value;
        const color = entry.color || configEntry?.color || `var(--color-${dataKey})` || "#888";
        
        return (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm text-muted-foreground">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent }
