import React from 'react';
import { motion } from 'motion/react';
import { Plus, X } from 'lucide-react';
import type { AppMode, GroupPage } from '../lib/notebook-types';
import { cn } from '../lib/cn';
import { getMarkerStyle, getOriginDotClassName, getOriginLabel } from '../lib/notebook-ui';
import { PAGE_CARD_HEIGHT_PX, PAGE_CARD_WIDTH_PX } from '../lib/workspace-constants';

interface PageCardProps {
  className?: string;
  interactive?: boolean;
  isActive?: boolean;
  mode?: AppMode;
  newItemText?: string;
  page: GroupPage;
  pageSize: number;
  showAddItemInput?: boolean;
  ticks?: Record<string, boolean>;
  onAddItem?: () => void;
  onBindPage?: (pageKey: string) => void;
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
  pageSize,
  showAddItemInput = false,
  ticks = {},
  onAddItem,
  onBindPage,
  onItemTextChange,
  onRemoveItem,
  onToggleTick,
}: PageCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        'hybrid-paper mx-auto',
        className
      )}
      style={{ width: `${PAGE_CARD_WIDTH_PX}px`, height: `${PAGE_CARD_HEIGHT_PX}px` }}
      layout
      layoutId={`page-card-${page.key}`}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
    >
      <div className="paper-lines">
        <div className="paper-content flex h-full flex-col">
          <div className="mx-auto mb-[1rem] flex w-full max-w-[550px] items-end justify-between gap-4 border-b border-[rgba(0,47,167,0.08)] px-[0.8rem] pb-[0.5rem] pt-[1.5rem] max-md:flex-col max-md:items-start max-md:pr-0">
            <motion.div layout className="flex-1">
              <div className="list-text text-xl font-medium tracking-tight text-neutral-800">
                {page.groupTitle}
              </div>
            </motion.div>
            <div className="flex items-center gap-3 mb-1">
              <motion.span className="ui-mono text-[10px] text-neutral-300 tracking-wider" layout>
                {page.items.length}/{pageSize}
              </motion.span>
               {page.isBound ? (
                <motion.span className="text-klein font-medium text-sm tracking-wide border-b-2 border-klein/10 pb-0.5 opacity-60" layout>
                  已归档
                </motion.span>
              ) : page.isComplete ? (
                <motion.span
                  className="text-klein font-medium text-sm tracking-wide border-b-2 border-klein/20 pb-0.5"
                  layout
                >
                  已完成
                </motion.span>
              ) : (
                <span className="text-neutral-300 font-medium text-sm tracking-wide border-b-2 border-transparent pb-0.5">
                  待完成
                </span>
              )}
            </div>
          </div>

          {page.items.length === 0 ? (
            <div className="py-8 text-neutral-300 list-text on-lines">
              {`这一页还没有内容，继续往这一组里加 item，它会先排在这里；超过 ${pageSize} 个后会自动生成下一页。`}
            </div>
          ) : (
            <motion.ul
              className={cn(
                'space-y-0',
                !isActive && 'pointer-events-none'
              )}
            >
              {page.items.map((item) => (
                <motion.li
                  key={item.id}
                  className="group relative flex items-center gap-2"
                >
                  <input
                    type="checkbox"
                    checked={!!ticks[item.id]}
                    disabled={!interactive}
                    onChange={(e) => onToggleTick?.(item.id, e)}
                    className={cn(
                      'rams-checkbox absolute left-[-55px]',
                      !interactive && 'cursor-default pointer-events-none'
                    )}
                  />
                  <div
                    className={cn('flex flex-1 items-center gap-2', interactive && 'cursor-pointer')}
                    onClick={interactive ? (e) => onToggleTick?.(item.id, e) : undefined}
                  >
                    <span
                      className={cn(
                        'list-text on-lines select-none marker-text',
                        ticks[item.id] && 'is-highlighted'
                      )}
                      style={getMarkerStyle(item.text)}
                    >
                      <span className="marker-stroke" aria-hidden="true" />
                      <span className="marker-stroke marker-stroke-secondary" aria-hidden="true" />
                      <span className="marker-label">{item.text}</span>
                    </span>
                    {item.origin.type !== 'default' && (
                      <div
                        className={cn('w-1.5 h-1.5 rounded-full shrink-0', getOriginDotClassName(item.origin))}
                        title={getOriginLabel(item.origin)}
                      />
                    )}
                  </div>
                  {interactive && mode === 'edit' && (
                    <button
                      onClick={() => onRemoveItem?.(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-neutral-300 hover:text-klein transition-all ml-auto relative z-10"
                    >
                      <X size={16} />
                    </button>
                  )}
                </motion.li>
              ))}
            </motion.ul>
          )}

          {interactive && showAddItemInput && (
            <div className="input-row border-t border-neutral-100 mt-9 on-lines">
              <Plus size={18} className="text-klein mr-4 shrink-0" />
              <input
                type="text"
                value={newItemText}
                onChange={(e) => onItemTextChange?.(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onAddItem?.()}
                placeholder={`给「${page.groupTitle}」添加新项目...`}
                className="flex-1 bg-transparent border-none outline-none list-text on-lines placeholder:text-neutral-200 h-full"
              />
            </div>
          )}
          
          <div className="mt-auto px-8 pb-6 flex justify-end opacity-40">
            <span className="ui-mono text-[10px] tracking-[0.2em] text-neutral-400 font-medium">
              PAGE {String(page.pageIndex + 1).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
