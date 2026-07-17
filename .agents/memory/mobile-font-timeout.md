---
name: Mobile app SplashScreen 6000ms timeout fix
description: Root cause and fix for the "Uncaught Error: 6000ms timeout exceeded" crash in the Expo mobile app.
---

# Mobile App: 6000ms SplashScreen Timeout

## Root cause
`SplashScreen.preventAutoHideAsync()` is called at module load. `hideAsync()` is only triggered when `fontsLoaded || fontError` is true. `@expo-google-fonts/inter` and `@expo-google-fonts/playfair-display` can hang silently (no error thrown, no load event) in the Replit Expo environment, causing `hideAsync()` to never be called. Expo kills the app after 6000ms.

## Fix (app/_layout.tsx)
1. Wrap `preventAutoHideAsync()` in `.catch(() => {})` — it throws on fast-refresh when splash is already hidden.
2. Add a 4000ms forced deadline via `setTimeout` that calls `hideAsync()` and sets `ready = true` regardless of font state.
3. Gate rendering on `ready` (not directly on `fontsLoaded`) — `ready` is guaranteed within 4000ms.
4. The deadline clears itself if fonts load normally first.

**Why 4000ms:** Must fire before Expo's internal 6000ms kill timer with enough margin.

## Secondary fix (app/(tabs)/_layout.tsx)
Static imports of `expo-symbols` (iOS-only) and `expo-router/unstable-native-tabs` (unstable) crash on Android even when the components are never rendered. Replaced with cross-platform `Feather` icons + stable `Tabs` API from `expo-router`.

**Why:** Native module imports execute at bundle evaluation time — an unavailable native module throws immediately, regardless of whether the component is rendered.

## API URL
`setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`)` is correct. EXPO_PUBLIC_DOMAIN=$REPLIT_DEV_DOMAIN, API server is at path `/api`, so calls go to `$REPLIT_DEV_DOMAIN/api/tours` which routes correctly.
