import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { Notebook } from '@/components/Notebook';
import { ComparisonPanel } from '@/components/ComparisonPanel';
import { GroupWorkspace } from '@/components/GroupWorkspace';
import { MobileGroupList } from '@/components/MobileGroupList';
import { cn } from '@/lib/cn';
import { layoutSpring, panelTransition } from '@/lib/motion';
import { getPageCardHeight, PAGE_CARD_WIDTH_PX, PAGE_SIZE } from '@/lib/workspace-constants';
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
  const isComparisonView = isCompareResultFlow && comparison;
  const pageCardHeight = getPageCardHeight(PAGE_SIZE);

  const viewTransition = {
    initial: { opacity: 0, y: 20, scale: 0.985 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -14, scale: 0.985 },
  } as const;

  return (
    <LayoutGroup id="workspace-main">
      <AnimatePresence initial={false} mode="popLayout">
        {isComparisonView ? (
          <motion.section
            key={`comparison-${activeGroup.id}`}
            layout="position"
            className="w-full max-w-[1240px]"
            initial={viewTransition.initial}
            animate={viewTransition.animate}
            exit={viewTransition.exit}
            transition={panelTransition}
          >
            <ComparisonPanel comparison={comparison} group={activeGroup} />
          </motion.section>
        ) : isWorkspaceFlow ? (
          <motion.section
            key={`workspace-${activeGroup.id}`}
            className="flex min-h-[80vh] w-full flex-col items-center"
            onClick={(e) => e.stopPropagation()}
            initial={viewTransition.initial}
            animate={viewTransition.animate}
            exit={viewTransition.exit}
            transition={panelTransition}
          >
            {isMobile ? (
              <MobileGroupList
                className="w-full max-w-[800px] cursor-default"
                flow={flow}
                group={activeGroup}
                newItemText={newItemText}
                ticks={ticks}
                onAddItem={onAddItem}
                onItemTextChange={onItemTextChange}
                onRemoveItem={onRemoveItem}
                onToggleTick={onToggleTick}
              />
            ) : (
              <>
                <GroupWorkspace
                  activeGroup={activeGroup}
                  activeGroupPages={stackPages}
                  className="w-full max-w-[800px] cursor-default"
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

                <Notebook
                  id={activeGroup.id}
                  layoutId={`notebook-${activeGroup.id}`}
                  className="w-full cursor-default"
                  closed={false}
                  coverTitle={activeGroup.title}
                  pages={lowerStackPages}
                  ticks={ticks}
                  onRemoveItem={onRemoveItem}
                  onToggleTick={onToggleTick}
                />
              </>
            )}
          </motion.section>
        ) : (
          <motion.section
            key="closed-gallery"
            layout="position"
            className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-start justify-items-center gap-y-6 px-3 pt-6 md:grid-cols-2 md:gap-x-20 md:gap-y-16 md:px-4 md:pt-10"
            initial={viewTransition.initial}
            animate={viewTransition.animate}
            exit={viewTransition.exit}
            transition={panelTransition}
          >
            {galleryGroups.map(({ group, pages }) => (
              isMobile ? (
                <button
                  key={group.id}
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
                  key={group.id}
                  id={group.id}
                  layoutId={`notebook-${group.id}`}
                  className="w-[550px] origin-top"
                  closed={true}
                  coverTitle={group.title}
                  pages={pages}
                  ticks={ticks}
                  onRemoveItem={onRemoveItem}
                  onToggleTick={onToggleTick}
                  onOpen={() => onOpenGroupFromGallery(group.id)}
                />
              )
            ))}

            <motion.button
              type="button"
              layout="position"
              transition={{ layout: layoutSpring }}
              style={isMobile ? {
                width: '100%',
                maxWidth: 360,
                height: 72,
              } : {
                width: PAGE_CARD_WIDTH_PX,
                height: pageCardHeight,
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
          </motion.section>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}
