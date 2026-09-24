import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App, NotFound } from "./app.tsx";
import { axeViolations } from "./axe.ts";

describe("App", () => {
  it("shows the NutriGo heading in the main landmark", () => {
    render(<App path="/" />);
    expect(
      within(screen.getByRole("main")).getByRole("heading", {
        level: 1,
        name: "NutriGo",
      }),
    ).toBeTruthy();
  });

  it("has no axe violations", async () => {
    const { container } = render(<App path="/" />);
    expect(await axeViolations(container)).toEqual([]);
  });

  it("loads the playground on /playground in dev and preview builds", async () => {
    render(<App path="/playground" />);
    // The lazy chunk loads every *.playground.tsx; under coverage that takes over findBy's default 1 s.
    expect(
      await screen.findByRole(
        "heading",
        { level: 1, name: "Playground" },
        { timeout: 5000 },
      ),
    ).toBeTruthy();
  });
});

describe("NotFound", () => {
  it("shows a page-not-found heading in the main landmark (production /playground, SPEC-001 AC-4)", () => {
    render(<NotFound />);
    expect(
      within(screen.getByRole("main")).getByRole("heading", {
        level: 1,
        name: "Page not found",
      }),
    ).toBeTruthy();
  });
});
