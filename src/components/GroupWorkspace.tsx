import React from 'react';
import { motion } from 'motion/react';
import type { Group, GroupPage } from '@/lib/notebook-types';
import type { UIFlow } from '@/stores/ui-store';
import { CardStack } from '@/components/CardStack';

interface GroupWorkspaceProps {
  activeGroup: Group;
  activeGroupPages: GroupPage[];
  flow: UIFlow;
  newItemText: string;
  pageSize: number;
  paperRef: React.RefObject<HTMLDivElement | null>;
  ticks: Record<string, boolean>;
  onBindPage: (pageKey: string) => void;
  onAppendPage: () => void;
  onItemTextChange: (value: string) => void;
  onRemoveItem: (itemId: string) => void;
  onToggleTick: (itemId: string, e?: React.MouseEvent | React.ChangeEvent) => void;
  onAddItem: () => void;
}

export function GroupWorkspace({
  activeGroup,
  activeGroupPages,
  flow,
  newItemText,
  pageSize,
  paperRef,
  ticks,
  onBindPage,
  onAppendPage,
  onItemTextChange,
  onRemoveItem,
  onToggleTick,
  onAddItem,
}: GroupWorkspaceProps) {
  const isCompareReviewFlow = flow === 'compare-review';
  const cardMode = isCompareReviewFlow ? 'compare-step-1' : 'edit';

  return (
    <motion.div
      onClick={(e) => e.stopPropagation()}
      layout
      initial={{ opacity: 0, scale: 0.9, y: 200 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 200, transition: { duration: 0.2 } }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 25,
        layout: { type: 'spring', stiffness: 210, damping: 28 },
      }}
    >


      <div
          key={`group-${activeGroup.id}`}
          className="space-y-5"
          ref={paperRef}
        >
          {isCompareReviewFlow && (
            <div className="list-text rounded-xl border border-klein/10 bg-klein/3 px-5 py-4 font-bold text-klein shadow-[0_18px_40px_rgba(0,47,167,0.05)]">
              收到这一组的同步请求：请在下面逐页勾选你的进度，完成后可以进入对比。
            </div>
          )}

          <CardStack
            mode={cardMode}
            newItemText={newItemText}
            pageSize={pageSize}
            pages={activeGroupPages}
            ticks={ticks}
            onAddItem={onAddItem}
            onAppendPage={onAppendPage}
            onBindPage={onBindPage}
            onItemTextChange={onItemTextChange}
            onRemoveItem={onRemoveItem}
            onToggleTick={onToggleTick}
          />
      </div>
    </motion.div>
  );
}
