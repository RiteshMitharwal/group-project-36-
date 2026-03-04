import * as React from "react";
import { cn } from "@/lib/cn";

const variants = {
  default: "bg-primary/10 text-primary border-transparent",
  secondary: "bg-secondary text-secondary-foreground border-transparent",
  destructive: "bg-destructive/10 text-destructive border-transparent",
  outline: "border border-input",
  balanced: "bg-primary/10 text-primary border-transparent",
  overloaded: "bg-red-600/15 text-red-700 dark:text-red-400 border border-red-500/20",
  underloaded: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-transparent",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
export { Badge };
