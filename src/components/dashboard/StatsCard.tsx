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
    <div className={cn(
      "bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3 shadow-card",
      "transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5",
      className
    )}>
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide leading-tight">{label}</p>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-black text-text-primary tracking-tight num">
          {prefix}{typeof value === "number" ? value.toLocaleString("ar-SA") : value}{suffix}
        </p>
        {change !== undefined && (
          <div className={cn(
            "flex items-center gap-1 mt-1.5 text-xs font-semibold",
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
