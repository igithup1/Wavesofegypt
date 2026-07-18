/**
 * WishlistContext — single shared source of truth for saved/wishlisted tours.
 *
 * Mount <WishlistProvider> once at the root. All consumers (TourCard, Saved
 * tab, etc.) read from and write to the same in-memory state so saves/unsaves
 * reflect instantly everywhere.
 *
 * Persistence strategy:
 *  - AsyncStorage is the primary store (works offline, no login required).
 *  - When the API wishlist loads successfully (user logged in), it is merged
 *    into the local list once per session.
 *  - API mutations are fired as best-effort mirrors; local state is never
 *    blocked on their success.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useAddToWishlist,
  useRemoveFromWishlist,
  useGetWishlist,
  getGetWishlistQueryKey,
} from '@workspace/api-client-react';
import type { Tour } from '@workspace/api-client-react';

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'wishlist_tours_v1';

async function loadFromStorage(): Promise<Tour[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Tour[];
  } catch {
    return [];
  }
}

async function saveToStorage(tours: Tour[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tours));
  } catch {
    // Silently ignore — UI state is correct for the current session.
  }
}

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface WishlistContextValue {
  /** Set of saved tour IDs for O(1) lookup. */
  savedIds: Set<number>;
  /** Saved tours, newest first. */
  savedTours: Tour[];
  /** True while the initial AsyncStorage load is in progress. */
  isLoading: boolean;
  /**
   * Toggle a tour in/out of the wishlist.
   * Returns `true` if the tour is now saved, `false` if removed.
   */
  toggle: (tour: Tour) => boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [savedTours, setSavedTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const mergedApiRef = useRef(false);
  // Keep a ref in sync with state so toggle can read current list synchronously.
  const savedToursRef = useRef<Tour[]>([]);

  // Load persisted list on mount.
  useEffect(() => {
    loadFromStorage().then((tours) => {
      savedToursRef.current = tours;
      setSavedTours(tours);
      setIsLoading(false);
    });
  }, []);

  // Keep ref in sync with every state update.
  useEffect(() => {
    savedToursRef.current = savedTours;
  }, [savedTours]);

  // Fetch API wishlist (succeeds only when an auth token getter is set).
  const { data: apiWishlist, isSuccess: apiSuccess } = useGetWishlist({
    query: {
      queryKey: getGetWishlistQueryKey(),
      retry: false,
      staleTime: Infinity, // Merge once per session; local is source of truth.
    },
  });

  // Reset the merge gate when the API wishlist becomes unavailable (e.g. user
  // logs out). This ensures the next successful fetch after login triggers a
  // fresh merge.
  useEffect(() => {
    if (!apiSuccess) {
      mergedApiRef.current = false;
    }
  }, [apiSuccess]);

  // API mutations — fire and forget.
  const { mutate: addToApi } = useAddToWishlist();
  const { mutate: removeFromApi } = useRemoveFromWishlist();

  // Merge API list into local state the first time it loads successfully.
  // API data is authoritative — it always has the latest price, title, and
  // cover image. Local-only tours (saved offline / not yet synced) are
  // appended after the API list so nothing is lost.
  // Local-only tours are also pushed to the API so the server-side wishlist
  // stays in sync across devices (best-effort, same as regular toggles).
  useEffect(() => {
    if (!apiSuccess || !apiWishlist || mergedApiRef.current) return;
    mergedApiRef.current = true;

    setSavedTours((prev) => {
      const apiIds = new Set(apiWishlist.map((t) => t.id));
      // Keep local tours that the API doesn't know about yet (e.g. offline saves).
      const localOnly = prev.filter((t) => !apiIds.has(t.id));
      // Push each local-only tour to the API best-effort so it syncs across devices.
      for (const tour of localOnly) {
        addToApi({ data: { tourId: tour.id } });
      }
      // API tours come first (fresh data); local-only tours are appended.
      const merged = [...apiWishlist, ...localOnly];
      saveToStorage(merged);
      return merged;
    });
  }, [apiSuccess, apiWishlist, addToApi]);

  const toggle = useCallback(
    (tour: Tour): boolean => {
      // Read the current list synchronously via the ref (not stale closure).
      const isCurrentlySaved = savedToursRef.current.some((t) => t.id === tour.id);
      const nowSaved = !isCurrentlySaved;

      setSavedTours((prev) => {
        const next = isCurrentlySaved
          ? prev.filter((t) => t.id !== tour.id)
          : [tour, ...prev];
        saveToStorage(next);
        return next;
      });

      // Mirror to API best-effort (no-op when not authenticated).
      if (isCurrentlySaved) {
        removeFromApi({ tourId: tour.id });
      } else {
        addToApi({ data: { tourId: tour.id } });
      }

      return nowSaved;
    },
    [addToApi, removeFromApi],
  );

  // Derive the Set on each render (cheap — just a new Set from the same array).
  const savedIds = new Set(savedTours.map((t) => t.id));

  return (
    <WishlistContext.Provider value={{ savedIds, savedTours, isLoading, toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Consumer hook
// ---------------------------------------------------------------------------

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used inside <WishlistProvider>');
  }
  return ctx;
}
