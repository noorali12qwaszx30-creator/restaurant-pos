import { cn } from "@/lib/utils";

function Separator({ className, orientation = "horizontal" }: { className?: string; orientation?: "horizontal" | "vertical" }) {
  return (
    <div
      className={cn(
        "bg-border shrink-0",
        orientation === "horizontal" ? "h-px w-full" : "w-px self-stretch",
        className
      )}
    />
  );
}
export { Separator };
