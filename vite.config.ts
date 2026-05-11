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
  // Shim Node-only globals so bundles can run inside the shell's
  // sandboxed iframe. React and many libs reference `process.env.NODE_ENV`
  // (and sometimes other process.env keys); Vite's IIFE build doesn't
  // wrap things with the usual env-defines, so we have to spell them out.
  // Tenant code that needs build-time config should use Vite's
  // `import.meta.env.VITE_*` instead of `process.env.*`.
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': '({})',
    global: 'window',
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
      },
    },
  },
});
