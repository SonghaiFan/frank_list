import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { overlayTransition, sheetTransition } from '@/lib/motion';

interface ModalDialogProps {
  body: ReactNode;
  children: ReactNode;
  title: string;
  onClose: () => void;
}

export function ModalDialog({ body, children, title, onClose }: ModalDialogProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={overlayTransition}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-neutral-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={sheetTransition}
        className="bg-white p-7 rounded-3xl shadow-2xl max-w-sm w-full flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="space-y-2">
          <h3 className="text-klein font-bold text-lg">{title}</h3>
          <div className="text-neutral-500 text-sm leading-6">{body}</div>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}
