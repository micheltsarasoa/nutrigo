import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { GroceryRow } from "./GroceryRow.tsx";

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
  item: Partial<ComponentProps<typeof GroceryRow>["item"]> = {},
  props: Partial<ComponentProps<typeof GroceryRow>> = {},
) {
  const handlers = {
    onToggle: vi.fn(),
    onQuantity: vi.fn(),
    onActual: vi.fn(),
  };
  const view = render(
    <GroceryRow
      item={{ ...oats, ...item }}
      locale="en-IE"
      {...handlers}
      {...props}
    />,
  );
  return { ...view, ...handlers };
}

describe("GroceryRow", () => {
  it("pending: shows the item, its estimate rounded up to packs, and Pending", () => {
    setup();
    expect(screen.getByText("Oats")).toBeTruthy();
    expect(screen.getByText("Grains")).toBeTruthy();
    expect(screen.getByText("700")).toBeTruthy();
    expect(screen.getByText("~€1.20")).toBeTruthy();
    expect(screen.getByText("Pending")).toBeTruthy();
    expect(
      screen.getByRole<HTMLInputElement>("checkbox", {
        name: "Mark Oats as bought",
      }).checked,
    ).toBe(false);
  });

  it("ticking reports the new state", () => {
    const { onToggle } = setup();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("changes the quantity with the stepper while pending", () => {
    const { onQuantity } = setup();
    expect(
      screen.getByRole("spinbutton", { name: "Quantity of Oats" }),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Increase Quantity of Oats" }),
    );
    expect(onQuantity).toHaveBeenCalledWith(190);
  });

  it("bought: the name is ticked off, the quantity is fixed, and the actual price is entered", () => {
    const { onActual, onToggle } = setup({
      name: "Chickpeas",
      purchased: true,
      estCents: 105,
      actualCents: 110,
    });
    const box = screen.getByRole<HTMLInputElement>("checkbox", {
      name: "Mark Chickpeas as not bought",
    });
    expect(box.checked).toBe(true);
    expect(screen.queryByRole("spinbutton")).toBeNull();
    expect(screen.getByText("Bought")).toBeTruthy();
    const price = screen.getByRole<HTMLInputElement>("textbox", {
      name: "Actual price of Chickpeas",
    });
    expect(price.value).toBe("1.10");
    fireEvent.change(price, { target: { value: "1.25" } });
    expect(onActual).toHaveBeenCalledWith(125);
    fireEvent.click(box);
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it("bought without an actual price yet: the box is empty", () => {
    setup({ purchased: true });
    expect(
      screen.getByRole<HTMLInputElement>("textbox", {
        name: "Actual price of Oats",
      }).value,
    ).toBe("");
  });

  it("a manual item says so and has no calories", () => {
    setup({
      name: "Kitchen paper",
      manual: true,
      quantity: 1,
      unit: null,
      kcal: null,
      estCents: null,
    });
    expect(screen.getByText("manual")).toBeTruthy();
    expect(screen.getAllByText("–")).toHaveLength(2);
  });

  it("AC-4: no price shows a dash for the cost", () => {
    setup({ estCents: null });
    expect(screen.getByText("–")).toBeTruthy();
    expect(screen.queryByText(/~€/)).toBeNull();
  });

  it("no longer in plan: flagged, still tickable", () => {
    setup({ name: "Salmon", purchased: true, noLongerInPlan: true });
    expect(screen.getByText("No longer in plan")).toBeTruthy();
  });

  it("offline-pending: says it is waiting to sync", () => {
    setup({ purchased: true, pendingSync: true });
    expect(screen.getByText("Waiting to sync")).toBeTruthy();
  });

  it("has no axe violations in any state", async () => {
    const { container } = render(
      <>
        {[
          {},
          { purchased: true, actualCents: 110 },
          { manual: true, kcal: null, estCents: null },
          { purchased: true, noLongerInPlan: true },
          { purchased: true, pendingSync: true },
        ].map((o, i) => (
          <GroceryRow
            key={i}
            item={{ ...oats, name: `Item ${i}`, ...o }}
            locale="en-IE"
            onToggle={() => {}}
            onQuantity={() => {}}
            onActual={() => {}}
          />
        ))}
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
