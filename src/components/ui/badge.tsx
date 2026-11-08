import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        sale: "bg-primary text-primary-foreground",
        soldout: "bg-surface/90 text-foreground backdrop-blur",
        new: "bg-foreground text-background",
        premium: "bg-surface/90 text-primary backdrop-blur",
        outline: "border border-border text-foreground-muted",
        default: "bg-surface-raised text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
