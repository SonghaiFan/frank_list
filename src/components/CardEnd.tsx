import React, { forwardRef } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';
import { useI18n } from '@/hooks/useI18n';
import { layoutSpring } from '@/lib/motion';
import { getPageCardHeight, PAGE_CARD_WIDTH_PX, PAGE_ITEM_CAPACITY } from '@/lib/workspace-constants';

interface CardEndProps {
  className?: string;
  isActive?: boolean;
  layoutId?: string;
}

export const CardEnd = forwardRef<HTMLDivElement, CardEndProps>(({
  className,
  isActive = true,
  layoutId,
}, ref) => {
  const { t } = useI18n();
  const cardHeight = getPageCardHeight(PAGE_ITEM_CAPACITY);
  return (
    <motion.div
      ref={ref}
      className={cn(
        'hybrid-paper mx-auto flex flex-col items-center justify-center text-center bg-[#F7F7F9]',
        className
      )}
      style={{ width: `${PAGE_CARD_WIDTH_PX}px`, height: `${cardHeight}px` }}
      layout="position"
      layoutId={layoutId}
      animate={{ opacity: isActive ? 1 : 0.92, scale: isActive ? 1 : 0.985 }}
      transition={{
        layout: layoutSpring,
        type: 'spring',
        stiffness: 280,
        damping: 26,
      }}
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-linear-to-bl from-transparent to-black/5" />
      <div className="relative z-10 px-12 opacity-40">
        <p className="text-neutral-400 font-mono text-xs uppercase tracking-widest">
          {t('card.end.label')}
        </p>
      </div>
    </motion.div>
  );
});

CardEnd.displayName = 'CardEnd';
