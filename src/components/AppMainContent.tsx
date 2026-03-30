import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { Notebook } from '@/components/Notebook';
import { ComparisonPanel } from '@/components/ComparisonPanel';
import { GroupWorkspace } from '@/components/GroupWorkspace';
import { PAGE_CARD_HEIGHT_PX, PAGE_CARD_WIDTH_PX, PAGE_SIZE } from '@/lib/workspace-constants';
import { useI18n } from '@/hooks/useI18n';
import type { Group, GroupPage, ListItem } from '@/lib/notebook-types';
import type { UIFlow } from '@/stores/ui-store';

interface GalleryGroup {
  group: {
    id: string;
    title: string;
  };
  pages: GroupPage[];
}

interface AppMainContentProps {
  activeGroup: Group;
  comparison: {
    bothDone: ListItem[];
    bothNotDone: ListItem[];
    heDoneINot: ListItem[];
    iDoneHeNot: ListItem[];
  } | null;
  flow: UIFlow;
  galleryGroups: GalleryGroup[];
  isCompareResultFlow: boolean;
  isWorkspaceFlow: boolean;
  lowerStackPages: GroupPage[];
  newItemText: string;
  onAppendPage: () => void;
  onBindPage: (pageKey: string) => void;
  onCreateGroup: () => void;
  onItemTextChange: (value: string) => void;
  onAddItem: () => void;
  onOpenGroupFromGallery: (groupId: string) => void;
  onRemoveItem: (itemId: string) => void;
  onToggleTick: (itemId: string, e?: React.MouseEvent | React.ChangeEvent) => void;
  stackPages: GroupPage[];
  ticks: Record<string, boolean>;
}

export function AppMainContent({
  activeGroup,
  comparison,
  flow,
  galleryGroups,
  isCompareResultFlow,
  isWorkspaceFlow,
  lowerStackPages,
  newItemText,
  onAppendPage,
  onBindPage,
  onCreateGroup,
  onItemTextChange,
  onAddItem,
  onOpenGroupFromGallery,
  onRemoveItem,
  onToggleTick,
  stackPages,
  ticks,
}: AppMainContentProps) {
  const { t } = useI18n();

  return (
    <AnimatePresence>
      <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <LayoutGroup id="workspace-main">
          <AnimatePresence mode="popLayout" initial={false}>
            {isCompareResultFlow && comparison ? (
              <motion.div key="comparison" layout className="w-full max-w-[1240px]">
                <ComparisonPanel comparison={comparison} group={activeGroup} />
              </motion.div>
            ) : isWorkspaceFlow ? (
              <motion.div
                key="open-workspace"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center min-h-[80vh]"
              >
                <motion.div
                  key={activeGroup.id}
                  layout
                  transition={{ layout: { type: 'spring', stiffness: 350, damping: 30 } }}
                  onClick={(e) => e.stopPropagation()}
                  className="cursor-default w-full max-w-[800px]"
                >
                  <GroupWorkspace
                    activeGroup={activeGroup}
                    activeGroupPages={stackPages}
                    flow={flow}
                    newItemText={newItemText}
                    pageSize={PAGE_SIZE}
                    ticks={ticks}
                    onAddItem={onAddItem}
                    onAppendPage={onAppendPage}
                    onBindPage={onBindPage}
                    onItemTextChange={onItemTextChange}
                    onRemoveItem={onRemoveItem}
                    onToggleTick={onToggleTick}
                  />
                </motion.div>

                <motion.div
                  key={`notebook-${activeGroup.id}`}
                  layoutId={`notebook-${activeGroup.id}`}
                  layout
                  transition={{ layout: { type: 'spring', stiffness: 350, damping: 30 } }}
                  className="w-full flex justify-center cursor-default"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Notebook
                    id={activeGroup.id}
                    closed={false}
                    coverTitle={activeGroup.title}
                    pages={lowerStackPages}
                    ticks={ticks}
                    onRemoveItem={onRemoveItem}
                    onToggleTick={onToggleTick}
                  />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="closed-gallery"
                className="grid grid-cols-2 gap-x-20 gap-y-16 w-full max-w-[1200px] mx-auto items-start justify-items-center pt-10 px-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                {galleryGroups.map(({ group, pages }) => (
                  <motion.div
                    key={group.id}
                    layoutId={`notebook-${group.id}`}
                    className="w-full flex justify-center"
                    style={{
                      width: PAGE_CARD_WIDTH_PX,
                      height: PAGE_CARD_HEIGHT_PX,
                      transformOrigin: 'top center',
                    }}
                    transition={{ layout: { type: 'spring', stiffness: 350, damping: 30 } }}
                    title={group.title}
                  >
                    <Notebook
                      id={group.id}
                      className="origin-top mt-0"
                      style={{ transform: 'scale(0.85)' }}
                      closed={true}
                      coverTitle={group.title}
                      pages={pages}
                      ticks={ticks}
                      onRemoveItem={onRemoveItem}
                      onToggleTick={onToggleTick}
                      onOpen={() => onOpenGroupFromGallery(group.id)}
                    />
                  </motion.div>
                ))}

                <motion.button
                  type="button"
                  layout
                  style={{
                    width: PAGE_CARD_WIDTH_PX,
                    height: PAGE_CARD_HEIGHT_PX,
                    transform: 'scale(0.85)',
                    transformOrigin: 'top center',
                  }}
                  className="border-2 border-dashed border-neutral-200 rounded-[20px] flex flex-col items-center justify-center text-neutral-300 cursor-pointer hover:border-klein hover:text-klein hover:bg-klein/5 mixed-blend-multiply opacity-80 hover:opacity-100 transition-all origin-top"
                  onClick={onCreateGroup}
                >
                  <span className="text-5xl font-light mb-4">+</span>
                  <span className="font-bold text-lg">{t('app.newNotebook')}</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </LayoutGroup>
      </motion.div>
    </AnimatePresence>
  );
}
