import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App, NotFound } from "./app.tsx";
import { axeViolations } from "./axe.ts";

const heading = () =>
  within(screen.getByRole("main")).getByRole("heading", { level: 1 });
const current = () =>
  within(screen.getByRole("navigation", { name: "Main" }))
    .getAllByRole("link")
    .filter((a) => a.getAttribute("aria-current") === "page")
    .map((a) => a.textContent);

describe("App", () => {
  it.each([
    ["/", "Today"],
    ["/recipes", "Recipes"],
    ["/plan", "Plan"],
    ["/plan/2026-W40", "Plan"],
    ["/groceries", "Groceries"],
    ["/groceries/2026-W40", "Groceries"],
    ["/targets", "Targets"],
  ])("%s shows the %s page inside the shell, marked current", (path, name) => {
    render(<App path={path} wide={false} />);
    expect(heading().textContent).toBe(name);
    expect(current()).toEqual([name]);
  });

  it.each(["/nope", "/recipes/", "/plan/next-week", "/plan/2026-W40/x"])(
    "%s shows Page not found, still inside the shell",
    (path) => {
      render(<App path={path} wide={false} />);
      expect(heading().textContent).toBe("Page not found");
      expect(current()).toEqual([]);
    },
  );

  it("uses the bottom tab bar below 1200 px and the sidebar from 1200 px (SPEC-001 AC-10)", () => {
    const { rerender } = render(<App path="/" wide={false} />);
    expect(screen.queryByText("NutriGo")).toBeNull();
    rerender(<App path="/" wide />);
    expect(screen.getByText("NutriGo")).toBeTruthy();
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
  });

  it.each([false, true])("has no axe violations (wide: %s)", async (wide) => {
    const { container } = render(<App path="/plan" wide={wide} />);
    expect(await axeViolations(container)).toEqual([]);
  });

  it("loads the playground on /playground in dev and preview builds, outside the shell", async () => {
    render(<App path="/playground" wide={false} />);
    // The lazy chunk loads every *.playground.tsx; under coverage that takes over findBy's default 1 s.
    expect(
      await screen.findByRole(
        "heading",
        { level: 1, name: "Playground" },
        { timeout: 5000 },
      ),
    ).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: "Main" })).toBeNull();
  });
});

describe("NotFound", () => {
  it("shows a page-not-found heading in the main landmark (production /playground, SPEC-001 AC-4)", () => {
    render(<NotFound />);
    expect(heading().textContent).toBe("Page not found");
  });
});
