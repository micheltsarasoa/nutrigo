import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./app.tsx";
import { axeViolations } from "./axe.ts";

describe("App", () => {
  it("shows the NutriGo heading in the main landmark", () => {
    render(<App />);
    expect(
      within(screen.getByRole("main")).getByRole("heading", {
        level: 1,
        name: "NutriGo",
      }),
    ).toBeTruthy();
  });

  it("has no axe violations", async () => {
    const { container } = render(<App />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
