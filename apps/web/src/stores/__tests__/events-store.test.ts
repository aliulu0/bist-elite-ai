import { useEventsStore, type EventItem } from '../events-store';

beforeEach(() => {
  useEventsStore.setState({
    events: [],
    search: '',
    loading: false,
    error: '',
  });
});

describe('useEventsStore', () => {
  it('has correct initial state', () => {
    const state = useEventsStore.getState();
    expect(state.events).toEqual([]);
    expect(state.search).toBe('');
    expect(state.loading).toBe(false);
    expect(state.error).toBe('');
  });

  it('setEvents updates events', () => {
    const mockEvents: EventItem[] = [
      { id: '1', type: 'TEST', category: 'test', timestamp: '2024-01-01', data: '{}' },
    ];
    useEventsStore.getState().setEvents(mockEvents);
    expect(useEventsStore.getState().events).toEqual(mockEvents);
  });

  it('setSearch updates search', () => {
    useEventsStore.getState().setSearch('test query');
    expect(useEventsStore.getState().search).toBe('test query');
  });

  it('setLoading updates loading', () => {
    useEventsStore.getState().setLoading(true);
    expect(useEventsStore.getState().loading).toBe(true);
    useEventsStore.getState().setLoading(false);
    expect(useEventsStore.getState().loading).toBe(false);
  });

  it('setError updates error', () => {
    useEventsStore.getState().setError('test error');
    expect(useEventsStore.getState().error).toBe('test error');
  });

  it('setEvents replaces all events', () => {
    useEventsStore.getState().setEvents([
      { id: '1', type: 'A', category: 'a', timestamp: '', data: '' },
    ]);
    useEventsStore.getState().setEvents([
      { id: '2', type: 'B', category: 'b', timestamp: '', data: '' },
    ]);
    expect(useEventsStore.getState().events).toHaveLength(1);
    expect(useEventsStore.getState().events[0].id).toBe('2');
  });

  it('multiple state changes work', () => {
    const store = useEventsStore.getState();
    store.setLoading(true);
    store.setSearch('filter');
    store.setError('err');
    const state = useEventsStore.getState();
    expect(state.loading).toBe(true);
    expect(state.search).toBe('filter');
    expect(state.error).toBe('err');
  });

  it('default search is empty string', () => {
    expect(useEventsStore.getState().search).toBe('');
  });

  it('setEvents with empty array clears events', () => {
    useEventsStore.getState().setEvents([
      { id: '1', type: 'A', category: 'a', timestamp: '', data: '' },
    ]);
    useEventsStore.getState().setEvents([]);
    expect(useEventsStore.getState().events).toEqual([]);
  });

  it('setError can be cleared', () => {
    useEventsStore.getState().setError('error');
    useEventsStore.getState().setError('');
    expect(useEventsStore.getState().error).toBe('');
  });
});
