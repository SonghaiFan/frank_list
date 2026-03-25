export type ItemOriginType = 'default' | 'self' | 'external';
export type AppMode = 'edit' | 'compare-step-1' | 'compare-result';

export interface ItemOrigin {
  type: ItemOriginType;
  ownerId?: string;
}

export interface ListItem {
  id: string;
  text: string;
  origin: ItemOrigin;
}

export interface Group {
  id: string;
  title: string;
  items: ListItem[];
}

export interface GroupPage {
  key: string;
  type?: 'content' | 'cover' | 'end';
  groupId: string;
  groupTitle: string;
  pageIndex: number;
  items: ListItem[];
  isComplete: boolean;
  isBound: boolean;
}

export interface PersistedAppState {
  v: number;
  groups: Group[];
  ticks: Record<string, boolean>;
  boundPages: Record<string, boolean>;
  extraPageCounts: Record<string, number>;
  activeGroupId: string;
  nextGroupId: number;
  nextItemId: number;
}

export type CompactLocalItem = number | [string, string] | [string, string, string];

export interface CompactLocalGroup {
  id: string;
  n: string;
  i: CompactLocalItem[];
  t: string;
}

export interface CompactLocalState {
  v: number;
  a: string;
  c: [string, string];
  b: string[];
  p?: [string, string][];
  g: CompactLocalGroup[];
}

export interface SharedGroupData {
  v: number;
  o: string;
  g: string;
  n: string;
  i: (number | [number, number] | [string, string])[];
  t: string;
}

export interface ImportedGroupPayload {
  group: Group;
  sharedTicks: Record<string, boolean>;
}

export interface ConfettiHandle {
  spawn: (x: number, y: number) => void;
}
