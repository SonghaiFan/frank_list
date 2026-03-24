import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import type { GroupPage } from '../lib/notebook-types';
import { PAGE_CARD_HEIGHT_PX, PAGE_CARD_WIDTH_PX, PAGE_ITEM_CAPACITY } from '../lib/workspace-constants';
import { PageCard } from './PageCard';
import { CardCover } from './CardCover';
import { CardEnd } from './CardEnd';

interface NotebookProps {
  closed?: boolean;
  pages: GroupPage[];
  ticks: Record<string, boolean>;
  onRemoveItem: (itemId: string) => void;
  onToggleTick: (itemId: string, e?: React.MouseEvent | React.ChangeEvent) => void;
}


function NotebookSpine({ height = 600 }: { height?: number }) {
  const LINE_HEIGHT = 36;
  const count = Math.floor(height / LINE_HEIGHT);
  
  return (
    <div className="absolute left-1/2 top-0 w-12 -translate-x-1/2 z-[100] flex flex-col pointer-events-none select-none">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="relative w-full flex items-center justify-center" style={{ height: `${LINE_HEIGHT}px` }}>
            <div className="h-4 w-16 bg-gradient-to-r from-neutral-400 via-neutral-100 to-neutral-400 rounded-full shadow-sm transform -rotate-2 border border-neutral-300" />
       </div>
      ))}
    </div>
  );
}

export function Notebook({
  closed = false,
  pages,
  ticks,
  onRemoveItem,
  onToggleTick,
}: NotebookProps) {
  const allPages = useMemo(() => {
    const coverPage: GroupPage = {
      key: 'notebook-cover',
      type: 'cover',
      groupId: 'system',
      groupTitle: 'Cover',
      pageIndex: -1,
      items: [],
      isComplete: true,
      isBound: true,
    };
    
    const endPage: GroupPage = {
      key: 'notebook-end',
      type: 'end',
      groupId: 'system',
      groupTitle: 'End',
      pageIndex: -2,
      items: [],
      isComplete: true,
      isBound: true,
    };
    
    return [coverPage, ...pages, endPage];
  }, [pages]);

  const [focusedPageKey, setFocusedPageKey] = useState<string | null>(allPages[0]?.key ?? null);
  const previousKeysRef = useRef<string[]>(allPages.map((page) => page.key));

  useEffect(() => {
    const nextKeys = allPages.map((page) => page.key);
    const newlyAddedKey = nextKeys.find((key) => !previousKeysRef.current.includes(key));

    setFocusedPageKey((currentKey) => {
      if (closed) {
        return allPages[0]?.key ?? null;
      }

      // If a new page is added (content page), focus it? 
      // Or if it's the "End" page appearing for the first time?
      if (newlyAddedKey && newlyAddedKey !== 'notebook-cover' && newlyAddedKey !== 'notebook-end') {
         // When a content page is moved here, we probably want to see it?
         // The original logic was: return pages[Math.max(0, pages.length - 1)].key;
         // Meaning focus the last added page.
         return newlyAddedKey;
      }
      
      // If current key is still valid, keep it.
      if (currentKey && allPages.some((page) => page.key === currentKey)) {
          return currentKey;
      }
      // Default to the last page (End) or Cover?
      // "Lower Stack" accumulates pages. When I move a page down, I expect to see it on top.
      // But if I have Cover -> Page 1 -> End. 
      // If I view the stack, typically I see the Top page (Cover).
      // But the previous implementation logic was `pages[pages.length-1]`.
      // If pages stack up 1, 2, 3... 
      // If I want to see the "latest", I should focus the last one?
      // But physically, 1 is at bottom? 
      // The z-index logic in previous code:
      // const zIndex = isCurrent ? ... : isPast ? index : pages.length - index;
      // It seems to support a stack where you can focus any page.
      // Let's stick to "focus the last page" (End) so we see the "End" of the notebook?
      // Or maybe Cover?
      // If it's a closed notebook, we see Cover.
      // If it's open, we see pages.
      // Let's default to Cover (key='notebook-cover') so it starts closed?
      // But user might want to see content.
      // Let's try defaulting to the *last* page (End), which means the notebook is fully "read"? 
      // No, usually you add pages to the end.
      // Let's default to 'notebook-cover' (first page) so it looks like a clean stack.
      return allPages[0].key;
    });

    previousKeysRef.current = nextKeys;
  }, [allPages]);

  const focusedPageIndex = allPages.findIndex((page) => page.key === focusedPageKey);
  const safeFocusedPageIndex = focusedPageIndex === -1 ? 0 : focusedPageIndex;
  const canGoPrev = !closed && safeFocusedPageIndex > 0;
  const canGoNext = !closed && safeFocusedPageIndex < allPages.length - 1;

  const goPrevPage = () => {
    const prevPage = allPages[safeFocusedPageIndex - 1];
    if (prevPage) setFocusedPageKey(prevPage.key);
  };

  const goNextPage = () => {
    const nextPage = allPages[safeFocusedPageIndex + 1];
    if (nextPage) setFocusedPageKey(nextPage.key);
  };

  return (
    <motion.div 
      layout
      className="relative flex min-h-[700px] w-full items-start justify-center perspective-[2000px] mt-10"
      initial={{ opacity: 0, scale: 0.9, y: -200 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -200 }}
      transition={{
        type: 'spring',
        stiffness: 100,
        damping: 20,
        layout: { type: 'spring', stiffness: 210, damping: 28 },
      }}
    >
        {!closed && allPages.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrevPage}
                disabled={!canGoPrev}
                className="absolute left-4 top-[300px] z-50 flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white/80 text-[#666] shadow-[0_8px_16px_rgba(0,0,0,0.06)] backdrop-blur-sm transition-all hover:-translate-y-px hover:border-klein hover:text-klein disabled:cursor-not-allowed disabled:opacity-35"
                title="Previous page"
              >
                <ArrowLeft size={20} />
              </button>
              <button
                type="button"
                onClick={goNextPage}
                disabled={!canGoNext}
                className="absolute right-4 top-[300px] z-50 flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white/80 text-[#666] shadow-[0_8px_16px_rgba(0,0,0,0.06)] backdrop-blur-sm transition-all hover:-translate-y-px hover:border-klein hover:text-klein disabled:cursor-not-allowed disabled:opacity-35"
                title="Next page"
              >
                <ArrowRight size={20} />
              </button>
            </>
          )}

          <NotebookSpine />
          
          <div className="relative w-full h-[620px] max-w-[500px] perspective-[2000px]">
              {allPages.map((page, index) => {
                const distanceFromFocus = index - safeFocusedPageIndex;
                const isPast = distanceFromFocus < 0;
                const isCurrent = distanceFromFocus === 0;
                const x = closed ? Math.min(index * 2.5, 18) : 0;
                const y = closed ? Math.min(index * 0.8, 8) : 0;
                const opacity = closed ? Math.max(0.72, 1 - index * 0.03) : isCurrent ? 1 : 0.82;
                
                const zIndex = closed
                  ? allPages.length - index
                  : isCurrent
                    ? allPages.length + 5
                    : isPast
                      ? index
                      : allPages.length - index;

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
                      rotateY: closed ? 0 : isPast ? -180 : 0,
                      opacity,
                    }}
                    transition={{ type: 'spring', stiffness: 220, damping: 28 }}
                    onClick={closed ? undefined : () => setFocusedPageKey(page.key)}
                  >
                    <div
                      className="absolute inset-0 [backface-visibility:hidden]"
                      style={{ pointerEvents: isCurrent ? 'auto' : 'none' }}
                    >
                      {/* Front of the page */}
                      {page.type === 'cover' ? (
                        <CardCover isActive={isCurrent} />
                      ) : page.type === 'end' ? (
                        <CardEnd isActive={isCurrent} />
                      ) : (
                        <PageCard
                          page={page}
                          pageSize={PAGE_ITEM_CAPACITY}
                          interactive={isCurrent}
                          isActive={isCurrent}
                          showAddItemInput={false}
                          ticks={ticks}
                          onRemoveItem={onRemoveItem}
                          onToggleTick={onToggleTick}
                        />
                      )}
                    </div>
                    <div
                      className="absolute inset-0 rounded-[6px] border border-[rgba(0,47,167,0.08)] bg-[linear-gradient(180deg,#f9fafc,#f1f2f5)] shadow-[0_26px_44px_rgba(0,47,167,0.08)] [backface-visibility:hidden]"
                      style={{ transform: 'rotateY(180deg)' }}
                    >
                      {/* Back of the page */}
                      <div className="absolute inset-y-0 left-[50px] w-px bg-[rgba(0,47,167,0.05)]" />
                      <div className="flex h-full flex-col justify-between px-12 py-10 text-neutral-400">
                        {page.type === 'cover' ? (
                            <div className="flex flex-col h-full justify-center items-center">
                                <div className="text-neutral-300 font-mono text-sm">INDEX</div>
                            </div>
                        ) : page.type === 'end' ? (
                            <div className="flex flex-col h-full justify-center items-center">
                                <div className="text-neutral-300 font-mono text-xs">BACK COVER</div>
                            </div>
                        ) : (
                           <>
                            <div>
                                <div className="ui-label">Back</div>
                                <div className="list-text mt-3 text-neutral-500">
                                    {page.groupTitle} · 第 {page.pageIndex + 1} 页
                                </div>
                            </div>
                            <div className="ui-mono opacity-55">
                                {page.items.length} / {PAGE_ITEM_CAPACITY}
                            </div>
                           </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
    </motion.div>
  );
}
