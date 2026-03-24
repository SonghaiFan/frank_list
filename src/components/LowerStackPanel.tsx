import type React from 'react';
import type { GroupPage } from '../lib/notebook-types';
import { PAGE_ITEM_CAPACITY } from '../lib/workspace-constants';
import { CardStack } from './CardStack';

interface LowerStackPanelProps {
  pages: GroupPage[];
  ticks: Record<string, boolean>;
  onRemoveItem: (itemId: string) => void;
  onToggleTick: (itemId: string, e?: React.MouseEvent | React.ChangeEvent) => void;
}

export function LowerStackPanel({
  pages,
  ticks,
  onRemoveItem,
  onToggleTick,
}: LowerStackPanelProps) {
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
        </div>
        <CardStack
          className="rounded-[28px] border border-dashed border-neutral-200/90 bg-[linear-gradient(180deg,rgba(245,247,252,0.9),rgba(255,255,255,0.95))] px-4 py-14"
          emptyMessage="还没有移下来的 page"
          emptySubtext="在下方取消任意 item 后，这一页会自动回到上方。"
          allowAddItemInput={false}
          interactive={true}
          pageSize={PAGE_ITEM_CAPACITY}
          pages={pages}
          ticks={ticks}
          onRemoveItem={onRemoveItem}
          onToggleTick={onToggleTick}
        />
      </div>
    </div>
  );
}
