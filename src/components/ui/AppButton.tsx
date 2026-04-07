import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center transition-all disabled:cursor-not-allowed disabled:opacity-35",
  {
    variants: {
      variant: {
        "dialog-danger":
          "flex-1 rounded-xl bg-danger py-3 font-medium text-white transition-colors hover:bg-danger-strong",
        "dialog-neutral":
          "flex-1 rounded-xl bg-neutral-100 py-3 font-medium text-neutral-600 transition-colors hover:bg-neutral-200",
        "floating-icon":
          "h-12 w-12 rounded-full border border-neutral-200 bg-white/80 text-ink-muted shadow-[0_8px_16px_rgba(0,0,0,0.06)] backdrop-blur-sm hover:-translate-y-px hover:border-brand hover:text-brand",
        "floating-pill":
          "h-12 min-w-12 gap-1 rounded-full border-none bg-white/92 px-4 text-gray-900/85 shadow-[0_12px_26px_rgba(0,0,0,0.1)] hover:-translate-y-px hover:bg-white",
        "icon-active":
          "h-10 w-10 cursor-pointer rounded-full border border-transparent bg-brand text-white hover:-translate-y-px hover:bg-brand hover:text-white",
        "icon-default":
          "h-10 w-10 cursor-pointer rounded-full border border-neutral-200 bg-white text-ink-muted hover:-translate-y-px hover:border-brand hover:text-brand",
      },
    },
  },
);

interface AppButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: ReactNode;
}

export function AppButton({
  children,
  className,
  type = "button",
  variant,
  ...props
}: AppButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant }), className)}
      {...props}
    >
      {children}
    </button>
  );
}
