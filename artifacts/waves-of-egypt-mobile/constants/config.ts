/**
 * App-wide configuration constants.
 * Update WEB_APP_URL when the production domain is set.
 */
export const WEB_APP_URL =
  (process.env.EXPO_PUBLIC_WEB_URL as string | undefined) ??
  'https://wavesofegypt.com';
