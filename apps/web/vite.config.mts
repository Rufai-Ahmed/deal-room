/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const API_TARGET = process.env.VITE_API_TARGET ?? 'http://localhost:3000';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/web',
  server: {
    port: 4200,
    host: 'localhost',
    // Keeps the browser on a single origin in development, matching the
    // rewrite that fronts the API in production. Both keys are anchored
    // regexes: a bare '/s' prefix would also swallow /src and /styles.css.
    proxy: {
      '^/api/.*': { target: API_TARGET, changeOrigin: true },
      '^/s/[^/]+$': { target: API_TARGET, changeOrigin: true },
    },
  },
  preview: {
    port: 4200,
    host: 'localhost',
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'Deal Room',
        short_name: 'Deal Room',
        description:
          'Share fundraising documents with investors and see exactly how they engage.',
        theme_color: '#14523c',
        background_color: '#fbfaf8',
        display: 'standalone',
        start_url: '/documents',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // A cached document response would leak a revoked deck and a cached API
        // response would show a founder stale engagement. Both stay network-only.
        navigateFallbackDenylist: [/^\/api/, /^\/s\//, /^\/view\//],
        runtimeCaching: [
          {
            urlPattern: /^.*\/(api|s|view)\/.*/,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    name: 'web',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
