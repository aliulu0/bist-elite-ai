import { renderHook, act } from '@testing-library/react';
import { useThemeStore } from './theme-store';

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe('useThemeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
  });

  it('defaults to dark theme', () => {
    const { result } = renderHook(() => useThemeStore());
    expect(result.current.theme).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
  });

  it('sets light theme', () => {
    const { result } = renderHook(() => useThemeStore());
    act(() => result.current.setTheme('light'));
    expect(result.current.theme).toBe('light');
    expect(result.current.resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('sets dark theme', () => {
    const { result } = renderHook(() => useThemeStore());
    act(() => result.current.setTheme('dark'));
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('sets system theme', () => {
    const { result } = renderHook(() => useThemeStore());
    act(() => result.current.setTheme('system'));
    expect(result.current.theme).toBe('system');
  });

  it('persists theme to localStorage', () => {
    const { result } = renderHook(() => useThemeStore());
    act(() => result.current.setTheme('light'));
    expect(localStorage.getItem('bist-elite-theme')).toBeTruthy();
  });
});
