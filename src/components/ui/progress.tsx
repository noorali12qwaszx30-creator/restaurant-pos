import { cn } from "@/lib/utils";

function Progress({ value = 0, className }: { value?: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-elevated", className)}>
      <div
        className="h-full bg-primary transition-all duration-500 rounded-full"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
export { Progress };
