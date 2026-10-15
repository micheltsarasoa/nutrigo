import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { TargetsForm } from "./TargetsForm.tsx";

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const save = () => screen.getByRole("button", { name: "Save targets" });
const filled = { kcal: 2000, carbs: 250, protein: 120, fat: 70 };

describe("TargetsForm", () => {
  it("is a card titled Daily targets with a hint and four labelled fields", () => {
    render(<TargetsForm onSave={() => {}} />);
    expect(screen.getByRole("region", { name: "Daily targets" })).toBeTruthy();
    expect(
      screen.getByText("Used by the Today ring and the week chart."),
    ).toBeTruthy();
    for (const l of ["Calories", "Carbs", "Protein", "Fat"])
      expect(screen.getByLabelText(l)).toBeTruthy();
  });

  it("empty: Save is aria-disabled and does nothing but explain", () => {
    const onSave = vi.fn();
    render(<TargetsForm onSave={onSave} />);
    expect(save().getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(save());
    expect(onSave).not.toHaveBeenCalled();
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toBe(
      "Enter your daily calories, for example 2000.",
    );
    expect(
      screen.getByLabelText("Calories").getAttribute("aria-describedby"),
    ).toContain(alert.id);
  });

  it("filled: shows initial values and saves numbers", () => {
    const onSave = vi.fn();
    render(<TargetsForm initial={filled} onSave={onSave} />);
    expect((screen.getByLabelText("Carbs") as HTMLInputElement).value).toBe(
      "250",
    );
    expect(save().getAttribute("aria-disabled")).toBeNull();
    fireEvent.click(save());
    expect(onSave).toHaveBeenCalledWith(filled);
  });

  it("saves on form submit (Enter), and empty macros become undefined", () => {
    const onSave = vi.fn();
    render(<TargetsForm onSave={onSave} />);
    type("Calories", "2000");
    expect(save().getAttribute("aria-disabled")).toBeNull();
    fireEvent.submit(screen.getByLabelText("Calories").closest("form")!);
    expect(onSave).toHaveBeenCalledWith({
      kcal: 2000,
      carbs: undefined,
      protein: undefined,
      fat: undefined,
    });
  });

  it("does not save invalid macros and says what to fix", () => {
    const onSave = vi.fn();
    render(<TargetsForm initial={filled} onSave={onSave} />);
    type("Carbs", "abc");
    type("Protein", "-20");
    type("Fat", "-1");
    fireEvent.click(save());
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getAllByRole("alert").map((a) => a.textContent)).toEqual([
      "Carbs must be a number, for example 250.",
      "Protein can’t be negative. Enter 0 or more, or leave it empty.",
      "Fat can’t be negative. Enter 0 or more, or leave it empty.",
    ]);
    expect(screen.getByLabelText("Carbs").getAttribute("aria-invalid")).toBe(
      "true",
    );
  });

  it("clears an error once the field is fixed", () => {
    const onSave = vi.fn();
    render(<TargetsForm initial={filled} onSave={onSave} />);
    type("Protein", "-20");
    fireEvent.click(save());
    type("Protein", "30");
    fireEvent.click(save());
    expect(screen.queryByRole("alert")).toBeNull();
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("checked: shows errors straight away", () => {
    render(<TargetsForm checked onSave={() => {}} />);
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("saving: Save is busy and ignores clicks", () => {
    const onSave = vi.fn();
    render(<TargetsForm initial={filled} saving onSave={onSave} />);
    expect(save().getAttribute("aria-busy")).toBe("true");
    fireEvent.click(save());
    expect(onSave).not.toHaveBeenCalled();
  });

  it("shows a save error from the caller", () => {
    render(
      <TargetsForm initial={filled} error="Couldn’t save." onSave={() => {}} />,
    );
    expect(screen.getByRole("alert").textContent).toBe("Couldn’t save.");
  });

  it("has no axe violations in any state", async () => {
    // One at a time: several cards on a page would share a landmark name.
    for (const ui of [
      <TargetsForm onSave={() => {}} />,
      <TargetsForm initial={filled} onSave={() => {}} />,
      <TargetsForm checked initial={filled} error="x" onSave={() => {}} />,
    ]) {
      const { container, unmount } = render(ui);
      expect(await axeViolations(container)).toEqual([]);
      unmount();
    }
  });
});
