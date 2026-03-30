import { cn } from '@/lib/cn';

interface MobileNotebookThumbnailProps {
  className?: string;
  title: string;
}

export function MobileNotebookThumbnail({
  className,
  title,
}: MobileNotebookThumbnailProps) {
  return (
    <div className={cn('relative h-[176px] w-[118px]', className)}>
      <div className="absolute inset-y-[10px] left-0 z-10 flex w-4 flex-col justify-between">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-4 w-6 rounded-full border border-neutral-300 bg-linear-to-r from-neutral-400 via-neutral-100 to-neutral-300 shadow-[0_2px_5px_rgba(0,0,0,0.14)]"
          />
        ))}
      </div>

      <div className="absolute inset-y-0 right-0 w-[102px] overflow-hidden rounded-[4px] border border-[rgba(0,47,167,0.1)] bg-[#F7F7F9] shadow-[0_18px_30px_rgba(0,47,167,0.08)]">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-linear-to-bl from-black/5 to-transparent" />
        <div className="absolute inset-y-0 left-[16px] w-px bg-[rgba(0,47,167,0.15)]" />
        <div className="flex h-full flex-col items-center justify-center px-4 text-center">
          <h3 className="line-clamp-3 text-[22px] font-bold tracking-tight text-klein/90">{title}</h3>
          <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.24em] text-neutral-400">
            Frank List
          </p>
        </div>
      </div>
    </div>
  );
}
