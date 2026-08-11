import { renderHook, act } from '@testing-library/react';
import { useLayoutStore } from './layout-store';

describe('useLayoutStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to expanded sidebar', () => {
    const { result } = renderHook(() => useLayoutStore());
    expect(result.current.sidebarCollapsed).toBe(false);
  });

  it('toggles sidebar', () => {
    const { result } = renderHook(() => useLayoutStore());
    act(() => result.current.toggleSidebar());
    expect(result.current.sidebarCollapsed).toBe(true);
    act(() => result.current.toggleSidebar());
    expect(result.current.sidebarCollapsed).toBe(false);
  });

  it('sets sidebar collapsed directly', () => {
    const { result } = renderHook(() => useLayoutStore());
    act(() => result.current.setSidebarCollapsed(true));
    expect(result.current.sidebarCollapsed).toBe(true);
    act(() => result.current.setSidebarCollapsed(false));
    expect(result.current.sidebarCollapsed).toBe(false);
  });
});
