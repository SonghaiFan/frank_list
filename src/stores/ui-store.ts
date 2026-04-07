import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  getPreferredLocale,
  type Locale,
  UI_PREFERENCES_STORAGE_KEY,
} from "@/lib/i18n";
import { DEFAULT_GROUP_ID } from "@/lib/workspace-constants";

export type UIFlow =
  | "workspace"
  | "gallery"
  | "compare-review"
  | "compare-result";
export type UIOverlay =
  | "none"
  | "qr"
  | "reset-confirm"
  | "delete-group-confirm";

interface UIState {
  activeGroupId: string;
  copySuccess: boolean;
  flow: UIFlow;
  locale: Locale;
  newItemText: string;
  overlay: UIOverlay;
  backToWorkspace: () => void;
  clearCopySuccess: () => void;
  closeOverlay: () => void;
  closeToGallery: () => void;
  hydrate: (payload: { activeGroupId: string; flow?: UIFlow }) => void;
  openGroupFromGallery: (groupId: string) => void;
  selectGroup: (groupId: string) => void;
  setCopySuccess: (value: boolean) => void;
  setLocale: (locale: Locale) => void;
  setNewItemText: (value: string) => void;
  showDeleteGroupConfirm: () => void;
  showQrCode: () => void;
  showResetConfirm: () => void;
  startCompareReview: (groupId: string) => void;
  startComparison: () => void;
  toggleLocale: () => void;
  togglePrimaryView: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeGroupId: DEFAULT_GROUP_ID,
      copySuccess: false,
      flow: "gallery",
      locale: getPreferredLocale(),
      newItemText: "",
      overlay: "none",
      backToWorkspace: () => set({ flow: "workspace", overlay: "none" }),
      clearCopySuccess: () => set({ copySuccess: false }),
      closeOverlay: () => set({ overlay: "none" }),
      closeToGallery: () => set({ flow: "gallery" }),
      hydrate: ({ activeGroupId, flow = "gallery" }) =>
        set({ activeGroupId, flow }),
      openGroupFromGallery: (groupId) =>
        set({ activeGroupId: groupId, flow: "workspace" }),
      selectGroup: (groupId) =>
        set({ activeGroupId: groupId, flow: "workspace" }),
      setCopySuccess: (value) => set({ copySuccess: value }),
      setLocale: (locale) => set({ locale }),
      setNewItemText: (value) => set({ newItemText: value }),
      showDeleteGroupConfirm: () => set({ overlay: "delete-group-confirm" }),
      showQrCode: () => set({ overlay: "qr" }),
      showResetConfirm: () => set({ overlay: "reset-confirm" }),
      startCompareReview: (groupId) =>
        set({ activeGroupId: groupId, flow: "compare-review" }),
      startComparison: () => set({ flow: "compare-result" }),
      toggleLocale: () =>
        set((state) => ({ locale: state.locale === "zh" ? "en" : "zh" })),
      togglePrimaryView: () =>
        set((state) => ({
          flow:
            state.flow === "gallery"
              ? "workspace"
              : state.flow === "workspace"
                ? "gallery"
                : state.flow,
        })),
    }),
    {
      name: UI_PREFERENCES_STORAGE_KEY,
      partialize: (state) => ({ locale: state.locale }),
    },
  ),
);
