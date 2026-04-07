import React from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Group } from "@/lib/notebook-types";
import { Card } from "@/components/ui/Card";
import { CompareNotice } from "@/components/ui/CompareNotice";
import { NotebookHeader } from "@/components/ui/NotebookHeader";
import { NotebookListItem } from "@/components/ui/NotebookListItem";
import { useI18n } from "@/hooks/useI18n";
import type { UIFlow } from "@/stores/ui-store";

interface MobileGroupListProps {
  className?: string;
  flow?: UIFlow;
  group: Group;
  newItemText: string;
  ticks: Record<string, boolean>;
  onAddItem: () => void;
  onItemTextChange: (value: string) => void;
  onRemoveItem: (itemId: string) => void;
  onToggleTick: (
    itemId: string,
    e?: React.MouseEvent | React.ChangeEvent,
  ) => void;
}

export function MobileGroupList({
  className,
  flow = "workspace",
  group,
  newItemText,
  ticks,
  onAddItem,
  onItemTextChange,
  onRemoveItem,
  onToggleTick,
}: MobileGroupListProps) {
  const { locale, t } = useI18n();
  const isCompareReviewFlow = flow === "compare-review";

  return (
    <div className={cn("w-full space-y-4", className)}>
      {isCompareReviewFlow && (
        <CompareNotice>
          {t("workspace.compareNotice")}
        </CompareNotice>
      )}

      <Card variant="paper" className="mx-auto w-full">
        <div className="paper-content px-5! pt-0! pb-6! sm:px-8!">
          <NotebookHeader
            inset="mobile"
            title={group.title}
            subtitle={String(group.items.length)}
            className="pl-9"
          />

          <ul className="pt-1 pl-12">
            {group.items.map((item) => {
              const checkboxId = `mobile-group-${group.id}-${item.id}`;

              return (
                <NotebookListItem
                  key={item.id}
                  checkboxId={checkboxId}
                  checked={!!ticks[item.id]}
                  checkboxOffsetClassName="-left-12"
                  item={item}
                  locale={locale}
                  onRemove={onRemoveItem}
                  onToggleTick={onToggleTick}
                  showRemoveButton={true}
                />
              );
            })}
          </ul>

          <div className="input-row on-lines mt-1 pl-12">
            <Plus size={18} className="text-klein mr-3 shrink-0" />
            <input
              type="text"
              value={newItemText}
              onChange={(event) => onItemTextChange(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && onAddItem()}
              placeholder={t("page.addItemPlaceholder", { title: group.title })}
              className="list-text on-lines h-full min-w-0 flex-1 border-none bg-transparent outline-none placeholder:text-neutral-200"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
