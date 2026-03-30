import { Users } from 'lucide-react';

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
  return (
    <footer className="mt-10 flex flex-col items-center">
      {isCompareReviewFlow && (
        <button
          onClick={onStartComparison}
          className="px-12 py-4 bg-neutral-900 text-white rounded-full font-medium tracking-tight shadow-xl hover:bg-black transition-all flex items-center gap-3"
        >
          <Users size={18} />
          {compareLabel}
        </button>
      )}
      {isEditingFlow && (
        <div className="mt-3 flex items-center gap-4 ui-mono opacity-55">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-klein" />
            {legendSelf}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            {legendExternal}
          </span>
        </div>
      )}
      <div className="mt-6 ui-mono opacity-20">{signature}</div>
    </footer>
  );
}
