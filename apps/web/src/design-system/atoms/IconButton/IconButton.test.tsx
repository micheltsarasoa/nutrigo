import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { IconButton } from "./IconButton.tsx";

describe("IconButton", () => {
  it("is a button named by its label, with a decorative icon", () => {
    render(<IconButton icon="settings" label="Settings" />);
    const button = screen.getByRole("button", { name: "Settings" });
    expect(button.getAttribute("type")).toBe("button");
    expect(button.querySelector("svg")!.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("calls onClick", () => {
    const onClick = vi.fn();
    render(<IconButton icon="settings" label="Settings" onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("active: says the dialog it opens is open", () => {
    render(
      <IconButton
        icon="settings"
        label="Settings"
        aria-haspopup="dialog"
        aria-expanded
      />,
    );
    expect(screen.getByRole("button").getAttribute("aria-expanded")).toBe(
      "true",
    );
  });

  it("disabled: ignores clicks", () => {
    const onClick = vi.fn();
    render(
      <IconButton
        icon="settings"
        label="Settings"
        disabled
        onClick={onClick}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("gets focus from the keyboard", () => {
    render(<IconButton icon="settings" label="Settings" />);
    screen.getByRole("button").focus();
    expect(document.activeElement).toBe(screen.getByRole("button"));
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <>
        <IconButton icon="settings" label="Settings" />
        <IconButton icon="settings" label="Settings open" aria-expanded />
        <IconButton icon="settings" label="Settings off" disabled />
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
