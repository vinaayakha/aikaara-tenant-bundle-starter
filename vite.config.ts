import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs';

// One IIFE bundle per file matching `src/screens/*.entry.tsx`.
// Add a screen by adding `<name>.entry.tsx` next to its component;
// the publisher uploads `dist/<name>.iife.js` to slot `screen:<name>`.
const entriesDir = path.resolve(__dirname, 'src/screens');
const input = Object.fromEntries(
  fs.readdirSync(entriesDir)
    .filter((f) => f.endsWith('.entry.tsx'))
    .map((f) => [f.replace('.entry.tsx', ''), path.join(entriesDir, f)]),
);

// Tiny runtime polyfill prepended to every bundle. Bundles run inside
// the shell's sandboxed iframe where Node globals don't exist; libs and
// tenant code commonly reference `process.env`, `global`, etc. The
// banner installs idempotent shims so every access pattern works
// (typeof process / process.env / destructuring), not just the
// compile-time-replaced refs that Vite's `define` would catch.
const BUNDLE_BANNER = [
  'window.process=window.process||{env:{NODE_ENV:"production"}};',
  'window.global=window.global||window;',
].join('');

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input,
      output: {
        format: 'iife',
        entryFileNames: '[name].iife.js',
        assetFileNames: '[name][extname]',
        inlineDynamicImports: false,
        banner: BUNDLE_BANNER,
      },
    },
  },
});
