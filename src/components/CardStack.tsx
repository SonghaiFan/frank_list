import React, { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'motion/react';
import type { AppMode, GroupPage } from '../lib/notebook-types';
import { cn } from '../lib/cn';
import { PAGE_CARD_HEIGHT_PX, PAGE_CARD_WIDTH_PX } from '../lib/workspace-constants';
import { PageCard } from './PageCard';

interface CardStackProps {
  className?: string;
  interactive?: boolean;
  allowAddItemInput?: boolean;
  mode?: AppMode;
  newItemText?: string;
  pageSize: number;
  pages: GroupPage[];
  ticks: Record<string, boolean>;
  onAddItem?: () => void;
  onAppendPage?: () => void;
  onBindPage?: (pageKey: string) => void;
  onItemTextChange?: (value: string) => void;
  onRemoveItem?: (itemId: string) => void;
  onToggleTick?: (itemId: string, e?: React.MouseEvent | React.ChangeEvent) => void;
}

export function CardStack({
  className,
  interactive = true,
  allowAddItemInput = true,
  mode = 'edit',
  newItemText = '',
  pageSize,
  pages,
  ticks,
  onAddItem,
  onAppendPage,
  onBindPage,
  onItemTextChange,
  onRemoveItem,
  onToggleTick,
}: CardStackProps) {
  const [focusedPageKey, setFocusedPageKey] = useState<string | null>(pages[0]?.key ?? null);
  const previousKeysRef = useRef<string[]>(pages.map((page) => page.key));

  useEffect(() => {
    if (pages.length === 0) {
      setFocusedPageKey(null);
      previousKeysRef.current = [];
      return;
    }

    const nextKeys = pages.map((page) => page.key);
    const newlyAddedKey = nextKeys.find((key) => !previousKeysRef.current.includes(key));

    setFocusedPageKey((currentKey) => {
      if (newlyAddedKey) return newlyAddedKey;
      return currentKey && pages.some((page) => page.key === currentKey)
        ? currentKey
        : pages[0].key;
    });

    previousKeysRef.current = nextKeys;
  }, [pages]);

  const focusedPageIndex = pages.findIndex((page) => page.key === focusedPageKey);
  const safeFocusedPageIndex = focusedPageIndex === -1 ? 0 : focusedPageIndex;
  const currentPage = pages[safeFocusedPageIndex];
  const isLastPageFocused = safeFocusedPageIndex === pages.length - 1;
  const isCurrentPageFull = currentPage ? currentPage.items.length >= pageSize : false;
  const areAllPagesFull = pages.length > 0 && pages.every((page) => page.items.length >= pageSize);
  const shouldShowAddItemInput = allowAddItemInput
    && interactive
    && mode === 'edit'
    && isLastPageFocused
    && !!currentPage
    && !isCurrentPageFull;

  const getStackClasses = (offset: number) => {
    if (offset === 0) return 'translate-x-0 translate-y-0 scale-100 opacity-100';
    if (offset === -1) return '-translate-x-[34%] translate-y-[14px] scale-[0.96] opacity-78 max-md:-translate-x-[20%] max-md:translate-y-[10px] max-md:scale-[0.97]';
    if (offset === 1) return 'translate-x-[34%] translate-y-[14px] scale-[0.96] opacity-78 max-md:translate-x-[20%] max-md:translate-y-[10px] max-md:scale-[0.97]';
    if (offset === -2) return '-translate-x-[47%] translate-y-[24px] scale-[0.93] opacity-48 max-md:-translate-x-[28%] max-md:translate-y-[18px] max-md:scale-[0.95]';
    if (offset === 2) return 'translate-x-[47%] translate-y-[24px] scale-[0.93] opacity-48 max-md:translate-x-[28%] max-md:translate-y-[18px] max-md:scale-[0.95]';
    return 'translate-x-0 translate-y-10 scale-[0.82] opacity-0 pointer-events-none';
  };

  return (
    <div 
      className={cn('relative flex items-start justify-center overflow-visible px-6 pb-8 pt-2 max-md:px-0', className)}
      style={{ minHeight: `${PAGE_CARD_HEIGHT_PX + 88}px` }}
    >
      {areAllPagesFull && isLastPageFocused && (
        <button
          type="button"
          onClick={onAppendPage}
          className="absolute right-0 z-20 flex h-12 min-w-12 items-center justify-center gap-1 rounded-full border-none bg-white/92 px-4 text-gray-900/85 shadow-[0_12px_26px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-px hover:bg-white max-md:bottom-4.5 max-md:right-[calc(50%-58px)] max-md:top-auto"
          style={{ top: `${(PAGE_CARD_HEIGHT_PX / 2) - 24}px` }}
          title="Add new page"
        >
          <Plus size={18} />
        </button>
      )}

      {pages.map((page, index) => {
        const offset = index - safeFocusedPageIndex;
        const absOffset = Math.abs(offset);
        const isActive = offset === 0;
        const isVisible = absOffset <= 2;

        return (
          <motion.div
            key={page.key}
            className={cn(
              'absolute inset-x-0 top-0 mx-auto cursor-pointer transition-all duration-300 ease-out',
              // Removed drop-shadow to prevent shadow accumulation/darkening artifacts
              isActive && 'is-active cursor-default',
              isVisible ? getStackClasses(offset) : 'translate-x-0 translate-y-10 scale-[0.82] opacity-0 pointer-events-none'
            )}
            style={{ zIndex: pages.length - absOffset, width: `${PAGE_CARD_WIDTH_PX}px` }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: isVisible ? 1 : 0, y: 0 }}
            layout
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            onClick={() => setFocusedPageKey(page.key)}
          >
            <PageCard
              page={page}
              pageSize={pageSize}
              interactive={interactive}
              isActive={isActive}
              mode={mode}
              newItemText={newItemText}
              showAddItemInput={isActive && shouldShowAddItemInput}
              ticks={ticks}
              onAddItem={onAddItem}
              onBindPage={onBindPage}
              onItemTextChange={onItemTextChange}
              onRemoveItem={onRemoveItem}
              onToggleTick={onToggleTick}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
