import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { Segmented } from "./Segmented.tsx";

const VIEWS = [
  { value: "list", icon: "steps", label: "List view" },
  { value: "grid", icon: "dashboard", label: "Grid view" },
] as const;

describe("Segmented", () => {
  it("is a radio group named by its label, one radio per option, each named", () => {
    render(
      <Segmented
        label="View"
        options={VIEWS}
        value="list"
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole("radiogroup", { name: "View" })).toBeTruthy();
    expect(
      screen.getAllByRole("radio").map((r) => r.getAttribute("aria-label")),
    ).toEqual(["List view", "Grid view"]);
  });

  it("checks the option matching value", () => {
    render(
      <Segmented
        label="View"
        options={VIEWS}
        value="grid"
        onChange={() => {}}
      />,
    );
    expect(
      (screen.getByRole("radio", { name: "Grid view" }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    expect(
      (screen.getByRole("radio", { name: "List view" }) as HTMLInputElement)
        .checked,
    ).toBe(false);
  });

  it("reports the picked value", () => {
    const onChange = vi.fn();
    render(
      <Segmented
        label="View"
        options={VIEWS}
        value="list"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Grid view" }));
    expect(onChange).toHaveBeenCalledWith("grid");
  });

  it("is one tab stop: native radios share a name, so arrow keys move between them", () => {
    render(
      <Segmented
        label="View"
        options={VIEWS}
        value="list"
        onChange={() => {}}
      />,
    );
    const [a, b] = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(a!.name).toBeTruthy();
    expect(a!.name).toBe(b!.name);
    a!.focus();
    expect(document.activeElement).toBe(a);
  });

  it("two groups on a page don't share a name", () => {
    render(
      <>
        <Segmented
          label="View"
          options={VIEWS}
          value="list"
          onChange={() => {}}
        />
        <Segmented
          label="Other"
          options={VIEWS}
          value="list"
          onChange={() => {}}
        />
      </>,
    );
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios[0]!.name).not.toBe(radios[2]!.name);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <Segmented
        label="View"
        options={VIEWS}
        value="list"
        onChange={() => {}}
      />,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
