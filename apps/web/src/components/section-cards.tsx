import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface SectionCardMetric {
  title: string;
  value: string;
  footerTitle: string;
  footerDescription: string;
  trend?: "up" | "down";
  badgeText?: string;
}

interface SectionCardsProps {
  metrics: SectionCardMetric[];
}

export function SectionCards({ metrics }: SectionCardsProps) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {metrics.map((metric) => {
        const isDown = metric.trend === "down";
        const TrendIcon = isDown ? IconTrendingDown : IconTrendingUp;

        return (
          <Card className="@container/card" key={metric.title}>
            <CardHeader>
              <CardDescription className="text-xs">{metric.title}</CardDescription>
              <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl">
                {metric.value}
              </CardTitle>
              <CardAction>
                <Badge variant="outline" className="text-[11px]">
                  <TrendIcon />
                  {metric.badgeText || "Live"}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-xs">
              <div className="line-clamp-1 flex gap-2 font-medium text-xs">
                {metric.footerTitle} <TrendIcon className="size-4" />
              </div>
              <div className="text-[11px] text-muted-foreground">{metric.footerDescription}</div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
