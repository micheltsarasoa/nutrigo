# ADR-0012: Native routing (no React Router) and `vite-plugin-pwa` for the service worker

- Status: Accepted (2026-09-24)
- Date: 2026-09-24
- Deciders: Owner

## Context
SPEC-001 (issue #32) needs the app shell to navigate between five destinations and to install as a PWA (AC-8). `frontend.md` §5 planned **React Router (data routers)** for routing, and the stack table in `CLAUDE.md` already names `vite-plugin-pwa`. Neither package is installed yet. CLAUDE.md rule 1 (Ponytail, ADR-0003) allows a new dependency only with an ADR, so both choices are recorded here before any code uses them.

**Routing.** Today there are five routes: `/` (Today), `/recipes`, `/plan/:week`, `/groceries/:week` and `/targets` (§6), plus the dev-only `/playground`. Pages fetch their own data (§2), so nothing needs a router's data loaders yet.

**Service worker.** An installable PWA needs a manifest, icons and a service worker. The worker has to precache the built app. The built app is made of **hashed file names that change on every build** (`assets/index-<hash>.js`, the Poppins `woff2` files, the CSS), and it has to update cleanly when a new build ships.

## Decision
1. **Routing stays native.** It uses the History API (`history.pushState` plus the `popstate` event) and a tiny path matcher in the app. There's no React Router. If data loaders, nested layouts or route-level code splitting become a real need, React Router gets added then, with a new ADR.
2. **`vite-plugin-pwa` (v1.x, `generateSW`)** is added as a dev dependency of `@nutrigo/web`. It generates `manifest.webmanifest`, `sw.js` (Workbox) and a small `registerSW.js` at build time. The config lives in `apps/web/vite.config.ts`:
   - `registerType: "autoUpdate"` with `injectRegister: "auto"`. We don't import the virtual module, so the plugin injects `<script src="/registerSW.js">` and turns on `skipWaiting` and `clientsClaim`. `main.tsx` is unchanged.
   - Precache `**/*.{js,css,html,woff2}` plus the manifest icons, the favicon and the apple-touch icon. The self-hosted Poppins fonts go in the precache so the app works offline.
   - `navigateFallbackDenylist: [/^\/api\//, /^\/playground/]`. API calls and the playground never get the cached `index.html`.
   - `theme_color` (green) and `background_color` (cream, the page background) are read from `docs/design-system/tokens.json`. A three-line inline plugin injects the `theme-color` meta from the same token, so there's no raw colour in the source.
   - The playground build (`--mode playground`, `dist-playground/`) sets `disable: true`, so it has no service worker, no manifest and no register script. It's a review build: a cached worker could show the owner a stale component after a change.
   - The dev server has no service worker either (the plugin's `devOptions` are off by default).

## Alternatives considered
| Option | Pros | Cons |
|---|---|---|
| React Router (data routers), as `frontend.md` planned | Standard; loaders, nested routes, lazy routes | About 5 routes don't need it; a dependency and its concepts to learn for a `switch` on the path |
| **Native History API + matcher** (chosen) | No dependency; about 20 lines; easy to test | We write link interception and param parsing ourselves; loaders would have to be rebuilt if we ever need them |
| Hand-written `sw.js` with a precache list | No dependency | The list of hashed assets changes on every build, so it needs a build step to write it anyway; revisioning, cleanup of old caches and the update flow (`skipWaiting`, `clientsClaim`, navigation fallback) are easy to get subtly wrong, and a broken SW sticks on the phone |
| `workbox-build` / `workbox-cli` called from a script | The same Workbox output | A second build step and config to maintain next to Vite; the plugin already wires Workbox into the Vite build and injects the manifest link and register script |
| **`vite-plugin-pwa`** (chosen) | One config block; manifest + SW + registration from the Vite build; already named in the stack | About 300 transitive dev packages (Workbox pulls in Rollup and Babel); build-time only, nothing extra ships to the browser beyond Workbox's runtime |

## Consequences
- `frontend.md` §5 now says native routing, and the §1 tree no longer lists `src/sw.ts`: the worker is generated into `dist/sw.js` at build time.
- The production build serves `/manifest.webmanifest`, `/sw.js`, `/registerSW.js`, `/workbox-<hash>.js` and the icons from `apps/web/public/`. The API's static handler already serves them with the right types (`application/manifest+json`, `text/javascript`) and no long-lived `Cache-Control`. Browsers revalidate `sw.js` on each update check.
- **Updates:** a new build's worker takes over immediately (`skipWaiting` + `clientsClaim`), and old caches are cleaned up. Tabs that are already open are **not reloaded** automatically. That would need the `virtual:pwa-register` module (workbox-window) in `main.tsx`. They get the new version on their next navigation or reload. Add the prompt or auto-reload later if it matters.
- The icons (192, 512, maskable 512, apple-touch 180, `favicon.ico`) are PNGs rendered once from the Logo mark on the design's "Icon only" tile. They're regenerated by hand if the logo changes.
- A service worker only runs over HTTPS or on `localhost`. On the phone that's the Tailscale URL (ADR-0009).
- Offline data (the shopping-list queue, runtime caching of API reads) is out of scope here. It comes with the Sprint 4 spec.
