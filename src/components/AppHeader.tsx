import React from "react";
import {
  ArrowLeft,
  Check,
  Menu,
  QrCode,
  RotateCcw,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useI18n } from "@/hooks/useI18n";
import type { UIFlow } from "@/stores/ui-store";

interface AppHeaderProps {
  copySuccess: boolean;
  flow: UIFlow;
  onBack: () => void;
  onCopy: () => void;
  onReset: () => void;
  onShowQrCode: () => void;
  onTogglePrimaryView?: () => void;
}

export function AppHeader({
  copySuccess,
  flow,
  onBack,
  onCopy,
  onReset,
  onShowQrCode,
  onTogglePrimaryView,
}: AppHeaderProps) {
  const { t, toggleLocale } = useI18n();
  const circleButtonClass =
    "flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-[#666] transition-all hover:-translate-y-px hover:border-klein hover:text-klein cursor-pointer";
  const isGalleryFlow = flow === "gallery";
  const isEditingFlow = flow === "workspace" || flow === "gallery";
  const isComparisonFlow =
    flow === "compare-review" || flow === "compare-result";

  return (
    <nav className="mb-5 flex w-full items-center justify-between px-2">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="ui-label text-base font-bold">
            {t("brand.name")}
          </span>
          <span className="ui-mono text-xs tracking-tighter uppercase opacity-50">
            {isEditingFlow ? t("brand.workspace") : t("brand.comparison")}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onTogglePrimaryView}
          className={cn(
            circleButtonClass,
            isGalleryFlow &&
              "bg-klein hover:bg-klein border-transparent text-white hover:text-white",
          )}
          title={
            isGalleryFlow
              ? t("header.openStackView")
              : t("header.closeIntoNotebook")
          }
        >
          <Menu size={18} />
        </button>

        {isComparisonFlow && (
          <button
            onClick={onBack}
            className={circleButtonClass}
            title={t("header.backToEdit")}
          >
            <ArrowLeft size={18} />
          </button>
        )}

        {isEditingFlow && (
          <button
            onClick={onReset}
            className={cn(circleButtonClass, "text-neutral-300")}
            title={t("header.reset")}
          >
            <RotateCcw size={18} />
          </button>
        )}
        {isEditingFlow && (
          <button
            onClick={onShowQrCode}
            className={circleButtonClass}
            title={t("header.qrCode")}
          >
            <QrCode size={18} />
          </button>
        )}
        {isEditingFlow && (
          <button
            onClick={onCopy}
            className={cn(
              circleButtonClass,
              copySuccess &&
                "bg-klein hover:bg-klein border-transparent text-white hover:text-white",
            )}
            title={t("header.shareLink")}
          >
            {copySuccess ? <Check size={18} /> : <Share2 size={18} />}
          </button>
        )}
        <button
          onClick={toggleLocale}
          className={circleButtonClass}
          title={t("common.languageToggle")}
        >
          <span className="ui-mono text-xs">{t("common.languageToggle")}</span>
        </button>
      </div>
    </nav>
  );
}
