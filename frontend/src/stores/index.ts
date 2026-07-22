import { create } from "zustand";
import type { Locale } from "@/locales";

interface AppStore {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));

interface SettingsStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  theme: "dark" | "light" | "system";
  setTheme: (theme: "dark" | "light" | "system") => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  locale: "tr",
  setLocale: (locale) => set({ locale }),
  theme: "dark",
  setTheme: (theme) => set({ theme }),
}));

interface NotificationStore {
  notifications: Array<{
    id: string;
    type: "success" | "error" | "warning" | "info";
    message: string;
  }>;
  addNotification: (notification: {
    type: "success" | "error" | "warning" | "info";
    message: string;
  }) => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: Math.random().toString(36).substr(2, 9) },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));
