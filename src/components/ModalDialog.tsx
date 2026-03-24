import { motion } from 'motion/react';
import type { ReactNode } from 'react';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-neutral-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="bg-white p-7 rounded-3xl shadow-2xl max-w-sm w-full flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
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
