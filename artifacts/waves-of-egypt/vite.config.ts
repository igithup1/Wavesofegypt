import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// PORT — required in Replit, fall back to 5173 for local/external hosting
const rawPort = process.env.PORT ?? '5173';
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// BASE_PATH — required in Replit's multi-artifact proxy, defaults to '/'
// for Vercel, Netlify, or any standard host where the site lives at the root.
const basePath = process.env.BASE_PATH ?? '/';

const isReplit =
  process.env.NODE_ENV !== 'production' &&
  process.env.REPL_ID !== undefined;

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    // Replit-specific plugins — automatically excluded in non-Replit environments
    ...(isReplit
      ? [
          (await import('@replit/vite-plugin-runtime-error-modal')).default(),
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({ root: path.resolve(import.meta.dirname, '..') }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(import.meta.dirname, '..', '..', 'attached_assets'),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
    // Split vendor chunks for better long-term caching
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Large UI / animation libraries → separate chunks
          if (id.includes('framer-motion')) return 'framer-motion';
          if (id.includes('recharts') || id.includes('d3-')) return 'charts';
          if (id.includes('@radix-ui')) return 'radix';
          if (id.includes('lucide-react')) return 'lucide';
          // Everything else from node_modules → shared vendor chunk
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: { strict: true },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
