/**
 * AuthContext — manages JWT token and current-user state for the mobile app.
 *
 * Token is stored in expo-secure-store so it persists across app restarts
 * and is never exposed to AsyncStorage or the JS bundle.
 *
 * On mount the context:
 *  1. Reads any persisted token from SecureStore.
 *  2. Registers a setAuthTokenGetter so every API call includes the token.
 *  3. Validates the token by calling GET /api/auth/me.
 *
 * Other modules consume `useAuth()` to read user state and call login/logout.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { setAuthTokenGetter, getMe } from '@workspace/api-client-react';
import type { User } from '@workspace/api-client-react';

// ---------------------------------------------------------------------------
// SecureStore shim for web (not supported there)
// ---------------------------------------------------------------------------

const TOKEN_KEY = 'auth_token_v1';

async function readToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  }
  try { return await SecureStore.getItemAsync(TOKEN_KEY); } catch { return null; }
}

async function writeToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    try { localStorage.setItem(TOKEN_KEY, token); } catch {}
    return;
  }
  try { await SecureStore.setItemAsync(TOKEN_KEY, token); } catch {}
}

async function deleteToken(): Promise<void> {
  if (Platform.OS === 'web') {
    try { localStorage.removeItem(TOKEN_KEY); } catch {}
    return;
  }
  try { await SecureStore.deleteItemAsync(TOKEN_KEY); } catch {}
}

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

export interface AuthContextValue {
  /** Current authenticated user, or null when logged out. */
  user: User | null;
  /** True while the initial token validation is in progress. */
  isLoading: boolean;
  /** Store token + mark user as logged in. Called after login/register. */
  signIn: (token: string, user: User) => Promise<void>;
  /** Clear token and user state. */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Keep a mutable ref so the token getter always reads the latest token.
  const tokenRef = useRef<string | null>(null);

  // Register the token getter once — it reads from the mutable ref.
  useEffect(() => {
    setAuthTokenGetter(() => tokenRef.current);
    return () => {
      // Clear the getter when the provider unmounts (e.g. in tests).
      setAuthTokenGetter(null);
    };
  }, []);

  // On mount: restore persisted token and validate it.
  useEffect(() => {
    const restore = async () => {
      try {
        const stored = await readToken();
        if (stored) {
          tokenRef.current = stored;
          // Validate the token by fetching /api/auth/me.
          const me = await getMe();
          setUser(me);
        }
      } catch {
        // Token expired or invalid — clear it.
        tokenRef.current = null;
        await deleteToken();
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const signIn = useCallback(async (token: string, loggedInUser: User) => {
    tokenRef.current = token;
    await writeToken(token);
    setUser(loggedInUser);
  }, []);

  const signOut = useCallback(async () => {
    tokenRef.current = null;
    await deleteToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Consumer hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
