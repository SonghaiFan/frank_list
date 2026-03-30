import React, { forwardRef } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';
import { PAGE_CARD_HEIGHT_PX, PAGE_CARD_WIDTH_PX } from '@/lib/workspace-constants';

interface CardCoverProps {
  className?: string;
  isActive?: boolean;
  layoutId?: string;
  title?: string;
}

export const CardCover = forwardRef<HTMLDivElement, CardCoverProps>(({
  className,
  isActive = true,
  layoutId,
  title = 'Notebook',
}, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn(
        'hybrid-paper mx-auto flex flex-col items-center justify-center text-center bg-[#F7F7F9]',
        className
      )}
      style={{ width: `${PAGE_CARD_WIDTH_PX}px`, height: `${PAGE_CARD_HEIGHT_PX}px` }}
      layout
      layoutId={layoutId}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-linear-to-bl from-black/5 to-transparent" />
      <div className="relative z-10 px-12">
        <h1 className="text-4xl font-bold text-klein/90 mb-4 tracking-tight">{title}</h1>
        <p className="text-neutral-400 font-mono text-sm uppercase tracking-widest">
          Frank List
        </p>
      </div>
    </motion.div>
  );
});

CardCover.displayName = 'CardCover';
