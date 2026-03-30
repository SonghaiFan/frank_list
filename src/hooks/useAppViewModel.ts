import { useEffect, useMemo } from 'react';
import type React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppDataStore } from '@/stores/app-data-store';
import { useUIStore } from '@/stores/ui-store';
import { useI18n } from '@/hooks/useI18n';
import {
  clearPersistedAppState,
  clearShareQueryFromUrl,
  createGroupShareUrl,
  loadAppState,
  persistAppState,
} from '@/lib/app-state-storage';
import { createDefaultState } from '@/lib/notebook-utils';
import {
  getActiveGroupOrFallback,
  getComparisonBuckets,
  getPageCollections,
} from '@/lib/app-selectors';
import { getGeneratedGroupTitle } from '@/lib/notebook-labels';
import { DEFAULT_GROUP_ID } from '@/lib/workspace-constants';

export const useAppViewModel = () => {
  const { t } = useI18n();
  const appData = useAppDataStore(useShallow((state) => ({
    addItem: state.addItem,
    appendEmptyPage: state.appendEmptyPage,
    bindPage: state.bindPage,
    boundPages: state.boundPages,
    clearSharedTicks: state.clearSharedTicks,
    createGroup: state.createGroup,
    deleteGroup: state.deleteGroup,
    extraPageCounts: state.extraPageCounts,
    groups: state.groups,
    hydrateData: state.hydrateData,
    isHydrated: state.isHydrated,
    myId: state.myId,
    myTicks: state.myTicks,
    nextGroupId: state.nextGroupId,
    nextItemId: state.nextItemId,
    pruneBoundPages: state.pruneBoundPages,
    removeItem: state.removeItem,
    resetData: state.resetData,
    sharedTicks: state.sharedTicks,
    toggleTick: state.toggleTick,
  })));

  const ui = useUIStore(useShallow((state) => ({
    activeGroupId: state.activeGroupId,
    backToWorkspace: state.backToWorkspace,
    closeOverlay: state.closeOverlay,
    closeToGallery: state.closeToGallery,
    copySuccess: state.copySuccess,
    flow: state.flow,
    hydrate: state.hydrate,
    locale: state.locale,
    newItemText: state.newItemText,
    openGroupFromGallery: state.openGroupFromGallery,
    overlay: state.overlay,
    selectGroup: state.selectGroup,
    setCopySuccess: state.setCopySuccess,
    setNewItemText: state.setNewItemText,
    showQrCode: state.showQrCode,
    showResetConfirm: state.showResetConfirm,
    startComparison: state.startComparison,
    togglePrimaryView: state.togglePrimaryView,
  })));

  const isWorkspaceFlow = ui.flow === 'workspace' || ui.flow === 'compare-review';
  const isCompareReviewFlow = ui.flow === 'compare-review';
  const isCompareResultFlow = ui.flow === 'compare-result';
  const isEditingFlow = ui.flow === 'workspace' || ui.flow === 'gallery';

  const activeGroup = useMemo(
    () => getActiveGroupOrFallback(appData.groups, ui.activeGroupId),
    [appData.groups, ui.activeGroupId]
  );

  const { lowerStackPages, stackPages } = useMemo(
    () => getPageCollections(
      activeGroup,
      appData.myTicks,
      appData.boundPages,
      appData.extraPageCounts[activeGroup.id] ?? 0
    ),
    [activeGroup, appData.myTicks, appData.boundPages, appData.extraPageCounts]
  );

  const galleryGroups = useMemo(
    () => appData.groups.map((group) => ({
      group,
      pages: getPageCollections(
        group,
        appData.myTicks,
        appData.boundPages,
        appData.extraPageCounts[group.id] ?? 0
      ).activeGroupPages,
    })),
    [appData.groups, appData.myTicks, appData.boundPages, appData.extraPageCounts]
  );

  const comparison = useMemo(
    () => (isCompareResultFlow ? getComparisonBuckets(activeGroup.items, appData.myTicks, appData.sharedTicks) : null),
    [activeGroup.items, appData.myTicks, appData.sharedTicks, isCompareResultFlow]
  );

  useEffect(() => {
    const initialize = async () => {
      const loaded = await loadAppState();
      appData.hydrateData(loaded);
      ui.hydrate({ activeGroupId: loaded.persistedState.activeGroupId, flow: loaded.initialFlow });
    };

    initialize();
  }, [appData, ui]);

  useEffect(() => {
    if (!appData.isHydrated || !appData.myId) return;

    const persist = async () => {
      await persistAppState({
        groups: appData.groups,
        ticks: appData.myTicks,
        boundPages: appData.boundPages,
        extraPageCounts: appData.extraPageCounts,
        activeGroupId: ui.activeGroupId,
        nextGroupId: appData.nextGroupId,
        nextItemId: appData.nextItemId,
      }, appData.myId);
    };

    persist();
  }, [
    appData.boundPages,
    appData.extraPageCounts,
    appData.groups,
    appData.isHydrated,
    appData.myId,
    appData.myTicks,
    appData.nextGroupId,
    appData.nextItemId,
    ui.activeGroupId,
  ]);

  useEffect(() => {
    appData.pruneBoundPages();
  }, [appData.groups, appData.myTicks, appData.pruneBoundPages]);

  const toggleTick = (itemId: string, e?: React.MouseEvent | React.ChangeEvent) => {
    const { pageKeyToBind } = appData.toggleTick({ activeGroupId: ui.activeGroupId, itemId });

    if (pageKeyToBind) {
      window.setTimeout(() => {
        useAppDataStore.getState().bindPage(pageKeyToBind);
      }, 800);
    }
  };

  const selectGroup = (groupId: string) => {
    ui.selectGroup(groupId);
    appData.clearSharedTicks();
    clearShareQueryFromUrl();
  };

  const createGroup = () => {
    const newGroup = appData.createGroup(getGeneratedGroupTitle(appData.groups.length + 1, ui.locale));
    selectGroup(newGroup.id);
  };

  const addItem = () => {
    appData.addItem({ activeGroupId: ui.activeGroupId, text: ui.newItemText });
    ui.setNewItemText('');
  };

  const appendEmptyPage = () => {
    appData.appendEmptyPage(ui.activeGroupId);
  };

  const movePageToLowerStack = (pageKey: string) => {
    appData.bindPage(pageKey);
  };

  const removeItem = (itemId: string) => {
    appData.removeItem({ activeGroupId: ui.activeGroupId, itemId });
  };

  const generateShareUrl = () => createGroupShareUrl(activeGroup, appData.myTicks, appData.myId);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateShareUrl());
      ui.setCopySuccess(true);
      window.setTimeout(() => useUIStore.getState().clearCopySuccess(), 2000);
    } catch (error) {
      console.error('Failed to copy!', error);
    }
  };

  const backToEdit = () => {
    clearShareQueryFromUrl();
    ui.backToWorkspace();
    appData.clearSharedTicks();
  };

  const deleteActiveGroup = () => {
    if (activeGroup.id === DEFAULT_GROUP_ID) return;

    const fallbackGroupId = appData.deleteGroup(activeGroup.id);
    if (fallbackGroupId) {
      ui.selectGroup(fallbackGroupId);
    }
    ui.backToWorkspace();
    ui.closeOverlay();
    ui.setNewItemText('');
    clearShareQueryFromUrl();
  };

  const resetAll = () => {
    const next = createDefaultState(ui.locale);
    clearShareQueryFromUrl();
    clearPersistedAppState();
    appData.resetData(next);
    ui.hydrate({ activeGroupId: next.activeGroupId, flow: 'workspace' });
    ui.closeOverlay();
    ui.setNewItemText('');
  };

  return {
    activeGroup,
    addItem,
    appendEmptyPage,
    backToEdit,
    closeOverlay: ui.closeOverlay,
    comparison,
    copySuccess: ui.copySuccess,
    copyToClipboard,
    createGroup,
    deleteActiveGroup,
    flow: ui.flow,
    galleryGroups,
    generateShareUrl,
    isCompareResultFlow,
    isCompareReviewFlow,
    isEditingFlow,
    isWorkspaceFlow,
    labels: {
      cancel: t('common.cancel'),
      compareThisGroup: t('app.compareThisGroup'),
      deleteBody: t('app.delete.body'),
      deleteConfirm: t('app.delete.confirm'),
      deleteTitle: t('app.delete.title', { title: activeGroup.title }),
      legendExternal: t('app.legend.external'),
      legendSelf: t('app.legend.self'),
      newNotebook: t('app.newNotebook'),
      qrHint: t('app.qrHint'),
      resetBody: t('app.reset.body'),
      resetConfirm: t('app.reset.confirm'),
      resetTitle: t('app.reset.title'),
      signature: t('brand.signature'),
    },
    lowerStackPages,
    movePageToLowerStack,
    newItemText: ui.newItemText,
    onItemTextChange: ui.setNewItemText,
    onOpenGroupFromGallery: ui.openGroupFromGallery,
    onResetRequest: ui.showResetConfirm,
    onShowQrCode: ui.showQrCode,
    onStartComparison: ui.startComparison,
    onTogglePrimaryView: ui.togglePrimaryView,
    overlay: ui.overlay,
    removeItem,
    resetAll,
    stackPages,
    ticks: appData.myTicks,
    toggleTick,
  };
};
