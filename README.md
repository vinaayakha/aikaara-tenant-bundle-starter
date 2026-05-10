# tenant-bundle-starter

Starter template for an Aikaara **per-tenant component-bundle repo**.

When a new tenant onboards, Aikaara generates a fresh repo from this
template (named `<slug>-bundles`) under the org their GitHub token can
write to. The hosted chat shell pulls bundles from that repo via S3 and
patches the tenant's descriptor.

## Layout

```
package.json          dependencies for the SDK + react
vite.config.ts        IIFE build, one entry per screen
src/screens/
  login.tsx           your screen component
  login.entry.tsx     mounts the component via initRemoteAuthor
```

## Adding a screen

1. Add `src/screens/<name>.tsx`.
2. Add `src/screens/<name>.entry.tsx` that calls `initRemoteAuthor(...)`.
3. Push to `main` — the publisher (or webhook) builds and uploads it.
   The descriptor slot is `screen:<name>`.

## Local dev with the shell

Clone this repo as `<slug>-bundles` next to the shell, e.g.

```
~/aikaara/
  aikaara-hosted-shell/
  tenant-bundles/
    bandhan-itr-bundles/      ← this repo
```

Then `npm install && npm run build` here. The shell's dev server serves
`dist/login.iife.js` at `/tenant-bundles/<slug>/login.iife.js` so your
descriptor's `scriptUrl` can point at the same origin.

Override the parent dir with `AIKAARA_TENANT_BUNDLES_DIR` on the shell.
