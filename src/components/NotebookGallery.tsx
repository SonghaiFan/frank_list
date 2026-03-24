import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import type { Group } from '../lib/notebook-types';
import { cn } from '../lib/cn';
import { MOTION_LAYOUT_SPRING } from '../lib/motion';
import { PAGE_CARD_HEIGHT_PX, PAGE_CARD_WIDTH_PX } from '../lib/workspace-constants';

interface NotebookGalleryProps {
  activeGroupId: string;
  groups: Group[];
  ticks: Record<string, boolean>;
  onCreateGroup: () => void;
  onOpenGroup: (groupId: string) => void;
}

export function NotebookGallery({
  activeGroupId,
  groups,
  ticks,
  onCreateGroup,
  onOpenGroup,
}: NotebookGalleryProps) {
  return (
    <motion.div
      layout
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={MOTION_LAYOUT_SPRING}
      className="pb-6"
    >
      <div className="mb-6 flex items-end justify-between gap-4 px-2 max-md:flex-col max-md:items-start">
        <div>
          <div className="ui-label text-klein">Notebook Gallery</div>
          <div className="list-text text-neutral-700">每一组都是一本 notebook，点开继续编辑。</div>
        </div>
        <button
          type="button"
          onClick={onCreateGroup}
          className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(0,0,0,0.12)] transition-all hover:-translate-y-px hover:bg-black"
        >
          <Plus size={16} />
          新建 Notebook
        </button>
      </div>

      <div className="grid grid-cols-1 gap-10 px-2 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => {
          const completedItems = group.items.filter((item) => ticks[item.id]).length;

          return (
            <motion.button
              key={group.id}
              type="button"
              layout
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.99 }}
              transition={MOTION_LAYOUT_SPRING}
              onClick={() => onOpenGroup(group.id)}
              className={cn(
                'group flex flex-col items-center gap-5 rounded-[28px] border border-transparent bg-transparent px-4 py-3 text-left transition-colors',
                group.id === activeGroupId && 'border-klein/10 bg-klein/[0.03]'
              )}
            >
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-[8px] border border-neutral-200 bg-white shadow-sm"
                  style={{
                    width: `${PAGE_CARD_WIDTH_PX}px`,
                    height: `${PAGE_CARD_HEIGHT_PX}px`,
                    transform: 'scale(0.32) translate(24px, 24px)',
                    transformOrigin: 'top left',
                  }}
                />
                <div
                  className="absolute inset-0 rounded-[8px] border border-neutral-200 bg-white shadow-sm"
                  style={{
                    width: `${PAGE_CARD_WIDTH_PX}px`,
                    height: `${PAGE_CARD_HEIGHT_PX}px`,
                    transform: 'scale(0.32) translate(12px, 12px)',
                    transformOrigin: 'top left',
                  }}
                />
                <div
                  className="relative overflow-hidden rounded-[8px] border border-[rgba(0,47,167,0.08)] bg-[#F7F7F9] shadow-[0_26px_44px_rgba(0,47,167,0.08)]"
                  style={{
                    width: `${PAGE_CARD_WIDTH_PX * 0.32}px`,
                    height: `${PAGE_CARD_HEIGHT_PX * 0.32}px`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent opacity-10" />
                  <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/8 to-transparent" />
                  <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
                    <div className="mb-1 text-xl font-bold tracking-tight text-klein/90">Notebook</div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400">
                      Frank List
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-[300px] text-center">
                <div className="list-text truncate text-[1.05rem] text-neutral-800 transition-colors group-hover:text-klein">
                  {group.title}
                </div>
                <div className="mt-2 flex items-center justify-center gap-3 ui-mono text-[11px] opacity-55">
                  <span>{completedItems} / {group.items.length} done</span>
                  <span className="h-1 w-1 rounded-full bg-neutral-300" />
                  <span>{Math.max(1, Math.ceil(group.items.length / 10))} pages</span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
