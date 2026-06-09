import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center animate-in", className)}>
      <div className="relative mb-5">
        <div className="w-20 h-20 rounded-3xl bg-surface border border-border shadow-card flex items-center justify-center text-text-muted">
          {icon ?? <Inbox className="w-9 h-9" strokeWidth={1.5} />}
        </div>
        {/* subtle glow ring */}
        <div className="absolute inset-0 rounded-3xl bg-primary/5 blur-xl scale-110 -z-10" />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-text-muted mb-5 max-w-[220px] leading-relaxed">{description}</p>
      )}
      {action}
    </div>
  );
}
