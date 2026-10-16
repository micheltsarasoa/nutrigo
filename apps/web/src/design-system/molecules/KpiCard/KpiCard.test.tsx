import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { KpiCard } from "./KpiCard.tsx";

describe("KpiCard", () => {
  it("reads as label, value, delta", () => {
    const { container } = render(
      <KpiCard
        label="Estimated cost"
        value="€58.40"
        delta={{ direction: "up", text: "+€4.20 vs last week" }}
      />,
    );
    expect(container.textContent).toContain("Estimated cost");
    expect(container.textContent).toContain("€58.40");
    expect(screen.getByText(/\+€4\.20 vs last week/)).toBeTruthy();
  });

  it("says up or down in words as well as with the arrow", () => {
    render(
      <>
        <KpiCard
          label="A"
          value="1"
          delta={{ direction: "up", text: "+1 vs last week" }}
        />
        <KpiCard
          label="B"
          value="2"
          delta={{ direction: "down", text: "−3 vs last week" }}
        />
      </>,
    );
    expect(screen.getByText(/\+1 vs last week/).textContent).toContain("▲");
    expect(screen.getByText(/−3 vs last week/).textContent).toContain("▼");
    expect(screen.getByText("Up")).toBeTruthy();
    expect(screen.getByText("Down")).toBeTruthy();
  });

  it("shows a hint when there is no delta", () => {
    render(
      <KpiCard label="Total kcal" value="14 300" hint="No previous list" />,
    );
    expect(screen.getByText("No previous list")).toBeTruthy();
    expect(screen.queryByText("Up")).toBeNull();
  });

  it("shows the exclusion hint under an estimate", () => {
    render(
      <KpiCard
        label="Estimated cost"
        value="€41.10"
        hint="Estimate excludes 3 items"
      />,
    );
    expect(screen.getByText("Estimate excludes 3 items")).toBeTruthy();
  });

  it("is a group named by its label", () => {
    render(<KpiCard label="Total items" value="24" />);
    expect(screen.getByRole("group", { name: "Total items" })).toBeTruthy();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <KpiCard
        label="Total items"
        value="24"
        delta={{ direction: "down", text: "−3 vs last week" }}
      />,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
