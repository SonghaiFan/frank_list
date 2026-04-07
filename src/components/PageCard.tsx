import React from "react";
import { motion } from "motion/react";
import { Plus } from "lucide-react";
import type { AppMode, GroupPage } from "@/lib/notebook-types";
import { cn } from "@/lib/cn";
import { NotebookHeader } from "@/components/ui/NotebookHeader";
import { NotebookListItem } from "@/components/ui/NotebookListItem";
import { useI18n } from "@/hooks/useI18n";
import { getPageStatus } from "@/lib/page-status";
import {
  getPageCardHeight,
  PAGE_CARD_WIDTH_PX,
  PAGE_ITEM_CAPACITY,
} from "@/lib/workspace-constants";

interface PageCardProps {
  className?: string;
  interactive?: boolean;
  isActive?: boolean;
  mode?: AppMode;
  newItemText?: string;
  page: GroupPage;
  showAddItemInput?: boolean;
  ticks?: Record<string, boolean>;
  onAddItem?: () => void;
  onItemTextChange?: (value: string) => void;
  onRemoveItem?: (itemId: string) => void;
  onToggleTick?: (
    itemId: string,
    e?: React.MouseEvent | React.ChangeEvent,
  ) => void;
}

export function PageCard({
  className,
  interactive = true,
  isActive = true,
  mode = "edit",
  newItemText = "",
  page,
  showAddItemInput = false,
  ticks = {},
  onAddItem,
  onItemTextChange,
  onRemoveItem,
  onToggleTick,
}: PageCardProps) {
  const { locale, t } = useI18n();
  const cardRef = React.useRef<HTMLDivElement>(null);
  const cardHeight = getPageCardHeight(PAGE_ITEM_CAPACITY);
  const status = getPageStatus(page);
  const statusLabel = t(`page.status.${status}`);

  return (
    <motion.div
      ref={cardRef}
      className={cn("hybrid-paper paper-lines mx-auto", className)}
      style={{ width: `${PAGE_CARD_WIDTH_PX}px`, height: `${cardHeight}px` }}
      layout
      layoutId={`page-card-${page.key}`}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
    >
      <div className="paper-content flex h-full flex-col p-0!">
        <motion.div layout="position">
          <NotebookHeader
            title={page.groupTitle}
            status={status}
            statusLabel={statusLabel}
          />
        </motion.div>

        <div className="flex-1 pt-0 pl-18">
          <motion.ul
            className={cn("space-y-0", !isActive && "pointer-events-none")}
          >
            {page.items.map((item) => {
              const checkboxId = `page-card-${page.key}-${item.id}`;

              return (
                <NotebookListItem
                  key={item.id}
                  checkboxId={checkboxId}
                  checked={!!ticks[item.id]}
                  checkboxOffsetClassName="-left-15"
                  interactive={interactive}
                  item={item}
                  locale={locale}
                  onRemove={onRemoveItem}
                  onToggleTick={onToggleTick}
                  showRemoveButton={interactive && mode === "edit"}
                  showRemoveOnHover={true}
                />
              );
            })}
          </motion.ul>

          {interactive && showAddItemInput && (
            <div className="input-row on-lines">
              <Plus size={18} className="text-klein mr-4 shrink-0" />
              <input
                type="text"
                value={newItemText}
                onChange={(e) => onItemTextChange?.(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onAddItem?.()}
                placeholder={t("page.addItemPlaceholder", {
                  title: page.groupTitle,
                })}
                className="list-text on-lines h-full flex-1 border-none bg-transparent outline-none placeholder:text-neutral-200"
              />
            </div>
          )}
        </div>

        <div className="mt-auto flex h-9 items-center justify-end px-8 opacity-40">
          <span className="ui-mono translate-y-px text-[10px] font-medium tracking-[0.2em] text-neutral-400">
            {String(page.pageIndex + 1).padStart(2, "0")}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
