import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Trash2 } from 'lucide-react';
import type { AppMode, Group, GroupPage } from '../lib/notebook-types';
import { CardStack } from './CardStack';

interface GroupWorkspaceProps {
  activeGroup: Group;
  activeGroupPages: GroupPage[];
  boundPageCount: number;
  editingGroupId: string | null;
  groupTitleDraft: string;
  mode: AppMode;
  newItemText: string;
  pageSize: number;
  paperRef: React.RefObject<HTMLDivElement | null>;
  ticks: Record<string, boolean>;
  onBindPage: (pageKey: string) => void;
  onAppendPage: () => void;
  onDeleteGroup: () => void;
  onDraftChange: (value: string) => void;
  onItemTextChange: (value: string) => void;
  onRemoveItem: (itemId: string) => void;
  onRenameCancel: () => void;
  onRenameSave: () => void;
  onRenameStart: () => void;
  onToggleTick: (itemId: string, e?: React.MouseEvent | React.ChangeEvent) => void;
  onAddItem: () => void;
}

export function GroupWorkspace({
  activeGroup,
  activeGroupPages,
  boundPageCount,
  editingGroupId,
  groupTitleDraft,
  mode,
  newItemText,
  pageSize,
  paperRef,
  ticks,
  onBindPage,
  onAppendPage,
  onDeleteGroup,
  onDraftChange,
  onItemTextChange,
  onRemoveItem,
  onRenameCancel,
  onRenameSave,
  onRenameStart,
  onToggleTick,
  onAddItem,
}: GroupWorkspaceProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 200 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 200, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
    >


      <div
          key={`group-${activeGroup.id}`}
          className="space-y-5"
          ref={paperRef}
        >
          {mode === 'compare-step-1' && (
            <div className="list-text rounded-[24px] border border-klein/10 bg-klein/3 px-5 py-4 font-bold text-klein shadow-[0_18px_40px_rgba(0,47,167,0.05)]">
              收到这一组的同步请求：请在下面逐页勾选你的进度，完成后可以进入对比。
            </div>
          )}

          <CardStack
            emptyMessage="这一组上方已经没有 page 了。"
            emptySubtext="完成后的 page 会从上面的 stack 移动到下面的 stack。"
            mode={mode}
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
