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
