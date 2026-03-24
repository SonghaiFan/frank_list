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
    <>
      <div className="mb-4 rounded-[28px] border border-neutral-200/80 bg-white/85 px-5 py-4 shadow-[0_24px_50px_rgba(0,47,167,0.06)] backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            {editingGroupId === activeGroup.id ? (
              <input
                autoFocus
                type="text"
                value={groupTitleDraft}
                onChange={(e) => onDraftChange(e.target.value)}
                onBlur={onRenameSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onRenameSave();
                  if (e.key === 'Escape') onRenameCancel();
                }}
                className="list-text w-full bg-transparent border-none outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={onRenameStart}
                className="list-text truncate-text text-left hover:text-klein transition-colors"
                title="点击重命名这一组"
              >
                {activeGroup.title}
              </button>
            )}
            <div className="ui-mono opacity-45 truncate-text">{activeGroup.id}</div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="ui-mono opacity-50">
              [{activeGroup.items.length} items / {activeGroupPages.length} pages / {boundPageCount} bound]
            </div>
            {mode === 'edit' && activeGroup.id !== '0' && (
              <button
                onClick={onDeleteGroup}
                className="text-neutral-300 hover:text-klein transition-colors"
                title="Delete Group"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`group-${activeGroup.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
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
        </motion.div>
      </AnimatePresence>
    </>
  );
}
