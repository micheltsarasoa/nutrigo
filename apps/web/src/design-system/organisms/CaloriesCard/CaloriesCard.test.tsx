import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { CaloriesCard } from "./CaloriesCard.tsx";

const targets = { carbs: 250, protein: 120, fat: 70 };
const typical = { carbs: 160, protein: 68, fat: 41 };

describe("CaloriesCard", () => {
  it("typical: ring, heading and three macro bars", () => {
    render(
      <CaloriesCard
        kcal={1380}
        target={2000}
        macros={typical}
        targets={targets}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Calories intake" }),
    ).toBeTruthy();
    expect(screen.getByRole("img", { name: "1380 kcal of 2000" })).toBeTruthy();
    for (const [name, max] of [
      ["Carbs", 250],
      ["Protein", 120],
      ["Fat", 70],
    ] as const) {
      expect(
        screen.getByRole("progressbar", { name }).getAttribute("aria-valuemax"),
      ).toBe(String(max));
    }
  });

  it("over target: the ring and the macros say by how much", () => {
    render(
      <CaloriesCard
        kcal={2340}
        target={2000}
        macros={{ carbs: 260, protein: 122, fat: 92 }}
        targets={targets}
      />,
    );
    expect(screen.getByText("+340 kcal over ▲")).toBeTruthy();
    expect(screen.getByText("▲ +10 g over")).toBeTruthy();
    expect(screen.getByText("▲ +22 g over")).toBeTruthy();
  });

  it("empty day: 0 kcal and three empty bars", () => {
    render(
      <CaloriesCard
        kcal={0}
        target={2000}
        macros={{ carbs: 0, protein: 0, fat: 0 }}
        targets={targets}
      />,
    );
    expect(screen.getByRole("img", { name: "0 kcal of 2000" })).toBeTruthy();
    expect(screen.getAllByRole("progressbar")).toHaveLength(3);
  });

  it("shows the planned kcal when given", () => {
    render(
      <CaloriesCard
        kcal={300}
        target={2990}
        planned={2150}
        macros={typical}
        targets={targets}
      />,
    );
    expect(screen.getByText("2150 kcal planned")).toBeTruthy();
  });

  it("no targets: totals, no ring, no bars, link to /targets", () => {
    render(<CaloriesCard kcal={1380} target={0} macros={typical} />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByRole("progressbar")).toBeNull();
    for (const t of ["1380", "160 g", "68 g", "41 g"]) {
      expect(screen.getByText(t)).toBeTruthy();
    }
    expect(
      screen.getByText(/Set your daily targets to see the ring and bars\./),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Set targets" }).getAttribute("href"),
    ).toBe("/targets");
  });

  it("has no axe violations in any state", async () => {
    const { container } = render(
      <div>
        <CaloriesCard
          kcal={1380}
          target={2000}
          macros={typical}
          targets={targets}
        />
        <CaloriesCard
          kcal={0}
          target={2000}
          macros={{ carbs: 0, protein: 0, fat: 0 }}
          targets={targets}
        />
        <CaloriesCard kcal={1380} target={0} macros={typical} />
      </div>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
