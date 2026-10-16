import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { MoneyField } from "./MoneyField.tsx";

const box = () => screen.getByRole("textbox", { name: "Price" });
const type = (value: string) => fireEvent.change(box(), { target: { value } });

describe("MoneyField", () => {
  it("is a decimal text box named by its label, with a € suffix as its description", () => {
    render(<MoneyField label="Price" value={null} onChange={() => {}} />);
    expect(box().getAttribute("inputmode")).toBe("decimal");
    expect(box().getAttribute("aria-describedby")).toBe(
      screen.getByText("€").id,
    );
  });

  it("shows integer cents as euros in the locale (fr-FR by default)", () => {
    const { rerender } = render(
      <MoneyField label="Price" value={300} onChange={() => {}} />,
    );
    expect((box() as HTMLInputElement).value).toBe("3,00");
    rerender(
      <MoneyField
        label="Price"
        value={120}
        locale="en-IE"
        onChange={() => {}}
      />,
    );
    expect((box() as HTMLInputElement).value).toBe("1.20");
  });

  it("is empty for no amount", () => {
    render(<MoneyField label="Price" value={null} onChange={() => {}} />);
    expect((box() as HTMLInputElement).value).toBe("");
  });

  it.each([
    ["3,5", 350],
    ["3.50", 350],
    ["12", 1200],
    ["0,05", 5],
    ["1,15", 115],
    ["  2,40 ", 240],
  ])("typing %s gives %d cents", (text, cents) => {
    const onChange = vi.fn();
    render(<MoneyField label="Price" value={null} onChange={onChange} />);
    type(text);
    expect(onChange).toHaveBeenLastCalledWith(cents);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("clearing the box gives null", () => {
    const onChange = vi.fn();
    render(<MoneyField label="Price" value={300} onChange={onChange} />);
    type("");
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it.each(["3,0,0", "abc", "1,005", "-2", "€3"])(
    "rejects %s: an alert, the text kept, no change reported",
    (text) => {
      const onChange = vi.fn();
      render(<MoneyField label="Price" value={null} onChange={onChange} />);
      type(text);
      expect(screen.getByRole("alert").textContent).toBe(
        "Enter an amount like 3,50.",
      );
      expect(box().getAttribute("aria-invalid")).toBe("true");
      expect((box() as HTMLInputElement).value).toBe(text);
      expect(onChange).not.toHaveBeenCalled();
    },
  );

  it("tidies a valid amount on blur (3,5 becomes 3,50)", () => {
    const Harness = () => {
      const [v, setV] = useState<number | null>(null);
      return <MoneyField label="Price" value={v} onChange={setV} />;
    };
    render(<Harness />);
    type("3,5");
    fireEvent.blur(box());
    expect((box() as HTMLInputElement).value).toBe("3,50");
  });

  it("follows a value changed from outside", () => {
    const { rerender } = render(
      <MoneyField label="Price" value={100} onChange={() => {}} />,
    );
    rerender(<MoneyField label="Price" value={250} onChange={() => {}} />);
    expect((box() as HTMLInputElement).value).toBe("2,50");
  });

  it("shows an error given by the parent", () => {
    render(
      <MoneyField
        label="Price"
        value={null}
        error="Enter a pack size too"
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole("alert").textContent).toBe("Enter a pack size too");
  });

  it("can be disabled", () => {
    render(
      <MoneyField label="Price" value={120} disabled onChange={() => {}} />,
    );
    expect((box() as HTMLInputElement).disabled).toBe(true);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <MoneyField label="Price" value={300} onChange={() => {}} />,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
