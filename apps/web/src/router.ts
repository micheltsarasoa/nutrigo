import { useSyncExternalStore } from "react";

// ADR-0012: the History API and one click listener instead of a router.
// navigate() fires popstate itself, so one event covers links, Back and Forward.

export function navigate(to: string) {
  history.pushState(null, "", to);
  scrollTo(0, 0);
  dispatchEvent(new PopStateEvent("popstate"));
}

export function subscribe(listener: () => void) {
  addEventListener("popstate", listener);
  return () => removeEventListener("popstate", listener);
}

export const usePath = () =>
  useSyncExternalStore(subscribe, () => location.pathname);

// Plain <a href> clicks inside the app become navigate(). New-tab clicks, other
// origins, downloads and in-page #anchors stay with the browser.
function onClick(e: MouseEvent) {
  if (e.defaultPrevented || e.button !== 0) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = (e.target as Element).closest("a");
  if (!a || a.target || a.hasAttribute("download")) return;
  if (a.origin !== location.origin) return;
  if (a.pathname === location.pathname && a.hash) return;
  e.preventDefault();
  navigate(a.pathname + a.search + a.hash);
}

export function interceptLinks() {
  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}
