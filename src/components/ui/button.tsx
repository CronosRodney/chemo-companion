import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "medical-gradient text-primary-foreground shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-luxury)] hover:scale-[1.02] premium-button",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-luxury)] premium-button",
        outline: "border-2 border-primary/20 bg-background/50 backdrop-blur-sm hover:bg-primary/5 hover:border-primary/40 hover:shadow-[var(--shadow-card)]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-accent shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-luxury)] premium-button",
        ghost: "hover:bg-accent/50 hover:text-accent-foreground backdrop-blur-sm",
        link: "text-primary underline-offset-4 hover:underline font-medium",
        medical: "medical-gradient text-primary-foreground shadow-[var(--shadow-luxury)] hover:shadow-[var(--shadow-premium)] transform hover:scale-105 glow",
        success: "bg-success text-success-foreground hover:bg-success/90 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-luxury)] premium-button",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-luxury)] premium-button",
        hero: "hero-gradient text-white hover:shadow-[var(--shadow-premium)] shadow-[var(--shadow-luxury)] transform hover:scale-105 font-bold text-shadow",
        luxury: "luxury-gradient text-white shadow-[var(--shadow-premium)] hover:shadow-[var(--shadow-glow)] transform hover:scale-105 font-bold glow",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-xl px-5 text-sm",
        lg: "h-14 rounded-xl px-8 text-base font-bold",
        icon: "h-12 w-12 rounded-xl",
        xl: "h-16 rounded-2xl px-10 text-lg font-bold",
        xxl: "h-20 rounded-2xl px-12 text-xl font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
