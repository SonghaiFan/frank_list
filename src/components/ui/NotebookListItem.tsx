import type { ChangeEvent, MouseEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ListItem } from "@/lib/notebook-types";
import {
  getMarkerStyle,
  getOriginDotClassName,
  getOriginLabel,
} from "@/lib/notebook-ui";

interface NotebookListItemProps {
  checkboxId: string;
  checked: boolean;
  checkboxOffsetClassName: string;
  interactive?: boolean;
  item: ListItem;
  locale: string;
  onRemove?: (itemId: string) => void;
  onToggleTick?: (
    itemId: string,
    e?: MouseEvent | ChangeEvent,
  ) => void;
  showRemoveButton?: boolean;
  showRemoveOnHover?: boolean;
  textClassName?: string;
}

export function NotebookListItem({
  checkboxId,
  checked,
  checkboxOffsetClassName,
  interactive = true,
  item,
  locale,
  onRemove,
  onToggleTick,
  showRemoveButton = false,
  showRemoveOnHover = false,
  textClassName,
}: NotebookListItemProps) {
  const showOriginDot = item.origin.type !== "default";
  const canRemove = showRemoveButton && showOriginDot;

  return (
    <li className="group relative flex items-center gap-2">
      <input
        id={checkboxId}
        type="checkbox"
        checked={checked}
        disabled={!interactive}
        onChange={(event) => onToggleTick?.(item.id, event)}
        className={cn(
          "rams-checkbox absolute",
          checkboxOffsetClassName,
          !interactive && "pointer-events-none cursor-default",
        )}
      />
      <label
        htmlFor={interactive ? checkboxId : undefined}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2",
          interactive && "cursor-pointer",
        )}
      >
        <span
          className={cn(
            "list-text on-lines marker-text min-w-0 select-none",
            checked && "is-highlighted",
            textClassName,
          )}
          style={getMarkerStyle(item.text)}
        >
          <span className="marker-stroke" aria-hidden="true" />
          <span
            className="marker-stroke marker-stroke-secondary"
            aria-hidden="true"
          />
          <span className="marker-label break-words">{item.text}</span>
        </span>
        {showOriginDot ? (
          <span
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              getOriginDotClassName(item.origin),
            )}
            title={getOriginLabel(item.origin, locale)}
          />
        ) : null}
      </label>
      {canRemove ? (
        <button
          type="button"
          onClick={() => onRemove?.(item.id)}
          className={cn(
            "hover:text-klein relative z-10 ml-auto p-1 text-neutral-300 transition-colors",
            showRemoveOnHover && "opacity-0 transition-all group-hover:opacity-100",
          )}
        >
          <X size={16} />
        </button>
      ) : null}
    </li>
  );
}
