import type { Group, GroupPage, ListItem } from '@/lib/notebook-types';
import { createDefaultGroup, getGroupPages } from '@/lib/notebook-utils';

export interface ComparisonBuckets {
  bothDone: ListItem[];
  bothNotDone: ListItem[];
  iDoneHeNot: ListItem[];
  heDoneINot: ListItem[];
}

export const getActiveGroupOrFallback = (groups: Group[], activeGroupId: string) => {
  return groups.find((group) => group.id === activeGroupId) ?? groups[0] ?? createDefaultGroup();
};

export const getPageCollections = (
  activeGroup: Group,
  ticks: Record<string, boolean>,
  boundPages: Record<string, boolean>,
  extraPageCount = 0
) => {
  const activeGroupPages = getGroupPages(activeGroup, ticks, boundPages, extraPageCount);

  return {
    activeGroupPages,
    lowerStackPages: activeGroupPages.filter((page) => page.isBound),
    stackPages: activeGroupPages.filter((page) => !page.isBound),
  };
};

export const getComparisonBuckets = (
  items: ListItem[],
  myTicks: Record<string, boolean>,
  sharedTicks: Record<string, boolean>
): ComparisonBuckets => {
  const bothDone: ListItem[] = [];
  const bothNotDone: ListItem[] = [];
  const iDoneHeNot: ListItem[] = [];
  const heDoneINot: ListItem[] = [];

  items.forEach((item) => {
    const myTick = !!myTicks[item.id];
    const hisTick = !!sharedTicks[item.id];

    if (myTick && hisTick) bothDone.push(item);
    else if (!myTick && !hisTick) bothNotDone.push(item);
    else if (myTick && !hisTick) iDoneHeNot.push(item);
    else if (!myTick && hisTick) heDoneINot.push(item);
  });

  return { bothDone, bothNotDone, iDoneHeNot, heDoneINot };
};
