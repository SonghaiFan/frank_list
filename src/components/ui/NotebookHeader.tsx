import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";

type NotebookHeaderStatus = "bound" | "complete" | "pending";

interface NotebookHeaderProps {
  className?: string;
  inset?: "desktop" | "mobile";
  status?: NotebookHeaderStatus;
  statusLabel?: string;
  subtitle?: string;
  title: string;
}

const insetClassMap = {
  desktop:
    "mx-auto flex min-h-18 w-full max-w-135 items-end justify-between gap-4 border-b border-[rgba(0,47,167,0.1)] pr-8 pb-2 pl-15",
  mobile:
    "mx-auto flex min-h-18 w-full items-end justify-between gap-4 border-b border-[rgba(0,47,167,0.1)] pr-2 pb-2 pl-10",
} as const;

export function NotebookHeader({
  className,
  inset = "desktop",
  status,
  statusLabel,
  subtitle,
  title,
}: NotebookHeaderProps) {
  return (
    <div className={cn(insetClassMap[inset], className)}>
      <div className="min-w-0 flex-1">
        <div className="list-text truncate text-xl leading-none font-medium tracking-tight text-neutral-800">
          {title}
        </div>
        {subtitle ? (
          <div className="ui-mono mt-2 text-[10px] tracking-[0.18em] text-neutral-400 uppercase">
            {subtitle}
          </div>
        ) : null}
      </div>
      {status ? (
        <div className="mb-px flex items-center gap-3">
          <StatusBadge status={status}>{statusLabel}</StatusBadge>
        </div>
      ) : null}
    </div>
  );
}
