import {
  createDefaultState,
  decryptState,
  encryptState,
  generateShareKey,
  mergeImportedGroup,
  normalizeState,
  parseSharedPayload,
  randomId,
} from "@/lib/notebook-utils";
import { getPreferredLocale } from "@/lib/i18n";
import { LOCAL_STATE_STORAGE_KEY } from "@/lib/workspace-constants";
import type { Group, PersistedAppState } from "@/lib/notebook-types";

export interface LoadedAppState {
  localId: string;
  persistedState: PersistedAppState;
  sharedTicks: Record<string, boolean>;
  initialFlow: "gallery" | "compare-review";
}

type PersistInputState = Omit<PersistedAppState, "v">;

const USER_ID_STORAGE_KEY = "rams-user-id";

export const ensureLocalUserId = () => {
  let localId = localStorage.getItem(USER_ID_STORAGE_KEY);
  if (!localId || localId.length > 6) {
    localId = randomId(4);
    localStorage.setItem(USER_ID_STORAGE_KEY, localId);
  }
  return localId;
};

export const loadAppState = async (): Promise<LoadedAppState> => {
  const locale = getPreferredLocale();
  const localId = ensureLocalUserId();
  let persistedState = createDefaultState(locale);

  const savedState = localStorage.getItem(LOCAL_STATE_STORAGE_KEY);
  if (savedState) {
    const decrypted = await decryptState(savedState, localId, locale);
    if (decrypted) persistedState = decrypted;
  }

  const params = new URLSearchParams(window.location.search);
  const key = params.get("key");
  if (!key) {
    return {
      localId,
      persistedState,
      sharedTicks: {},
      initialFlow: "gallery",
    };
  }

  const imported = parseSharedPayload(key, locale);
  if (!imported) {
    return {
      localId,
      persistedState,
      sharedTicks: {},
      initialFlow: "gallery",
    };
  }

  return {
    localId,
    persistedState: {
      ...persistedState,
      groups: mergeImportedGroup(persistedState.groups, imported.group),
      activeGroupId: imported.group.id,
    },
    sharedTicks: imported.sharedTicks,
    initialFlow: "compare-review",
  };
};

export const persistAppState = async (
  state: PersistInputState,
  userId: string,
) => {
  const encrypted = await encryptState(
    normalizeState(state, getPreferredLocale()),
    userId,
  );
  localStorage.setItem(LOCAL_STATE_STORAGE_KEY, encrypted);
};

export const clearPersistedAppState = () => {
  localStorage.removeItem(LOCAL_STATE_STORAGE_KEY);
};

export const createGroupShareUrl = (
  group: Group,
  ticks: Record<string, boolean>,
  userId: string,
) => {
  const encoded = generateShareKey(group, ticks, userId);
  const url = new URL(window.location.href);
  url.searchParams.set("key", encoded);
  return url.toString();
};

export const clearShareQueryFromUrl = () => {
  window.history.replaceState({}, "", window.location.pathname);
};
