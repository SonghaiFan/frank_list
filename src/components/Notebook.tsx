import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import type { GroupPage } from '../lib/notebook-types';
import { PAGE_CARD_HEIGHT_PX, PAGE_CARD_WIDTH_PX, PAGE_ITEM_CAPACITY, PAGE_LINE_HEIGHT_PX } from '../lib/workspace-constants';
import { PageCard } from './PageCard';

interface NotebookProps {
  pages: GroupPage[];
  ticks: Record<string, boolean>;
  onRemoveItem: (itemId: string) => void;
  onToggleTick: (itemId: string, e?: React.MouseEvent | React.ChangeEvent) => void;
}


function NotebookHoles({ side = 'left', height = PAGE_CARD_HEIGHT_PX, className = '' }: { side: 'left' | 'right', height?: number, className?: string }) {
  // Calculate count to match the lined paper grid
  const count = Math.floor(height / PAGE_LINE_HEIGHT_PX);
  
  return (
    <div 
      className={`absolute w-8 z-30 flex flex-col pointer-events-none ${side === 'left' ? 'left-2' : 'right-2'} ${className}`} 
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-full flex items-center justify-center" style={{ height: `${PAGE_LINE_HEIGHT_PX}px` }}>
          <div className="h-3 w-3 bg-neutral-800 rounded-full opacity-10 shadow-inner transform scale-y-90" />
        </div>
      ))}
    </div>
  );
}

function NotebookSpine({ height = PAGE_CARD_HEIGHT_PX }: { height?: number }) {
  const count = Math.floor(height / PAGE_LINE_HEIGHT_PX);
  
  return (
    <div className="absolute left-1/2 top-0 w-12 -translate-x-1/2 z-[100] flex flex-col pointer-events-none select-none">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="relative w-full flex items-center justify-center" style={{ height: `${PAGE_LINE_HEIGHT_PX}px` }}>
            <div className="h-4 w-16 bg-gradient-to-r from-neutral-400 via-neutral-100 to-neutral-400 rounded-full shadow-sm transform -rotate-2 border border-neutral-300" />
       </div>
      ))}
    </div>
  );
}

export function Notebook({
  pages,
  ticks,
  onRemoveItem,
  onToggleTick,
}: NotebookProps) {
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
      if (currentKey && pages.some((page) => page.key === currentKey)) return currentKey;
      return pages[Math.max(0, pages.length - 1)].key;
    });

    previousKeysRef.current = nextKeys;
  }, [pages]);

  const focusedPageIndex = pages.findIndex((page) => page.key === focusedPageKey);
  const safeFocusedPageIndex = focusedPageIndex === -1 ? Math.max(0, pages.length - 1) : focusedPageIndex;
  const canGoPrev = safeFocusedPageIndex > 0;
  const canGoNext = safeFocusedPageIndex < pages.length - 1;

  const goPrevPage = () => {
    const prevPage = pages[safeFocusedPageIndex - 1];
    if (prevPage) setFocusedPageKey(prevPage.key);
  };

  const goNextPage = () => {
    const nextPage = pages[safeFocusedPageIndex + 1];
    if (nextPage) setFocusedPageKey(nextPage.key);
  };
  const spreadHalfGap = 0;

  return (
    <div className="mt-10">
      <div className="mb-4 px-2">
        <div className="ui-label">Lower Stack</div>
        <div className="ui-mono opacity-45">上面的 page 完成后，会直接移动到下面这个 stack。</div>
      </div>
      <div className="relative overflow-visible rounded-[32px] border border-neutral-200/80 bg-white/78 px-6 pb-8 pt-6 shadow-[0_30px_65px_rgba(0,47,167,0.08)] backdrop-blur-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <div className="list-text">Moved Pages</div>
            <div className="ui-mono opacity-45">{pages.length} pages moved here</div>
          </div>
          {pages.length > 1 && (
            <div className="relative z-[3] flex gap-2.5">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={goPrevPage}
                disabled={!canGoPrev}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-[#666] transition-all hover:-translate-y-px hover:border-klein hover:text-klein disabled:cursor-not-allowed disabled:opacity-35"
                title="Previous page"
              >
                <ArrowLeft size={16} />
              </motion.button>
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={goNextPage}
                disabled={!canGoNext}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-[#666] transition-all hover:-translate-y-px hover:border-klein hover:text-klein disabled:cursor-not-allowed disabled:opacity-35"
                title="Next page"
              >
                <ArrowRight size={16} />
              </motion.button>
            </div>
          )}
        </div>
        <div className="relative min-h-[720px] overflow-visible rounded-[28px] bg-neutral-100/50 shadow-inner px-4 py-14 border border-neutral-200/50">
          <NotebookSpine />t-14 pb-14 border border-neutral-200/50 flex flex-col items-center">
          <div className="relative w-full max-w-[1200px]" style={{ height: PAGE_CARD_HEIGHT_PX }}>
            <NotebookSpine />
          
            {pages.length === 0 ? (
              <div
                className="mx-auto flex items-center justify-center rounded-[6px] border-2 border-dashed border-neutral-300/50 bg-white/55 px-6 text-center"
                style={{ width: `${PAGE_CARD_WIDTH_PX}px`, height: `${PAGE_CARD_HEIGHT_PX}px` }}
              >
                <div>
                  <div className="list-text text-neutral-500">还没有移下来的 page</div>
                  <div className="ui-mono mt-2 opacity-45">在下方取消任意 item 后，这一页会自动回到上方。</div>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full perspective-[2000px]">
                {pages.map((page, index) => {
                  const distanceFromFocus = index - safeFocusedPageIndex;
                  const isPast = distanceFromFocus < 0;
                  const isCurrent = distanceFromFocus === 0;
                  // With transformOrigin: 'left center', we don't need to manually translate x when flipping
                  const x = 0;
                  const y = 0;
                  // Only dim future pages that are underneath the current stack
                  const opacity = (isCurrent || isPast) ? 1 : 0.82;
                  
                  // For past pages (left stack), higher index = higher in stack (visible)
                  // For future pages (right stack), lower index = higher in stack (visible)
                  const zIndex = isCurrent
                    ? pages.length + 5
                    : isPast
                      ? index
                      : pages.length - index;

                  return (
                    <motion.div
                      key={page.key}
                      className="absolute left-1/2 top-0 cursor-pointer border-none bg-transparent p-0 text-left"
                      style={{
                        width: `${PAGE_CARD_WIDTH_PX}px`,
                        height: `${PAGE_CARD_HEIGHT_PX}px`,
                        zIndex,
                        transformStyle: 'preserve-3d',
                        transformOrigin: 'left center',
                      }}
                      initial={false}
                      animate={{
                        x,
                        y,
                        rotateY: isPast ? -180 : 0,
                        opacity,
                      }}
                      transition={{ type: 'spring', stiffness: 220, damping: 28 }}
                      onClick={() => setFocusedPageKey(page.key)}
                    >
                      <div
                        className="absolute inset-0 [backface-visibility:hidden]"
                        style={{ pointerEvents: isCurrent ? 'auto' : 'none' }}
                      >
                        <NotebookHoles side="left" />
                        <PageCard
                          page={page}
                          pageSize={PAGE_ITEM_CAPACITY}
                          interactive={isCurrent}
                          isActive={isCurrent}
                          showAddItemInput={false}
                          ticks={ticks}
                          variant="flat"
                          onRemoveItem={onRemoveItem}
                          onToggleTick={onToggleTick}
                        />
                      </div>
                      <div
                        className="absolute inset-0 [backface-visibility:hidden]"
                        style={{ transform: 'rotateY(180deg)', pointerEvents: isCurrent ? 'auto' : 'none' }}
                      >
                        <NotebookHoles side="right" />
                        <PageCard
                          variant="flat"
                          isBack
                          className="bg-neutral-50/30"
                        >
                          <div className="flex h-full flex-col justify-between px-12 py-10 text-neutral-400 select-none">
                            <div>
                              <div className="ui-label">Back</div>
                              <div className="list-text mt-3 text-neutral-500">
                                {page.groupTitle} · 第 {page.pageIndex + 1} 页
                              </div>
                            </div>
                            <div className="ui-mono opacity-55">
                              {page.items.length} / {PAGE_ITEM_CAPACITY}
                            </div>
                          </div>
                        </PageCard>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>v>
      </div>
    </div>
  );
}
