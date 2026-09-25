import {
  formatEUR,
  formatNumber,
  type Locale,
  type Settings,
} from "@nutrigo/shared";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { SettingsDialog } from "./SettingsDialog.tsx";

// jsdom has no modal dialogs yet: open and close by the attribute, and fire
// the native "close" event on close() the way a real dialog does (Esc, or
// the owning form's method="dialog"), so the component can rely on it.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
});

const clean: Settings = { locale: "fr-FR" };

function renderDialog(
  props: Partial<ComponentProps<typeof SettingsDialog>> = {},
) {
  const handlers = { onSave: vi.fn(), onClose: vi.fn() };
  const view = render(
    <SettingsDialog open settings={clean} {...handlers} {...props} />,
  );
  return { ...view, ...handlers };
}

const select = () =>
  screen.getByRole<HTMLSelectElement>("combobox", {
    name: "Number and money format",
  });
const saveButton = () => screen.getByRole("button", { name: "Save" });
const cancelButton = () => screen.getByRole("button", { name: "Cancel" });
// The select's help text, like IngredientEditor/RecipeEditor read field errors: by
// the id its aria-describedby names (no jest-dom matchers are set up in this repo).
const help = (field: HTMLElement) =>
  document.getElementById(field.getAttribute("aria-describedby") ?? "")
    ?.textContent;
const example = (locale: Locale) =>
  `Example: ${formatNumber(1240, locale)} kcal · ${formatEUR(5740, locale)}`;

describe("SettingsDialog", () => {
  it('is closed when open is false, and open=true shows it as a dialog named "Settings"', () => {
    const showModal = vi.spyOn(HTMLDialogElement.prototype, "showModal");
    const { rerender, onSave, onClose } = renderDialog({ open: false });
    expect(showModal).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(
      <SettingsDialog
        open
        settings={clean}
        onSave={onSave}
        onClose={onClose}
      />,
    );
    expect(showModal).toHaveBeenCalledOnce();
    expect(screen.getByRole("dialog", { name: "Settings" })).toBeTruthy();
  });

  it("shows a loading status with no controls, and a disabled Save", () => {
    renderDialog({ settings: null });
    expect(screen.getByRole("status").textContent).toBe(
      "Loading your settings…",
    );
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(saveButton().hasAttribute("disabled")).toBe(true);
  });

  it("shows the load error with a Retry button, no controls, and a disabled Save", () => {
    const onRetry = vi.fn();
    renderDialog({
      settings: null,
      loadError: "Couldn't load your settings. Try again.",
      onRetry,
    });
    expect(screen.getByRole("alert").textContent).toBe(
      "Couldn't load your settings. Try again.",
    );
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(saveButton().hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("AC-1: shows the saved locale, clean, with its example and a disabled Save", () => {
    renderDialog();
    const field = select();
    expect(field.value).toBe("fr-FR");
    // U+202F between thousands and U+00A0 before €, as SPEC-008 §7 fixes them.
    expect(help(field)).toBe("Example: 1\u202F240 kcal · 57,40\u00A0€");
    expect(example("fr-FR")).toBe(help(field));
    expect(saveButton().hasAttribute("disabled")).toBe(true);
  });

  it("updates the live example and enables Save once the locale is changed, then saves it", () => {
    const { onSave, onClose } = renderDialog();
    fireEvent.change(select(), { target: { value: "en-IE" } });
    expect(help(select())).toBe("Example: 1,240 kcal · €57.40");
    expect(saveButton().hasAttribute("disabled")).toBe(false);
    fireEvent.click(saveButton());
    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledWith({ locale: "en-IE" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("AC-3: Cancel closes the dialog without saving", () => {
    const { onSave, onClose } = renderDialog();
    fireEvent.change(select(), { target: { value: "en-IE" } });
    fireEvent.click(cancelButton());
    expect(onClose).toHaveBeenCalledOnce();
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("AC-3: the native close event (Esc) closes without saving", () => {
    const { onSave, onClose } = renderDialog();
    const dialog = screen.getByRole("dialog", { name: "Settings" });
    fireEvent(dialog, new Event("close"));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("AC-3: reopening the dialog discards an unsaved change", () => {
    const { rerender, onSave, onClose } = renderDialog();
    fireEvent.change(select(), { target: { value: "en-IE" } });
    rerender(
      <SettingsDialog
        open={false}
        settings={clean}
        onSave={onSave}
        onClose={onClose}
      />,
    );
    rerender(
      <SettingsDialog
        open
        settings={clean}
        onSave={onSave}
        onClose={onClose}
      />,
    );
    expect(select().value).toBe("fr-FR");
  });

  it("fills in the select once the settings arrive", () => {
    const { rerender, onSave, onClose } = renderDialog({ settings: null });
    expect(screen.queryByRole("combobox")).toBeNull();
    rerender(
      <SettingsDialog
        open
        settings={clean}
        onSave={onSave}
        onClose={onClose}
      />,
    );
    expect(select().value).toBe("fr-FR");
  });

  it("while saving, Save is busy and doesn't save twice", () => {
    const { onSave } = renderDialog({ saving: true });
    const button = saveButton();
    expect(button.getAttribute("aria-busy")).toBe("true");
    fireEvent.click(button);
    fireEvent.submit(button.closest("form")!);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("shows a save error and keeps the picked locale", () => {
    const { rerender, onSave, onClose } = renderDialog();
    fireEvent.change(select(), { target: { value: "en-IE" } });
    rerender(
      <SettingsDialog
        open
        settings={clean}
        error="The settings couldn't be saved. Try again."
        onSave={onSave}
        onClose={onClose}
      />,
    );
    expect(screen.getByRole("alert").textContent).toBe(
      "The settings couldn't be saved. Try again.",
    );
    expect(select().value).toBe("en-IE");
  });

  it("is usable with the keyboard", () => {
    const { onSave } = renderDialog();
    const field = select();
    field.focus();
    expect(document.activeElement).toBe(field);
    fireEvent.change(field, { target: { value: "en-IE" } });
    fireEvent.submit(field.closest("form")!);
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("has no axe violations: loading, load error, clean, dirty, save error", async () => {
    for (const props of [
      { settings: null },
      {
        settings: null,
        loadError: "Couldn't load your settings. Try again.",
        onRetry: vi.fn(),
      },
      {},
      { error: "The settings couldn't be saved. Try again." },
    ]) {
      const { container, unmount } = renderDialog(props);
      expect(await axeViolations(container)).toEqual([]);
      unmount();
    }
    const { container } = renderDialog();
    fireEvent.change(select(), { target: { value: "en-IE" } });
    expect(await axeViolations(container)).toEqual([]);
  });
});
