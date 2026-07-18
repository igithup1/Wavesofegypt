import { createRoot } from 'react-dom/client';
import { setBaseUrl, setAuthTokenGetter } from '@workspace/api-client-react';

import App from './App';

import './index.css';

// When deployed outside the Vite dev-server proxy (e.g. Vercel), the generated
// API client paths like /api/tours need an absolute base host.
// VITE_API_URL = https://wavesofegypt.replit.app/api
// Generated paths already include /api, so we extract only the origin to avoid
// double-prefixing (/api/api/tours). In local dev VITE_API_URL is unset and
// the Vite proxy handles /api/* automatically, so this is a no-op.
const rawApiUrl = import.meta.env.VITE_API_URL;
if (rawApiUrl) {
  try {
    setBaseUrl(new URL(rawApiUrl).origin);
  } catch {
    setBaseUrl(rawApiUrl.replace(/\/api\/?$/, ''));
  }
}

// Wire up the auth token so every generated API hook automatically sends
// "Authorization: Bearer <token>" — without this, all authenticated endpoints
// (admin dashboard, bookings, etc.) return 401 and show empty/zero data.
setAuthTokenGetter(() => localStorage.getItem('auth_token'));

createRoot(document.getElementById('root')!).render(<App />);
