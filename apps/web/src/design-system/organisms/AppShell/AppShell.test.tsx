import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { AppShell, APP_SHELL_LAYOUTS, type NavItem } from "./AppShell.tsx";

const items: NavItem[] = [
  { href: "/", icon: "dashboard", label: "Today" },
  { href: "/recipes", icon: "menu", label: "Recipes" },
  { href: "/plan", icon: "calendar", label: "Plan" },
  { href: "/groceries", icon: "items", label: "Groceries" },
  { href: "/targets", icon: "time", label: "Targets" },
];

function shell(layout: (typeof APP_SHELL_LAYOUTS)[number], current = "/") {
  return render(
    <AppShell items={items} current={current} layout={layout}>
      <h1>Page</h1>
    </AppShell>,
  );
}

const activeLink = () =>
  screen
    .getAllByRole("link")
    .filter((a) => a.getAttribute("aria-current") === "page");

describe("AppShell", () => {
  it("has the tab-bar and sidebar layouts", () => {
    expect(APP_SHELL_LAYOUTS).toEqual(["tabs", "sidebar"]);
  });

  it.each(APP_SHELL_LAYOUTS)(
    "%s: one Main navigation with the 5 destinations, and the page in <main>",
    (layout) => {
      shell(layout);
      const nav = screen.getByRole("navigation", { name: "Main" });
      const links = within(nav).getAllByRole("link");
      expect(links.map((a) => a.textContent)).toEqual([
        "Today",
        "Recipes",
        "Plan",
        "Groceries",
        "Targets",
      ]);
      expect(links.map((a) => a.getAttribute("href"))).toEqual(
        items.map((i) => i.href),
      );
      expect(within(nav).getAllByRole("listitem")).toHaveLength(5);
      const main = screen.getByRole("main");
      expect(within(main).getByRole("heading", { name: "Page" })).toBeTruthy();
    },
  );

  it("sidebar: shows the NutriGo lockup; the tab bar doesn't", () => {
    const { unmount } = shell("sidebar");
    expect(screen.getByText("NutriGo")).toBeTruthy();
    unmount();
    shell("tabs");
    expect(screen.queryByText("NutriGo")).toBeNull();
  });

  it.each([
    ["/", "Today"],
    ["/recipes", "Recipes"],
    ["/recipes/12", "Recipes"],
    ["/plan/2026-W40", "Plan"],
    ["/targets", "Targets"],
  ])("marks %s as %s, and only that one", (current, label) => {
    shell("tabs", current);
    expect(activeLink().map((a) => a.textContent)).toEqual([label]);
  });

  it("marks nothing on an unknown page, and a prefix must end at a /", () => {
    shell("tabs", "/recipesque");
    expect(activeLink()).toEqual([]);
  });

  it("is reachable with the keyboard", () => {
    shell("tabs");
    const link = screen.getByRole("link", { name: "Plan" });
    link.focus();
    expect(document.activeElement).toBe(link);
  });

  it.each(APP_SHELL_LAYOUTS)("%s: has no axe violations", async (layout) => {
    const { container } = shell(layout, "/plan/2026-W40");
    expect(await axeViolations(container)).toEqual([]);
  });
});
