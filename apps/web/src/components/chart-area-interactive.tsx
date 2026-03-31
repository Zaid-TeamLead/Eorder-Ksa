"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/formatters";

export interface SalesTrendPoint {
  monthLabel: string;
  amountWithoutTax: number;
  quantity: number;
}

interface ChartAreaInteractiveProps {
  data: SalesTrendPoint[];
}

const chartConfig = {
  amountWithoutTax: {
    label: "Amount Without Tax",
    color: "#16a34a",
  },
  quantity: {
    label: "Quantity",
    color: "#0ea5e9",
  },
} satisfies ChartConfig;

export function ChartAreaInteractive({ data }: ChartAreaInteractiveProps) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="text-lg">Sales Trend</CardTitle>
        <CardDescription className="text-xs">
          <span className="hidden @[540px]/card:block">Amount and quantity by month</span>
          <span className="@[540px]/card:hidden">Monthly trend</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {data.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
            No monthly trend data available.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[280px] w-full"
          >
            <AreaChart data={data}>
              <defs>
                <linearGradient id="fillAmountWithoutTax" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-amountWithoutTax)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-amountWithoutTax)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillQuantity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-quantity)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-quantity)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="monthLabel"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={16}
              />
              <YAxis yAxisId="amount" hide />
              <YAxis yAxisId="quantity" hide />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value) => String(value)}
                    formatter={(value, name) => {
                      if (name === "amountWithoutTax") {
                        return (
                          <div className="flex min-w-[160px] items-center justify-between gap-3">
                            <span className="text-muted-foreground">Amount Without Tax</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatCurrency(Number(value))}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div className="flex min-w-[160px] items-center justify-between gap-3">
                          <span className="text-muted-foreground">Quantity</span>
                          <span className="font-mono font-medium tabular-nums">
                            {Number(value).toLocaleString("en-US")}
                          </span>
                        </div>
                      );
                    }}
                  />
                }
              />
              <Area
                yAxisId="amount"
                dataKey="amountWithoutTax"
                type="natural"
                fill="url(#fillAmountWithoutTax)"
                stroke="var(--color-amountWithoutTax)"
                strokeWidth={2}
              />
              <Area
                yAxisId="quantity"
                dataKey="quantity"
                type="natural"
                fill="url(#fillQuantity)"
                stroke="var(--color-quantity)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
