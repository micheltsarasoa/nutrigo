import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { WeekNav } from "./WeekNav.tsx";

const props = () => ({
  label: "Oct 5 – 11, 2026",
  isCurrentWeek: false,
  onPrevious: vi.fn(),
  onNext: vi.fn(),
  onToday: vi.fn(),
});

describe("WeekNav", () => {
  it("SPEC-003 AC-2: shows the week label between Previous and Next week buttons", () => {
    render(<WeekNav {...props()} />);
    expect(screen.getByRole("group", { name: "Week" })).toBeTruthy();
    expect(screen.getByText("Oct 5 – 11, 2026")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Previous week" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next week" })).toBeTruthy();
  });

  it("calls onPrevious and onNext", () => {
    const p = props();
    render(<WeekNav {...p} />);
    fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
    fireEvent.click(screen.getByRole("button", { name: "Next week" }));
    expect(p.onPrevious).toHaveBeenCalledOnce();
    expect(p.onNext).toHaveBeenCalledOnce();
  });

  it("offers 'This week' on another week and calls onToday", () => {
    const p = props();
    render(<WeekNav {...p} />);
    fireEvent.click(screen.getByRole("button", { name: "This week" }));
    expect(p.onToday).toHaveBeenCalledOnce();
  });

  it("hides 'This week' on the current week and marks the label", () => {
    render(<WeekNav {...props()} isCurrentWeek />);
    expect(screen.queryByRole("button", { name: "This week" })).toBeNull();
    expect(
      screen.getByText("Oct 5 – 11, 2026").getAttribute("aria-current"),
    ).toBe("date");
  });

  it("while loading, is busy but keeps the buttons usable (focus stays)", () => {
    const p = props();
    render(<WeekNav {...p} loading />);
    expect(
      screen.getByRole("group", { name: "Week" }).getAttribute("aria-busy"),
    ).toBe("true");
    const next = screen.getByRole("button", { name: "Next week" });
    expect((next as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(next);
    expect(p.onNext).toHaveBeenCalledOnce();
  });

  it("is reachable with the keyboard in reading order", () => {
    render(<WeekNav {...props()} />);
    const previous = screen.getByRole("button", { name: "Previous week" });
    previous.focus();
    expect(document.activeElement).toBe(previous);
  });

  it("has no axe violations in each state", async () => {
    const { container } = render(
      <>
        <WeekNav {...props()} />
        <WeekNav {...props()} isCurrentWeek />
        <WeekNav {...props()} loading />
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
