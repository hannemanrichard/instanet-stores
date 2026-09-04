"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/components/ui/chart";
import type { DashboardSeriesPoint } from "../domain/dashboardSales";
import { formatChartAxisDate, formatDashboardAmount } from "./dashboardFormatters";

type DailySalesChartProps = {
  title: string;
  data: DashboardSeriesPoint[];
  seriesLabel: string;
  ariaLabel: string;
};

export const DailySalesChart = ({
  title,
  data,
  seriesLabel,
  ariaLabel,
}: DailySalesChartProps) => {
  const chartConfig = {
    value: {
      label: seriesLabel,
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="space-y-0 border-b border-border/60 bg-muted/20 px-4 py-3.5 sm:px-5">
        <CardTitle className="text-sm font-semibold tracking-tight">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-3 pt-4 sm:px-3 sm:pb-4">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[260px] w-full"
          aria-label={ariaLabel}
        >
          <BarChart
            data={data}
            margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 6" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              minTickGap={28}
              tickMargin={8}
              tickFormatter={formatChartAxisDate}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={52}
              tickMargin={4}
              tickFormatter={(value: number) => formatDashboardAmount(value)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    typeof value === "string"
                      ? formatChartAxisDate(value)
                      : String(value)
                  }
                />
              }
            />
            <Bar
              dataKey="value"
              fill="var(--color-value)"
              radius={[8, 8, 0, 0]}
              maxBarSize={36}
              isAnimationActive
              animationDuration={600}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
