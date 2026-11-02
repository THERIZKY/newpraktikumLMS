import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded px-2 py-0.5 text-xs font-mono font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary/15 text-secondary border border-secondary/30",
        destructive:
          "border-transparent bg-destructive/15 text-destructive border border-destructive/30",
        outline: "text-foreground border border-border",
        // Semantic LMS Status badges from Stitch:
        present:
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
        late:
          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
        excused:
          "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20",
        absent:
          "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
        neonPink:
          "bg-neon-pink/10 text-neon-pink border border-neon-pink/30",
        neonCyan:
          "bg-neon-cyan/10 text-cyan-400 border border-neon-cyan/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
