import { getPreferredLocale, translate, type Locale } from "@/lib/i18n";

const resolveLocale = (locale?: Locale) => locale ?? getPreferredLocale();

export const getDefaultGroupTitle = (locale?: Locale) =>
  translate(resolveLocale(locale), "generated.defaultGroupTitle");

export const getGeneratedGroupTitle = (index: number, locale?: Locale) =>
  translate(resolveLocale(locale), "generated.groupTitle", { index });

export const getGeneratedPageTitle = (index: number, locale?: Locale) =>
  translate(resolveLocale(locale), "generated.pageTitle", { index });

export const getImportedGroupTitle = (locale?: Locale) =>
  translate(resolveLocale(locale), "generated.importedGroupTitle");
