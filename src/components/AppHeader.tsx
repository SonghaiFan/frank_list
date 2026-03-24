import React from 'react';
import { ArrowLeft, Check, Menu, QrCode, RotateCcw, Share2 } from 'lucide-react';
import type { AppMode } from '../lib/notebook-types';
import { cn } from '../lib/cn';

interface AppHeaderProps {
  copySuccess: boolean;
  isGalleryClosed?: boolean;
  mode: AppMode;
  onBack: () => void;
  onCopy: () => void;
  onReset: () => void;
  onShowQrCode: () => void;
  onToggleGalleryClosed?: () => void;
  isDetailView?: boolean;
  onBackToGrid?: () => void;
}

export function AppHeader({
  copySuccess,
  isGalleryClosed = false,
  mode,
  onBack,
  onCopy,
  onReset,
  onShowQrCode,
  onToggleGalleryClosed,
  isDetailView,
  onBackToGrid,
}: AppHeaderProps) {
  const circleButtonClass =
    'flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-[#666] transition-all hover:-translate-y-px hover:border-klein hover:text-klein cursor-pointer';

  return (
    <nav className="mb-5 flex items-center justify-between px-2 w-full">
      <div className="flex items-center gap-4">
        {isDetailView && (
             <button onClick={onBackToGrid} className={circleButtonClass} title="Back to Library">
                <ArrowLeft size={18} />
             </button>
        )}
        <div className="flex flex-col">
            <span className="ui-label text-base font-bold">Rams Life</span>
            <span className="ui-mono uppercase tracking-tighter text-xs opacity-50">
            {mode === 'edit' ? 'v2.0 / Workspace' : 'v2.0 / Comparison'}
            </span>
        </div>
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={onToggleGalleryClosed}
          className={cn(
            circleButtonClass,
            isGalleryClosed && 'border-transparent bg-klein text-white hover:bg-klein hover:text-white'
          )}
          title={isGalleryClosed ? 'Open stack view' : 'Close into notebook'}
        >
          <Menu size={18} />
        </button>

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
