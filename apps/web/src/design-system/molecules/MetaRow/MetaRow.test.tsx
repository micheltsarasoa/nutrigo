import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { MetaRow } from "./MetaRow.tsx";

describe("MetaRow", () => {
  it("is a term and its value, with a decorative icon badge", () => {
    const { container } = render(
      <dl>
        <MetaRow icon="time" label="Prep time" value="10 min" />
      </dl>,
    );
    expect(screen.getByRole("term").textContent).toBe("Prep time");
    expect(screen.getByRole("definition").textContent).toBe("10 min");
    expect(container.querySelector("[aria-hidden] svg")).not.toBeNull();
  });

  it("shows an en dash when the value is missing", () => {
    render(
      <dl>
        <MetaRow icon="time" label="Cook time" value={null} />
      </dl>,
    );
    expect(screen.getByRole("definition").textContent).toBe("–");
  });

  it("is not focusable: it only displays", () => {
    const { container } = render(
      <dl>
        <MetaRow icon="steps" label="Steps" value="5 steps" />
      </dl>,
    );
    expect(container.querySelector("a, button, [tabindex]")).toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <dl>
        <MetaRow icon="difficulty" label="Difficulty" value="Medium" />
        <MetaRow icon="health-score" label="Health score" value="9/10" />
      </dl>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
