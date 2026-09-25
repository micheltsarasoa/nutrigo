import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { App, NotFound } from "./app.tsx";
import { axeViolations } from "./axe.ts";

const heading = () =>
  within(screen.getByRole("main")).getByRole("heading", { level: 1 });
const current = () =>
  within(screen.getByRole("navigation", { name: "Main" }))
    .getAllByRole("link")
    .filter((a) => a.getAttribute("aria-current") === "page")
    .map((a) => a.textContent);

describe("App", () => {
  it.each([
    ["/", "Today"],
    ["/recipes", "Recipes"],
    ["/plan", "Plan"],
    ["/plan/2026-W40", "Plan"],
    ["/groceries", "Groceries"],
    ["/groceries/2026-W40", "Groceries"],
    ["/targets", "Targets"],
  ])("%s shows the %s page inside the shell, marked current", (path, name) => {
    render(<App path={path} wide={false} />);
    expect(heading().textContent).toBe(name);
    expect(current()).toEqual([name]);
  });

  it.each(["/nope", "/recipes/", "/plan/next-week", "/plan/2026-W40/x"])(
    "%s shows Page not found, still inside the shell",
    (path) => {
      render(<App path={path} wide={false} />);
      expect(heading().textContent).toBe("Page not found");
      expect(current()).toEqual([]);
    },
  );

  it("uses the bottom tab bar below 1200 px and the sidebar from 1200 px (SPEC-001 AC-10)", () => {
    const { rerender } = render(<App path="/" wide={false} />);
    expect(screen.queryByText("NutriGo")).toBeNull();
    rerender(<App path="/" wide />);
    expect(screen.getByText("NutriGo")).toBeTruthy();
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
  });

  it.each([false, true])("has no axe violations (wide: %s)", async (wide) => {
    const { container } = render(<App path="/plan" wide={wide} />);
    expect(await axeViolations(container)).toEqual([]);
  });

  it("loads the playground on /playground in dev and preview builds, outside the shell", async () => {
    render(<App path="/playground" wide={false} />);
    // The lazy chunk loads every *.playground.tsx; under coverage that takes over findBy's default 1 s.
    expect(
      await screen.findByRole(
        "heading",
        { level: 1, name: "Playground" },
        { timeout: 5000 },
      ),
    ).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: "Main" })).toBeNull();
  });
});

describe("App /ingredients (SPEC-002)", () => {
  it("renders the ingredients page, with the Recipes tab current", () => {
    render(<App path="/ingredients" wide={false} />);
    expect(heading().textContent).toBe("Ingredients");
    expect(current()).toEqual(["Recipes"]);
  });

  it("/ingredients/abc shows Page not found", () => {
    render(<App path="/ingredients/abc" wide={false} />);
    expect(heading().textContent).toBe("Page not found");
    expect(current()).toEqual([]);
  });
});

describe("NotFound", () => {
  it("shows a page-not-found heading in the main landmark (production /playground, SPEC-001 AC-4)", () => {
    render(<NotFound />);
    expect(heading().textContent).toBe("Page not found");
  });
});

// jsdom has no modal dialogs: open/close by the attribute and fire the native
// "close" event on close(), the way SettingsDialog.test.tsx stubs it.
describe("App settings (SPEC-008)", () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function () {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function () {
      this.open = false;
      this.dispatchEvent(new Event("close"));
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const jsonResponse = (body: unknown, ok = true, status = ok ? 200 : 500) => ({
    ok,
    status,
    json: () => Promise.resolve(body),
  });

  const settingsButton = () => screen.getByRole("button", { name: "Settings" });
  const select = () =>
    screen.findByRole<HTMLSelectElement>("combobox", {
      name: "Number and money format",
    });
  const saveButton = () => screen.getByRole("button", { name: "Save" });

  it.each([false, true])(
    "opens the dialog and loads settings from GET /api/settings (wide: %s)",
    async (wide) => {
      const fetchMock = vi.fn(() =>
        Promise.resolve(jsonResponse({ locale: "fr-FR" })),
      );
      vi.stubGlobal("fetch", fetchMock);
      render(<App path="/" wide={wide} />);

      const button = settingsButton();
      expect(button.getAttribute("aria-expanded")).toBe("false");
      fireEvent.click(button);

      expect(
        await screen.findByRole("dialog", { name: "Settings" }),
      ).toBeTruthy();
      expect(button.getAttribute("aria-expanded")).toBe("true");

      const field = await select();
      expect(field.value).toBe("fr-FR");
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith("/api/settings");
    },
  );

  it("saving en-IE sends exactly one PUT with the new locale, closes the dialog, and shows it selected on reopen", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) =>
      Promise.resolve(jsonResponse({ locale: init ? "en-IE" : "fr-FR" })),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<App path="/" wide={false} />);

    const button = settingsButton();
    fireEvent.click(button);
    const field = await select();
    fireEvent.change(field, { target: { value: "en-IE" } });
    fireEvent.click(saveButton());

    await waitFor(() => {
      const puts = fetchMock.mock.calls.filter(
        ([, init]) => (init as RequestInit | undefined)?.method === "PUT",
      );
      expect(puts).toHaveLength(1);
    });
    const [putUrl, putInit] = fetchMock.mock.calls.find(
      ([, init]) => (init as RequestInit | undefined)?.method === "PUT",
    )!;
    expect(putUrl).toBe("/api/settings");
    expect((putInit as RequestInit).body).toBe(
      JSON.stringify({ locale: "en-IE" }),
    );

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(button.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(button);
    const reopened = await select();
    expect(reopened.value).toBe("en-IE");
  });

  it("Cancel after a change sends no PUT and closes the dialog", async () => {
    const fetchMock = vi.fn<
      (url: string, init?: RequestInit) => Promise<unknown>
    >(() => Promise.resolve(jsonResponse({ locale: "fr-FR" })));
    vi.stubGlobal("fetch", fetchMock);
    render(<App path="/" wide={false} />);

    fireEvent.click(settingsButton());
    const field = await select();
    fireEvent.change(field, { target: { value: "en-IE" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(
      fetchMock.mock.calls.some(
        ([, init]) => (init as RequestInit | undefined)?.method === "PUT",
      ),
    ).toBe(false);
  });

  it.each([
    [
      "a non-ok response",
      () => Promise.resolve(jsonResponse(null, false, 500)),
    ],
    ["a network error", () => Promise.reject(new Error("offline"))],
  ])(
    "shows a load error on %s, and Retry reloads the settings",
    async (_label, failOnce) => {
      const fetchMock = vi
        .fn()
        .mockImplementationOnce(failOnce)
        .mockImplementationOnce(() =>
          Promise.resolve(jsonResponse({ locale: "fr-FR" })),
        );
      vi.stubGlobal("fetch", fetchMock);
      render(<App path="/" wide={false} />);

      fireEvent.click(settingsButton());
      const alert = await screen.findByRole("alert");
      expect(alert.textContent).toBe(
        "Couldn't load your settings. Check the connection and try again.",
      );

      fireEvent.click(screen.getByRole("button", { name: "Retry" }));
      const field = await select();
      expect(field.value).toBe("fr-FR");
      expect(fetchMock).toHaveBeenCalledTimes(2);
    },
  );

  it("shows a save error and keeps the dialog open with the picked locale", async () => {
    const fetchMock = vi.fn((_url: string, init?: RequestInit) =>
      init
        ? Promise.resolve(jsonResponse(null, false, 500))
        : Promise.resolve(jsonResponse({ locale: "fr-FR" })),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<App path="/" wide={false} />);

    fireEvent.click(settingsButton());
    const field = await select();
    fireEvent.change(field, { target: { value: "en-IE" } });
    fireEvent.click(saveButton());

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe(
      "Couldn't save your settings. Your choice is kept, try again.",
    );
    expect(screen.getByRole("dialog", { name: "Settings" })).toBeTruthy();
    expect(field.value).toBe("en-IE");
  });

  it("fetches nothing until Settings is pressed", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<App path="/" wide={false} />);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
