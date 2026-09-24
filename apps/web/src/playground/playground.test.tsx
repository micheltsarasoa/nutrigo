import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../axe.ts";
import { Playground } from "./playground.tsx";
import type { Demo } from "./types.ts";

const demos: Demo[] = [
  { title: "Card", level: "molecule", states: { default: <p>card</p> } },
  {
    title: "Button",
    level: "atom",
    states: {
      primary: <button>Save</button>,
      disabled: <button disabled>Save</button>,
    },
  },
  {
    title: "NavLink / TabBarItem",
    level: "atom",
    states: { active: <a href="#x">Today</a> },
  },
];

describe("Playground index", () => {
  it("lists every component under its level, atoms first, linking to /playground/<level>/<name>", () => {
    render(<Playground demos={demos} path="/playground" />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Playground" }),
    ).toBeTruthy();
    const [atoms, molecules] = screen.getAllByRole("region");
    expect(within(atoms!).getByRole("heading", { name: "Atoms" })).toBeTruthy();
    expect(
      within(atoms!).getByRole("link", { name: "Button" }).getAttribute("href"),
    ).toBe("/playground/atom/button");
    expect(
      within(atoms!)
        .getByRole("link", { name: "NavLink / TabBarItem" })
        .getAttribute("href"),
    ).toBe("/playground/atom/navlink-tabbaritem");
    expect(
      within(molecules!)
        .getByRole("link", { name: "Card" })
        .getAttribute("href"),
    ).toBe("/playground/molecule/card");
  });

  it("says so when there are no components yet", () => {
    render(<Playground demos={[]} path="/playground/" />);
    expect(screen.getByText("No components yet.")).toBeTruthy();
    expect(screen.queryAllByRole("region")).toEqual([]);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <Playground demos={demos} path="/playground" />,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Playground component page", () => {
  it("shows the component title and every state under its own heading", () => {
    render(<Playground demos={demos} path="/playground/atom/button" />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Button" }),
    ).toBeTruthy();
    const primary = screen.getByRole("region", { name: "primary" });
    expect(within(primary).getByRole("button", { name: "Save" })).toBeTruthy();
    expect(
      within(screen.getByRole("region", { name: "disabled" })).getByRole(
        "button",
      ),
    ).toHaveProperty("disabled", true);
    expect(
      screen.getByRole("link", { name: "All components" }).getAttribute("href"),
    ).toBe("/playground");
  });

  it("shows not found for an unknown component", () => {
    render(<Playground demos={demos} path="/playground/atom/nope" />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Component not found" }),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "All components" })).toBeTruthy();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <Playground demos={demos} path="/playground/atom/button" />,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
