import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, MotionConfig, LayoutGroup } from 'motion/react';
import { Users } from 'lucide-react';
import LZString from 'lz-string';
import { QRCodeCanvas } from 'qrcode.react';
import { AppHeader } from './components/AppHeader';
import { ComparisonPanel } from './components/ComparisonPanel';
import { NotebookGallery } from './components/NotebookGallery';
import { GroupWorkspace } from './components/GroupWorkspace';
import { Notebook } from './components/Notebook';
import { ModalDialog } from './components/ModalDialog';
import { MOTION_FADE, MOTION_LAYOUT_SPRING, MOTION_MODAL } from './lib/motion';
import type { AppMode, Group, GroupPage, ItemOrigin, ItemOriginType, ListItem } from './lib/notebook-types';
import { PAGE_ITEM_CAPACITY } from './lib/workspace-constants';

const DEFAULT_ITEMS = [
  "送礼物", "被送礼物", "暗恋", "明恋", "失恋", "表白", "被表白",
  "留长发", "剪短发", "染发", "漂发", "烫发", "化妆", "做美甲",
  "放下一个人", "有过遗憾", "爱而不得", "双向奔赴", "当海王",
  "拒绝他人表白", "表白被拒", "被渣", "犯过傻", "装糊涂", "犯校规", "打架",
  "迟到", "旷课", "上课睡觉", "被叫家长", "喝酒", "抽烟", "纹身", "去清吧", "和朋友去KTV", "断片失眠一天",
  "吵架", "绝交", "晚上一个人哭", "捐血", "住院", "做手术", "晕倒", "会做饭", "做一桌菜",
  "做饭给家人", "做甜品给喜欢的人", "有超过10年的好朋友", "有个无条件可信任的朋友",
  "买花", "被送花", "给自己买礼物", "通宵补作业", "一个人散步", "夜跑", "深夜散心",
  "向陌生人吐露心声", "一个人出去吃饭", "一个人看电影", "摄影", "一个人去酒吧",
  "一个人过生日", "一个人逛超市", "一个人去图书馆", "一个人看病", "一个人去唱歌", "社死过",
  "一个人出门远行", "一个人在外难过", "给自己写信", "出国一个人旅游", "跟朋友旅游",
  "拥有要好的异性朋友", "谈恋爱", "考试不及格", "考试第一名", "当班干部", "竞选学生会",
  "上电视", "上报纸", "登台演出", "主持节目", "演讲", "野性消费", "买东西被宰",
  "被老师点名表扬", "被老师点名批评", "全校表扬", "被背叛", "被害", "被坚定选择", "获奖",
  "学一种语言", "写论文", "写书", "写诗", "写日记", "写剧本", "写歌", "拍影片"
];

const DEFAULT_GROUP_ID = '0';
const DEFAULT_GROUP_TITLE = '人生清单100项';
const PAGE_SIZE = PAGE_ITEM_CAPACITY;
const LOCAL_STATE_STORAGE_KEY = 'rams-life-state';
const ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BIT_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';
const TOP_SEP = '\u0001';
const GROUP_SEP = '\u0002';
const GROUP_FIELD_SEP = '\u0003';
const ITEM_SEP = '\u0004';
const ITEM_FIELD_SEP = '\u0005';
const ESCAPE_CHAR = '\\';

interface PersistedAppState {
  v: number;
  groups: Group[];
  ticks: Record<string, boolean>;
  boundPages: Record<string, boolean>;
  extraPageCounts: Record<string, number>;
  activeGroupId: string;
  nextGroupId: number;
  nextItemId: number;
}

type CompactLocalItem = number | [string, string] | [string, string, string];

interface CompactLocalGroup {
  id: string;
  n: string;
  i: CompactLocalItem[];
  t: string;
}

interface CompactLocalState {
  v: number;
  a: string;
  c: [string, string];
  b: string[];
  p?: [string, string][];
  g: CompactLocalGroup[];
}

interface SharedGroupData {
  v: number;
  o: string;
  g: string;
  n: string;
  i: (number | [number, number] | [string, string])[];
  t: string;
}

interface ImportedGroupPayload {
  group: Group;
  sharedTicks: Record<string, boolean>;
}

interface ConfettiHandle {
  spawn: (x: number, y: number) => void;
}

const createDefaultItem = (text: string, index: number): ListItem => ({
  id: `_${index.toString(36)}`,
  text,
  origin: { type: 'default' },
});

const DEFAULT_ITEM_RECORDS = DEFAULT_ITEMS.map((text, index) => createDefaultItem(text, index));
const DEFAULT_ITEM_INDEX_BY_TEXT = Object.fromEntries(DEFAULT_ITEMS.map((item, idx) => [item, idx]));
const DEFAULT_ITEM_INDEX_BY_ID = Object.fromEntries(DEFAULT_ITEM_RECORDS.map((item, idx) => [item.id, idx]));

const randomId = (length = 4) => {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(bytes, (byte) => ID_ALPHABET[byte % ID_ALPHABET.length]).join('');
  }
  return Math.random().toString(36).slice(2, 2 + length);
};

const createOwnedId = (ownerId: string, index: number) => `${ownerId}.${index.toString(36)}`;

const getOwnerIdFromScopedId = (id: string) => {
  const separatorIndex = id.indexOf('.');
  return separatorIndex === -1 ? null : id.slice(0, separatorIndex);
};

const packBits = (bits: boolean[]) => {
  let packed = '';
  for (let index = 0; index < bits.length; index += 6) {
    let value = 0;
    for (let offset = 0; offset < 6; offset += 1) {
      if (bits[index + offset]) value |= 1 << offset;
    }
    packed += BIT_ALPHABET[value];
  }
  return packed;
};

const unpackBits = (packed: string, count: number) => {
  const bits = new Array<boolean>(count).fill(false);
  for (let charIndex = 0; charIndex < packed.length; charIndex += 1) {
    const value = BIT_ALPHABET.indexOf(packed[charIndex]);
    if (value < 0) continue;
    for (let offset = 0; offset < 6; offset += 1) {
      const bitIndex = charIndex * 6 + offset;
      if (bitIndex >= count) return bits;
      bits[bitIndex] = ((value >> offset) & 1) === 1;
    }
  }
  return bits;
};

const escapeCompact = (value: string) =>
  value.replace(/[\\\u0001\u0002\u0003\u0004\u0005]/g, (char) => `${ESCAPE_CHAR}${char}`);

const splitEscaped = (value: string, separator: string) => {
  const parts: string[] = [];
  let current = '';
  let escaping = false;

  for (const char of value) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }

    if (char === ESCAPE_CHAR) {
      escaping = true;
      continue;
    }

    if (char === separator) {
      parts.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  parts.push(current);
  return parts;
};

const createDefaultGroup = (): Group => ({
  id: DEFAULT_GROUP_ID,
  title: DEFAULT_GROUP_TITLE,
  items: DEFAULT_ITEM_RECORDS.map((item) => ({ ...item, origin: { ...item.origin } })),
});

const createDefaultState = (): PersistedAppState => ({
  v: 6,
  groups: [createDefaultGroup()],
  ticks: {},
  boundPages: {},
  extraPageCounts: {},
  activeGroupId: DEFAULT_GROUP_ID,
  nextGroupId: 1,
  nextItemId: 0,
});

const cloneItem = (item: ListItem): ListItem => ({
  ...item,
  origin: { ...item.origin },
});

const cloneGroup = (group: Group): Group => ({
  ...group,
  items: group.items.map(cloneItem),
});

const normalizeOrigin = (origin?: ItemOrigin | string, item?: { id?: string; text: string }): ItemOrigin => {
  if (origin && typeof origin === 'object' && 'type' in origin) {
    return origin;
  }

  if (typeof origin === 'string') {
    if (origin === 'local') {
      const isDefault = item?.id ? DEFAULT_ITEM_INDEX_BY_ID[item.id] !== undefined : DEFAULT_ITEM_INDEX_BY_TEXT[item?.text ?? ''] !== undefined;
      return { type: isDefault ? 'default' : 'self' };
    }
    return { type: 'external', ownerId: origin };
  }

  if (item?.id && DEFAULT_ITEM_INDEX_BY_ID[item.id] !== undefined) return { type: 'default' };
  if (item?.text && DEFAULT_ITEM_INDEX_BY_TEXT[item.text] !== undefined) return { type: 'default' };
  return { type: 'self' };
};

const normalizeItems = (items: Array<ListItem | { id?: string; text: string; origin?: ItemOrigin | string }>) => {
  return items.map((item, index) => {
    const fallbackId = DEFAULT_ITEM_INDEX_BY_TEXT[item.text] !== undefined
      ? `_${DEFAULT_ITEM_INDEX_BY_TEXT[item.text].toString(36)}`
      : randomId(6);
    const id = item.id ?? fallbackId;
    return {
      id,
      text: item.text,
      origin: normalizeOrigin(item.origin, { id, text: item.text }),
    };
  });
};

const normalizeState = (state?: Partial<PersistedAppState>): PersistedAppState => {
  const fallback = createDefaultState();
  const groups = Array.isArray(state?.groups) && state?.groups.length > 0
    ? state!.groups.map((group, index) => {
        const groupId = group.id || randomId(6);
        return {
          id: groupId,
          title: groupId === DEFAULT_GROUP_ID ? DEFAULT_GROUP_TITLE : (group.title || `第 ${index + 1} 页`),
          items: normalizeItems(group.items ?? []),
        };
      })
    : fallback.groups;
  const activeGroupId = groups.some((group) => group.id === state?.activeGroupId)
    ? state!.activeGroupId!
    : groups[0].id;

  return {
    v: 6,
    groups,
    ticks: state?.ticks ?? {},
    boundPages: state?.boundPages ?? {},
    extraPageCounts: state?.extraPageCounts ?? {},
    activeGroupId,
    nextGroupId: state?.nextGroupId ?? 1,
    nextItemId: state?.nextItemId ?? 0,
  };
};

const encodeBase64 = (value: Uint8Array) => {
  let binary = '';
  value.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const decodeBase64 = (value: string) => {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const getEncryptionKey = async (userId: string) => {
  const keyMaterial = new TextEncoder().encode(`rams-life-state:${userId}:v3`);
  const digest = await crypto.subtle.digest('SHA-256', keyMaterial);
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
};

const getPageKey = (groupId: string, pageIndex: number) => `${groupId}:${pageIndex}`;

const getGroupPages = (
  group: Group,
  ticks: Record<string, boolean>,
  boundPages: Record<string, boolean>,
  extraPageCount = 0
): GroupPage[] => {
  const naturalPageCount = Math.max(1, Math.ceil(group.items.length / PAGE_SIZE));
  const pageCount = Math.max(1, naturalPageCount + extraPageCount);

  return Array.from({ length: pageCount }, (_, pageIndex) => {
    const items = group.items.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE);
    const key = getPageKey(group.id, pageIndex);
    const isComplete = items.length > 0 && items.every((item) => !!ticks[item.id]);

    return {
      key,
      groupId: group.id,
      groupTitle: group.title,
      pageIndex,
      items,
      isComplete,
      isBound: isComplete && !!boundPages[key],
    };
  });
};

const compressLocalGroup = (group: Group, ticks: Record<string, boolean>): CompactLocalGroup => {
  const items: CompactLocalItem[] = [];
  group.items.forEach((item) => {
    const defaultIndex = DEFAULT_ITEM_INDEX_BY_ID[item.id];
    if (item.origin.type === 'default' && defaultIndex !== undefined) {
      items.push(defaultIndex);
      return;
    }

    if (item.origin.type === 'external') {
      items.push([item.id, item.text, item.origin.ownerId || 'unknown']);
      return;
    }

    items.push([item.id, item.text]);
  });

  return {
    id: group.id,
    n: group.title,
    i: items,
    t: packBits(group.items.map((item) => !!ticks[item.id])),
  };
};

const decompressLocalGroup = (group: CompactLocalGroup) => {
  const items: ListItem[] = group.i.map((entry) => {
    if (typeof entry === 'number') {
      return createDefaultItem(DEFAULT_ITEMS[entry], entry);
    }

    if (entry.length === 3) {
      return {
        id: entry[0],
        text: entry[1],
        origin: { type: 'external', ownerId: entry[2] },
      };
    }

    return {
      id: entry[0],
      text: entry[1],
      origin: { type: 'self' },
    };
  });

  const ticks: Record<string, boolean> = {};
  const bitset = unpackBits(group.t, items.length);
  items.forEach((item, index) => {
    ticks[item.id] = bitset[index];
  });

  return {
    group: {
      id: group.id,
      title: group.id === DEFAULT_GROUP_ID ? DEFAULT_GROUP_TITLE : group.n,
      items,
    },
    ticks,
  };
};

const toCompactLocalState = (state: PersistedAppState): CompactLocalState => ({
  v: 6,
  a: state.activeGroupId,
  c: [state.nextGroupId.toString(36), state.nextItemId.toString(36)],
  b: Object.keys(state.boundPages).filter((key) => state.boundPages[key]),
  p: Object.entries(state.extraPageCounts)
    .filter(([, count]) => count > 0)
    .map(([groupId, count]) => [groupId, count.toString(36)]),
  g: state.groups.map((group) => compressLocalGroup(group, state.ticks)),
});

const serializeCompactLocalItem = (item: CompactLocalItem) => {
  if (typeof item === 'number') return `d${item.toString(36)}`;
  if (item.length === 3) return `e${item[0]}${ITEM_FIELD_SEP}${escapeCompact(item[1])}${ITEM_FIELD_SEP}${item[2]}`;
  return `s${item[0]}${ITEM_FIELD_SEP}${escapeCompact(item[1])}`;
};

const parseCompactLocalItem = (raw: string): CompactLocalItem => {
  const type = raw[0];
  const body = raw.slice(1);
  if (type === 'd') return parseInt(body, 36);
  const parts = splitEscaped(body, ITEM_FIELD_SEP);
  if (type === 'e') return [parts[0], parts[1] ?? '', parts[2] ?? 'unknown'];
  return [parts[0], parts[1] ?? ''];
};

const serializeCompactLocalState = (state: CompactLocalState) => {
  const groups = state.g.map((group) => {
    const items = group.i.map(serializeCompactLocalItem).join(ITEM_SEP);
    return [
      group.id,
      escapeCompact(group.n),
      group.t,
      items,
    ].join(GROUP_FIELD_SEP);
  }).join(GROUP_SEP);

  const extraPages = (state.p ?? [])
    .map(([groupId, count]) => `${groupId}${GROUP_FIELD_SEP}${count}`)
    .join(GROUP_SEP);

  return ['L6', state.a, state.c[0], state.c[1], state.b.map(escapeCompact).join(GROUP_SEP), extraPages, groups].join(TOP_SEP);
};

const parseCompactLocalState = (raw: string): CompactLocalState | null => {
  const parts = splitEscaped(raw, TOP_SEP);
  const [version, activeGroupId, nextGroupId, nextItemId] = parts;
  if (version !== 'L4' && version !== 'L5' && version !== 'L6') return null;

  const boundRaw = version === 'L5' || version === 'L6' ? (parts[4] ?? '') : '';
  const extraPagesRaw = version === 'L6' ? (parts[5] ?? '') : '';
  const groupsRaw = version === 'L6'
    ? (parts[6] ?? '')
    : version === 'L5'
      ? (parts[5] ?? '')
      : (parts[4] ?? '');

  const groups = groupsRaw
    ? splitEscaped(groupsRaw, GROUP_SEP).filter(Boolean).map((groupRaw) => {
        const [id, title, ticks, itemsRaw = ''] = splitEscaped(groupRaw, GROUP_FIELD_SEP);
        return {
          id,
          n: title ?? '',
          t: ticks ?? '',
          i: itemsRaw ? splitEscaped(itemsRaw, ITEM_SEP).filter(Boolean).map(parseCompactLocalItem) : [],
        };
      })
    : [];

  return {
    v: version === 'L6' ? 6 : version === 'L5' ? 5 : 4,
    a: activeGroupId,
    c: [nextGroupId ?? '1', nextItemId ?? '0'],
    b: boundRaw ? splitEscaped(boundRaw, GROUP_SEP).filter(Boolean) : [],
    p: extraPagesRaw
      ? splitEscaped(extraPagesRaw, GROUP_SEP)
          .filter(Boolean)
          .map((entry) => {
            const [groupId, count] = splitEscaped(entry, GROUP_FIELD_SEP);
            return [groupId, count ?? '0'] as [string, string];
          })
      : [],
    g: groups,
  };
};

const fromCompactLocalState = (state: CompactLocalState): PersistedAppState => {
  const groups = state.g.map((group) => decompressLocalGroup(group).group);
  const ticks = state.g.reduce<Record<string, boolean>>((acc, group) => {
    Object.assign(acc, decompressLocalGroup(group).ticks);
    return acc;
  }, {});

  return normalizeState({
    v: 6,
    groups,
    ticks,
    boundPages: Object.fromEntries(state.b.map((key) => [key, true])),
    extraPageCounts: Object.fromEntries(
      (state.p ?? []).map(([groupId, count]) => [groupId, parseInt(count, 36) || 0])
    ),
    activeGroupId: state.a,
    nextGroupId: parseInt(state.c?.[0] ?? '1', 36),
    nextItemId: parseInt(state.c?.[1] ?? '0', 36),
  });
};

const serializeEncryptedPayload = (iv: Uint8Array, data: Uint8Array) =>
  ['E6', encodeBase64(iv), encodeBase64(data)].join(TOP_SEP);

const parseEncryptedPayload = (raw: string) => {
  const [version, iv, data] = splitEscaped(raw, TOP_SEP);
  if ((version !== 'E4' && version !== 'E5' && version !== 'E6') || !iv || !data) return null;
  return { iv, data };
};

const encryptState = async (state: PersistedAppState, userId: string) => {
  const key = await getEncryptionKey(userId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const compactState = toCompactLocalState(state);
  const encoded = new TextEncoder().encode(serializeCompactLocalState(compactState));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  return LZString.compressToEncodedURIComponent(serializeEncryptedPayload(iv, new Uint8Array(encrypted)));
};

const decryptState = async (value: string, userId: string): Promise<PersistedAppState | null> => {
  try {
    const decoded = LZString.decompressFromEncodedURIComponent(value) ?? value;
    const payload = parseEncryptedPayload(decoded);
    if (!payload) return null;

    const key = await getEncryptionKey(userId);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: decodeBase64(payload.iv) },
      key,
      decodeBase64(payload.data)
    );
    const compactState = parseCompactLocalState(new TextDecoder().decode(decrypted));
    return compactState ? fromCompactLocalState(compactState) : null;
  } catch (error) {
    console.error('Failed to decrypt local state', error);
    return null;
  }
};

const compressGroup = (group: Group, ticks: Record<string, boolean>, ownerId: string): SharedGroupData => {
  const compressedItems: SharedGroupData['i'] = [];
  let rangeStart = -1;
  let lastIndex = -1;

  const flushRange = () => {
    if (rangeStart === -1) return;
    compressedItems.push(rangeStart === lastIndex ? rangeStart : [rangeStart, lastIndex]);
    rangeStart = -1;
  };

  group.items.forEach((item) => {
    const defaultIndex = DEFAULT_ITEM_INDEX_BY_ID[item.id];
    if (item.origin.type === 'default' && defaultIndex !== undefined) {
      if (rangeStart === -1) {
        rangeStart = defaultIndex;
        lastIndex = defaultIndex;
      } else if (defaultIndex === lastIndex + 1) {
        lastIndex = defaultIndex;
      } else {
        flushRange();
        rangeStart = defaultIndex;
        lastIndex = defaultIndex;
      }
      return;
    }

    flushRange();
    compressedItems.push([item.id, item.text]);
  });

  flushRange();

  return {
    v: 5,
    o: ownerId,
    g: group.id,
    n: group.title,
    i: compressedItems,
    t: packBits(group.items.map((item) => !!ticks[item.id])),
  };
};

const serializeSharedItem = (item: SharedGroupData['i'][number]) => {
  if (typeof item === 'number') return `d${item.toString(36)}`;
  if (typeof item[0] === 'number' && typeof item[1] === 'number') {
    return `r${item[0].toString(36)}${ITEM_FIELD_SEP}${item[1].toString(36)}`;
  }
  const customItem = item as [string, string];
  return `c${customItem[0]}${ITEM_FIELD_SEP}${escapeCompact(customItem[1])}`;
};

const parseSharedItem = (raw: string): SharedGroupData['i'][number] => {
  const type = raw[0];
  const body = raw.slice(1);
  if (type === 'd') return parseInt(body, 36);
  const parts = splitEscaped(body, ITEM_FIELD_SEP);
  if (type === 'r') return [parseInt(parts[0], 36), parseInt(parts[1], 36)];
  return [parts[0], parts[1] ?? ''];
};

const serializeSharedGroupData = (data: SharedGroupData) => {
  const items = data.i.map(serializeSharedItem).join(ITEM_SEP);
  return ['S5', data.o, data.g, escapeCompact(data.n), data.t, items].join(TOP_SEP);
};

const parseSharedGroupData = (raw: string): SharedGroupData | null => {
  const [version, ownerId, groupId, name, ticks, itemsRaw = ''] = splitEscaped(raw, TOP_SEP);
  if (version !== 'S5') return null;
  return {
    v: 5,
    o: ownerId,
    g: groupId,
    n: name ?? '',
    t: ticks ?? '',
    i: itemsRaw ? splitEscaped(itemsRaw, ITEM_SEP).filter(Boolean).map(parseSharedItem) : [],
  };
};

const decompressSharedGroup = (data: SharedGroupData): ImportedGroupPayload => {
  const items: ListItem[] = [];
  data.i.forEach((entry) => {
    if (typeof entry === 'number') {
      items.push(createDefaultItem(DEFAULT_ITEMS[entry], entry));
      return;
    }

    if (Array.isArray(entry) && typeof entry[0] === 'number' && typeof entry[1] === 'number') {
      for (let index = entry[0]; index <= entry[1]; index += 1) {
        items.push(createDefaultItem(DEFAULT_ITEMS[index], index));
      }
      return;
    }

    const customEntry = entry as [string, string];
    items.push({
      id: customEntry[0],
      text: customEntry[1],
      origin: { type: 'external', ownerId: getOwnerIdFromScopedId(customEntry[0]) || data.o || 'unknown' },
    });
  });

  const sharedTicks: Record<string, boolean> = {};
  const bitset = unpackBits(data.t, items.length);
  items.forEach((item, index) => {
    sharedTicks[item.id] = bitset[index];
  });

  return {
    group: {
      id: data.g || createOwnedId(data.o || 'ext', 0),
      title: data.n || '导入页',
      items,
    },
    sharedTicks,
  };
};

const parseSharedPayload = (key: string): ImportedGroupPayload | null => {
  try {
    const decoded = LZString.decompressFromEncodedURIComponent(key);
    if (!decoded) return null;
    const parsed = parseSharedGroupData(decoded);

    if (!parsed || parsed.v !== 5) return null;
    return decompressSharedGroup(parsed);
  } catch (error) {
    console.error('Failed to decode shared key', error);
    return null;
  }
};

const mergeImportedGroup = (groups: Group[], importedGroup: Group) => {
  const existingIndex = groups.findIndex((group) => group.id === importedGroup.id);
  if (existingIndex === -1) {
    return [...groups, cloneGroup(importedGroup)];
  }

  const existing = groups[existingIndex];
  const seen = new Set(existing.items.map((item) => item.id));
  const mergedItems = [...existing.items];

  importedGroup.items.forEach((item) => {
    if (!seen.has(item.id)) {
      mergedItems.push(cloneItem(item));
      seen.add(item.id);
    }
  });

  const nextGroups = [...groups];
  nextGroups[existingIndex] = {
    ...existing,
    title: importedGroup.title || existing.title,
    items: mergedItems,
  };
  return nextGroups;
};

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
        const isComplete = items.length > 0 && items.every((item) => !!myTicks[item.id]);

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

    if (isChecking && e && confettiRef.current && paperRef.current) {
      let x;
      let y;
      if ('clientX' in e && e.clientX !== undefined) {
        x = e.clientX;
        y = e.clientY;
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
    setIsGalleryClosed(false);
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

      const nextNaturalPageCount = Math.max(1, Math.ceil((activeGroup.items.length - 1) / PAGE_SIZE));
      const maxUsefulExtra = Math.max(0, activeGroupPages.length - nextNaturalPageCount);
      const nextExtra = Math.min(currentExtra, maxUsefulExtra);
      if (nextExtra === currentExtra) return prev;

      const next = { ...prev };
      if (nextExtra > 0) next[activeGroupId] = nextExtra;
      else delete next[activeGroupId];
      return next;
    });
  };

  const generateShareUrl = () => {
    const payload = compressGroup(activeGroup, myTicks, myId);
    const encoded = LZString.compressToEncodedURIComponent(serializeSharedGroupData(payload));
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

  const clearAllData = () => {
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
  };

  const deleteActiveGroup = () => {
    if (activeGroup.id === DEFAULT_GROUP_ID) return;

    const groupIndex = groups.findIndex((group) => group.id === activeGroup.id);
    const nextGroups = groups.filter((group) => group.id !== activeGroup.id);
    const fallbackGroup = nextGroups[Math.max(0, groupIndex - 1)] ?? nextGroups[0] ?? createDefaultGroup();

    setGroups(nextGroups);
    setActiveGroupId(fallbackGroup.id);
    setViewMode('grid'); // Reset to grid after delete
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
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen p-4 md:p-10 flex flex-col items-center">
      <motion.div initial={false} animate={{ opacity: 1 }} transition={MOTION_FADE} className="w-full max-w-[1240px]">
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

        <AnimatePresence initial={false}>
          <motion.div
            key="detail"
            initial={false}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             transition={MOTION_FADE}
          >
            <LayoutGroup>
              <motion.div layout className="flex flex-col">
                <AnimatePresence initial={false} mode="sync">
                  {mode === 'compare-result' && comparison ? (
                    <motion.div
                      key={`comparison-${activeGroup.id}`}
                      layout
                      transition={MOTION_LAYOUT_SPRING}
                    >
                      <ComparisonPanel comparison={comparison} group={activeGroup} />
                    </motion.div>
                  ) : isGalleryClosed ? (
                    <motion.div
                      key="gallery"
                      layout
                      transition={MOTION_LAYOUT_SPRING}
                    >
                      <NotebookGallery
                        activeGroupId={activeGroup.id}
                        groups={groups}
                        ticks={myTicks}
                        onCreateGroup={createGroup}
                        onOpenGroup={selectGroup}
                      />
                    </motion.div>
                  ) : !isGalleryClosed ? (
                    <motion.div
                      key={`workspace-${activeGroup.id}`}
                      layout
                      transition={MOTION_LAYOUT_SPRING}
                    >
                      <GroupWorkspace
                        activeGroup={activeGroup}
                        activeGroupPages={stackPages}
                        boundPageCount={lowerStackPages.length}
                        editingGroupId={editingGroupId}
                        groupTitleDraft={groupTitleDraft}
                        mode={mode}
                        newItemText={newItemText}
                        pageSize={PAGE_SIZE}
                        paperRef={paperRef}
                        ticks={myTicks}
                        onAddItem={addItem}
                        onAppendPage={appendEmptyPage}
                        onBindPage={movePageToLowerStack}
                        onDeleteGroup={() => setShowDeleteGroupConfirm(true)}
                        onDraftChange={setGroupTitleDraft}
                        onItemTextChange={setNewItemText}
                        onRemoveItem={removeItem}
                        onRenameCancel={cancelRenameGroup}
                        onRenameSave={saveGroupTitle}
                        onRenameStart={startRenameGroup}
                        onToggleTick={toggleTick}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isGalleryClosed && (
                  <motion.div layout transition={MOTION_LAYOUT_SPRING}>
                    <Notebook
                      key={activeGroup.id}
                      pages={lowerStackPages}
                      ticks={myTicks}
                      onRemoveItem={removeItem}
                      onToggleTick={toggleTick}
                    />
                  </motion.div>
                )}
              </motion.div>
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
                    onClick={clearAllData}
                    className="flex-1 py-3 bg-neutral-900 hover:bg-black text-white rounded-xl font-medium transition-colors"
                  >
                    确认重置
                  </button>
                </div>
            </ModalDialog>
          )}

          {showDeleteGroupConfirm && activeGroup.id !== DEFAULT_GROUP_ID && (
            <ModalDialog
              title="删除这一组吗？"
              body={`这会删除「${activeGroup.title}」这一组、它下面的所有分页，以及相关勾选和装订记录。默认组不能删除。`}
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
                    className="flex-1 py-3 bg-neutral-900 hover:bg-black text-white rounded-xl font-medium transition-colors"
                  >
                    确认删除
                  </button>
                </div>
            </ModalDialog>
          )}

          {showQrCode && (
            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={MOTION_FADE}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-neutral-900/40 backdrop-blur-sm"
              onClick={() => setShowQrCode(false)}
            >
              <motion.div
                initial={{ scale: 0.97, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.97, opacity: 0 }}
                transition={MOTION_MODAL}
                className="bg-white p-8 rounded-3xl shadow-2xl max-w-xs w-full flex flex-col items-center gap-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center space-y-2">
                  <h3 className="text-klein font-bold text-lg">分享当前这一组</h3>
                  <p className="text-neutral-400 text-sm">对方扫码后，会导入「{activeGroup.title}」这一组</p>
                </div>

                <div className="p-4 bg-white border-4 border-neutral-50 rounded-2xl shadow-inner">
                  <QRCodeCanvas value={generateShareUrl()} size={200} level="H" includeMargin={false} />
                </div>

                <div className="ui-mono text-center opacity-45 break-all">
                  {activeGroup.id}
                </div>

                <button
                  onClick={() => setShowQrCode(false)}
                  className="w-full py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl font-medium transition-colors"
                >
                  关闭
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
    </MotionConfig>
  );
}
