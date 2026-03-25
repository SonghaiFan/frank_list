import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { Users } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { AppHeader } from './components/AppHeader';
import { ComparisonPanel } from './components/ComparisonPanel';
import { GroupWorkspace } from './components/GroupWorkspace';
import { Notebook } from './components/Notebook';
import { ModalDialog } from './components/ModalDialog';
import type { AppMode, Group, ListItem } from './lib/notebook-types';
import {
  DEFAULT_GROUP_ID,
  LOCAL_STATE_STORAGE_KEY,
  PAGE_CARD_HEIGHT_PX,
  PAGE_CARD_WIDTH_PX,
  PAGE_SIZE,
} from './lib/workspace-constants';
import {
  createDefaultGroup,
  createDefaultState,
  createOwnedId,
  decryptState,
  encryptState,
  generateShareKey,
  getGroupPages,
  getPageKey,
  mergeImportedGroup,
  normalizeState,
  parseSharedPayload,
  randomId,
} from './lib/notebook-utils';

interface ConfettiHandle {
  spawn: (x: number, y: number) => void;
}

export default function App() {
  const [myId, setMyId] = useState<string>('local');
  const [groups, setGroups] = useState<Group[]>([createDefaultGroup()]);
  const [activeGroupId, setActiveGroupId] = useState<string>(DEFAULT_GROUP_ID);
  const [myTicks, setMyTicks] = useState<Record<string, boolean>>({});
  const [boundPages, setBoundPages] = useState<Record<string, boolean>>({});
  const [extraPageCounts, setExtraPageCounts] = useState<Record<string, number>>({});
  const [nextGroupId, setNextGroupId] = useState(1);
  const [nextItemId, setNextItemId] = useState(0);
  const [sharedTicks, setSharedTicks] = useState<Record<string, boolean>>({});
  const [mode, setMode] = useState<AppMode>('edit');
  const [isGalleryClosed, setIsGalleryClosed] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupTitleDraft, setGroupTitleDraft] = useState('');
  const [newItemText, setNewItemText] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  const confettiRef = useRef<ConfettiHandle | null>(null);
  const paperRef = useRef<HTMLDivElement>(null);

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
      let localId = localStorage.getItem('rams-user-id');
      if (!localId || localId.length > 6) {
        localId = randomId(4);
        localStorage.setItem('rams-user-id', localId);
      }
      setMyId(localId);

      let currentState = createDefaultState();
      const savedState = localStorage.getItem(LOCAL_STATE_STORAGE_KEY);
      if (savedState) {
        const decrypted = await decryptState(savedState, localId);
        if (decrypted) currentState = decrypted;
      }

      const params = new URLSearchParams(window.location.search);
      const key = params.get('key');
      if (key) {
        const imported = parseSharedPayload(key);
        if (imported) {
          currentState = {
            ...currentState,
            groups: mergeImportedGroup(currentState.groups, imported.group),
            activeGroupId: imported.group.id,
          };
          setSharedTicks(imported.sharedTicks);
          setMode('compare-step-1');
        }
      }

      setGroups(currentState.groups);
      setActiveGroupId(currentState.activeGroupId);
      setMyTicks(currentState.ticks);
      setBoundPages(currentState.boundPages);
      setExtraPageCounts(currentState.extraPageCounts);
      setNextGroupId(currentState.nextGroupId);
      setNextItemId(currentState.nextItemId);
      setIsHydrated(true);
    };

    initialize();
  }, []);

  useEffect(() => {
    if (!isHydrated || !myId) return;

    const persist = async () => {
      const payload = normalizeState({
        groups,
        ticks: myTicks,
        boundPages,
        extraPageCounts,
        activeGroupId,
        nextGroupId,
        nextItemId,
      });
      const encrypted = await encryptState(payload, myId);
      localStorage.setItem(LOCAL_STATE_STORAGE_KEY, encrypted);
    };

    persist();
  }, [activeGroupId, boundPages, extraPageCounts, groups, isHydrated, myId, myTicks, nextGroupId, nextItemId]);

  useEffect(() => {
    setBoundPages((prev) => {
      let changed = false;
      const next = { ...prev };

      Object.keys(prev).forEach((pageKey) => {
        if (!prev[pageKey]) return;

        const [groupId, pageIndexRaw] = pageKey.split(':');
        const group = groups.find((entry) => entry.id === groupId);
        const pageIndex = Number.parseInt(pageIndexRaw, 10);

        if (!group || Number.isNaN(pageIndex)) {
          delete next[pageKey];
          changed = true;
          return;
        }

        const items = group.items.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE);
        const isComplete = items.length === PAGE_SIZE && items.every((item) => !!myTicks[item.id]);

        if (!isComplete) {
          delete next[pageKey];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [groups, myTicks]);

  const toggleTick = (itemId: string, e?: React.MouseEvent | React.ChangeEvent) => {
    const isChecking = !myTicks[itemId];
    setMyTicks((prev) => ({ ...prev, [itemId]: isChecking }));

    if (isChecking) {
      const itemIndex = activeGroup.items.findIndex((item) => item.id === itemId);
      if (itemIndex !== -1) {
        const pageIndex = Math.floor(itemIndex / PAGE_SIZE);
        const pageStart = pageIndex * PAGE_SIZE;
        const pageItems = activeGroup.items.slice(pageStart, pageStart + PAGE_SIZE);
        
        const isPageComplete = pageItems.length === PAGE_SIZE && pageItems.every((item) => 
          item.id === itemId ? true : !!myTicks[item.id]
        );

        if (isPageComplete) {
          const pageKey = getPageKey(activeGroup.id, pageIndex);
          setTimeout(() => {
            setBoundPages((prev) => ({ ...prev, [pageKey]: true }));
          }, 800);
        }
      }
    }

    if (isChecking && e && confettiRef.current && paperRef.current) {
      let x;
      let y;
      if ('clientX' in e && (e as React.MouseEvent).clientX !== undefined) {
        x = (e as React.MouseEvent).clientX;
        y = (e as React.MouseEvent).clientY;
      } else {
        const targetRect = (e.target as HTMLElement).getBoundingClientRect();
        x = targetRect.left + targetRect.width / 2;
        y = targetRect.top + targetRect.height / 2;
      }

      if (!isNaN(x) && !isNaN(y)) {
        confettiRef.current.spawn(x, y);
      }
    }
  };

  const selectGroup = (groupId: string) => {
    setActiveGroupId(groupId);
    setMode('edit');
    setSharedTicks({});
    window.history.replaceState({}, '', window.location.pathname);
  };

  const createGroup = () => {
    const newGroup: Group = {
      id: createOwnedId(myId, nextGroupId),
      title: `第 ${groups.length + 1} 组`,
      items: [],
    };
    setNextGroupId((prev) => prev + 1);
    setGroups((prev) => [...prev, newGroup]);
    selectGroup(newGroup.id);
    setEditingGroupId(newGroup.id);
    setGroupTitleDraft(newGroup.title);
  };

  const startRenameGroup = () => {
    if (mode !== 'edit') return;
    setEditingGroupId(activeGroup.id);
    setGroupTitleDraft(activeGroup.title);
  };

  const saveGroupTitle = () => {
    if (!editingGroupId) return;
    const nextTitle = groupTitleDraft.trim();
    if (!nextTitle) {
      setEditingGroupId(null);
      setGroupTitleDraft('');
      return;
    }

    setGroups((prev) =>
      prev.map((group) =>
        group.id === editingGroupId
          ? { ...group, title: nextTitle }
          : group
      )
    );
    setEditingGroupId(null);
    setGroupTitleDraft('');
  };

  const cancelRenameGroup = () => {
    setEditingGroupId(null);
    setGroupTitleDraft('');
  };

  const addItem = () => {
    const text = newItemText.trim();
    if (!text) return;
    if (activeGroup.items.some((item) => item.text === text)) return;

    const previousNaturalPageCount = Math.max(1, Math.ceil(activeGroup.items.length / PAGE_SIZE));

    const newItem: ListItem = {
      id: createOwnedId(myId, nextItemId),
      text,
      origin: { type: 'self' },
    };

    setGroups((prev) =>
      prev.map((group) =>
        group.id === activeGroupId
          ? { ...group, items: [...group.items, newItem] }
          : group
      )
    );
    setExtraPageCounts((prev) => {
      const currentExtra = prev[activeGroupId] ?? 0;
      if (currentExtra === 0) return prev;

      const nextNaturalPageCount = Math.max(1, Math.ceil((activeGroup.items.length + 1) / PAGE_SIZE));
      const consumedExtraPages = Math.max(0, nextNaturalPageCount - previousNaturalPageCount);
      if (consumedExtraPages === 0) return prev;

      const nextExtra = Math.max(0, currentExtra - consumedExtraPages);
      if (nextExtra === currentExtra) return prev;

      const next = { ...prev };
      if (nextExtra > 0) next[activeGroupId] = nextExtra;
      else delete next[activeGroupId];
      return next;
    });
    setNextItemId((prev) => prev + 1);
    setNewItemText('');
  };

  const appendEmptyPage = () => {
    setExtraPageCounts((prev) => ({
      ...prev,
      [activeGroupId]: (prev[activeGroupId] ?? 0) + 1,
    }));
  };

  const movePageToLowerStack = (pageKey: string) => {
    setBoundPages((prev) => ({ ...prev, [pageKey]: true }));
  };

  const removeItem = (itemId: string) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === activeGroupId
          ? { ...group, items: group.items.filter((item) => item.id !== itemId) }
          : group
      )
    );
    setMyTicks((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
    setSharedTicks((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
    setExtraPageCounts((prev) => {
      const currentExtra = prev[activeGroupId] ?? 0;
      if (currentExtra === 0) return prev;

      // Prune extra page capability as content shrinks to avoid "zombie" empty pages
      const nextExtra = Math.max(0, currentExtra - 1);
      if (nextExtra === currentExtra) return prev;

      const next = { ...prev };
      if (nextExtra > 0) next[activeGroupId] = nextExtra;
      else delete next[activeGroupId];
      return next;
    });
  };

  const generateShareUrl = () => {
    const encoded = generateShareKey(activeGroup, myTicks, myId);
    const url = new URL(window.location.href);
    url.searchParams.set('key', encoded);
    return url.toString();
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateShareUrl());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy!', error);
    }
  };

  const startComparison = () => {
    setMode('compare-result');
  };

  const backToEdit = () => {
    window.history.replaceState({}, '', window.location.pathname);
    setMode('edit');
    setSharedTicks({});
  };

  const deleteActiveGroup = () => {
    if (activeGroup.id === DEFAULT_GROUP_ID) return;

    const groupIndex = groups.findIndex((group) => group.id === activeGroup.id);
    const nextGroups = groups.filter((group) => group.id !== activeGroup.id);
    const fallbackGroup = nextGroups[Math.max(0, groupIndex - 1)] ?? nextGroups[0] ?? createDefaultGroup();

    setGroups(nextGroups);
    setActiveGroupId(fallbackGroup.id);
    setMyTicks((prev) => {
      const next = { ...prev };
      activeGroup.items.forEach((item) => {
        delete next[item.id];
      });
      return next;
    });
    setSharedTicks((prev) => {
      const next = { ...prev };
      activeGroup.items.forEach((item) => {
        delete next[item.id];
      });
      return next;
    });
    setBoundPages((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([key]) => !key.startsWith(`${activeGroup.id}:`)))
    );
    setExtraPageCounts((prev) => {
      const next = { ...prev };
      delete next[activeGroup.id];
      return next;
    });
    setMode('edit');
    setShowDeleteGroupConfirm(false);
    setEditingGroupId(null);
    setGroupTitleDraft('');
    setNewItemText('');
    window.history.replaceState({}, '', window.location.pathname);
  };

  const comparison = useMemo(() => {
    if (mode !== 'compare-result') return null;

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
  }, [activeGroup.items, mode, myTicks, sharedTicks]);

  return (
    <div className="min-h-screen p-4 md:p-10 flex flex-col items-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-[1240px]">
        <AppHeader
          copySuccess={copySuccess}
          isGalleryClosed={isGalleryClosed}
          mode={mode}
          onBack={backToEdit}
          onCopy={copyToClipboard}
          onReset={() => setShowResetConfirm(true)}
          onShowQrCode={() => setShowQrCode(true)}
          onToggleGalleryClosed={() => setIsGalleryClosed((prev) => !prev)}
        />

        <AnimatePresence>
          <motion.div
            key="detail"
            initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
          >
        
          <LayoutGroup id="workspace-main">
            <AnimatePresence mode="popLayout" initial={false}>
              {mode === 'compare-result' && comparison ? (
                <motion.div key="comparison" layout className="w-full max-w-[1240px]">
                  <ComparisonPanel comparison={comparison} group={activeGroup} />
                </motion.div>
              ) : !isGalleryClosed ? (
                <motion.div
                  key="open-workspace"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full flex flex-col items-center min-h-[80vh] cursor-zoom-out"
                  onClick={() => setIsGalleryClosed(true)}
                >
                  <motion.div
                    key={activeGroup.id}
                    layout
                    transition={{ layout: { type: 'spring', stiffness: 210, damping: 28 } }}
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-default w-full max-w-[800px]"
                  >
                    <GroupWorkspace
                      activeGroup={activeGroup}
                      activeGroupPages={stackPages}
                      mode={mode}
                      newItemText={newItemText}
                      pageSize={PAGE_SIZE}
                      paperRef={paperRef}
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
                    transition={{ layout: { type: 'spring', stiffness: 210, damping: 28 } }}
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
                        transition={{ layout: { type: 'spring', stiffness: 210, damping: 28 } }}
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
                            setActiveGroupId(group.id);
                            setIsGalleryClosed(false);
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
          {mode === 'compare-step-1' && (
            <button
              onClick={startComparison}
              className="px-12 py-4 bg-neutral-900 text-white rounded-full font-medium tracking-tight shadow-xl hover:bg-black transition-all flex items-center gap-3"
            >
              <Users size={18} />
              对比这一组
            </button>
          )}
          {mode === 'edit' && (
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
          {showResetConfirm && (
            <ModalDialog
              title="确认重置吗？"
              body="这会清空你本地所有组、勾选、自己新增的项目、装订记录，以及已导入的外部组，并恢复成默认第一组。"
              onClose={() => setShowResetConfirm(false)}
            >
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl font-medium transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                        const next = createDefaultState();
                        window.history.replaceState({}, '', window.location.pathname);
                        localStorage.removeItem(LOCAL_STATE_STORAGE_KEY);
                        setGroups(next.groups);
                        setActiveGroupId(next.activeGroupId);
                        setMyTicks({});
                        setBoundPages({});
                        setExtraPageCounts({});
                        setNextGroupId(next.nextGroupId);
                        setNextItemId(next.nextItemId);
                        setSharedTicks({});
                        setMode('edit');
                        setShowResetConfirm(false);
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
          {showDeleteGroupConfirm && (
             <ModalDialog
               title={`确认删除 "${activeGroup.title}" 吗？`}
               body="删除后无法恢复，包括里面新增的项目和勾选记录。"
               onClose={() => setShowDeleteGroupConfirm(false)}
             >
               <div className="flex gap-3">
                 <button
                   onClick={() => setShowDeleteGroupConfirm(false)}
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
        
        {showQrCode ? (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowQrCode(false)}>
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
