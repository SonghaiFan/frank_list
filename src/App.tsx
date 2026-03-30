import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { Users } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { AppHeader } from '@/components/AppHeader';
import { ComparisonPanel } from '@/components/ComparisonPanel';
import { GroupWorkspace } from '@/components/GroupWorkspace';
import { Notebook } from '@/components/Notebook';
import { ModalDialog } from '@/components/ModalDialog';
import type { ListItem } from '@/lib/notebook-types';
import {
  clearPersistedAppState,
  createGroupShareUrl,
  loadAppState,
  persistAppState,
} from '@/lib/app-state-storage';
import {
  DEFAULT_GROUP_ID,
  PAGE_CARD_HEIGHT_PX,
  PAGE_CARD_WIDTH_PX,
  PAGE_SIZE,
} from '@/lib/workspace-constants';
import {
  createDefaultGroup,
  createDefaultState,
  getGroupPages,
} from '@/lib/notebook-utils';
import { useShallow } from 'zustand/react/shallow';
import { useAppDataStore } from '@/stores/app-data-store';
import { useUIStore } from '@/stores/ui-store';

export default function App() {
  const {
    addItem: addItemToData,
    appendEmptyPage: appendEmptyPageInData,
    bindPage,
    boundPages,
    clearSharedTicks,
    createGroup: createGroupInData,
    deleteGroup: deleteGroupFromData,
    extraPageCounts,
    groups,
    hydrateData,
    isHydrated,
    myId,
    myTicks,
    nextGroupId,
    nextItemId,
    pruneBoundPages,
    removeItem: removeItemInData,
    resetData,
    sharedTicks,
    toggleTick: toggleTickInStore,
  } = useAppDataStore(useShallow((state) => ({
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
  const {
    activeGroupId,
    backToWorkspace,
    closeOverlay,
    closeToGallery,
    copySuccess,
    flow,
    hydrate: hydrateUI,
    newItemText,
    openGroupFromGallery,
    overlay,
    selectGroup: selectGroupInUI,
    setCopySuccess,
    setNewItemText,
    showQrCode,
    showResetConfirm,
    startComparison: enterComparisonResult,
    togglePrimaryView,
  } = useUIStore();

  const isWorkspaceFlow = flow === 'workspace' || flow === 'compare-review';
  const isCompareReviewFlow = flow === 'compare-review';
  const isCompareResultFlow = flow === 'compare-result';
  const isEditingFlow = flow === 'workspace' || flow === 'gallery';

  const activeGroup = useMemo(
    () => groups.find((group) => group.id === activeGroupId) ?? groups[0] ?? createDefaultGroup(),
    [activeGroupId, groups]
  );
  const activeGroupPages = useMemo(
    () => getGroupPages(activeGroup, myTicks, boundPages, extraPageCounts[activeGroup.id] ?? 0),
    [activeGroup, myTicks, boundPages, extraPageCounts]
  );
  const stackPages = useMemo(
    () => activeGroupPages.filter((page) => !page.isBound),
    [activeGroupPages]
  );
  const lowerStackPages = useMemo(
    () => activeGroupPages.filter((page) => page.isBound),
    [activeGroupPages]
  );

  useEffect(() => {
    const initialize = async () => {
      const loaded = await loadAppState();
      hydrateData(loaded);
      hydrateUI({ activeGroupId: loaded.persistedState.activeGroupId, flow: loaded.initialFlow });
    };

    initialize();
  }, [hydrateData, hydrateUI]);

  useEffect(() => {
    if (!isHydrated || !myId) return;

    const persist = async () => {
      await persistAppState({
        groups,
        ticks: myTicks,
        boundPages,
        extraPageCounts,
        activeGroupId,
        nextGroupId,
        nextItemId,
      }, myId);
    };

    persist();
  }, [activeGroupId, boundPages, extraPageCounts, groups, isHydrated, myId, myTicks, nextGroupId, nextItemId]);

  useEffect(() => {
    pruneBoundPages();
  }, [groups, myTicks, pruneBoundPages]);

  const toggleTick = (itemId: string, e?: React.MouseEvent | React.ChangeEvent) => {
    const { pageKeyToBind } = toggleTickInStore({ activeGroupId, itemId });

    if (pageKeyToBind) {
      window.setTimeout(() => {
        useAppDataStore.getState().bindPage(pageKeyToBind);
      }, 800);
    }
  };

  const selectGroup = (groupId: string) => {
    selectGroupInUI(groupId);
    clearSharedTicks();
    window.history.replaceState({}, '', window.location.pathname);
  };

  const createGroup = () => {
    const newGroup = createGroupInData();
    selectGroup(newGroup.id);
  };

  const addItem = () => {
    addItemToData({ activeGroupId, text: newItemText });
    setNewItemText('');
  };

  const appendEmptyPage = () => {
    appendEmptyPageInData(activeGroupId);
  };

  const movePageToLowerStack = (pageKey: string) => {
    bindPage(pageKey);
  };

  const removeItem = (itemId: string) => {
    removeItemInData({ activeGroupId, itemId });
  };

  const generateShareUrl = () => {
    return createGroupShareUrl(activeGroup, myTicks, myId);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateShareUrl());
      setCopySuccess(true);
      window.setTimeout(() => useUIStore.getState().clearCopySuccess(), 2000);
    } catch (error) {
      console.error('Failed to copy!', error);
    }
  };

  const startComparison = () => {
    enterComparisonResult();
  };

  const backToEdit = () => {
    window.history.replaceState({}, '', window.location.pathname);
    backToWorkspace();
    clearSharedTicks();
  };

  const deleteActiveGroup = () => {
    if (activeGroup.id === DEFAULT_GROUP_ID) return;

    const fallbackGroupId = deleteGroupFromData(activeGroup.id);
    if (fallbackGroupId) {
      selectGroupInUI(fallbackGroupId);
    }
    backToWorkspace();
    closeOverlay();
    setNewItemText('');
    window.history.replaceState({}, '', window.location.pathname);
  };

  const comparison = useMemo(() => {
    if (!isCompareResultFlow) return null;

    const bothDone: ListItem[] = [];
    const bothNotDone: ListItem[] = [];
    const iDoneHeNot: ListItem[] = [];
    const heDoneINot: ListItem[] = [];

    activeGroup.items.forEach((item) => {
      const myTick = !!myTicks[item.id];
      const hisTick = !!sharedTicks[item.id];

      if (myTick && hisTick) bothDone.push(item);
      else if (!myTick && !hisTick) bothNotDone.push(item);
      else if (myTick && !hisTick) iDoneHeNot.push(item);
      else if (!myTick && hisTick) heDoneINot.push(item);
    });

    return { bothDone, bothNotDone, iDoneHeNot, heDoneINot };
  }, [activeGroup.items, isCompareResultFlow, myTicks, sharedTicks]);

  return (
    <div
      className={`min-h-screen p-4 md:p-10 flex flex-col items-center transition-colors ${
        isWorkspaceFlow ? 'cursor-zoom-out' : ''
      }`}
      onClick={() => {
        if (flow === 'workspace') closeToGallery();
      }}
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-[1240px]">
        <div className="w-full" onClick={(e) => e.stopPropagation()}>
          <AppHeader
            copySuccess={copySuccess}
            flow={flow}
            onBack={backToEdit}
            onCopy={copyToClipboard}
            onReset={showResetConfirm}
            onShowQrCode={showQrCode}
            onTogglePrimaryView={togglePrimaryView}
          />
        </div>

        <AnimatePresence>
          <motion.div
            key="detail"
            initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
          >
        
          <LayoutGroup id="workspace-main">
            <AnimatePresence mode="popLayout" initial={false}>
              {isCompareResultFlow && comparison ? (
                <motion.div key="comparison" layout className="w-full max-w-[1240px]">
                  <ComparisonPanel comparison={comparison} group={activeGroup} />
                </motion.div>
              ) : isWorkspaceFlow ? (
                <motion.div
                  key="open-workspace"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full flex flex-col items-center min-h-[80vh]"
                >
                  <motion.div
                    key={activeGroup.id}
                    layout
                    transition={{ layout: { type: 'spring', stiffness: 350, damping: 30 } }}
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-default w-full max-w-[800px]"
                  >
                    <GroupWorkspace
                      activeGroup={activeGroup}
                      activeGroupPages={stackPages}
                      flow={flow}
                      newItemText={newItemText}
                      pageSize={PAGE_SIZE}
                      ticks={myTicks}
                      onAddItem={addItem}
                      onAppendPage={appendEmptyPage}
                      onBindPage={movePageToLowerStack}
                      onItemTextChange={setNewItemText}
                      onRemoveItem={removeItem}
                      onToggleTick={toggleTick}
                    />
                  </motion.div>

                  <motion.div
                    key={`notebook-${activeGroup.id}`}
                    layoutId={`notebook-${activeGroup.id}`}
                    layout
                    transition={{ layout: { type: 'spring', stiffness: 350, damping: 30 } }}
                    className="w-full flex justify-center cursor-default"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Notebook
                      id={activeGroup.id}
                      closed={false}
                      coverTitle={activeGroup.title}
                      pages={lowerStackPages}
                      ticks={myTicks}
                      onRemoveItem={removeItem}
                      onToggleTick={toggleTick}
                    />
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="closed-gallery"
                  className="grid grid-cols-2 gap-x-20 gap-y-16 w-full max-w-[1200px] mx-auto items-start justify-items-center pt-10 px-4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  {groups.map((group) => {
                    const groupPages = getGroupPages(
                      group,
                      myTicks,
                      boundPages,
                      extraPageCounts[group.id] ?? 0
                    );
                    return (
                      <motion.div
                        key={group.id}
                        layoutId={`notebook-${group.id}`}
                        className="w-full flex justify-center"
                        style={{
                           width: PAGE_CARD_WIDTH_PX,
                           height: PAGE_CARD_HEIGHT_PX,
                           transformOrigin: 'top center',
                        }}
                        transition={{ layout: { type: 'spring', stiffness: 350, damping: 30 } }}
                        title={group.title}
                      >
                        <Notebook
                          id={group.id}
                          className="origin-top mt-0"
                          style={{ transform: 'scale(0.85)' }}
                          closed={true}
                          coverTitle={group.title}
                          pages={groupPages}
                          ticks={myTicks}
                          onRemoveItem={removeItem}
                          onToggleTick={toggleTick}
                          onOpen={() => {
                            openGroupFromGallery(group.id);
                          }}
                        />
                      </motion.div>
                    );
                  })}
                  
                  <motion.div 
                     layout
                     style={{
                        width: PAGE_CARD_WIDTH_PX,
                        height: PAGE_CARD_HEIGHT_PX,
                        transform: 'scale(0.85)',
                        transformOrigin: 'top center',
                     }}
                     className="border-2 border-dashed border-neutral-200 rounded-[20px] flex flex-col items-center justify-center text-neutral-300 cursor-pointer hover:border-klein hover:text-klein hover:bg-klein/5 mixed-blend-multiply opacity-80 hover:opacity-100 transition-all origin-top"
                     onClick={createGroup}
                  >
                     <span className="text-5xl font-light mb-4">+</span>
                     <span className="font-bold text-lg">New Notebook</span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </LayoutGroup>

        </motion.div>
        </AnimatePresence>

        <footer className="mt-10 flex flex-col items-center">
          {isCompareReviewFlow && (
            <button
              onClick={startComparison}
              className="px-12 py-4 bg-neutral-900 text-white rounded-full font-medium tracking-tight shadow-xl hover:bg-black transition-all flex items-center gap-3"
            >
              <Users size={18} />
              对比这一组
            </button>
          )}
          {isEditingFlow && (
            <div className="mt-3 flex items-center gap-4 ui-mono opacity-55">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-klein" />
                我添加的
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                外部导入
              </span>
            </div>
          )}
          <div className="mt-6 ui-mono opacity-20">
            RAMS-NOTEBOOK HYBRID / v2.0
          </div>
        </footer>

        <AnimatePresence>
          {overlay === 'reset-confirm' && (
            <ModalDialog
              title="确认重置吗？"
              body="这会清空你本地所有组、勾选、自己新增的项目、装订记录，以及已导入的外部组，并恢复成默认第一组。"
              onClose={closeOverlay}
            >
                <div className="flex gap-3">
                  <button
                    onClick={closeOverlay}
                    className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl font-medium transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                        const next = createDefaultState();
                        window.history.replaceState({}, '', window.location.pathname);
                        clearPersistedAppState();
                        resetData(next);
                        hydrateUI({ activeGroupId: next.activeGroupId, flow: 'workspace' });
                        closeOverlay();
                        setNewItemText('');
                    }}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                  >
                    确认重置
                  </button>
                </div>
            </ModalDialog>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {overlay === 'delete-group-confirm' && (
             <ModalDialog
               title={`确认删除 "${activeGroup.title}" 吗？`}
               body="删除后无法恢复，包括里面新增的项目和勾选记录。"
               onClose={closeOverlay}
             >
               <div className="flex gap-3">
                 <button
                   onClick={closeOverlay}
                   className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl font-medium transition-colors"
                 >
                   取消
                 </button>
                 <button
                   onClick={deleteActiveGroup}
                   className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                 >
                   确认删除
                 </button>
               </div>
             </ModalDialog>
          )}
        </AnimatePresence>
        
        {overlay === 'qr' ? (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={closeOverlay}>
             <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-6" onClick={e => e.stopPropagation()}>
               <div className="bg-white p-2 rounded-xl border border-neutral-100 shadow-sm">
                 <QRCodeCanvas value={generateShareUrl()} size={200} level="M" />
               </div>
               <p className="text-neutral-500 text-sm">扫码查看这一组</p>
             </div>
           </div>
        ) : null}

      </motion.div>
    </div>
  );
}
