import { useMemo } from 'react';
import type React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppDataStore } from '@/stores/app-data-store';
import { useUIStore } from '@/stores/ui-store';
import { useI18n } from '@/hooks/useI18n';
import { useAppLifecycle } from '@/hooks/useAppLifecycle';
import {
  clearShareQueryFromUrl,
  createGroupShareUrl,
} from '@/lib/app-state-storage';
import {
  getActiveGroupOrFallback,
  getComparisonBuckets,
  getPageCollections,
} from '@/lib/app-selectors';
import { getGeneratedGroupTitle } from '@/lib/notebook-labels';
import { DEFAULT_GROUP_ID } from '@/lib/workspace-constants';

export const useAppViewModel = () => {
  const { t } = useI18n();
  const appState = useAppDataStore(useShallow((state) => ({
    boundPages: state.boundPages,
    extraPageCounts: state.extraPageCounts,
    groups: state.groups,
    isHydrated: state.isHydrated,
    myId: state.myId,
    myTicks: state.myTicks,
    nextGroupId: state.nextGroupId,
    nextItemId: state.nextItemId,
    sharedTicks: state.sharedTicks,
  })));

  const appActions = useAppDataStore(useShallow((state) => ({
    addItem: state.addItem,
    appendEmptyPage: state.appendEmptyPage,
    bindPage: state.bindPage,
    clearSharedTicks: state.clearSharedTicks,
    createGroup: state.createGroup,
    deleteGroup: state.deleteGroup,
    hydrateData: state.hydrateData,
    pruneBoundPages: state.pruneBoundPages,
    removeItem: state.removeItem,
    resetData: state.resetData,
    toggleTick: state.toggleTick,
  })));

  const uiState = useUIStore(useShallow((state) => ({
    activeGroupId: state.activeGroupId,
    copySuccess: state.copySuccess,
    flow: state.flow,
    locale: state.locale,
    newItemText: state.newItemText,
    overlay: state.overlay,
  })));

  const uiActions = useUIStore(useShallow((state) => ({
    backToWorkspace: state.backToWorkspace,
    closeOverlay: state.closeOverlay,
    setCopySuccess: state.setCopySuccess,
    setNewItemText: state.setNewItemText,
    hydrate: state.hydrate,
    openGroupFromGallery: state.openGroupFromGallery,
    selectGroup: state.selectGroup,
    showQrCode: state.showQrCode,
    showResetConfirm: state.showResetConfirm,
    startComparison: state.startComparison,
    togglePrimaryView: state.togglePrimaryView,
  })));

  const isWorkspaceFlow = uiState.flow === 'workspace' || uiState.flow === 'compare-review';
  const isCompareReviewFlow = uiState.flow === 'compare-review';
  const isCompareResultFlow = uiState.flow === 'compare-result';
  const isEditingFlow = uiState.flow === 'workspace' || uiState.flow === 'gallery';

  const activeGroup = useMemo(
    () => getActiveGroupOrFallback(appState.groups, uiState.activeGroupId),
    [appState.groups, uiState.activeGroupId]
  );

  const { lowerStackPages, stackPages } = useMemo(
    () => getPageCollections(
      activeGroup,
      appState.myTicks,
      appState.boundPages,
      appState.extraPageCounts[activeGroup.id] ?? 0
    ),
    [activeGroup, appState.myTicks, appState.boundPages, appState.extraPageCounts]
  );

  const galleryGroups = useMemo(
    () => appState.groups.map((group) => ({
      group,
      pages: getPageCollections(
        group,
        appState.myTicks,
        appState.boundPages,
        appState.extraPageCounts[group.id] ?? 0
      ).activeGroupPages,
    })),
    [appState.groups, appState.myTicks, appState.boundPages, appState.extraPageCounts]
  );

  const comparison = useMemo(
    () => (isCompareResultFlow ? getComparisonBuckets(activeGroup.items, appState.myTicks, appState.sharedTicks) : null),
    [activeGroup.items, appState.myTicks, appState.sharedTicks, isCompareResultFlow]
  );

  const { resetToDefaultState } = useAppLifecycle({
    activeGroupId: uiState.activeGroupId,
    hydrateAppData: appActions.hydrateData,
    hydrateUI: uiActions.hydrate,
    locale: uiState.locale,
    pruneBoundPages: appActions.pruneBoundPages,
    state: appState,
  });

  const toggleTick = (itemId: string, _event?: React.MouseEvent | React.ChangeEvent) => {
    const { pageKeyToBind } = appActions.toggleTick({ activeGroupId: uiState.activeGroupId, itemId });

    if (pageKeyToBind) {
      window.setTimeout(() => {
        useAppDataStore.getState().bindPage(pageKeyToBind);
      }, 800);
    }
  };

  const selectGroup = (groupId: string) => {
    uiActions.selectGroup(groupId);
    appActions.clearSharedTicks();
    clearShareQueryFromUrl();
  };

  const createGroup = () => {
    const newGroup = appActions.createGroup(getGeneratedGroupTitle(appState.groups.length + 1, uiState.locale));
    selectGroup(newGroup.id);
  };

  const addItem = () => {
    appActions.addItem({ activeGroupId: uiState.activeGroupId, text: uiState.newItemText });
    uiActions.setNewItemText('');
  };

  const appendEmptyPage = () => {
    appActions.appendEmptyPage(uiState.activeGroupId);
  };

  const movePageToLowerStack = (pageKey: string) => {
    appActions.bindPage(pageKey);
  };

  const removeItem = (itemId: string) => {
    appActions.removeItem({ activeGroupId: uiState.activeGroupId, itemId });
  };

  const generateShareUrl = () => createGroupShareUrl(activeGroup, appState.myTicks, appState.myId);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateShareUrl());
      uiActions.setCopySuccess(true);
      window.setTimeout(() => useUIStore.getState().clearCopySuccess(), 2000);
    } catch (error) {
      console.error('Failed to copy!', error);
    }
  };

  const backToEdit = () => {
    clearShareQueryFromUrl();
    uiActions.backToWorkspace();
    appActions.clearSharedTicks();
  };

  const deleteActiveGroup = () => {
    if (activeGroup.id === DEFAULT_GROUP_ID) return;

    const fallbackGroupId = appActions.deleteGroup(activeGroup.id);
    if (fallbackGroupId) {
      uiActions.selectGroup(fallbackGroupId);
    }
    uiActions.backToWorkspace();
    uiActions.closeOverlay();
    uiActions.setNewItemText('');
    clearShareQueryFromUrl();
  };

  const resetAll = () => {
    const next = resetToDefaultState();
    clearShareQueryFromUrl();
    appActions.resetData(next);
    uiActions.hydrate({ activeGroupId: next.activeGroupId, flow: 'gallery' });
    uiActions.closeOverlay();
    uiActions.setNewItemText('');
  };

  return {
    activeGroup,
    addItem,
    appendEmptyPage,
    backToEdit,
    closeOverlay: uiActions.closeOverlay,
    comparison,
    copySuccess: uiState.copySuccess,
    copyToClipboard,
    createGroup,
    deleteActiveGroup,
    flow: uiState.flow,
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
    newItemText: uiState.newItemText,
    onItemTextChange: uiActions.setNewItemText,
    onOpenGroupFromGallery: uiActions.openGroupFromGallery,
    onResetRequest: uiActions.showResetConfirm,
    onShowQrCode: uiActions.showQrCode,
    onStartComparison: uiActions.startComparison,
    onTogglePrimaryView: uiActions.togglePrimaryView,
    overlay: uiState.overlay,
    removeItem,
    resetAll,
    stackPages,
    ticks: appState.myTicks,
    toggleTick,
  };
};
