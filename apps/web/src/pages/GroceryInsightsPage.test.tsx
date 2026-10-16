import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axeViolations } from "../axe.ts";
import { LocaleProvider } from "../locale.tsx";
import { GroceryInsightsPage } from "./GroceryInsightsPage.tsx";

const SPENDING = {
  weeks: [
    { isoWeek: "2026-W38", estimatedCents: 6000, actualCents: 5530 },
    { isoWeek: "2026-W39", estimatedCents: 5200, actualCents: 7100 },
    { isoWeek: "2026-W40", estimatedCents: 5740, actualCents: 0 },
  ],
  byCategory: [
    { category: "veggies", cents: 9000 },
    { category: "grains", cents: 3000 },
  ],
};

let respond: () => Response;
let requested: string[];
beforeEach(() => {
  requested = [];
  respond = () => new Response(JSON.stringify(SPENDING));
  vi.stubGlobal("fetch", async (url: string) => {
    requested.push(url);
    return respond();
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("GroceryInsightsPage", () => {
  it("draws the weekly spend (estimate hatched) and the category donut", async () => {
    render(
      <LocaleProvider value="en-IE">
        <GroceryInsightsPage isoWeek="2026-W40" />
      </LocaleProvider>,
    );
    expect(
      await screen.findByRole("img", {
        name: /Weekly grocery spend, highest in W39 at €71\.00/,
      }),
    ).toBeTruthy();
    expect(requested).toEqual(["/api/spending?weeks=8"]);
    const kinds = screen
      .getAllByTestId("column")
      .map((c) => c.getAttribute("data-kind"));
    expect(kinds).toEqual(["actual", "peak", "estimated"]);
    expect(screen.getByText("Veggies")).toBeTruthy();
    expect(screen.getByText(/€90\.00 · 75%/)).toBeTruthy();
  });

  it("goes back to the list of the week", async () => {
    const go = vi.spyOn(window.history, "pushState");
    render(<GroceryInsightsPage isoWeek="2026-W40" />);
    await screen.findAllByTestId("column");
    fireEvent.click(screen.getByRole("button", { name: "Back to list" }));
    expect(go).toHaveBeenCalledWith(null, "", "/groceries/2026-W40");
  });

  it("shows empty states when no list exists", async () => {
    respond = () => new Response(JSON.stringify({ weeks: [], byCategory: [] }));
    render(<GroceryInsightsPage isoWeek="2026-W40" />);
    expect((await screen.findAllByText("No spending recorded")).length).toBe(2);
  });

  it("offers a retry when loading fails", async () => {
    respond = () => new Response("{}", { status: 500 });
    render(<GroceryInsightsPage isoWeek="2026-W40" />);
    expect(await screen.findByRole("alert")).toBeTruthy();
    respond = () => new Response(JSON.stringify(SPENDING));
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() =>
      expect(screen.getAllByTestId("column")).toHaveLength(3),
    );
  });

  it("has no axe violations", async () => {
    const { container } = render(<GroceryInsightsPage isoWeek="2026-W40" />);
    await screen.findAllByTestId("column");
    expect(await axeViolations(container)).toEqual([]);
  });
});
