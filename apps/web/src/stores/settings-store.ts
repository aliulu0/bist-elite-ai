import { create } from 'zustand';
import type {
  SettingsTab,
  SettingsValues,
  SettingsProfile,
  SettingsSnapshot,
  ValidationError,
} from '@/components/settings/settings-types';
import { DEFAULT_SETTINGS, DEFAULT_PROFILES } from '@/components/settings/settings-types';

export interface SettingsState {
  activeTab: SettingsTab;
  values: SettingsValues;
  savedValues: SettingsValues;
  dirty: boolean;
  profiles: SettingsProfile[];
  selectedProfile: string;
  snapshots: SettingsSnapshot[];
  selectedSnapshot: string | null;
  validationErrors: ValidationError[];
  saving: boolean;
  search: string;

  setActiveTab: (tab: SettingsTab) => void;
  updateValues: (section: string, key: string, value: unknown) => void;
  setValues: (values: SettingsValues) => void;
  save: () => void;
  reset: () => void;
  setProfile: (id: string) => void;
  addProfile: (profile: SettingsProfile) => void;
  removeProfile: (id: string) => void;
  addSnapshot: (snapshot: SettingsSnapshot) => void;
  removeSnapshot: (id: string) => void;
  setSelectedSnapshot: (id: string | null) => void;
  setValidationErrors: (errors: ValidationError[]) => void;
  setSaving: (saving: boolean) => void;
  setSearch: (search: string) => void;
}

export function settingsEqual(a: SettingsValues, b: SettingsValues): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  activeTab: 'general',
  values: structuredClone(DEFAULT_SETTINGS),
  savedValues: structuredClone(DEFAULT_SETTINGS),
  dirty: false,
  profiles: [...DEFAULT_PROFILES],
  selectedProfile: 'default',
  snapshots: [],
  selectedSnapshot: null,
  validationErrors: [],
  saving: false,
  search: '',

  setActiveTab: (activeTab) => set({ activeTab }),

  updateValues: (section, key, value) =>
    set((s) => {
      const sectionData = s.values[section as keyof SettingsValues];
      if (typeof sectionData === 'object' && sectionData !== null) {
        const updated = { ...sectionData, [key]: value };
        const newValues = { ...s.values, [section]: updated };
        return { values: newValues, dirty: !settingsEqual(newValues, s.savedValues) };
      }
      return {};
    }),

  setValues: (values) => set({ values, dirty: !settingsEqual(values, get().savedValues) }),

  save: () =>
    set((s) => ({
      savedValues: structuredClone(s.values),
      dirty: false,
    })),

  reset: () =>
    set((s) => ({
      values: structuredClone(s.savedValues),
      dirty: false,
      validationErrors: [],
    })),

  setProfile: (id) =>
    set((s) => {
      const profile = s.profiles.find((p) => p.id === id);
      if (profile) {
        return { selectedProfile: id };
      }
      return {};
    }),

  addProfile: (profile) =>
    set((s) => ({
      profiles: [...s.profiles, profile],
    })),

  removeProfile: (id) =>
    set((s) => ({
      profiles: s.profiles.filter((p) => p.id !== id),
      selectedProfile: s.selectedProfile === id ? 'default' : s.selectedProfile,
    })),

  addSnapshot: (snapshot) =>
    set((s) => ({
      snapshots: [snapshot, ...s.snapshots],
    })),

  removeSnapshot: (id) =>
    set((s) => ({
      snapshots: s.snapshots.filter((snap) => snap.id !== id),
      selectedSnapshot: s.selectedSnapshot === id ? null : s.selectedSnapshot,
    })),

  setSelectedSnapshot: (selectedSnapshot) => set({ selectedSnapshot }),

  setValidationErrors: (validationErrors) => set({ validationErrors }),

  setSaving: (saving) => set({ saving }),

  setSearch: (search) => set({ search }),
}));
