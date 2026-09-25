import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { NoteItem } from "./NoteItem.tsx";

describe("NoteItem", () => {
  it("is a list item holding the note as plain text, with a decorative dot", () => {
    const { container } = render(
      <ul>
        <NoteItem text="Marinate the turkey in lemon juice for 30 minutes." />
      </ul>,
    );
    expect(screen.getByRole("listitem").textContent).toBe(
      "Marinate the turkey in lemon juice for 30 minutes.",
    );
    expect(container.querySelector("[aria-hidden]")).not.toBeNull();
  });

  it("shows markdown characters as they are, not as markup", () => {
    const { container } = render(
      <ul>
        <NoteItem text="Use **fresh** herbs <b>only</b>" />
      </ul>,
    );
    expect(screen.getByText("Use **fresh** herbs <b>only</b>")).toBeTruthy();
    expect(container.querySelector("b, strong")).toBeNull();
  });

  it("is not focusable: it only displays", () => {
    const { container } = render(
      <ul>
        <NoteItem text="Swap rice for quinoa." />
      </ul>,
    );
    expect(container.querySelector("a, button, [tabindex]")).toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <ul>
        <NoteItem text="Marinate the turkey." />
        <NoteItem text="Swap rice for quinoa." />
      </ul>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
