import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { Button } from "./Button.tsx";

describe("Button", () => {
  it("is a native button that won't submit forms by default", () => {
    render(<Button>Add to Meal Plan</Button>);
    const button = screen.getByRole("button", { name: "Add to Meal Plan" });
    expect(button.getAttribute("type")).toBe("button");
  });

  it("keeps an explicit type", () => {
    render(<Button type="submit">Save</Button>);
    expect(screen.getByRole("button").getAttribute("type")).toBe("submit");
  });

  it("calls onClick and is reachable with the keyboard", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Add</Button>);
    const button = screen.getByRole("button");
    button.focus();
    expect(document.activeElement).toBe(button);
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it.each(["primary-green", "primary-orange", "ghost"] as const)(
    "applies the %s variant",
    (variant) => {
      render(<Button variant={variant}>Go</Button>);
      expect(screen.getByRole("button").className).toContain(variant);
    },
  );

  it("defaults to primary-green, md", () => {
    render(<Button>Go</Button>);
    const { className } = screen.getByRole("button");
    expect(className).toContain("primary-green");
    expect(className).toMatch(/md/);
  });

  it("applies the sm size and the block width", () => {
    render(
      <Button size="sm" block>
        Go
      </Button>,
    );
    const { className } = screen.getByRole("button");
    expect(className).toMatch(/sm/);
    expect(className).toMatch(/block/);
  });

  it("shows a decorative icon before the label", () => {
    render(<Button icon="add">Add Item</Button>);
    const button = screen.getByRole("button", { name: "Add Item" });
    const svg = button.firstElementChild!;
    expect(svg.tagName).toBe("svg");
    expect(svg.getAttribute("aria-hidden")).toBe("true");
  });

  it("does nothing when disabled", () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole("button") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("stays focusable but inert while loading, and says it is busy", () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Saving…
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Saving…" });
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect((button as HTMLButtonElement).disabled).toBe(false);
    button.focus();
    expect(document.activeElement).toBe(button);
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("has no axe violations in any state", async () => {
    const { container } = render(
      <>
        <Button>Add to Meal Plan</Button>
        <Button variant="primary-orange">Emphasis</Button>
        <Button variant="ghost" size="sm" icon="filter">
          Filter
        </Button>
        <Button disabled>Disabled</Button>
        <Button loading>Saving…</Button>
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
