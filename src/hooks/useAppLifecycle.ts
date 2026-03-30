import { useEffect } from 'react';
import {
  clearPersistedAppState,
  loadAppState,
  persistAppState,
} from '@/lib/app-state-storage';
import { createDefaultState } from '@/lib/notebook-utils';
import type { Locale } from '@/lib/i18n';
import type { LoadedAppState } from '@/lib/app-state-storage';
import type { PersistedAppState } from '@/lib/notebook-types';
import type { UIFlow } from '@/stores/ui-store';

interface AppLifecycleState {
  boundPages: Record<string, boolean>;
  extraPageCounts: Record<string, number>;
  groups: PersistedAppState['groups'];
  isHydrated: boolean;
  myId: string;
  myTicks: Record<string, boolean>;
  nextGroupId: number;
  nextItemId: number;
}

interface AppLifecycleOptions {
  activeGroupId: string;
  hydrateAppData: (loaded: LoadedAppState) => void;
  hydrateUI: (payload: { activeGroupId: string; flow?: UIFlow }) => void;
  locale: Locale;
  pruneBoundPages: () => void;
  state: AppLifecycleState;
}

export const useAppLifecycle = ({
  activeGroupId,
  hydrateAppData,
  hydrateUI,
  locale,
  pruneBoundPages,
  state,
}: AppLifecycleOptions) => {
  useEffect(() => {
    if (state.isHydrated) return;

    let cancelled = false;

    const initialize = async () => {
      const loaded = await loadAppState();
      if (cancelled) return;

      hydrateAppData(loaded);
      hydrateUI({ activeGroupId: loaded.persistedState.activeGroupId, flow: loaded.initialFlow });
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [hydrateAppData, hydrateUI, state.isHydrated]);

  useEffect(() => {
    if (!state.isHydrated || !state.myId) return;

    void persistAppState({
      groups: state.groups,
      ticks: state.myTicks,
      boundPages: state.boundPages,
      extraPageCounts: state.extraPageCounts,
      activeGroupId,
      nextGroupId: state.nextGroupId,
      nextItemId: state.nextItemId,
    }, state.myId);
  }, [
    activeGroupId,
    state.boundPages,
    state.extraPageCounts,
    state.groups,
    state.isHydrated,
    state.myId,
    state.myTicks,
    state.nextGroupId,
    state.nextItemId,
  ]);

  useEffect(() => {
    pruneBoundPages();
  }, [pruneBoundPages, state.groups, state.myTicks]);

  const resetToDefaultState = () => {
    clearPersistedAppState();
    return createDefaultState(locale);
  };

  return {
    resetToDefaultState,
  };
};
