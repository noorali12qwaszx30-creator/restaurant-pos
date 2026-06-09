import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  change?: number;
  icon?: React.ReactNode;
  className?: string;
}

export function StatsCard({ label, value, prefix = "", suffix = "", change, icon, className }: StatsCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div className={cn("bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3", className)}>
      <div className="flex items-start justify-between">
        <p className="text-xs text-text-muted leading-tight">{label}</p>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-text-muted">
            {icon}
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary">
          {prefix}{typeof value === "number" ? value.toLocaleString("ar-SA") : value}{suffix}
        </p>
        {change !== undefined && (
          <div className={cn(
            "flex items-center gap-1 mt-1 text-xs",
            isPositive ? "text-status-success" : isNegative ? "text-status-error" : "text-text-muted"
          )}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : isNegative ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            <span>{isPositive ? "+" : ""}{change}% مقارنة بالأمس</span>
          </div>
        )}
      </div>
    </div>
  );
}
