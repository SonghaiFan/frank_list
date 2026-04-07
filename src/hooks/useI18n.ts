import { useUIStore } from "@/stores/ui-store";
import { translate } from "@/lib/i18n";

export const useI18n = () => {
  const locale = useUIStore((state) => state.locale);
  const toggleLocale = useUIStore((state) => state.toggleLocale);

  return {
    locale,
    t: (key: string, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
    toggleLocale,
  };
};
