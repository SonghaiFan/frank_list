import { create } from "zustand";
import type { Group, PersistedAppState } from "@/lib/notebook-types";
import {
  createDefaultGroup,
  createOwnedId,
  getPageKey,
} from "@/lib/notebook-utils";
import { PAGE_SIZE } from "@/lib/workspace-constants";
import type { LoadedAppState } from "@/lib/app-state-storage";

interface ToggleTickResult {
  isChecking: boolean;
  pageKeyToBind?: string;
}

interface AppDataState {
  boundPages: Record<string, boolean>;
  extraPageCounts: Record<string, number>;
  groups: Group[];
  isHydrated: boolean;
  myId: string;
  myTicks: Record<string, boolean>;
  nextGroupId: number;
  nextItemId: number;
  sharedTicks: Record<string, boolean>;
  addItem: (params: { activeGroupId: string; text: string }) => void;
  appendEmptyPage: (activeGroupId: string) => void;
  bindPage: (pageKey: string) => void;
  clearSharedTicks: () => void;
  createGroup: (title: string) => Group;
  deleteGroup: (activeGroupId: string) => string | null;
  hydrateData: (loaded: LoadedAppState) => void;
  pruneBoundPages: () => void;
  removeItem: (params: { activeGroupId: string; itemId: string }) => void;
  resetData: (state: PersistedAppState) => void;
  setSharedTicks: (ticks: Record<string, boolean>) => void;
  toggleTick: (params: {
    activeGroupId: string;
    itemId: string;
  }) => ToggleTickResult;
}

export const useAppDataStore = create<AppDataState>((set, get) => ({
  boundPages: {},
  extraPageCounts: {},
  groups: [createDefaultGroup()],
  isHydrated: false,
  myId: "local",
  myTicks: {},
  nextGroupId: 1,
  nextItemId: 0,
  sharedTicks: {},
  addItem: ({ activeGroupId, text }) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const { extraPageCounts, groups, myId, nextItemId } = get();
    const activeGroup = groups.find((group) => group.id === activeGroupId);
    if (!activeGroup || activeGroup.items.some((item) => item.text === trimmed))
      return;

    const previousNaturalPageCount = Math.max(
      1,
      Math.ceil(activeGroup.items.length / PAGE_SIZE),
    );
    const newItem = {
      id: createOwnedId(myId, nextItemId),
      text: trimmed,
      origin: { type: "self" as const },
    };

    set({
      groups: groups.map((group) =>
        group.id === activeGroupId
          ? { ...group, items: [...group.items, newItem] }
          : group,
      ),
      extraPageCounts: (() => {
        const currentExtra = extraPageCounts[activeGroupId] ?? 0;
        if (currentExtra === 0) return extraPageCounts;

        const nextNaturalPageCount = Math.max(
          1,
          Math.ceil((activeGroup.items.length + 1) / PAGE_SIZE),
        );
        const consumedExtraPages = Math.max(
          0,
          nextNaturalPageCount - previousNaturalPageCount,
        );
        if (consumedExtraPages === 0) return extraPageCounts;

        const nextExtra = Math.max(0, currentExtra - consumedExtraPages);
        if (nextExtra === currentExtra) return extraPageCounts;

        const next = { ...extraPageCounts };
        if (nextExtra > 0) next[activeGroupId] = nextExtra;
        else delete next[activeGroupId];
        return next;
      })(),
      nextItemId: nextItemId + 1,
    });
  },
  appendEmptyPage: (activeGroupId) =>
    set((state) => ({
      extraPageCounts: {
        ...state.extraPageCounts,
        [activeGroupId]: (state.extraPageCounts[activeGroupId] ?? 0) + 1,
      },
    })),
  bindPage: (pageKey) =>
    set((state) => ({
      boundPages: { ...state.boundPages, [pageKey]: true },
    })),
  clearSharedTicks: () => set({ sharedTicks: {} }),
  createGroup: (title) => {
    const { groups, myId, nextGroupId } = get();
    const group: Group = {
      id: createOwnedId(myId, nextGroupId),
      title,
      items: [],
    };
    set({
      groups: [...groups, group],
      nextGroupId: nextGroupId + 1,
    });
    return group;
  },
  deleteGroup: (activeGroupId) => {
    const { boundPages, extraPageCounts, groups, myTicks, sharedTicks } = get();
    const activeGroup = groups.find((group) => group.id === activeGroupId);
    if (!activeGroup) return null;

    const groupIndex = groups.findIndex((group) => group.id === activeGroupId);
    const nextGroups = groups.filter((group) => group.id !== activeGroupId);
    const fallbackGroup =
      nextGroups[Math.max(0, groupIndex - 1)] ??
      nextGroups[0] ??
      createDefaultGroup();

    const nextMyTicks = { ...myTicks };
    const nextSharedTicks = { ...sharedTicks };
    activeGroup.items.forEach((item) => {
      delete nextMyTicks[item.id];
      delete nextSharedTicks[item.id];
    });

    const nextBoundPages = Object.fromEntries(
      Object.entries(boundPages).filter(
        ([key]) => !key.startsWith(`${activeGroupId}:`),
      ),
    );
    const nextExtraPageCounts = { ...extraPageCounts };
    delete nextExtraPageCounts[activeGroupId];

    set({
      groups: nextGroups,
      myTicks: nextMyTicks,
      sharedTicks: nextSharedTicks,
      boundPages: nextBoundPages,
      extraPageCounts: nextExtraPageCounts,
    });

    return fallbackGroup.id;
  },
  hydrateData: (loaded) =>
    set({
      myId: loaded.localId,
      groups: loaded.persistedState.groups,
      myTicks: loaded.persistedState.ticks,
      boundPages: loaded.persistedState.boundPages,
      extraPageCounts: loaded.persistedState.extraPageCounts,
      nextGroupId: loaded.persistedState.nextGroupId,
      nextItemId: loaded.persistedState.nextItemId,
      sharedTicks: loaded.sharedTicks,
      isHydrated: true,
    }),
  pruneBoundPages: () =>
    set((state) => {
      let changed = false;
      const next = { ...state.boundPages };

      Object.keys(state.boundPages).forEach((pageKey) => {
        if (!state.boundPages[pageKey]) return;

        const [groupId, pageIndexRaw] = pageKey.split(":");
        const group = state.groups.find((entry) => entry.id === groupId);
        const pageIndex = Number.parseInt(pageIndexRaw, 10);

        if (!group || Number.isNaN(pageIndex)) {
          delete next[pageKey];
          changed = true;
          return;
        }

        const items = group.items.slice(
          pageIndex * PAGE_SIZE,
          (pageIndex + 1) * PAGE_SIZE,
        );
        const isComplete =
          items.length === PAGE_SIZE &&
          items.every((item) => !!state.myTicks[item.id]);

        if (!isComplete) {
          delete next[pageKey];
          changed = true;
        }
      });

      return changed ? { boundPages: next } : state;
    }),
  removeItem: ({ activeGroupId, itemId }) =>
    set((state) => {
      const currentExtra = state.extraPageCounts[activeGroupId] ?? 0;
      const nextExtraPageCounts = { ...state.extraPageCounts };
      if (currentExtra > 0) {
        const nextExtra = Math.max(0, currentExtra - 1);
        if (nextExtra > 0) nextExtraPageCounts[activeGroupId] = nextExtra;
        else delete nextExtraPageCounts[activeGroupId];
      }

      const nextMyTicks = { ...state.myTicks };
      delete nextMyTicks[itemId];
      const nextSharedTicks = { ...state.sharedTicks };
      delete nextSharedTicks[itemId];

      return {
        groups: state.groups.map((group) =>
          group.id === activeGroupId
            ? {
                ...group,
                items: group.items.filter((item) => item.id !== itemId),
              }
            : group,
        ),
        myTicks: nextMyTicks,
        sharedTicks: nextSharedTicks,
        extraPageCounts: nextExtraPageCounts,
      };
    }),
  resetData: (state) =>
    set({
      groups: state.groups,
      myTicks: {},
      boundPages: {},
      extraPageCounts: {},
      nextGroupId: state.nextGroupId,
      nextItemId: state.nextItemId,
      sharedTicks: {},
      isHydrated: true,
    }),
  setSharedTicks: (ticks) => set({ sharedTicks: ticks }),
  toggleTick: ({ activeGroupId, itemId }) => {
    const { groups, myTicks } = get();
    const isChecking = !myTicks[itemId];
    const nextTicks = { ...myTicks, [itemId]: isChecking };
    let pageKeyToBind: string | undefined;

    if (isChecking) {
      const activeGroup = groups.find((group) => group.id === activeGroupId);
      const itemIndex =
        activeGroup?.items.findIndex((item) => item.id === itemId) ?? -1;
      if (activeGroup && itemIndex !== -1) {
        const pageIndex = Math.floor(itemIndex / PAGE_SIZE);
        const pageStart = pageIndex * PAGE_SIZE;
        const pageItems = activeGroup.items.slice(
          pageStart,
          pageStart + PAGE_SIZE,
        );
        const isPageComplete =
          pageItems.length === PAGE_SIZE &&
          pageItems.every((item) => !!nextTicks[item.id]);

        if (isPageComplete) {
          pageKeyToBind = getPageKey(activeGroupId, pageIndex);
        }
      }
    }

    set({ myTicks: nextTicks });
    return { isChecking, pageKeyToBind };
  },
}));
