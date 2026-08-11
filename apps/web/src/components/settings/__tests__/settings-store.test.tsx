import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore, settingsEqual } from '@/stores/settings-store';
import { DEFAULT_SETTINGS } from '@/components/settings/settings-types';

describe('settingsEqual', () => {
  it('returns true for identical objects', () => {
    expect(settingsEqual(DEFAULT_SETTINGS, DEFAULT_SETTINGS)).toBe(true);
  });

  it('returns false for different objects', () => {
    const modified = { ...DEFAULT_SETTINGS, general: { ...DEFAULT_SETTINGS.general, language: 'en' } };
    expect(settingsEqual(DEFAULT_SETTINGS, modified)).toBe(false);
  });
});

describe('useSettingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      values: structuredClone(DEFAULT_SETTINGS),
      savedValues: structuredClone(DEFAULT_SETTINGS),
      dirty: false,
      activeTab: 'general',
      selectedProfile: 'default',
      search: '',
      validationErrors: [],
    });
  });

  it('setActiveTab changes tab', () => {
    useSettingsStore.getState().setActiveTab('theme');
    expect(useSettingsStore.getState().activeTab).toBe('theme');
  });

  it('updateValues makes dirty', () => {
    useSettingsStore.getState().updateValues('general', 'language', 'en');
    expect(useSettingsStore.getState().values.general.language).toBe('en');
    expect(useSettingsStore.getState().dirty).toBe(true);
  });

  it('save clears dirty', () => {
    useSettingsStore.getState().updateValues('general', 'language', 'en');
    useSettingsStore.getState().save();
    expect(useSettingsStore.getState().dirty).toBe(false);
  });

  it('reset restores saved values', () => {
    useSettingsStore.getState().updateValues('general', 'language', 'en');
    useSettingsStore.getState().reset();
    expect(useSettingsStore.getState().values.general.language).toBe('tr');
    expect(useSettingsStore.getState().dirty).toBe(false);
  });

  it('setValues replaces all values', () => {
    const newVals = { ...DEFAULT_SETTINGS, general: { ...DEFAULT_SETTINGS.general, language: 'en' } };
    useSettingsStore.getState().setValues(newVals);
    expect(useSettingsStore.getState().values.general.language).toBe('en');
  });

  it('addProfile adds profile', () => {
    const before = useSettingsStore.getState().profiles.length;
    useSettingsStore.getState().addProfile({
      id: 'test', name: 'Test', description: '', createdAt: '', updatedAt: '', isDefault: false,
    });
    expect(useSettingsStore.getState().profiles.length).toBe(before + 1);
  });

  it('removeProfile removes profile', () => {
    useSettingsStore.getState().removeProfile('balanced');
    expect(useSettingsStore.getState().profiles.find((p) => p.id === 'balanced')).toBeUndefined();
  });

  it('removeProfile resets selected if removing selected', () => {
    useSettingsStore.setState({ selectedProfile: 'balanced' });
    useSettingsStore.getState().removeProfile('balanced');
    expect(useSettingsStore.getState().selectedProfile).toBe('default');
  });

  it('setProfile changes selected', () => {
    useSettingsStore.getState().setProfile('aggressive');
    expect(useSettingsStore.getState().selectedProfile).toBe('aggressive');
  });

  it('addSnapshot adds snapshot', () => {
    useSettingsStore.getState().addSnapshot({
      id: 's1', profileId: 'default', createdAt: '', createdBy: 'Test', changes: {},
    });
    expect(useSettingsStore.getState().snapshots.length).toBe(1);
  });

  it('removeSnapshot removes snapshot', () => {
    useSettingsStore.getState().addSnapshot({
      id: 's1', profileId: 'default', createdAt: '', createdBy: 'Test', changes: {},
    });
    useSettingsStore.getState().removeSnapshot('s1');
    expect(useSettingsStore.getState().snapshots.length).toBe(0);
  });

  it('removeSnapshot resets selectedSnapshot', () => {
    useSettingsStore.getState().addSnapshot({
      id: 's1', profileId: 'default', createdAt: '', createdBy: 'Test', changes: {},
    });
    useSettingsStore.getState().setSelectedSnapshot('s1');
    useSettingsStore.getState().removeSnapshot('s1');
    expect(useSettingsStore.getState().selectedSnapshot).toBeNull();
  });

  it('setValidationErrors updates errors', () => {
    useSettingsStore.getState().setValidationErrors([{ field: 'x', message: 'err' }]);
    expect(useSettingsStore.getState().validationErrors).toHaveLength(1);
  });

  it('setSaving updates saving', () => {
    useSettingsStore.getState().setSaving(true);
    expect(useSettingsStore.getState().saving).toBe(true);
  });

  it('setSearch updates search', () => {
    useSettingsStore.getState().setSearch('test');
    expect(useSettingsStore.getState().search).toBe('test');
  });

  it('updateValues with non-object section does nothing', () => {
    useSettingsStore.getState().updateValues('invalid', 'key', 'val');
    expect(useSettingsStore.getState().dirty).toBe(false);
  });

  it('setProfile with invalid id does nothing', () => {
    useSettingsStore.getState().setProfile('nonexistent');
    expect(useSettingsStore.getState().selectedProfile).toBe('default');
  });
});
