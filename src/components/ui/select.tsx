import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "w-full h-10 rounded-md border border-border bg-surface-elevated px-3 py-2 pe-8 text-sm text-text-primary appearance-none",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-colors",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="absolute inset-y-0 end-2.5 my-auto w-4 h-4 text-text-muted pointer-events-none" />
    </div>
  )
);
Select.displayName = "Select";
export { Select };
