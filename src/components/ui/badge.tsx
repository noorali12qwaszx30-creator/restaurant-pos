import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:  "bg-primary/15 text-primary border border-primary/20",
        success:  "bg-status-success/15 text-status-success border border-status-success/20",
        warning:  "bg-status-warning/15 text-status-warning border border-status-warning/20",
        error:    "bg-status-error/15 text-status-error border border-status-error/20",
        info:     "bg-status-info/15 text-status-info border border-status-info/20",
        secondary:"bg-surface-elevated text-text-secondary border border-border",
        outline:  "border border-border text-text-secondary",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
