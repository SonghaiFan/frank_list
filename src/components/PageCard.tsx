import React from 'react';
import { motion } from 'motion/react';
import { Plus, X } from 'lucide-react';
import type { AppMode, GroupPage } from '@/lib/notebook-types';
import { cn } from '@/lib/cn';
import { getMarkerStyle, getOriginDotClassName, getOriginLabel } from '@/lib/notebook-ui';
import { PAGE_CARD_HEIGHT_PX, PAGE_CARD_WIDTH_PX } from '@/lib/workspace-constants';

interface PageCardProps {
  className?: string;
  interactive?: boolean;
  isActive?: boolean;
  mode?: AppMode;
  newItemText?: string;
  page: GroupPage;
  showAddItemInput?: boolean;
  ticks?: Record<string, boolean>;
  onAddItem?: () => void;
  onItemTextChange?: (value: string) => void;
  onRemoveItem?: (itemId: string) => void;
  onToggleTick?: (itemId: string, e?: React.MouseEvent | React.ChangeEvent) => void;
}

export function PageCard({
  className,
  interactive = true,
  isActive = true,
  mode = 'edit',
  newItemText = '',
  page,
  showAddItemInput = false,
  ticks = {},
  onAddItem,
  onItemTextChange,
  onRemoveItem,
  onToggleTick,
}: PageCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={cardRef}
      className={cn('hybrid-paper paper-lines mx-auto', className)}
      style={{ width: `${PAGE_CARD_WIDTH_PX}px`, height: `${PAGE_CARD_HEIGHT_PX}px` }}
      layout
      layoutId={`page-card-${page.key}`}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
    >
      <div className="paper-content flex h-full flex-col p-0!">
        <motion.div
          layout="position"
          className="mx-auto flex h-18 w-full max-w-135 items-end justify-between gap-4 border-b border-[rgba(0,47,167,0.1)] pl-15 pr-8 pb-2"
        >
          <div className="min-w-0 flex-1">
            <div className="list-text text-xl leading-none font-medium tracking-tight text-neutral-800">
              {page.groupTitle}
            </div>
          </div>
          <div className="mb-px flex items-center gap-3">
            {page.isBound ? (
              <motion.span className="text-klein text-xs font-medium tracking-wide opacity-60" layout="position">
                已归档
              </motion.span>
            ) : page.isComplete ? (
              <motion.span className="text-klein text-xs font-medium tracking-wide" layout="position">
                已完成
              </motion.span>
            ) : (
              <span className="text-xs font-medium tracking-wide text-neutral-300">
                待完成
              </span>
            )}
          </div>
        </motion.div>

        <div className="flex-1 pl-18 pt-0">
          <motion.ul className={cn('space-y-0', !isActive && 'pointer-events-none')}>
            {page.items.map((item) => {
              const checkboxId = `page-card-${page.key}-${item.id}`;

              return (
                <li key={item.id} className="group relative flex items-center gap-2">
                  <input
                    id={checkboxId}
                    type="checkbox"
                    checked={!!ticks[item.id]}
                    disabled={!interactive}
                    onChange={(e) => onToggleTick?.(item.id, e)}
                    className={cn(
                      'rams-checkbox absolute -left-15',
                      !interactive && 'pointer-events-none cursor-default'
                    )}
                  />
                  <label
                    htmlFor={interactive ? checkboxId : undefined}
                    className={cn('flex flex-1 items-center gap-2', interactive && 'cursor-pointer')}
                  >
                    <span
                      className={cn(
                        'list-text on-lines marker-text select-none',
                        ticks[item.id] && 'is-highlighted'
                      )}
                      style={getMarkerStyle(item.text)}
                    >
                      <span className="marker-stroke" aria-hidden="true" />
                      <span className="marker-stroke marker-stroke-secondary" aria-hidden="true" />
                      <span className="marker-label">{item.text}</span>
                    </span>
                    {item.origin.type !== 'default' && (
                      <span
                        className={cn('h-1.5 w-1.5 shrink-0 rounded-full', getOriginDotClassName(item.origin))}
                        title={getOriginLabel(item.origin)}
                      />
                    )}
                  </label>
                  {interactive && mode === 'edit' && item.origin.type !== 'default' && (
                    <button
                      type="button"
                      onClick={() => onRemoveItem?.(item.id)}
                      className="relative z-10 ml-auto p-1 text-neutral-300 opacity-0 transition-all group-hover:opacity-100 hover:text-klein"
                    >
                      <X size={16} />
                    </button>
                  )}
                </li>
              );
            })}
          </motion.ul>

          {interactive && showAddItemInput && (
            <div className="input-row on-lines">
              <Plus size={18} className="text-klein mr-4 shrink-0" />
              <input
                type="text"
                value={newItemText}
                onChange={(e) => onItemTextChange?.(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onAddItem?.()}
                placeholder={`给「${page.groupTitle}」添加新项目...`}
                className="list-text on-lines h-full flex-1 border-none bg-transparent outline-none placeholder:text-neutral-200"
              />
            </div>
          )}
        </div>

        <div className="mt-auto flex h-9 items-center justify-end px-8 opacity-40">
          <span className="ui-mono translate-y-px text-[10px] font-medium tracking-[0.2em] text-neutral-400">
            {String(page.pageIndex + 1).padStart(2, '0')}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
