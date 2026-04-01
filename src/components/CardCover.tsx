import React, { forwardRef } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';
import { useI18n } from '@/hooks/useI18n';
import { getPageCardHeight, PAGE_CARD_WIDTH_PX, PAGE_ITEM_CAPACITY } from '@/lib/workspace-constants';

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
  title,
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
      layout
      layoutId={layoutId}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-linear-to-bl from-black/5 to-transparent" />
      <div className="relative z-10 px-12">
        <h1 className="text-4xl font-bold text-klein/90 mb-4 tracking-tight">{title ?? t('card.cover.defaultTitle')}</h1>
        <p className="text-neutral-400 font-mono text-sm uppercase tracking-widest">
          {t('card.cover.subtitle')}
        </p>
      </div>
    </motion.div>
  );
});

CardCover.displayName = 'CardCover';
