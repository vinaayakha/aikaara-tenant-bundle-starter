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

export default defineConfig({
  plugins: [react()],
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
      },
    },
  },
});
