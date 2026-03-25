import LZString from 'lz-string';
import {
  BIT_ALPHABET,
  DEFAULT_GROUP_ID,
  DEFAULT_GROUP_TITLE,
  DEFAULT_ITEMS,
  ESCAPE_CHAR,
  GROUP_FIELD_SEP,
  GROUP_SEP,
  ID_ALPHABET,
  ITEM_FIELD_SEP,
  ITEM_SEP,
  LOCAL_STATE_STORAGE_KEY,
  PAGE_SIZE,
  TOP_SEP,
} from './workspace-constants';
import type {
  CompactLocalGroup,
  CompactLocalItem,
  CompactLocalState,
  Group,
  GroupPage,
  ImportedGroupPayload,
  ItemOrigin,
  ListItem,
  PersistedAppState,
  SharedGroupData,
} from './notebook-types';

export const createDefaultItem = (text: string, index: number): ListItem => ({
  id: `_${index.toString(36)}`,
  text,
  origin: { type: 'default' },
});

export const DEFAULT_ITEM_RECORDS = DEFAULT_ITEMS.map((text, index) => createDefaultItem(text, index));
export const DEFAULT_ITEM_INDEX_BY_TEXT = Object.fromEntries(DEFAULT_ITEMS.map((item, idx) => [item, idx]));
export const DEFAULT_ITEM_INDEX_BY_ID = Object.fromEntries(DEFAULT_ITEM_RECORDS.map((item, idx) => [item.id, idx]));

export const randomId = (length = 4) => {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(bytes, (byte) => ID_ALPHABET[byte % ID_ALPHABET.length]).join('');
  }
  return Math.random().toString(36).slice(2, 2 + length);
};

export const createOwnedId = (ownerId: string, index: number) => `${ownerId}.${index.toString(36)}`;

export const getOwnerIdFromScopedId = (id: string) => {
  const separatorIndex = id.indexOf('.');
  return separatorIndex === -1 ? null : id.slice(0, separatorIndex);
};

export const packBits = (bits: boolean[]) => {
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

export const unpackBits = (packed: string, count: number) => {
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

export const escapeCompact = (value: string) =>
  value.replace(/[\\\u0001\u0002\u0003\u0004\u0005]/g, (char) => `${ESCAPE_CHAR}${char}`);

export const splitEscaped = (value: string, separator: string) => {
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

export const createDefaultGroup = (): Group => ({
  id: DEFAULT_GROUP_ID,
  title: DEFAULT_GROUP_TITLE,
  items: DEFAULT_ITEM_RECORDS.map((item) => ({ ...item, origin: { ...item.origin } })),
});

export const createDefaultState = (): PersistedAppState => ({
  v: 6,
  groups: [createDefaultGroup()],
  ticks: {},
  boundPages: {},
  extraPageCounts: {},
  activeGroupId: DEFAULT_GROUP_ID,
  nextGroupId: 1,
  nextItemId: 0,
});

export const cloneItem = (item: ListItem): ListItem => ({
  ...item,
  origin: { ...item.origin },
});

export const cloneGroup = (group: Group): Group => ({
  ...group,
  items: group.items.map(cloneItem),
});

export const normalizeOrigin = (origin?: ItemOrigin | string, item?: { id?: string; text: string }): ItemOrigin => {
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

export const normalizeItems = (items: Array<ListItem | { id?: string; text: string; origin?: ItemOrigin | string }>) => {
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

export const normalizeState = (state?: Partial<PersistedAppState>): PersistedAppState => {
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

export const encodeBase64 = (value: Uint8Array) => {
  let binary = '';
  value.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

export const decodeBase64 = (value: string) => {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

export const getEncryptionKey = async (userId: string) => {
  const keyMaterial = new TextEncoder().encode(`rams-life-state:${userId}:v3`);
  const digest = await crypto.subtle.digest('SHA-256', keyMaterial);
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
};

export const getPageKey = (groupId: string, pageIndex: number) => `${groupId}:${pageIndex}`;

export const getGroupPages = (
  group: Group,
  ticks: Record<string, boolean>,
  boundPages: Record<string, boolean>,
  extraPageCount = 0
): GroupPage[] => {
  const naturalPageCount = Math.max(1, Math.ceil(group.items.length / PAGE_SIZE));
  const pageCount = Math.max(1, naturalPageCount + extraPageCount);

  const pages = Array.from({ length: pageCount }, (_, pageIndex) => {
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

  // If the last page is bound, we automatically add a new empty page
  // so the user always has a place to work.
  const lastPage = pages[pages.length - 1];
  if (lastPage.isBound) {
    const newPageIndex = pages.length;
    const newKey = getPageKey(group.id, newPageIndex);
    pages.push({
      key: newKey,
      groupId: group.id,
      groupTitle: group.title,
      pageIndex: newPageIndex,
      items: [],
      isComplete: false,
      isBound: false,
    });
  }

  return pages;
};

export const compressLocalGroup = (group: Group, ticks: Record<string, boolean>): CompactLocalGroup => {
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

export const decompressLocalGroup = (group: CompactLocalGroup) => {
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

export const toCompactLocalState = (state: PersistedAppState): CompactLocalState => ({
  v: 6,
  a: state.activeGroupId,
  c: [state.nextGroupId.toString(36), state.nextItemId.toString(36)],
  b: Object.keys(state.boundPages).filter((key) => state.boundPages[key]),
  p: Object.entries(state.extraPageCounts)
    .filter(([, count]) => count > 0)
    .map(([groupId, count]) => [groupId, count.toString(36)]),
  g: state.groups.map((group) => compressLocalGroup(group, state.ticks)),
});

export const serializeCompactLocalItem = (item: CompactLocalItem) => {
  if (typeof item === 'number') return `d${item.toString(36)}`;
  if (item.length === 3) return `e${item[0]}${ITEM_FIELD_SEP}${escapeCompact(item[1])}${ITEM_FIELD_SEP}${item[2]}`;
  return `s${item[0]}${ITEM_FIELD_SEP}${escapeCompact(item[1])}`;
};

export const parseCompactLocalItem = (raw: string): CompactLocalItem => {
  const type = raw[0];
  const body = raw.slice(1);
  if (type === 'd') return parseInt(body, 36);
  const parts = splitEscaped(body, ITEM_FIELD_SEP);
  if (type === 'e') return [parts[0], parts[1] ?? '', parts[2] ?? 'unknown'];
  return [parts[0], parts[1] ?? ''];
};

export const serializeCompactLocalState = (state: CompactLocalState) => {
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

export const parseCompactLocalState = (raw: string): CompactLocalState | null => {
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

export const fromCompactLocalState = (state: CompactLocalState): PersistedAppState => {
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

export const serializeEncryptedPayload = (iv: Uint8Array, data: Uint8Array) =>
  ['E6', encodeBase64(iv), encodeBase64(data)].join(TOP_SEP);

export const parseEncryptedPayload = (raw: string) => {
  const [version, iv, data] = splitEscaped(raw, TOP_SEP);
  if ((version !== 'E4' && version !== 'E5' && version !== 'E6') || !iv || !data) return null;
  return { iv, data };
};

export const encryptState = async (state: PersistedAppState, userId: string) => {
  const key = await getEncryptionKey(userId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const compactState = toCompactLocalState(state);
  const encoded = new TextEncoder().encode(serializeCompactLocalState(compactState));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  return LZString.compressToEncodedURIComponent(serializeEncryptedPayload(iv, new Uint8Array(encrypted)));
};

export const decryptState = async (value: string, userId: string): Promise<PersistedAppState | null> => {
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

export const compressGroup = (group: Group, ticks: Record<string, boolean>, ownerId: string): SharedGroupData => {
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

export const serializeSharedItem = (item: SharedGroupData['i'][number]) => {
  if (typeof item === 'number') return `d${item.toString(36)}`;
  if (typeof item[0] === 'number' && typeof item[1] === 'number') {
    return `r${item[0].toString(36)}${ITEM_FIELD_SEP}${item[1].toString(36)}`;
  }
  const customItem = item as [string, string];
  return `c${customItem[0]}${ITEM_FIELD_SEP}${escapeCompact(customItem[1])}`;
};

export const parseSharedItem = (raw: string): SharedGroupData['i'][number] => {
  const type = raw[0];
  const body = raw.slice(1);
  if (type === 'd') return parseInt(body, 36);
  const parts = splitEscaped(body, ITEM_FIELD_SEP);
  if (type === 'r') return [parseInt(parts[0], 36), parseInt(parts[1], 36)];
  return [parts[0], parts[1] ?? ''];
};

export const serializeSharedGroupData = (data: SharedGroupData) => {
  const items = data.i.map(serializeSharedItem).join(ITEM_SEP);
  return ['S5', data.o, data.g, escapeCompact(data.n), data.t, items].join(TOP_SEP);
};

export const parseSharedGroupData = (raw: string): SharedGroupData | null => {
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

export const decompressSharedGroup = (data: SharedGroupData): ImportedGroupPayload => {
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

export const parseSharedPayload = (key: string): ImportedGroupPayload | null => {
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

export const mergeImportedGroup = (groups: Group[], importedGroup: Group) => {
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

export const generateShareKey = (group: Group, ticks: Record<string, boolean>, ownerId: string) => {
  const payload = compressGroup(group, ticks, ownerId);
  return LZString.compressToEncodedURIComponent(serializeSharedGroupData(payload));
};