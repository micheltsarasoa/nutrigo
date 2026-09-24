import { afterEach, describe, expect, it, vi } from "vitest";
import { interceptLinks, navigate, subscribe } from "./router.ts";

function link(href: string, attrs: Record<string, string> = {}) {
  const a = document.createElement("a");
  a.href = href;
  for (const [k, v] of Object.entries(attrs)) a.setAttribute(k, v);
  a.append(document.createElement("span"));
  document.body.append(a);
  return a;
}

// Returns whether the router took the click; then cancels it so jsdom doesn't try to navigate.
function click(target: Element, init: MouseEventInit = {}) {
  let taken = false;
  const last = (e: Event) => {
    taken = e.defaultPrevented;
    e.preventDefault();
  };
  addEventListener("click", last, { once: true });
  target.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true, ...init }),
  );
  return taken;
}

describe("router", () => {
  const stop = interceptLinks();

  afterEach(() => {
    document.body.replaceChildren();
    history.replaceState(null, "", "/");
  });

  it("navigate() pushes the path and notifies subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    navigate("/recipes");
    expect(location.pathname).toBe("/recipes");
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it("notifies subscribers on back and forward", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    dispatchEvent(new PopStateEvent("popstate"));
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it("turns a click on an in-app link (or anything inside it) into navigate()", () => {
    expect(click(link("/plan/2026-W40").firstElementChild!)).toBe(true);
    expect(location.pathname).toBe("/plan/2026-W40");
  });

  it.each([
    ["a new-tab click", "/recipes", {}, { ctrlKey: true }],
    ["a middle click", "/recipes", {}, { button: 1 }],
    ["target=_blank", "/recipes", { target: "_blank" }, {}],
    ["a download", "/recipes", { download: "" }, {}],
    ["another origin", "https://example.org/recipes", {}, {}],
    ["an in-page #anchor", "#plan", {}, {}],
  ])("leaves %s to the browser", (_, href, attrs, init) => {
    expect(click(link(href, attrs), init)).toBe(false);
    expect(location.pathname).toBe("/");
  });

  it("stops intercepting when asked", () => {
    stop();
    expect(click(link("/recipes"))).toBe(false);
  });
});
