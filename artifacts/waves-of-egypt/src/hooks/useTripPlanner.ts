import { useState, useEffect } from 'react';
import type { Tour } from '@workspace/api-client-react';

const STORAGE_KEY = 'woe_my_trip';

export interface TripItem {
  tour: Tour;
  date: string;
  adults: number;
  children: number;
}

export interface TripStore {
  items: TripItem[];
  hotel: string;
  requests: string;
}

const DEFAULT: TripStore = { items: [], hotel: '', requests: '' };

function load(): TripStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

function persist(store: TripStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch { /* quota exceeded etc. */ }
}

// Cross-component notification without React context
const listeners = new Set<(store: TripStore) => void>();
function broadcast(store: TripStore) {
  listeners.forEach(fn => fn(store));
}

export function useTripPlanner() {
  const [store, setStore] = useState<TripStore>(load);

  useEffect(() => {
    // Subscribe to updates from other component instances
    const fn = (next: TripStore) => setStore(next);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  function save(next: TripStore) {
    persist(next);
    setStore(next);
    broadcast(next);
  }

  function toggleTour(tour: Tour) {
    const current = load();
    const exists = current.items.some(i => i.tour.id === tour.id);
    if (exists) {
      save({ ...current, items: current.items.filter(i => i.tour.id !== tour.id) });
    } else {
      save({ ...current, items: [...current.items, { tour, date: '', adults: 2, children: 0 }] });
    }
  }

  function removeTour(tourId: number) {
    const current = load();
    save({ ...current, items: current.items.filter(i => i.tour.id !== tourId) });
  }

  function isSaved(tourId: number): boolean {
    return store.items.some(i => i.tour.id === tourId);
  }

  function updateItem(tourId: number, updates: Partial<Omit<TripItem, 'tour'>>) {
    const current = load();
    save({
      ...current,
      items: current.items.map(i =>
        i.tour.id === tourId ? { ...i, ...updates } : i
      ),
    });
  }

  function setHotel(hotel: string) {
    save({ ...load(), hotel });
  }

  function setRequests(requests: string) {
    save({ ...load(), requests });
  }

  function clear() {
    save(DEFAULT);
  }

  return {
    items: store.items,
    hotel: store.hotel,
    requests: store.requests,
    count: store.items.length,
    toggleTour,
    removeTour,
    isSaved,
    updateItem,
    setHotel,
    setRequests,
    clear,
  };
}
