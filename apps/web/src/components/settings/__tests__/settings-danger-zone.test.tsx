import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsDangerZone } from '../settings-danger-zone';
import { SettingsImportExport } from '../settings-import-export';

describe('SettingsDangerZone', () => {
  it('renders title', () => {
    render(<SettingsDangerZone />);
    expect(screen.getByText('Tehlikeli Bölge')).toBeDefined();
  });

  it('renders warning', () => {
    render(<SettingsDangerZone />);
    expect(screen.getByText('Bu işlemler geri alınamaz')).toBeDefined();
  });

  it('renders reset all settings button', () => {
    render(<SettingsDangerZone />);
    expect(screen.getByText('Tüm Ayarları Sıfırla')).toBeDefined();
  });

  it('renders reset all profiles button', () => {
    render(<SettingsDangerZone />);
    expect(screen.getByText('Tüm Profilleri Sıfırla')).toBeDefined();
  });

  it('renders clear cache button', () => {
    render(<SettingsDangerZone />);
    expect(screen.getByText('Önbelleği Temizle')).toBeDefined();
  });
});

describe('SettingsImportExport', () => {
  it('renders title', () => {
    render(<SettingsImportExport />);
    expect(screen.getByText('İçe / Dışa Aktar')).toBeDefined();
  });

  it('renders JSON export button', () => {
    render(<SettingsImportExport />);
    expect(screen.getByText('JSON Dışa Aktar')).toBeDefined();
  });

  it('renders JSON import button', () => {
    render(<SettingsImportExport />);
    expect(screen.getByText('JSON İçe Aktar')).toBeDefined();
  });

  it('renders schema validation', () => {
    render(<SettingsImportExport />);
    expect(screen.getByText(/Şema Doğrulama/)).toBeDefined();
  });

  it('renders profile export button', () => {
    render(<SettingsImportExport />);
    expect(screen.getByText('Profil Dışa Aktar')).toBeDefined();
  });
});
