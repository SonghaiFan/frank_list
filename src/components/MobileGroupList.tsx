import React from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Group } from '@/lib/notebook-types';
import { getMarkerStyle, getOriginDotClassName, getOriginLabel } from '@/lib/notebook-ui';
import { useI18n } from '@/hooks/useI18n';
import type { UIFlow } from '@/stores/ui-store';

interface MobileGroupListProps {
  className?: string;
  flow?: UIFlow;
  group: Group;
  newItemText: string;
  ticks: Record<string, boolean>;
  onAddItem: () => void;
  onItemTextChange: (value: string) => void;
  onRemoveItem: (itemId: string) => void;
  onToggleTick: (itemId: string, e?: React.MouseEvent | React.ChangeEvent) => void;
}

export function MobileGroupList({
  className,
  flow = 'workspace',
  group,
  newItemText,
  ticks,
  onAddItem,
  onItemTextChange,
  onRemoveItem,
  onToggleTick,
}: MobileGroupListProps) {
  const { locale, t } = useI18n();
  const isCompareReviewFlow = flow === 'compare-review';

  return (
    <div className={cn('w-full space-y-4', className)}>
      {isCompareReviewFlow && (
        <div className="list-text rounded-xl border border-klein/10 bg-klein/3 px-5 py-4 font-bold text-klein shadow-[0_18px_40px_rgba(0,47,167,0.05)]">
          {t('workspace.compareNotice')}
        </div>
      )}

      <section className="hybrid-paper paper-lines mx-auto w-full">
        <div className="paper-content px-5! pb-6! pt-0! sm:px-8!">
          <div className="mx-auto flex min-h-18 w-full items-end justify-between gap-4 border-b border-[rgba(0,47,167,0.1)] pb-2 pl-9 pr-2">
            <div className="min-w-0 flex-1">
              <div className="list-text text-xl leading-none font-medium tracking-tight text-neutral-800">
                {group.title}
              </div>
            </div>
            <div className="ui-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400">
              {group.items.length}
            </div>
          </div>

          <ul className="pl-12 pt-1">
            {group.items.map((item) => {
              const checkboxId = `mobile-group-${group.id}-${item.id}`;

              return (
                <li key={item.id} className="group relative flex items-center gap-2">
                  <input
                    id={checkboxId}
                    type="checkbox"
                    checked={!!ticks[item.id]}
                    onChange={(event) => onToggleTick(item.id, event)}
                    className="rams-checkbox absolute -left-12"
                  />
                  <label htmlFor={checkboxId} className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                    <span
                      className={cn(
                        'list-text on-lines marker-text min-w-0 select-none',
                        ticks[item.id] && 'is-highlighted'
                      )}
                      style={getMarkerStyle(item.text)}
                    >
                      <span className="marker-stroke" aria-hidden="true" />
                      <span className="marker-stroke marker-stroke-secondary" aria-hidden="true" />
                      <span className="marker-label break-words">{item.text}</span>
                    </span>
                    {item.origin.type !== 'default' && (
                      <span
                        className={cn('h-1.5 w-1.5 shrink-0 rounded-full', getOriginDotClassName(item.origin))}
                        title={getOriginLabel(item.origin, locale)}
                      />
                    )}
                  </label>
                  {item.origin.type !== 'default' && (
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="relative z-10 ml-auto p-1 text-neutral-300 transition-colors hover:text-klein"
                    >
                      <X size={16} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="input-row on-lines mt-1 pl-12">
            <Plus size={18} className="mr-3 shrink-0 text-klein" />
            <input
              type="text"
              value={newItemText}
              onChange={(event) => onItemTextChange(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && onAddItem()}
              placeholder={t('page.addItemPlaceholder', { title: group.title })}
              className="list-text on-lines h-full min-w-0 flex-1 border-none bg-transparent outline-none placeholder:text-neutral-200"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
