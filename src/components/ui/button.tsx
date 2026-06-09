import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground rounded-xl shadow-sm hover:bg-primary-hover hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        destructive:
          "bg-status-error text-primary-foreground rounded-xl shadow-sm hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0",
        outline:
          "border border-border bg-transparent hover:bg-surface-elevated rounded-xl text-text-primary hover:border-primary/30",
        secondary:
          "bg-surface-elevated text-text-primary rounded-xl hover:bg-border border border-border hover:border-border/80",
        ghost:
          "hover:bg-surface-elevated rounded-xl text-text-primary",
        link:
          "text-primary underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-10 px-5 py-2 text-sm",
        sm: "h-8 px-3.5 text-xs rounded-lg",
        lg: "h-12 px-7 text-base rounded-xl",
        icon: "h-9 w-9 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
