export type Locale = 'zh' | 'en';

export const UI_PREFERENCES_STORAGE_KEY = 'rams-ui-preferences';

type TranslationValue = string | ((vars?: Record<string, string | number>) => string);

const format = (template: string, vars?: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key) => String(vars?.[key] ?? ''));

const translationFactory = (template: string) => (vars?: Record<string, string | number>) => format(template, vars);

export const isLocale = (value: unknown): value is Locale => value === 'zh' || value === 'en';

const translations: Record<Locale, Record<string, TranslationValue>> = {
  zh: {
    'brand.name': "Frank's Life List",
    'brand.workspace': 'v2.0 / Workspace',
    'brand.comparison': 'v2.0 / Comparison',
    'brand.signature': "FRANK'S LIFE LIST / v2.0",
    'common.cancel': '取消',
    'common.confirm': '确认',
    'common.languageToggle': 'EN',
    'header.backToLibrary': '返回书库',
    'header.openStackView': '展开工作台',
    'header.closeIntoNotebook': '收起为笔记本',
    'header.backToEdit': '返回编辑',
    'header.reset': '重置默认状态',
    'header.qrCode': '二维码',
    'header.shareLink': '分享链接',
    'workspace.compareNotice': '收到这一组的同步请求：请在下面逐页勾选你的进度，完成后可以进入对比。',
    'comparison.title': '对比结果',
    'comparison.bothDone': '共同完成',
    'comparison.iDoneHeNot': '我已完成',
    'comparison.heDoneINot': '对方已完成',
    'comparison.bothNotDone': '都没有完成',
    'page.status.bound': '已归档',
    'page.status.complete': '已完成',
    'page.status.pending': '待完成',
    'page.addItemPlaceholder': translationFactory('给「{title}」添加新项目...'),
    'origin.self': '自己添加',
    'origin.external': '外部导入',
    'origin.externalWithOwner': translationFactory('外部导入 · {ownerId}'),
    'origin.default': '默认项目',
    'card.cover.defaultTitle': 'Notebook',
    'card.cover.subtitle': "Frank's Life List",
    'card.end.label': '列表结束',
    'notebook.previousPage': '上一页',
    'notebook.nextPage': '下一页',
    'notebook.index': '目录',
    'notebook.backCover': '封底',
    'notebook.backLabel': '背面',
    'notebook.pageMeta': translationFactory('{title} · 第 {page} 页'),
    'stack.addPage': '添加新页',
    'app.newNotebook': '新建笔记本',
    'app.compareThisGroup': '对比这一组',
    'app.legend.self': '我添加的',
    'app.legend.external': '外部导入',
    'app.reset.title': '确认重置吗？',
    'app.reset.body': '这会清空你本地所有组、勾选、自己新增的项目、装订记录，以及已导入的外部组，并恢复成默认第一组。',
    'app.reset.confirm': '确认重置',
    'app.delete.title': translationFactory('确认删除 “{title}” 吗？'),
    'app.delete.body': '删除后无法恢复，包括里面新增的项目和勾选记录。',
    'app.delete.confirm': '确认删除',
    'app.qrHint': '扫码查看这一组',
    'groupTabs.newGroup': '新建一组',
    'groupTabs.currentGroupId': translationFactory('当前组 ID: {id}'),
    'generated.defaultGroupTitle': '人生清单100项',
    'generated.groupTitle': translationFactory('第 {index} 组'),
    'generated.pageTitle': translationFactory('第 {index} 页'),
    'generated.importedGroupTitle': '导入页',
  },
  en: {
    'brand.name': "Frank's Life List",
    'brand.workspace': 'v2.0 / Workspace',
    'brand.comparison': 'v2.0 / Comparison',
    'brand.signature': "FRANK'S LIFE LIST / v2.0",
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.languageToggle': '中文',
    'header.backToLibrary': 'Back to Library',
    'header.openStackView': 'Open stack view',
    'header.closeIntoNotebook': 'Close into notebook',
    'header.backToEdit': 'Back to Edit',
    'header.reset': 'Reset to Default',
    'header.qrCode': 'QR Code',
    'header.shareLink': 'Share Link',
    'workspace.compareNotice': 'A sync request arrived for this group. Please review each page below and then compare the results.',
    'comparison.title': 'Comparison',
    'comparison.bothDone': 'Both done',
    'comparison.iDoneHeNot': 'Only I did',
    'comparison.heDoneINot': 'Only they did',
    'comparison.bothNotDone': 'Neither done',
    'page.status.bound': 'Archived',
    'page.status.complete': 'Done',
    'page.status.pending': 'Pending',
    'page.addItemPlaceholder': translationFactory('Add a new item to "{title}"...'),
    'origin.self': 'Added by me',
    'origin.external': 'Imported',
    'origin.externalWithOwner': translationFactory('Imported · {ownerId}'),
    'origin.default': 'Default item',
    'card.cover.defaultTitle': 'Notebook',
    'card.cover.subtitle': "Frank's Life List",
    'card.end.label': 'End of List',
    'notebook.previousPage': 'Previous page',
    'notebook.nextPage': 'Next page',
    'notebook.index': 'Index',
    'notebook.backCover': 'Back cover',
    'notebook.backLabel': 'Back',
    'notebook.pageMeta': translationFactory('{title} · Page {page}'),
    'stack.addPage': 'Add new page',
    'app.newNotebook': 'New Notebook',
    'app.compareThisGroup': 'Compare this group',
    'app.legend.self': 'Added by me',
    'app.legend.external': 'Imported',
    'app.reset.title': 'Reset everything?',
    'app.reset.body': 'This clears all local groups, checkmarks, custom items, bound pages, and imported external groups, then restores the default first group.',
    'app.reset.confirm': 'Reset',
    'app.delete.title': translationFactory('Delete "{title}"?'),
    'app.delete.body': 'This cannot be undone, including custom items and checkmarks inside the group.',
    'app.delete.confirm': 'Delete',
    'app.qrHint': 'Scan to open this group',
    'groupTabs.newGroup': 'New group',
    'groupTabs.currentGroupId': translationFactory('Current group ID: {id}'),
    'generated.defaultGroupTitle': '100 Life List',
    'generated.groupTitle': translationFactory('Group {index}'),
    'generated.pageTitle': translationFactory('Page {index}'),
    'generated.importedGroupTitle': 'Imported Page',
  },
};

export const translate = (
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>
) => {
  const value = translations[locale][key] ?? translations.zh[key] ?? key;
  return typeof value === 'function' ? value(vars) : value;
};

export const readStoredLocale = (): Locale | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(UI_PREFERENCES_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { state?: { locale?: unknown } };
    return isLocale(parsed.state?.locale) ? parsed.state.locale : null;
  } catch {
    return null;
  }
};

export const getPreferredLocale = (): Locale => {
  const storedLocale = readStoredLocale();
  if (storedLocale) return storedLocale;
  if (typeof navigator === 'undefined') return 'zh';
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
};
