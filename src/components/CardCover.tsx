import React, { forwardRef } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { useI18n } from "@/hooks/useI18n";
import {
  getPageCardHeight,
  PAGE_CARD_WIDTH_PX,
  PAGE_ITEM_CAPACITY,
} from "@/lib/workspace-constants";

interface CardCoverProps {
  className?: string;
  isActive?: boolean;
  layoutId?: string;
  title?: string;
}

export const CardCover = forwardRef<HTMLDivElement, CardCoverProps>(
  ({ className, isActive = true, layoutId, title }, ref) => {
    const { t } = useI18n();
    const cardHeight = getPageCardHeight(PAGE_ITEM_CAPACITY);
    return (
      <motion.div
        ref={ref}
        className={cn(
          "hybrid-paper mx-auto flex flex-col items-center justify-center bg-[#F7F7F9] text-center",
          className,
        )}
        style={{ width: `${PAGE_CARD_WIDTH_PX}px`, height: `${cardHeight}px` }}
        layout
        layoutId={layoutId}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
      >
        <div className="pointer-events-none absolute inset-0 bg-linear-to-bl from-black/5 to-transparent opacity-10" />
        <div className="relative z-10 px-12">
          <h1 className="text-klein/90 mb-4 text-4xl font-bold tracking-tight">
            {title ?? t("card.cover.defaultTitle")}
          </h1>
          <p className="font-mono text-sm tracking-widest text-neutral-400 uppercase">
            {t("card.cover.subtitle")}
          </p>
        </div>
      </motion.div>
    );
  },
);

CardCover.displayName = "CardCover";
