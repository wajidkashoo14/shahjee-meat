import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold tracking-[0.01em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        // The only green in the UI: main actions (Add to cart, Checkout, Sign in, Save).
        primary: "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover",
        secondary: "border border-border bg-surface text-foreground shadow-sm hover:border-foreground",
        outline: "border border-input bg-transparent text-foreground hover:bg-surface-raised",
        ghost: "text-foreground hover:bg-surface-raised",
        link: "text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground",
        destructive: "bg-danger text-danger-foreground shadow-sm hover:opacity-90",
        // Ink: selected toggles and filters, which are states rather than actions
        ink: "bg-foreground text-background shadow-sm hover:bg-foreground/85",
        // Secondary actions on photography
        inverse: "bg-on-scrim text-scrim shadow-sm hover:bg-on-scrim/90",
        inverseOutline: "border border-on-scrim/50 bg-scrim/15 text-on-scrim backdrop-blur-sm hover:border-on-scrim hover:bg-on-scrim/10",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-6",
        lg: "h-13 px-8 text-base",
        icon: "size-10 max-[360px]:size-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";
