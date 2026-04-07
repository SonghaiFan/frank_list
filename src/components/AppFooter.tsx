import { Users } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";

interface AppFooterProps {
  compareLabel: string;
  isCompareReviewFlow: boolean;
  isEditingFlow: boolean;
  legendExternal: string;
  legendSelf: string;
  onStartComparison: () => void;
  signature: string;
}

export function AppFooter({
  compareLabel,
  isCompareReviewFlow,
  isEditingFlow,
  legendExternal,
  legendSelf,
  onStartComparison,
  signature,
}: AppFooterProps) {
  const isMobile = useIsMobile();
  const showStickyCompareCta = isMobile && isCompareReviewFlow;

  return (
    <footer className="mt-10 flex flex-col items-center">
      {isCompareReviewFlow && !showStickyCompareCta && (
        <button
          onClick={onStartComparison}
          className="flex items-center gap-3 rounded-full bg-neutral-900 px-12 py-4 font-medium tracking-tight text-white shadow-xl transition-all hover:bg-black"
        >
          <Users size={18} />
          {compareLabel}
        </button>
      )}
      {showStickyCompareCta && (
        <>
          <div className="h-24" aria-hidden="true" />
          <div className="fixed inset-x-0 bottom-0 z-50 px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] md:hidden">
            <button
              onClick={onStartComparison}
              className="mx-auto flex w-full max-w-105 items-center justify-center gap-3 rounded-full bg-neutral-900 px-6 py-4 font-medium tracking-tight text-white shadow-[0_16px_40px_rgba(0,0,0,0.22)] transition-all hover:bg-black"
            >
              <Users size={18} />
              {compareLabel}
            </button>
          </div>
        </>
      )}
      {isEditingFlow && (
        <div className="ui-mono mt-3 flex items-center gap-4 opacity-55">
          <span className="flex items-center gap-1.5">
            <span className="bg-klein h-1.5 w-1.5 rounded-full" />
            {legendSelf}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            {legendExternal}
          </span>
        </div>
      )}
      <div className="ui-mono mt-6 opacity-20">{signature}</div>
    </footer>
  );
}
