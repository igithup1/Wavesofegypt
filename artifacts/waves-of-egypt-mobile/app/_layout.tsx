import React, { useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts as useInterFonts,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_800ExtraBold,
} from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { setBaseUrl } from '@workspace/api-client-react';

// Set the API base URL — must be called at module level (outside any component)
// EXPO_PUBLIC_DOMAIN is injected by the dev script as $REPLIT_DEV_DOMAIN
const domain = process.env.EXPO_PUBLIC_DOMAIN ?? '';
setBaseUrl(`https://${domain}`);

// Prevent the splash screen from auto-hiding before asset loading is complete.
// Wrapped in catch — throws if splash screen was already shown/hidden (e.g. fast-refresh).
SplashScreen.preventAutoHideAsync().catch(() => {});

// Maximum ms to wait for fonts before we give up and show the app anyway.
// Must be comfortably under Expo's internal 6000ms kill timer.
const FONT_LOAD_DEADLINE_MS = 4000;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      // Don't throw to the error boundary on query failure — let screens handle it
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
  const [interLoaded, interError] = useInterFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [playfairLoaded, playfairError] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_800ExtraBold,
  });

  // `ready` becomes true when fonts finish (success or error) OR when the
  // deadline fires — whichever comes first.
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

  // Hard deadline — fires before Expo's 6 000 ms kill timer
  useEffect(() => {
    deadlineRef.current = setTimeout(markReady, FONT_LOAD_DEADLINE_MS);
    return () => {
      if (deadlineRef.current) clearTimeout(deadlineRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Normal path — fonts resolved (loaded or errored)
  const fontsLoaded = interLoaded && playfairLoaded;
  const fontError = interError || playfairError;

  useEffect(() => {
    if (fontsLoaded || fontError) {
      markReady();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontsLoaded, fontError]);

  // Don't render at all until we're ready — but we're guaranteed to become
  // ready within FONT_LOAD_DEADLINE_MS, never causing the 6 000 ms crash.
  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <RootLayoutNav />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
