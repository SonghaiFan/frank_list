import { AnimatePresence, motion } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';
import { ModalDialog } from '@/components/ModalDialog';
import { overlayTransition, sheetTransition } from '@/lib/motion';
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
    <AnimatePresence initial={false} mode="wait">
      {overlay === 'reset-confirm' ? (
        <ModalDialog key="reset-confirm" title={resetTitle} body={resetBody} onClose={closeOverlay}>
          <div className="flex gap-3">
            <button
              onClick={closeOverlay}
              className="flex-1 rounded-xl bg-neutral-100 py-3 font-medium text-neutral-600 transition-colors hover:bg-neutral-200"
            >
              {closeLabel}
            </button>
            <button
              onClick={onReset}
              className="flex-1 rounded-xl bg-red-500 py-3 font-medium text-white transition-colors hover:bg-red-600"
            >
              {resetConfirm}
            </button>
          </div>
        </ModalDialog>
      ) : overlay === 'delete-group-confirm' ? (
        <ModalDialog key="delete-group-confirm" title={deleteTitle} body={deleteBody} onClose={closeOverlay}>
          <div className="flex gap-3">
            <button
              onClick={closeOverlay}
              className="flex-1 rounded-xl bg-neutral-100 py-3 font-medium text-neutral-600 transition-colors hover:bg-neutral-200"
            >
              {closeLabel}
            </button>
            <button
              onClick={onDeleteGroup}
              className="flex-1 rounded-xl bg-red-500 py-3 font-medium text-white transition-colors hover:bg-red-600"
            >
              {deleteConfirm}
            </button>
          </div>
        </ModalDialog>
      ) : overlay === 'qr' ? (
        <motion.div
          key="qr"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={overlayTransition}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
          onClick={closeOverlay}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={sheetTransition}
            className="flex w-full max-w-sm flex-col items-center gap-6 rounded-[28px] bg-white p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-xl border border-neutral-100 bg-white p-2 shadow-sm">
              <QRCodeCanvas value={generateShareUrl()} size={200} level="M" />
            </div>
            <p className="text-center text-sm text-neutral-500">{qrHint}</p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
