import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    positive: boolean;
  };
  icon: ReactNode;
  className?: string;
}

export function StatsCard({ title, value, change, icon, className }: StatsCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-glow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
          {change && (
            <p
              className={cn(
                "mt-1 text-sm",
                change.positive ? "text-status-done" : "text-status-blocked"
              )}
            >
              {change.positive ? "+" : "-"}{Math.abs(change.value)}% from last week
            </p>
          )}
        </div>
        <div className="rounded-lg bg-primary/10 p-3 text-primary">{icon}</div>
      </div>
    </div>
  );
}
