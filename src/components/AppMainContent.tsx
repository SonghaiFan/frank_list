import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { Notebook } from "@/components/Notebook";
import { ComparisonPanel } from "@/components/ComparisonPanel";
import { GroupWorkspace } from "@/components/GroupWorkspace";
import { MobileGroupList } from "@/components/MobileGroupList";
import { GalleryNotebookCard } from "@/components/ui/GalleryNotebookCard";
import { cn } from "@/lib/cn";
import { layoutSpring, panelTransition } from "@/lib/motion";
import { getGroupPageStatus } from "@/lib/page-status";
import {
  getPageCardHeight,
  PAGE_CARD_WIDTH_PX,
  PAGE_SIZE,
} from "@/lib/workspace-constants";
import { useI18n } from "@/hooks/useI18n";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { Group, GroupPage, ListItem } from "@/lib/notebook-types";
import type { UIFlow } from "@/stores/ui-store";

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
  onToggleTick: (
    itemId: string,
    e?: React.MouseEvent | React.ChangeEvent,
  ) => void;
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
                className="w-full cursor-default"
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
                  className="w-full cursor-default"
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
            className="mx-auto grid w-full max-w-300 grid-cols-1 items-start justify-items-center gap-y-6 px-3 pt-6 md:grid-cols-2 md:gap-x-20 md:gap-y-16 md:px-4 md:pt-10"
            initial={viewTransition.initial}
            animate={viewTransition.animate}
            exit={viewTransition.exit}
            transition={panelTransition}
          >
            {galleryGroups.map(({ group, pages }) =>
              isMobile ? (
                <GalleryNotebookCard
                  key={group.id}
                  onOpen={() => onOpenGroupFromGallery(group.id)}
                  pages={pages}
                  statusLabel={t(`page.status.${getGroupPageStatus(pages)}`)}
                  title={group.title}
                  totalPagesLabel={`${pages.length} pages`}
                />
              ) : (
                <Notebook
                  key={group.id}
                  id={group.id}
                  layoutId={`notebook-${group.id}`}
                  closed={true}
                  coverTitle={group.title}
                  pages={pages}
                  ticks={ticks}
                  onRemoveItem={onRemoveItem}
                  onToggleTick={onToggleTick}
                  onOpen={() => onOpenGroupFromGallery(group.id)}
                />
              ),
            )}

            <motion.button
              type="button"
              layout="position"
              transition={{ layout: layoutSpring }}
              style={
                isMobile
                  ? {
                      width: "100%",
                      maxWidth: 360,
                      height: 72,
                    }
                  : {
                      width: PAGE_CARD_WIDTH_PX,
                      height: pageCardHeight,
                      transformOrigin: "top center",
                    }
              }
              className={cn(
                "mixed-blend-multiply flex origin-top cursor-pointer flex-col items-center justify-center border-2 border-dashed border-neutral-200 text-neutral-300 opacity-80 transition-all hover:bg-brand/5 hover:text-brand hover:opacity-100 hover:border-brand",
                isMobile ? "rounded-[14px]" : "rounded-[20px]",
              )}
              onClick={onCreateGroup}
            >
              <span
                className={cn(
                  "font-light",
                  isMobile ? "mb-1 text-2xl" : "mb-4 text-5xl",
                )}
              >
                +
              </span>
              <span
                className={cn("font-bold", isMobile ? "text-xs" : "text-lg")}
              >
                {t("app.newNotebook")}
              </span>
            </motion.button>
          </motion.section>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}
