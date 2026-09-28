import type { RecipeSummary } from "@nutrigo/shared";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axeViolations } from "../axe.ts";
import { RecipesPage } from "./RecipesPage.tsx";

beforeEach(() => {
  // navigate() (router.ts) calls scrollTo, which jsdom doesn't implement.
  vi.stubGlobal("scrollTo", vi.fn());
  // Node's own localStorage global shadows jsdom's and has no methods without
  // --localstorage-file, so each test gets a fresh in-memory one.
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  history.replaceState(null, "", "/");
});

const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
});

const bowl: RecipeSummary = {
  id: 7,
  name: "Turkey rice bowl",
  mealType: "lunch",
  rating: 4,
  photoPath: null,
  kcalPerServing: 242.6,
  healthScore: 9,
  totalMin: 75,
};
const porridge: RecipeSummary = {
  id: 3,
  name: "Porridge",
  mealType: "breakfast",
  rating: null,
  photoPath: null,
  kcalPerServing: 311,
  healthScore: 7,
  totalMin: null,
};

const stubFetch = (body: unknown = [bowl, porridge]) => {
  const fetchMock = vi.fn<(url: string) => Promise<unknown>>(() =>
    Promise.resolve(jsonResponse(body)),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};
const lastUrl = (fetchMock: ReturnType<typeof stubFetch>) =>
  fetchMock.mock.calls.at(-1)![0];
const heading = () =>
  within(screen.getByRole("main")).getByRole("heading", { level: 1 });

describe("RecipesPage", () => {
  it("shows the heading, the Ingredients link and a loading state", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    render(<RecipesPage />);
    expect(heading().textContent).toBe("Recipes");
    expect(
      screen.getByRole("link", { name: "Ingredients" }).getAttribute("href"),
    ).toBe("/ingredients");
    expect(screen.getByRole("status").textContent).toBe("Loading recipes…");
  });

  it("lists each summary as a linked card with rounded kcal and formatted total time", async () => {
    const fetchMock = stubFetch();
    render(<RecipesPage />);

    const bowlLink = await screen.findByRole("link", {
      name: /Turkey rice bowl/,
    });
    expect(bowlLink.getAttribute("href")).toBe("/recipes/7");
    const bowlCard = bowlLink.closest("li")!;
    expect(bowlCard.textContent).toContain("243 kcal");
    expect(bowlCard.textContent).toContain("1 h 15 min");
    expect(bowlCard.textContent).toContain("9/10");

    const porridgeCard = screen
      .getByRole("link", { name: /Porridge/ })
      .closest("li")!;
    expect(porridgeCard.textContent).toContain("311 kcal");
    expect(porridgeCard.textContent).toContain("–");

    expect(lastUrl(fetchMock)).toBe("/api/recipes?sort=name");
  });

  it.each([
    [0, null],
    [5, "5 min"],
    [60, "1 h"],
    [135, "2 h 15 min"],
  ])("formats %i minutes as %s", async (totalMin, text) => {
    stubFetch([{ ...bowl, totalMin }]);
    render(<RecipesPage />);
    const card = (
      await screen.findByRole("link", { name: /Turkey rice bowl/ })
    ).closest("li")!;
    if (text) expect(card.textContent).toContain(text);
    else expect(card.textContent).toContain("–");
  });

  it("AC-4, AC-5: search, meal type and sort go to the API; All drops the filter", async () => {
    const fetchMock = stubFetch();
    render(<RecipesPage />);
    await screen.findByRole("link", { name: /Porridge/ });

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search recipes" }),
      {
        target: { value: " chick " },
      },
    );
    await waitFor(() =>
      expect(lastUrl(fetchMock)).toBe("/api/recipes?sort=name&q=chick"),
    );

    fireEvent.click(screen.getByRole("radio", { name: "Lunch" }));
    await waitFor(() =>
      expect(lastUrl(fetchMock)).toBe(
        "/api/recipes?sort=name&q=chick&mealType=lunch",
      ),
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Sort by" }), {
      target: { value: "kcal" },
    });
    await waitFor(() =>
      expect(lastUrl(fetchMock)).toBe(
        "/api/recipes?sort=kcal&q=chick&mealType=lunch",
      ),
    );

    fireEvent.click(screen.getByRole("radio", { name: "All" }));
    await waitFor(() =>
      expect(lastUrl(fetchMock)).toBe("/api/recipes?sort=kcal&q=chick"),
    );
  });

  it("aborts the previous request when the query changes, without showing an error", async () => {
    const signals: AbortSignal[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            signals.push(init.signal!);
            init.signal!.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError")),
            );
          }),
      ),
    );
    render(<RecipesPage />);
    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search recipes" }),
      {
        target: { value: "c" },
      },
    );
    await waitFor(() => expect(signals).toHaveLength(2));
    expect(signals[0]!.aborted).toBe(true);
    await Promise.resolve();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows a no-match state when a search finds nothing", async () => {
    const fetchMock = vi.fn((url: string) =>
      Promise.resolve(jsonResponse(url.includes("q=") ? [] : [bowl])),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<RecipesPage />);
    await screen.findByRole("link", { name: /Turkey rice bowl/ });
    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search recipes" }),
      {
        target: { value: "pizza" },
      },
    );
    expect(await screen.findByText("No recipes match")).toBeTruthy();
  });

  it("AC-7: the view switch changes the layout and is remembered on this device", async () => {
    stubFetch();
    const { unmount } = render(<RecipesPage />);
    await screen.findByRole("link", { name: /Porridge/ });
    const grid = () =>
      screen.getByRole<HTMLInputElement>("radio", { name: "Grid view" });
    expect(grid().checked).toBe(false);

    fireEvent.click(grid());
    expect(grid().checked).toBe(true);
    expect(localStorage.getItem("nutrigo.recipes.view")).toBe("grid");

    unmount();
    render(<RecipesPage />);
    await screen.findByRole("link", { name: /Porridge/ });
    expect(grid().checked).toBe(true);
  });

  it("falls back to the list view on an unknown stored value", async () => {
    localStorage.setItem("nutrigo.recipes.view", "table");
    stubFetch();
    render(<RecipesPage />);
    await screen.findByRole("link", { name: /Porridge/ });
    expect(
      screen.getByRole<HTMLInputElement>("radio", { name: "List view" })
        .checked,
    ).toBe(true);
  });

  it("Add recipe navigates to /recipes/new", async () => {
    stubFetch();
    render(<RecipesPage />);
    await screen.findByRole("link", { name: /Porridge/ });
    fireEvent.click(screen.getByRole("button", { name: "Add recipe" }));
    expect(location.pathname).toBe("/recipes/new");
  });

  it("the empty library's Add your first recipe navigates to /recipes/new", async () => {
    stubFetch([]);
    render(<RecipesPage />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Add your first recipe" }),
    );
    expect(location.pathname).toBe("/recipes/new");
  });

  it("shows a load error with Retry, which reloads", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => Promise.resolve(jsonResponse(null, 500)))
      .mockImplementationOnce(() => Promise.resolve(jsonResponse([porridge])));
    vi.stubGlobal("fetch", fetchMock);
    render(<RecipesPage />);

    const alert = await screen.findByRole("alert");
    expect(
      within(alert).getByText(
        "Couldn't load your recipes. Check the connection and try again.",
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await screen.findByRole("link", { name: /Porridge/ });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("has no axe violations, populated", async () => {
    stubFetch();
    const { container } = render(<RecipesPage />);
    await screen.findByRole("link", { name: /Porridge/ });
    expect(await axeViolations(container)).toEqual([]);
  });
});
