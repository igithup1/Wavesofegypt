---
name: Mobile app SplashScreen 6000ms timeout fix
description: Root cause and fix for the "Uncaught Error: 6000ms timeout exceeded" crash in the Expo mobile app.
---

# Mobile App: 6000ms SplashScreen Timeout

## Root cause
`SplashScreen.preventAutoHideAsync()` is called at module load. `hideAsync()` is only triggered when `fontsLoaded || fontError` is true. `@expo-google-fonts/inter` and `@expo-google-fonts/playfair-display` can hang silently (no error thrown, no load event) in the Replit Expo environment, causing `hideAsync()` to never be called. Expo kills the app after 6000ms.

## Fix (app/_layout.tsx)
1. Wrap `preventAutoHideAsync()` in `.catch(() => {})` — it throws on fast-refresh when splash is already hidden.
2. Replace `useFonts` hooks (which use fontfaceobserver internally) with `Font.loadAsync` in a `useEffect`.
3. **On `Platform.OS === 'web'`: skip all font loading entirely** — call `markReady()` immediately. fontfaceobserver is a web-only library and is the direct cause of the crash.
4. On native: call `Font.loadAsync(...)` with a try/catch; call `markReady()` in the `finally` block so failure never crashes.
5. Add a 3500ms hard deadline via `setTimeout` as a final safety net.
6. Gate rendering on `ready` state — guaranteed to become true within 3500ms.

**Why skip on web:** fontfaceobserver throws inside a `setTimeout` (outside React's tree) so neither try/catch nor ErrorBoundary catches it. The only safe fix is to not call it at all on web. System fonts look fine on web.

**Why not `useFonts`:** Both `@expo-google-fonts/inter` and `@expo-google-fonts/playfair-display` call `useFonts` which delegates to fontfaceobserver on web. The entire hook must be replaced with `Font.loadAsync` to get try/catch control.

## Secondary fix (app/(tabs)/_layout.tsx)
Static imports of `expo-symbols` (iOS-only) and `expo-router/unstable-native-tabs` (unstable) crash on Android even when the components are never rendered. Replaced with cross-platform `Feather` icons + stable `Tabs` API from `expo-router`.

**Why:** Native module imports execute at bundle evaluation time — an unavailable native module throws immediately, regardless of whether the component is rendered.

## API URL
`setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`)` is correct. EXPO_PUBLIC_DOMAIN=$REPLIT_DEV_DOMAIN, API server is at path `/api`, so calls go to `$REPLIT_DEV_DOMAIN/api/tours` which routes correctly.
