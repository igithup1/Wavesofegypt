---
name: Mobile app SplashScreen 6000ms timeout fix
description: Root cause and fix for the "Uncaught Error: 6000ms timeout exceeded" crash in the Expo mobile app — including the fontfaceobserver web crash.
---

# Mobile App: 6000ms SplashScreen + fontfaceobserver Timeout

## Root cause #1 — SplashScreen never dismissed
`SplashScreen.preventAutoHideAsync()` is called at module load. `hideAsync()` only triggers when `fontsLoaded || fontError` is true. `@expo-google-fonts` packages can hang silently (no error thrown, no load event) → `hideAsync()` never called → Expo kills at 6000ms.

## Root cause #2 — fontfaceobserver web crash (confirmed by user screenshot)
On web (`Platform.OS === 'web'`), `useFonts` from `@expo-google-fonts` uses `fontfaceobserver` internally. fontfaceobserver throws its own 6000ms timeout **inside a `setTimeout`**, outside React's tree. Neither `try/catch` nor `ErrorBoundary` can intercept it. Error source in stack: `node_modules/.pnpm/fontfaceobserver@2.3.0`.

## Fix (app/_layout.tsx)
1. **Remove `useFonts` hooks entirely** — they use fontfaceobserver on web.
2. **`Platform.OS === 'web'`: skip all font loading** — call `markReady()` immediately. System fonts look fine.
3. **Native**: use `Font.loadAsync(...)` with direct `.ttf` requires in a `useEffect` with try/catch + `finally { markReady() }`.
4. **3500ms hard deadline** via `setTimeout` as last safety net before Expo's 6000ms kill timer.
5. Wrap `preventAutoHideAsync()` in `.catch(() => {})` — throws on fast-refresh.
6. Gate rendering on `ready` state — guaranteed true within 3500ms.

**Why skip on web:** fontfaceobserver throws outside React's tree; no catch is possible. Only fix is to not call it.
**Why not `useFonts`:** Both hooks delegate to fontfaceobserver on web. Must be replaced with `Font.loadAsync`.

## Secondary fix (app/(tabs)/_layout.tsx)
Remove static imports of `expo-symbols` (iOS-only) and `expo-router/unstable-native-tabs` (unstable). They execute at bundle evaluation time and crash Android even when never rendered. Replace with `Feather` icons + standard `expo-router` `Tabs` API.

## Port EADDRINUSE
Expo workflow fails with EADDRINUSE on restart. Fix: `fuser -k 21459/tcp 2>/dev/null; sleep 1` before restarting the workflow.
