import { renderHook, act } from '@testing-library/react';
import { useNotificationStore } from './notification-store';

describe('useNotificationStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useNotificationStore());
    act(() => result.current.clearAll());
  });

  it('adds a notification', () => {
    const { result } = renderHook(() => useNotificationStore());
    act(() => result.current.addNotification({ type: 'info', title: 'Test', message: 'Hello' }));
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].title).toBe('Test');
    expect(result.current.notifications[0].read).toBe(false);
  });

  it('generates unique IDs', () => {
    const { result } = renderHook(() => useNotificationStore());
    act(() => {
      result.current.addNotification({ type: 'info', title: 'A', message: '' });
      result.current.addNotification({ type: 'info', title: 'B', message: '' });
    });
    expect(result.current.notifications[0].id).not.toBe(result.current.notifications[1].id);
  });

  it('marks a notification as read', () => {
    const { result } = renderHook(() => useNotificationStore());
    act(() => result.current.addNotification({ type: 'info', title: 'Test', message: '' }));
    const id = result.current.notifications[0].id;
    act(() => result.current.markAsRead(id));
    expect(result.current.notifications[0].read).toBe(true);
  });

  it('marks all as read', () => {
    const { result } = renderHook(() => useNotificationStore());
    act(() => {
      result.current.addNotification({ type: 'info', title: 'A', message: '' });
      result.current.addNotification({ type: 'error', title: 'B', message: '' });
    });
    act(() => result.current.markAllAsRead());
    expect(result.current.notifications.every((n) => n.read)).toBe(true);
  });

  it('removes a notification', () => {
    const { result } = renderHook(() => useNotificationStore());
    act(() => result.current.addNotification({ type: 'info', title: 'Test', message: '' }));
    const id = result.current.notifications[0].id;
    act(() => result.current.removeNotification(id));
    expect(result.current.notifications).toHaveLength(0);
  });

  it('clears all notifications', () => {
    const { result } = renderHook(() => useNotificationStore());
    act(() => {
      result.current.addNotification({ type: 'info', title: 'A', message: '' });
      result.current.addNotification({ type: 'info', title: 'B', message: '' });
    });
    act(() => result.current.clearAll());
    expect(result.current.notifications).toHaveLength(0);
  });

  it('counts unread', () => {
    const { result } = renderHook(() => useNotificationStore());
    act(() => {
      result.current.addNotification({ type: 'info', title: 'A', message: '' });
      result.current.addNotification({ type: 'info', title: 'B', message: '' });
    });
    expect(result.current.unreadCount()).toBe(2);
    act(() => result.current.markAsRead(result.current.notifications[0].id));
    expect(result.current.unreadCount()).toBe(1);
  });

  it('sets timestamp on creation', () => {
    const { result } = renderHook(() => useNotificationStore());
    const before = Date.now();
    act(() => result.current.addNotification({ type: 'info', title: 'Test', message: '' }));
    const after = Date.now();
    const ts = result.current.notifications[0].timestamp.getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});
