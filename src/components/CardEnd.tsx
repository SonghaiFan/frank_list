import React, { forwardRef } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/cn';
import { PAGE_CARD_HEIGHT_PX, PAGE_CARD_WIDTH_PX } from '../lib/workspace-constants';

interface CardEndProps {
  className?: string;
  isActive?: boolean;
}

export const CardEnd = forwardRef<HTMLDivElement, CardEndProps>(({
  className,
  isActive = true,
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
      layoutId="notebook-end"
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-linear-to-bl from-transparent to-black/5" />
      <div className="relative z-10 px-12 opacity-40">
        <p className="text-neutral-400 font-mono text-xs uppercase tracking-widest">
          End of List
        </p>
      </div>
    </motion.div>
  );
});

CardEnd.displayName = 'CardEnd';
