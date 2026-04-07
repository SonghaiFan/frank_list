import React from "react";
import {
  ArrowLeft,
  Check,
  Menu,
  QrCode,
  RotateCcw,
  Share2,
} from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";
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
        <AppButton
          onClick={onTogglePrimaryView}
          variant={isGalleryFlow ? "icon-active" : "icon-default"}
          title={
            isGalleryFlow
              ? t("header.openStackView")
              : t("header.closeIntoNotebook")
          }
        >
          <Menu size={18} />
        </AppButton>

        {isComparisonFlow && (
          <AppButton
            onClick={onBack}
            variant="icon-default"
            title={t("header.backToEdit")}
          >
            <ArrowLeft size={18} />
          </AppButton>
        )}

        {isEditingFlow && (
          <AppButton
            onClick={onReset}
            variant="icon-default"
            className="text-neutral-300"
            title={t("header.reset")}
          >
            <RotateCcw size={18} />
          </AppButton>
        )}
        {isEditingFlow && (
          <AppButton
            onClick={onShowQrCode}
            variant="icon-default"
            title={t("header.qrCode")}
          >
            <QrCode size={18} />
          </AppButton>
        )}
        {isEditingFlow && (
          <AppButton
            onClick={onCopy}
            variant={copySuccess ? "icon-active" : "icon-default"}
            title={t("header.shareLink")}
          >
            {copySuccess ? <Check size={18} /> : <Share2 size={18} />}
          </AppButton>
        )}
        <AppButton
          onClick={toggleLocale}
          variant="icon-default"
          title={t("common.languageToggle")}
        >
          <span className="ui-mono text-xs">{t("common.languageToggle")}</span>
        </AppButton>
      </div>
    </nav>
  );
}
