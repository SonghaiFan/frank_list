import { ArrowLeft, Check, QrCode, RotateCcw, Share2 } from 'lucide-react';
import type { AppMode } from '../lib/notebook-types';
import { cn } from '../lib/cn';

interface AppHeaderProps {
  copySuccess: boolean;
  mode: AppMode;
  onBack: () => void;
  onCopy: () => void;
  onReset: () => void;
  onShowQrCode: () => void;
}

export function AppHeader({
  copySuccess,
  mode,
  onBack,
  onCopy,
  onReset,
  onShowQrCode,
}: AppHeaderProps) {
  const circleButtonClass =
    'flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-[#666] transition-all hover:-translate-y-px hover:border-klein hover:text-klein';

  return (
    <nav className="mb-5 flex items-center justify-between px-2">
      <div className="flex flex-col">
        <span className="ui-label">人生清单</span>
        <span className="ui-mono uppercase tracking-tighter">
          {mode === 'edit' ? 'v2.0 / Workspace' : 'v2.0 / 对比'}
        </span>
      </div>
      <div className="flex gap-3">
        {mode !== 'edit' && (
          <button onClick={onBack} className={circleButtonClass} title="Back to Edit">
            <ArrowLeft size={18} />
          </button>
        )}
        {mode === 'edit' && (
          <button onClick={onReset} className={cn(circleButtonClass, 'text-neutral-300')} title="Reset to Default">
            <RotateCcw size={18} />
          </button>
        )}
        {mode === 'edit' && (
          <button onClick={onShowQrCode} className={circleButtonClass} title="QR Code">
            <QrCode size={18} />
          </button>
        )}
        {mode === 'edit' && (
          <button
            onClick={onCopy}
            className={cn(
              circleButtonClass,
              copySuccess && 'border-transparent bg-klein text-white hover:bg-klein hover:text-white'
            )}
            title="Share Link"
          >
            {copySuccess ? <Check size={18} /> : <Share2 size={18} />}
          </button>
        )}
      </div>
    </nav>
  );
}
