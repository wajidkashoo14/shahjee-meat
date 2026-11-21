import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em]",
  {
    variants: {
      variant: {
        // Merchandising labels (sit on product photos). Ink and parchment only;
        // red marks a sale. Wagyu is set in the display italic so it reads
        // apart from "New" without another color.
        sale: "bg-sale text-sale-foreground",
        new: "bg-foreground text-background",
        premium: "bg-scrim/85 font-display text-xs font-semibold normal-case italic tracking-normal text-on-scrim backdrop-blur",
        soldout: "bg-surface/90 text-foreground backdrop-blur",
        // Neutral + status (sit on surfaces)
        outline: "border border-border text-foreground-muted",
        default: "bg-surface-raised text-foreground",
        success: "bg-success-soft text-success-soft-foreground",
        warning: "bg-warning-soft text-warning-soft-foreground",
        danger: "bg-danger-soft text-danger-soft-foreground",
        info: "bg-info-soft text-info-soft-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
