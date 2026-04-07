import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const cardVariants = cva("", {
  variants: {
    variant: {
      action:
        "mixed-blend-multiply flex origin-top cursor-pointer flex-col items-center justify-center border-2 border-dashed border-neutral-200 text-neutral-300 opacity-80 transition-all hover:bg-brand/5 hover:text-brand hover:opacity-100 hover:border-brand",
      notice:
        "list-text rounded-xl border border-brand/10 bg-brand/3 px-5 py-4 font-bold text-brand shadow-[0_18px_40px_rgba(0,47,167,0.05)]",
      paper: "hybrid-paper paper-lines",
    },
    radius: {
      default: "",
      action: "rounded-[20px]",
      actionMobile: "rounded-[14px]",
    },
  },
  defaultVariants: {
    radius: "default",
    variant: "paper",
  },
});

interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({
  className,
  radius,
  variant,
  ...props
}: CardProps) {
  return <div className={cn(cardVariants({ radius, variant }), className)} {...props} />;
}
