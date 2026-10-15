import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { DayHead } from "./DayHead.tsx";

const props = () => ({
  dow: "Mon",
  dayNumber: 5,
  kcal: 1850,
  isToday: false,
  isSelected: false,
  onSelect: vi.fn(),
});

describe("DayHead", () => {
  it("shows the weekday, the day number and the planned kcal", () => {
    render(<DayHead {...props()} />);
    expect(screen.getByText("Mon")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("1,850 kcal")).toBeTruthy();
  });

  it("says 'No meals' for an empty day", () => {
    render(<DayHead {...props()} kcal={0} />);
    expect(screen.getByText("No meals")).toBeTruthy();
    expect(screen.queryByText(/kcal/)).toBeNull();
  });

  it("calls onSelect on click and on Enter/Space (it is a button)", () => {
    const p = props();
    render(<DayHead {...p} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(p.onSelect).toHaveBeenCalledOnce();
    button.focus();
    expect(document.activeElement).toBe(button);
  });

  it("marks the selected day with aria-pressed", () => {
    const { rerender } = render(<DayHead {...props()} />);
    expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe(
      "false",
    );
    rerender(<DayHead {...props()} isSelected />);
    expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("marks today with aria-current, independent of the selection", () => {
    const { rerender } = render(<DayHead {...props()} />);
    expect(screen.getByRole("button").getAttribute("aria-current")).toBeNull();
    rerender(<DayHead {...props()} isToday />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-current")).toBe("date");
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });

  it("has no axe violations in each state", async () => {
    const { container } = render(
      <>
        <DayHead {...props()} />
        <DayHead {...props()} isToday />
        <DayHead {...props()} isSelected />
        <DayHead {...props()} isToday isSelected />
        <DayHead {...props()} kcal={0} />
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
