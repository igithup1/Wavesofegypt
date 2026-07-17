import React, { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import * as Font from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { setBaseUrl } from '@workspace/api-client-react';
import { WishlistProvider } from '@/contexts/WishlistContext';

// Set the API base URL at module level — before any component renders.
// EXPO_PUBLIC_DOMAIN is injected by the dev script as $REPLIT_DEV_DOMAIN.
const domain = process.env.EXPO_PUBLIC_DOMAIN ?? '';
setBaseUrl(`https://${domain}`);

// Prevent splash screen from auto-hiding. Wrapped in catch because on
// fast-refresh it throws if the splash screen was already dismissed.
SplashScreen.preventAutoHideAsync().catch(() => {});

// How long we wait for fonts before giving up and rendering anyway.
// Must be well under Expo's internal 6 000 ms kill timer.
const FONT_LOAD_DEADLINE_MS = 3500;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      throwOnError: false,
    },
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="tour/[id]"
        options={{
          headerShown: false,
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const deadlineRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markReady = () => {
    if (deadlineRef.current) {
      clearTimeout(deadlineRef.current);
      deadlineRef.current = null;
    }
    setReady(true);
    SplashScreen.hideAsync().catch(() => {});
  };

  useEffect(() => {
    // Hard deadline — fires before Expo's internal 6 000 ms kill timer.
    deadlineRef.current = setTimeout(markReady, FONT_LOAD_DEADLINE_MS);

    const loadFonts = async () => {
      // On web, @expo-google-fonts uses fontfaceobserver which has its own
      // 6 000 ms timeout that throws an uncaught error outside React's tree.
      // Skip custom fonts on web entirely — system fonts look fine there.
      if (Platform.OS === 'web') {
        markReady();
        return;
      }

      // On native, load fonts with a try/catch so a failure never crashes.
      try {
        await Font.loadAsync({
          /* eslint-disable @typescript-eslint/no-require-imports */
          Inter_400Regular: require('@expo-google-fonts/inter/Inter_400Regular.ttf'),
          Inter_500Medium: require('@expo-google-fonts/inter/Inter_500Medium.ttf'),
          Inter_600SemiBold: require('@expo-google-fonts/inter/Inter_600SemiBold.ttf'),
          Inter_700Bold: require('@expo-google-fonts/inter/Inter_700Bold.ttf'),
          PlayfairDisplay_400Regular: require('@expo-google-fonts/playfair-display/PlayfairDisplay_400Regular.ttf'),
          PlayfairDisplay_700Bold: require('@expo-google-fonts/playfair-display/PlayfairDisplay_700Bold.ttf'),
          PlayfairDisplay_800ExtraBold: require('@expo-google-fonts/playfair-display/PlayfairDisplay_800ExtraBold.ttf'),
          /* eslint-enable @typescript-eslint/no-require-imports */
        });
      } catch (err) {
        // Font load failed — log and continue. Screens fall back to system fonts.
        console.warn('[fonts] failed to load custom fonts, using system fallback:', err);
      } finally {
        markReady();
      }
    };

    loadFonts();

    return () => {
      if (deadlineRef.current) clearTimeout(deadlineRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Never renders until ready — but ready is guaranteed within FONT_LOAD_DEADLINE_MS.
  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <WishlistProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </WishlistProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
