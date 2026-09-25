import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
      <main>
        <h1>Page</h1>
      </main>
    </AppShell>,
  );
}

const activeLink = () =>
  screen
    .getAllByRole("link")
    .filter((a) => a.getAttribute("aria-current") === "page");

// The settings entry (SPEC-008 §4 Q-A): a button in the banner, outside the nav.
function shellWithSettings(
  layout: (typeof APP_SHELL_LAYOUTS)[number],
  props: { onSettings?: () => void; settingsOpen?: boolean } = {},
) {
  return render(
    <AppShell items={items} current="/" layout={layout} {...props}>
      <main>
        <h1>Page</h1>
      </main>
    </AppShell>,
  );
}

describe("AppShell", () => {
  it("has the tab-bar and sidebar layouts", () => {
    expect(APP_SHELL_LAYOUTS).toEqual(["tabs", "sidebar"]);
  });

  it.each(APP_SHELL_LAYOUTS)(
    "%s: one Main navigation with the 5 destinations, then the page",
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
      // The page brings its own <main>; the shell doesn't add another.
      const main = screen.getByRole("main");
      expect(within(main).getByRole("heading", { name: "Page" })).toBeTruthy();
      expect(nav.contains(main)).toBe(false);
    },
  );

  it("takes another name for its navigation", () => {
    render(
      <AppShell items={items} current="/" layout="tabs" label="Main, tab bar">
        <p>Page</p>
      </AppShell>,
    );
    expect(
      screen.getByRole("navigation", { name: "Main, tab bar" }),
    ).toBeTruthy();
  });

  it("sidebar: shows the NutriGo lockup in the banner landmark; the tab bar doesn't", () => {
    const { unmount } = shell("sidebar");
    const banner = screen.getByRole("banner");
    expect(within(banner).getByText("NutriGo")).toBeTruthy();
    expect(
      within(banner).getByRole("navigation", { name: "Main" }),
    ).toBeTruthy();
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

describe("AppShell settings entry", () => {
  it("without onSettings, neither layout has a Settings button, and tabs still has no banner", () => {
    const { unmount } = shellWithSettings("sidebar");
    expect(screen.queryByRole("button", { name: "Settings" })).toBeNull();
    unmount();

    shellWithSettings("tabs");
    expect(screen.queryByRole("button", { name: "Settings" })).toBeNull();
    expect(screen.queryByRole("banner")).toBeNull();
  });

  it.each(APP_SHELL_LAYOUTS)(
    "%s: with onSettings, exactly one Settings button in the banner, not in Main nav, nav keeps its 5 items",
    (layout) => {
      shellWithSettings(layout, { onSettings: vi.fn() });

      const buttons = screen.getAllByRole("button", { name: "Settings" });
      expect(buttons).toHaveLength(1);
      const button = screen.getByRole("button", { name: "Settings" });
      expect(button.getAttribute("aria-haspopup")).toBe("dialog");
      expect(button.getAttribute("aria-expanded")).toBe("false");

      const banner = screen.getByRole("banner");
      expect(within(banner).getByRole("button", { name: "Settings" })).toBe(
        button,
      );

      const nav = screen.getByRole("navigation", { name: "Main" });
      expect(
        within(nav).queryByRole("button", { name: "Settings" }),
      ).toBeNull();
      expect(within(nav).getAllByRole("listitem")).toHaveLength(5);
      expect(within(nav).getAllByRole("link")).toHaveLength(5);
    },
  );

  it("tabs: the banner comes before the page content in document order, and still no NutriGo text", () => {
    shellWithSettings("tabs", { onSettings: vi.fn() });

    const banner = screen.getByRole("banner");
    const main = screen.getByRole("main");
    expect(
      banner.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.queryByText("NutriGo")).toBeNull();
  });

  it("sidebar: the Settings button comes after the nav inside the banner", () => {
    shellWithSettings("sidebar", { onSettings: vi.fn() });

    const banner = screen.getByRole("banner");
    const nav = within(banner).getByRole("navigation", { name: "Main" });
    const button = within(banner).getByRole("button", { name: "Settings" });
    expect(
      nav.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("calls onSettings once when the Settings button is clicked", () => {
    const onSettings = vi.fn();
    shellWithSettings("tabs", { onSettings });

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(onSettings).toHaveBeenCalledTimes(1);
  });

  it("settingsOpen sets aria-expanded to true", () => {
    shellWithSettings("tabs", { onSettings: vi.fn(), settingsOpen: true });

    expect(
      screen
        .getByRole("button", { name: "Settings" })
        .getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("the Settings button is focusable", () => {
    shellWithSettings("tabs", { onSettings: vi.fn() });

    const button = screen.getByRole("button", { name: "Settings" });
    button.focus();
    expect(document.activeElement).toBe(button);
  });

  it.each(APP_SHELL_LAYOUTS)(
    "%s: with onSettings and settingsOpen, has no axe violations",
    async (layout) => {
      const { container } = shellWithSettings(layout, {
        onSettings: vi.fn(),
        settingsOpen: true,
      });
      expect(await axeViolations(container)).toEqual([]);
    },
  );
});
