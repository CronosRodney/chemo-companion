import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        outline: "border border-primary text-primary bg-background hover:bg-primary/10",
        secondary: "bg-secondary text-secondary-foreground border border-border hover:bg-accent",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline font-medium",
        medical: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        success: "bg-success text-success-foreground hover:bg-success/90 shadow-sm",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 shadow-sm",
        hero: "bg-primary text-primary-foreground hover:bg-primary/85 shadow-md font-bold",
        luxury: "bg-primary text-primary-foreground hover:bg-primary/85 shadow-md font-bold",
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
