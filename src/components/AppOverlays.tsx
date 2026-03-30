import { AnimatePresence } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';
import { ModalDialog } from '@/components/ModalDialog';
import type { UIOverlay } from '@/stores/ui-store';

interface AppOverlaysProps {
  closeLabel: string;
  closeOverlay: () => void;
  deleteBody: string;
  deleteConfirm: string;
  deleteTitle: string;
  generateShareUrl: () => string;
  onDeleteGroup: () => void;
  onReset: () => void;
  overlay: UIOverlay;
  qrHint: string;
  resetBody: string;
  resetConfirm: string;
  resetTitle: string;
}

export function AppOverlays({
  closeLabel,
  closeOverlay,
  deleteBody,
  deleteConfirm,
  deleteTitle,
  generateShareUrl,
  onDeleteGroup,
  onReset,
  overlay,
  qrHint,
  resetBody,
  resetConfirm,
  resetTitle,
}: AppOverlaysProps) {
  return (
    <>
      <AnimatePresence>
        {overlay === 'reset-confirm' && (
          <ModalDialog title={resetTitle} body={resetBody} onClose={closeOverlay}>
            <div className="flex gap-3">
              <button
                onClick={closeOverlay}
                className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl font-medium transition-colors"
              >
                {closeLabel}
              </button>
              <button
                onClick={onReset}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
              >
                {resetConfirm}
              </button>
            </div>
          </ModalDialog>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {overlay === 'delete-group-confirm' && (
          <ModalDialog title={deleteTitle} body={deleteBody} onClose={closeOverlay}>
            <div className="flex gap-3">
              <button
                onClick={closeOverlay}
                className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl font-medium transition-colors"
              >
                {closeLabel}
              </button>
              <button
                onClick={onDeleteGroup}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
              >
                {deleteConfirm}
              </button>
            </div>
          </ModalDialog>
        )}
      </AnimatePresence>

      {overlay === 'qr' ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={closeOverlay}>
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-6" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white p-2 rounded-xl border border-neutral-100 shadow-sm">
              <QRCodeCanvas value={generateShareUrl()} size={200} level="M" />
            </div>
            <p className="text-neutral-500 text-sm">{qrHint}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
