import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { CheckRow } from "./CheckRow.tsx";

const oats = {
  name: "Oats",
  category: "Grains",
  quantity: 180,
  unit: "g",
  kcal: 700,
  estCents: 120,
  actualCents: null,
  purchased: false,
  manual: false,
  noLongerInPlan: false,
  pendingSync: false,
};

function setup(
  item: Partial<ComponentProps<typeof CheckRow>["item"]> = {},
  props: Partial<ComponentProps<typeof CheckRow>> = {},
) {
  const onToggle = vi.fn();
  const view = render(
    <CheckRow
      item={{ ...oats, ...item }}
      locale="en-IE"
      onToggle={onToggle}
      {...props}
    />,
  );
  return { ...view, onToggle };
}

describe("CheckRow", () => {
  it("pending: the name, then the quantity and the rounded-up estimate", () => {
    setup();
    expect(screen.getByText("Oats")).toBeTruthy();
    expect(screen.getByText("180 g · ~€1.20")).toBeTruthy();
    expect(
      screen.getByRole<HTMLInputElement>("checkbox", {
        name: "Mark Oats as bought",
      }).checked,
    ).toBe(false);
  });

  it("ticking reports the new state and opens nothing", () => {
    const { onToggle } = setup({}, { onOpen: vi.fn() });
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("purchased: shows the actual price, without the tilde", () => {
    setup({
      name: "Chickpeas",
      quantity: 400,
      purchased: true,
      actualCents: 110,
    });
    expect(screen.getByText("400 g · €1.10")).toBeTruthy();
    expect(
      screen.getByRole<HTMLInputElement>("checkbox", {
        name: "Mark Chickpeas as not bought",
      }).checked,
    ).toBe(true);
  });

  it("purchased without an actual price falls back to the estimate", () => {
    setup({ purchased: true });
    expect(screen.getByText("180 g · ~€1.20")).toBeTruthy();
  });

  it("manual item: says so, and a missing price is a dash", () => {
    setup({
      name: "Kitchen paper",
      manual: true,
      quantity: 1,
      unit: null,
      estCents: null,
    });
    expect(screen.getByText("manual")).toBeTruthy();
    expect(screen.getByText("1 · –")).toBeTruthy();
  });

  it("no longer in plan: flagged in the meta line", () => {
    setup({ name: "Salmon", purchased: true, noLongerInPlan: true });
    expect(screen.getByText("No longer in plan")).toBeTruthy();
  });

  it("offline-pending: says it is waiting to sync", () => {
    setup({ purchased: true, pendingSync: true });
    expect(screen.getByText("Waiting to sync")).toBeTruthy();
  });

  it("the body opens the item's detail, when asked to", () => {
    const onOpen = vi.fn();
    setup({}, { onOpen });
    fireEvent.click(screen.getByRole("button", { name: /Oats/ }));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it("without onOpen the body is plain text", () => {
    setup();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("has no axe violations in any state", async () => {
    const { container } = render(
      <>
        {[
          {},
          { purchased: true, actualCents: 110 },
          { manual: true, estCents: null },
          { purchased: true, noLongerInPlan: true },
          { purchased: true, pendingSync: true },
        ].map((o, i) => (
          <CheckRow
            key={i}
            item={{ ...oats, name: `Item ${i}`, ...o }}
            locale="en-IE"
            onToggle={() => {}}
            onOpen={() => {}}
          />
        ))}
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
