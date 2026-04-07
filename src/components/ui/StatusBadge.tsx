import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const statusBadgeVariants = cva("text-xs font-medium tracking-wide", {
  variants: {
    status: {
      bound: "text-brand opacity-60",
      complete: "text-brand",
      pending: "text-neutral-300",
    },
  },
  defaultVariants: {
    status: "pending",
  },
});

interface StatusBadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {}

export function StatusBadge({
  className,
  status,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(statusBadgeVariants({ status }), className)}
      {...props}
    />
  );
}
