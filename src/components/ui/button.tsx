import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] text-base font-bold border-2 border-transparent transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-fg border-accent hover:bg-accent-2",
        secondary:
          "bg-surface border-line text-ink hover:bg-surface-2",
        ghost: "text-ink border-transparent hover:bg-surface-2",
        danger: "bg-danger text-accent-fg border-danger hover:opacity-90",
      },
      size: {
        default: "min-h-12 h-12 px-4",
        sm: "min-h-11 h-11 px-3 text-base",
        lg: "min-h-14 h-14 px-5 text-lg",
        icon: "size-12",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>
>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = "Button";
