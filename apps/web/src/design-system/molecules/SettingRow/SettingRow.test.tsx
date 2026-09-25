import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { SettingRow } from "./SettingRow.tsx";

const select = (a11y: object) => (
  <select {...a11y} defaultValue="en">
    <option value="en">English</option>
    <option value="fr">Français</option>
  </select>
);

describe("SettingRow", () => {
  it("labels the control it is given", () => {
    render(<SettingRow label="Language">{select}</SettingRow>);
    expect(screen.getByRole("combobox", { name: "Language" })).toBeTruthy();
  });

  it("links the help text to the control", () => {
    render(
      <SettingRow label="Language" help="Used for dates and numbers.">
        {select}
      </SettingRow>,
    );
    const control = screen.getByRole("combobox", { name: "Language" });
    expect(control.getAttribute("aria-invalid")).toBeNull();
    const described = control.getAttribute("aria-describedby") ?? "";
    expect(document.getElementById(described)?.textContent).toBe(
      "Used for dates and numbers.",
    );
  });

  it("shows an error, marks the control invalid and describes it with help and error", () => {
    render(
      <SettingRow
        label="Language"
        help="Used for dates."
        error="Choose a language."
      >
        {select}
      </SettingRow>,
    );
    const control = screen.getByRole("combobox", { name: "Language" });
    expect(control.getAttribute("aria-invalid")).toBe("true");
    const texts = (control.getAttribute("aria-describedby") ?? "")
      .split(" ")
      .map((id) => document.getElementById(id)?.textContent);
    expect(texts).toEqual(["Used for dates.", "Choose a language."]);
  });

  it("has no describedby without help or error", () => {
    render(<SettingRow label="Language">{select}</SettingRow>);
    expect(
      screen.getByRole("combobox").getAttribute("aria-describedby"),
    ).toBeNull();
  });

  it("keeps the control reachable with the keyboard", () => {
    render(<SettingRow label="Language">{select}</SettingRow>);
    const control = screen.getByRole("combobox");
    control.focus();
    expect(document.activeElement).toBe(control);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <>
        <SettingRow label="Language" help="Used for dates.">
          {select}
        </SettingRow>
        <SettingRow label="Currency" error="Pick one.">
          {select}
        </SettingRow>
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
