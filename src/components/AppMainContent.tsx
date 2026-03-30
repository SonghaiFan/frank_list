import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { Notebook } from '@/components/Notebook';
import { ComparisonPanel } from '@/components/ComparisonPanel';
import { GroupWorkspace } from '@/components/GroupWorkspace';
import { MobileGroupList } from '@/components/MobileGroupList';
import { cn } from '@/lib/cn';
import { PAGE_CARD_HEIGHT_PX, PAGE_CARD_WIDTH_PX, PAGE_SIZE } from '@/lib/workspace-constants';
import { useI18n } from '@/hooks/useI18n';
import { useIsMobile } from '@/hooks/useIsMobile';
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
  const isMobile = useIsMobile();

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
                className="flex min-h-[80vh] w-full flex-col items-center"
              >
                {isMobile ? (
                  <motion.div
                    key={activeGroup.id}
                    layout
                    transition={{ layout: { type: 'spring', stiffness: 350, damping: 30 } }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-[800px] cursor-default"
                  >
                    <MobileGroupList
                      group={activeGroup}
                      newItemText={newItemText}
                      ticks={ticks}
                      onAddItem={onAddItem}
                      onItemTextChange={onItemTextChange}
                      onRemoveItem={onRemoveItem}
                      onToggleTick={onToggleTick}
                    />
                  </motion.div>
                ) : (
                  <>
                    <motion.div
                      key={activeGroup.id}
                      layout
                      transition={{ layout: { type: 'spring', stiffness: 350, damping: 30 } }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full max-w-[800px] cursor-default"
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
                      className="flex w-full cursor-default justify-center"
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
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="closed-gallery"
                className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-start justify-items-center gap-y-6 px-3 pt-6 md:grid-cols-2 md:gap-x-20 md:gap-y-16 md:px-4 md:pt-10"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                {galleryGroups.map(({ group, pages }) => (
                  <motion.div
                    key={group.id}
                    layoutId={`notebook-${group.id}`}
                    className="flex w-full justify-center"
                    style={isMobile ? undefined : {
                      width: PAGE_CARD_WIDTH_PX,
                      height: PAGE_CARD_HEIGHT_PX,
                      transformOrigin: 'top center',
                    }}
                    transition={{ layout: { type: 'spring', stiffness: 350, damping: 30 } }}
                    title={group.title}
                  >
                    {isMobile ? (
                      <button
                        type="button"
                        className="hybrid-paper paper-lines w-full max-w-[360px] cursor-pointer text-left transition-transform hover:-translate-y-px"
                        onClick={() => onOpenGroupFromGallery(group.id)}
                        title={group.title}
                      >
                        <div className="paper-content px-4! py-0!">
                          <div className="mx-auto flex min-h-18 w-full items-end justify-between gap-4 border-b border-[rgba(0,47,167,0.1)] pl-10 pr-2 pb-2">
                            <div className="min-w-0 flex-1">
                              <div className="list-text truncate text-lg leading-none font-medium tracking-tight text-neutral-800">
                                {group.title}
                              </div>
                              <div className="ui-mono mt-2 text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                                {pages.length} pages
                              </div>
                            </div>
                            <div className="mb-px flex items-center gap-3">
                              <span className="text-klein text-xs font-medium tracking-wide">
                                {pages.every((page) => page.isBound)
                                  ? t('page.status.bound')
                                  : pages.every((page) => page.isComplete)
                                    ? t('page.status.complete')
                                    : t('page.status.pending')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ) : (
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
                    )}
                  </motion.div>
                ))}

                <motion.button
                  type="button"
                  layout
                  style={isMobile ? {
                    width: '100%',
                    maxWidth: 360,
                    height: 72,
                  } : {
                    width: PAGE_CARD_WIDTH_PX,
                    height: PAGE_CARD_HEIGHT_PX,
                    transform: 'scale(0.85)',
                    transformOrigin: 'top center',
                  }}
                  className={cn(
                    'border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center text-neutral-300 cursor-pointer hover:border-klein hover:text-klein hover:bg-klein/5 mixed-blend-multiply opacity-80 hover:opacity-100 transition-all origin-top',
                    isMobile ? 'rounded-[14px]' : 'rounded-[20px]'
                  )}
                  onClick={onCreateGroup}
                >
                  <span className={cn('font-light', isMobile ? 'mb-1 text-2xl' : 'mb-4 text-5xl')}>+</span>
                  <span className={cn('font-bold', isMobile ? 'text-xs' : 'text-lg')}>{t('app.newNotebook')}</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </LayoutGroup>
      </motion.div>
    </AnimatePresence>
  );
}
