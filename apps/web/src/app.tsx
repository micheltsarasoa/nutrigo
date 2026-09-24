import { lazy, Suspense } from "react";
import {
  AppShell,
  type NavItem,
} from "./design-system/organisms/AppShell/index.ts";

// Dev and preview builds only (ADR-0006). In production this is a constant false,
// so the bundler drops the playground chunk entirely.
const PlaygroundPage =
  import.meta.env.DEV || import.meta.env.VITE_PLAYGROUND === "true"
    ? lazy(() => import("./playground/playground-page.tsx"))
    : null;

// frontend.md §6. Plan and Groceries take an optional ISO week (2026-W40).
const NAV: NavItem[] = [
  { href: "/", icon: "dashboard", label: "Today" },
  { href: "/recipes", icon: "menu", label: "Recipes" },
  { href: "/plan", icon: "calendar", label: "Plan" },
  { href: "/groceries", icon: "items", label: "Groceries" },
  { href: "/targets", icon: "time", label: "Targets" },
];
const ROUTES: [RegExp, string][] = [
  [/^\/$/, "Today"],
  [/^\/recipes$/, "Recipes"],
  [/^\/plan(\/\d{4}-W\d{2})?$/, "Plan"],
  [/^\/groceries(\/\d{4}-W\d{2})?$/, "Groceries"],
  [/^\/targets$/, "Targets"],
];

/** `wide`: the viewport is at least --breakpoint-desktop (1200 px). */
export function App({ path, wide }: { path: string; wide: boolean }) {
  if (path.startsWith("/playground")) {
    return PlaygroundPage ? (
      <Suspense>
        <PlaygroundPage path={path} />
      </Suspense>
    ) : (
      <NotFound />
    );
  }
  const title = ROUTES.find(([pattern]) => pattern.test(path))?.[1];
  // On a not-found page no tab is current, even under /recipes/…
  return (
    <AppShell
      items={NAV}
      current={title ? path : ""}
      layout={wide ? "sidebar" : "tabs"}
    >
      {title ? <Placeholder title={title} /> : <NotFound />}
    </AppShell>
  );
}

// Each page replaces its placeholder when its feature lands.
function Placeholder({ title }: { title: string }) {
  return (
    <main>
      <h1>{title}</h1>
    </main>
  );
}

export function NotFound() {
  return <Placeholder title="Page not found" />;
}
