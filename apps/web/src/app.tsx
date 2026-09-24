import { lazy, Suspense } from "react";

// Dev and preview builds only (ADR-0006). In production this is a constant false,
// so the bundler drops the playground chunk entirely.
const PlaygroundPage =
  import.meta.env.DEV || import.meta.env.VITE_PLAYGROUND === "true"
    ? lazy(() => import("./playground/playground-page.tsx"))
    : null;

export function App({ path }: { path: string }) {
  if (path.startsWith("/playground")) {
    return PlaygroundPage ? (
      <Suspense>
        <PlaygroundPage path={path} />
      </Suspense>
    ) : (
      <NotFound />
    );
  }
  return (
    <main>
      <h1>NutriGo</h1>
    </main>
  );
}

export function NotFound() {
  return (
    <main>
      <h1>Page not found</h1>
    </main>
  );
}
