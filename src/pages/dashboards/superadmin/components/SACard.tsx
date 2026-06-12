import { cn } from "@/lib/utils";

interface SACardProps {
  className?: string;
  glass?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export function SACard({ className, glass, children, onClick }: SACardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl border transition-all",
        glass
          ? "bg-white/5 backdrop-blur-md border-white/10"
          : "bg-surface border-border",
        onClick && "cursor-pointer hover:border-primary/30 active:scale-[0.98]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SASkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-xl bg-surface-elevated", className)} />
  );
}

export function SABadge({
  children, color = "default",
}: {
  children: React.ReactNode;
  color?: "default" | "success" | "error" | "warning" | "info" | "amber";
}) {
  const colors = {
    default: "bg-surface-elevated text-text-muted border-border",
    success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    error:   "bg-red-500/15 text-red-400 border-red-500/25",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    info:    "bg-sky-500/15 text-sky-400 border-sky-500/25",
    amber:   "bg-amber-500/15 text-amber-400 border-amber-500/25",
  };
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10px] font-bold border rounded-full px-2 py-0.5 leading-none",
      colors[color]
    )}>
      {children}
    </span>
  );
}

/** Live pulse dot */
export function PulseDot({ color = "success" }: { color?: "success" | "error" | "warning" | "muted" }) {
  const c = {
    success: "bg-emerald-400",
    error:   "bg-red-400",
    warning: "bg-amber-400",
    muted:   "bg-text-muted",
  };
  return (
    <span className="relative flex h-2 w-2">
      <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-60", c[color])} />
      <span className={cn("relative inline-flex rounded-full h-2 w-2", c[color])} />
    </span>
  );
}

/** Section header */
export function SASection({
  title, subtitle, action, children, className,
}: {
  title: string; subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-text-primary">{title}</p>
          {subtitle && <p className="text-[11px] text-text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
