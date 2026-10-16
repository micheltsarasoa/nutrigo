import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { MacroBar } from "./MacroBar.tsx";

const fillWidth = () =>
  (screen.getByRole("progressbar").firstElementChild as HTMLElement).style
    .width;

describe("MacroBar", () => {
  it("0 %: empty fill", () => {
    const { container } = render(
      <MacroBar macro="carbs" label="Carbs" value={0} target={250} />,
    );
    expect(fillWidth()).toBe("0%");
    expect(container.textContent).toBe("Carbs0 / 250 g");
  });

  it("typical: rounded percentage and aria attributes", () => {
    const { container } = render(
      <MacroBar macro="protein" label="Protein" value={68} target={120} />,
    );
    const bar = screen.getByRole("progressbar", { name: "Protein" });
    expect(bar.getAttribute("aria-valuenow")).toBe("68");
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("120");
    expect(fillWidth()).toBe("57%");
    expect(container.textContent).toBe("Protein68 / 120 g");
    expect(screen.queryByText(/over/)).toBeNull();
  });

  it("100 %: full fill, no over text", () => {
    render(<MacroBar macro="carbs" label="Carbs" value={250} target={250} />);
    expect(fillWidth()).toBe("100%");
    expect(screen.queryByText(/over/)).toBeNull();
  });

  it("over target: bar stays full and says by how much", () => {
    render(<MacroBar macro="fat" label="Fat" value={92} target={70} />);
    expect(fillWidth()).toBe("100%");
    expect(screen.getByText("▲ +22 g over")).toBeTruthy();
  });

  it("no target: header only, no progressbar", () => {
    const { container } = render(
      <MacroBar macro="protein" label="Protein" value={68} />,
    );
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(container.textContent).toBe("Protein68 g · no target");
  });

  it("a target of 0 counts as no target", () => {
    render(<MacroBar macro="fat" label="Fat" value={5} target={0} />);
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it.each(["carbs", "protein", "fat"] as const)("uses the %s colour", (m) => {
    const { container } = render(
      <MacroBar macro={m} label="x" value={1} target={2} />,
    );
    expect(container.firstElementChild!.getAttribute("class")).toContain(m);
  });

  it("has no axe violations in any state", async () => {
    const { container } = render(
      <div>
        <MacroBar macro="carbs" label="Carbs" value={0} target={250} />
        <MacroBar macro="protein" label="Protein" value={68} target={120} />
        <MacroBar macro="fat" label="Fat" value={92} target={70} />
        <MacroBar macro="protein" label="Protein 2" value={68} />
      </div>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
