import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { SearchField } from "./SearchField.tsx";

describe("SearchField", () => {
  it("is a native search box named by its label", () => {
    render(<SearchField label="Search menu" />);
    const box = screen.getByRole("searchbox", { name: "Search menu" });
    expect(box.getAttribute("type")).toBe("search");
  });

  it("uses the label as placeholder unless given one", () => {
    const { rerender } = render(<SearchField label="Search menu" />);
    expect(screen.getByRole("searchbox").getAttribute("placeholder")).toBe(
      "Search menu",
    );
    rerender(<SearchField label="Search menu" placeholder="Pasta, salad…" />);
    expect(screen.getByRole("searchbox").getAttribute("placeholder")).toBe(
      "Pasta, salad…",
    );
  });

  it("passes typing through to onChange", () => {
    const onChange = vi.fn();
    render(<SearchField label="Search menu" onChange={onChange} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "pasta" },
    });
    expect(onChange).toHaveBeenCalledOnce();
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe(
      "pasta",
    );
  });

  it("wraps the input in a label, so clicking the icon focuses it", () => {
    render(<SearchField label="Search menu" />);
    const box = screen.getByRole("searchbox");
    expect(box.closest("label")).not.toBeNull();
    expect(box.closest("label")!.querySelector("svg")).not.toBeNull();
    box.focus();
    expect(document.activeElement).toBe(box);
  });

  it("defaults to md, not filled, and offers sm and filled", () => {
    const { container, rerender } = render(<SearchField label="Search" />);
    const field = () => container.firstElementChild!.getAttribute("class")!;
    expect(field()).toMatch(/md/);
    expect(field()).not.toMatch(/filled/);
    rerender(<SearchField label="Search" size="sm" filled />);
    expect(field()).toMatch(/sm/);
    expect(field()).toMatch(/filled/);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <>
        <SearchField label="Search menu" />
        <SearchField label="Search item" size="sm" filled />
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
