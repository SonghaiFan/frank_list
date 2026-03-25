import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/cn';
import type { GroupPage } from '../lib/notebook-types';
import { PAGE_CARD_HEIGHT_PX, PAGE_CARD_WIDTH_PX, PAGE_ITEM_CAPACITY, PAGE_LINE_HEIGHT_PX } from '../lib/workspace-constants';
import { PageCard } from './PageCard';
import { CardCover } from './CardCover';
import { CardEnd } from './CardEnd';

interface NotebookProps {
  id?: string;
  className?: string;
  closed?: boolean;
  coverTitle?: string;
  onOpen?: () => void;
  pages: GroupPage[];
  ticks: Record<string, boolean>;
  onRemoveItem: (itemId: string) => void;
  onToggleTick: (itemId: string, e?: React.MouseEvent | React.ChangeEvent) => void;
}


function NotebookSpine({ height = PAGE_CARD_HEIGHT_PX, layoutId }: { height?: number; layoutId?: string }) {
  const count = Math.floor(height / PAGE_LINE_HEIGHT_PX);
  
  return (
    <motion.div 
      layoutId={layoutId}
      className="absolute left-1/2 top-0 w-12 -translate-x-1/2 z-100 flex flex-col pointer-events-none select-none"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="relative w-full flex items-center justify-center" style={{ height: `${PAGE_LINE_HEIGHT_PX}px` }}>
            {(i >= 2 && i < count - 2) && (
              <div className="h-4 w-16 bg-linear-to-r from-neutral-400 via-neutral-100 to-neutral-400 rounded-full shadow-sm transform -rotate-2 border border-neutral-300" />
            )}
       </div>
      ))}
    </motion.div>
  );
}

const COLLECTION_STEP_MS = 140;
const COLLECTION_BASE_MS = 980;

export function Notebook({
  id = 'default',
  className,
  closed = false,
  coverTitle,
  onOpen,
  pages,
  ticks,
  onRemoveItem,
  onToggleTick,
}: NotebookProps) {
  const allPages = useMemo(() => {
    const coverPage: GroupPage = {
      key: `notebook-cover-${id}`,
      type: 'cover',
      groupId: 'system',
      groupTitle: 'Cover',
      pageIndex: -1,
      items: [],
      isComplete: true,
      isBound: true,
    };
    
    const endPage: GroupPage = {
      key: `notebook-end-${id}`,
      type: 'end',
      groupId: 'system',
      groupTitle: 'End',
      pageIndex: -2,
      items: [],
      isComplete: true,
      isBound: true,
    };
    
    return [coverPage, ...pages, endPage];
  }, [pages, id]);

  const [focusedPageKey, setFocusedPageKey] = useState<string | null>(allPages[0]?.key ?? null);
  const [collectionState, setCollectionState] = useState<{ active: boolean; incomingKeys: string[] }>({
    active: false,
    incomingKeys: [],
  });
  const previousKeysRef = useRef<string[]>(allPages.map((page) => page.key));
  const collectionTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const nextKeys = allPages.map((page) => page.key);
    const newlyAddedKeys = nextKeys.filter(
      (key) => !previousKeysRef.current.includes(key) && key !== `notebook-cover-${id}` && key !== `notebook-end-${id}`
    );

    if (closed) {
      setCollectionState({ active: false, incomingKeys: [] });
      setFocusedPageKey(allPages[0]?.key ?? null);
      previousKeysRef.current = nextKeys;
      return;
    }

    if (collectionTimeoutRef.current) {
      window.clearTimeout(collectionTimeoutRef.current);
      collectionTimeoutRef.current = null;
    }

    if (newlyAddedKeys.length > 0) {
      const newestKey = newlyAddedKeys[newlyAddedKeys.length - 1] ?? null;
      setCollectionState({ active: true, incomingKeys: newlyAddedKeys });
      setFocusedPageKey(newestKey);
      collectionTimeoutRef.current = window.setTimeout(() => {
        setCollectionState({ active: false, incomingKeys: [] });
        collectionTimeoutRef.current = null;
      }, COLLECTION_BASE_MS + COLLECTION_STEP_MS * Math.max(0, newlyAddedKeys.length - 1));
    } else {
      setCollectionState((current) => (current.active ? { active: false, incomingKeys: [] } : current));
      setFocusedPageKey((currentKey) => (
        currentKey && allPages.some((page) => page.key === currentKey)
          ? currentKey
          : allPages[0]?.key ?? null
      ));
    }

    previousKeysRef.current = nextKeys;
  }, [allPages, closed]);

  useEffect(() => {
    return () => {
      if (collectionTimeoutRef.current) {
        window.clearTimeout(collectionTimeoutRef.current);
      }
    };
  }, []);

  const focusedPageIndex = allPages.findIndex((page) => page.key === focusedPageKey);
  const safeFocusedPageIndex = focusedPageIndex === -1 ? 0 : focusedPageIndex;
  const canGoPrev = !closed && safeFocusedPageIndex > 0;
  const canGoNext = !closed && safeFocusedPageIndex < allPages.length - 1;
  const isCollecting = collectionState.active && !closed;

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
      className={cn(
        'relative flex w-full items-start justify-center perspective-[2000px] mt-10',
        className
      )}
      style={{ minHeight: `${PAGE_CARD_HEIGHT_PX + 88}px` }}
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
                className="absolute left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white/80 text-[#666] shadow-[0_8px_16px_rgba(0,0,0,0.06)] backdrop-blur-sm transition-all hover:-translate-y-px hover:border-klein hover:text-klein disabled:cursor-not-allowed disabled:opacity-35"
                style={{ top: `${(PAGE_CARD_HEIGHT_PX / 2) - 24}px` }}
                title="Previous page"
              >
                <ArrowLeft size={20} />
              </button>
              <button
                type="button"
                onClick={goNextPage}
                disabled={!canGoNext}
                className="absolute right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white/80 text-[#666] shadow-[0_8px_16px_rgba(0,0,0,0.06)] backdrop-blur-sm transition-all hover:-translate-y-px hover:border-klein hover:text-klein disabled:cursor-not-allowed disabled:opacity-35"
                style={{ top: `${(PAGE_CARD_HEIGHT_PX / 2) - 24}px` }}
                title="Next page"
              >
                <ArrowRight size={20} />
              </button>
            </>
          )}

          <motion.div
            className="relative w-full flex justify-center"
            style={{ transformStyle: 'preserve-3d' }}
            animate={isCollecting ? {
              x: [0, 18, 0],
              y: [0, -20, 0],
              rotateZ: [0, 4, 0],
              rotateX: [0, 8, 0],
              scale: [1, 1.02, 1],
            } : {
              x: closed ? -PAGE_CARD_WIDTH_PX / 2 : 0,
              y: 0,
              rotateZ: 0,
              rotateX: 0,
              scale: 1,
            }}
            transition={{
              duration: 1.05,
              times: [0, 0.58, 1],
              ease: [0.22, 1, 0.36, 1],
            }}
          >
          <NotebookSpine layoutId={`notebook-spine-${id}`} />
          
          <div 
            className="relative w-full max-w-125 perspective-[2000px]"
            style={{ height: `${PAGE_CARD_HEIGHT_PX + 8}px` }}
          >
              {allPages.map((page, index) => {
                const distanceFromFocus = index - safeFocusedPageIndex;
                const isPast = distanceFromFocus < 0;
                const isCurrent = distanceFromFocus === 0;
                const x = closed ? Math.min(index * 3, 24) : 0;
                const y = closed ? Math.min(index * 0.8, 8) : 0;
                const opacity = closed ? 1 : isCurrent ? 1 : 0.82;
                const rotateY = closed ? 0 : isPast ? -180 : 0;
                
                // Shadow logic to prevent accumulation
                // 1. If closed or future (right stack): Only the bottom-most card (last index) has shadow
                // 2. If past (left stack): Only the bottom-most card (index 0) has shadow
                const showShadow = (closed || !isPast) 
                  ? index === allPages.length - 1
                  : index === 0;
                const shadowClass = showShadow ? "" : "!shadow-none";

                const collectionIndex = collectionState.incomingKeys.indexOf(page.key);
                const isIncoming = collectionIndex !== -1;
                
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
                    animate={isCollecting && isIncoming ? {
                      x: [-240, 20, x],
                      y: [-120, 10, y],
                      rotateY,
                      rotateZ: [-18, 6, 0],
                      opacity: [0, 1, opacity],
                      scale: [0.9, 1.03, 1],
                    } : {
                      x,
                      y,
                      rotateY,
                      rotateZ: 0,
                      opacity,
                      scale: 1,
                    }}
                    transition={isCollecting && isIncoming
                        ? {
                            duration: 0.88,
                            delay: collectionIndex * 0.14,
                            times: [0, 0.78, 1],
                            ease: [0.16, 1, 0.3, 1],
                          }
                        : { type: 'spring', stiffness: 220, damping: 28 }}
                    onClick={closed ? onOpen : () => setFocusedPageKey(page.key)}
                  >
                    <div
                      className="absolute inset-0 backface-hidden"
                      style={{ pointerEvents: isCurrent ? 'auto' : 'none' }}
                    >
                      {/* Front of the page */}
                      {page.type === 'cover' ? (
                        <CardCover 
                          isActive={isCurrent} 
                          title={coverTitle} 
                          layoutId={page.key}
                          className={shadowClass}
                        />
                      ) : page.type === 'end' ? (
                        <CardEnd 
                          isActive={isCurrent}
                          layoutId={page.key}
                          className={shadowClass}
                        />
                      ) : (
                        <PageCard
                          page={page}
                          pageSize={PAGE_ITEM_CAPACITY}
                          interactive={isCurrent}
                          isActive={isCurrent}
                          className={shadowClass}
                          showAddItemInput={false}
                          ticks={ticks}
                          onRemoveItem={onRemoveItem}
                          onToggleTick={onToggleTick}
                        />
                      )}
                    </div>
                    <div
                      className="absolute inset-0 rounded-md border border-[rgba(0,47,167,0.08)] bg-[linear-gradient(180deg,#f9fafc,#f1f2f5)] shadow-[0_26px_44px_rgba(0,47,167,0.08)] backface-hidden"
                      style={{ transform: 'rotateY(180deg)' }}
                    >
                      {/* Back of the page */}
                      <div className="absolute inset-y-0 left-12.5 w-px bg-[rgba(0,47,167,0.05)]" />
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
    </motion.div>
  );
}
