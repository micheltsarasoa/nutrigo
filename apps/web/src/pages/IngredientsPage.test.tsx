import {
  apiError,
  type Ingredient,
  type IngredientInput,
} from "@nutrigo/shared";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { axeViolations } from "../axe.ts";
import { IngredientsPage } from "./IngredientsPage.tsx";

// jsdom has no modal dialogs: open/close by the attribute and fire the native
// "close" event on close(), the way app.test.tsx stubs it.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
});

beforeEach(() => {
  // navigate() (router.ts) calls scrollTo, which jsdom doesn't implement.
  vi.stubGlobal("scrollTo", vi.fn());
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

const oatsInput: IngredientInput = {
  name: "Oats",
  category: "grains",
  kcal100g: 389,
  carbs100g: 66,
  protein100g: 17,
  fat100g: 7,
  fibre100g: 10.6,
  sugars100g: null,
  sodiumMg100g: 2,
  defaultUnit: "g",
  gramsPerUnit: null,
};
const oatsIngredient: Ingredient = {
  ...oatsInput,
  id: 42,
  source: "manual",
  updatedAt: "2026-01-01T00:00:00.000Z",
};
const eggIngredient: Ingredient = {
  name: "Egg",
  category: "protein",
  kcal100g: 143.4,
  carbs100g: 0.7,
  protein100g: 12.6,
  fat100g: 9.5,
  fibre100g: null,
  sugars100g: null,
  sodiumMg100g: null,
  defaultUnit: "piece",
  gramsPerUnit: 60,
  id: 7,
  source: "off",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const branIngredient: Ingredient = {
  ...oatsIngredient,
  id: 43,
  name: "Oat bran",
  kcal100g: 246,
  protein100g: 17.3,
};

// The names in the table, in row order, and the cells of one ingredient's row.
const rowNames = () =>
  within(screen.getByRole("table"))
    .getAllByRole("link")
    .map((a) => a.textContent);
const cells = (link: HTMLElement) =>
  within(link.closest("tr")!)
    .getAllByRole("cell")
    .map((td) => td.textContent);

const heading = () =>
  within(screen.getByRole("main")).getByRole("heading", { level: 1 });
const box = (name: string) => screen.getByRole("textbox", { name });
const number = (name: string) =>
  screen.getByRole<HTMLInputElement>("spinbutton", { name });
const select = (name: string) =>
  screen.getByRole<HTMLSelectElement>("combobox", { name });
const type = (el: HTMLElement, value: string) =>
  fireEvent.change(el, { target: { value } });
const clickSave = () =>
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
const confirmDelete = () => {
  fireEvent.click(screen.getByRole("button", { name: "Delete" }));
  fireEvent.click(
    within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }),
  );
};
const fillOats = () => {
  type(box("Name"), "Oats");
  type(select("Category"), "grains");
  type(number("Calories"), "389");
  type(number("Carbs"), "66");
  type(number("Protein"), "17");
  type(number("Fat"), "7");
};

describe("IngredientsPage /ingredients (list)", () => {
  it("shows the heading and Add ingredient button while the ingredients load", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    render(<IngredientsPage path="/ingredients" />);
    expect(heading().textContent).toBe("Ingredients");
    expect(screen.getByRole("button", { name: "Add ingredient" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("Loading ingredients…");
  });

  it("shows a load error with Retry, which reloads", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => Promise.reject(new Error("offline")))
      .mockImplementationOnce(() => Promise.resolve(jsonResponse([])));
    vi.stubGlobal("fetch", fetchMock);
    render(<IngredientsPage path="/ingredients" />);

    const alert = await screen.findByRole("alert");
    expect(
      within(alert).getByText(
        "Couldn't load your ingredients. Check the connection and try again.",
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await screen.findByText("No ingredients yet");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shows an empty state with nothing to load", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse([]))),
    );
    render(<IngredientsPage path="/ingredients" />);
    expect(await screen.findByText("No ingredients yet")).toBeTruthy();
  });

  it("AC-11: lists every ingredient by name as a linked row of category and nutrition per 100 g", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(jsonResponse([oatsIngredient, eggIngredient])),
      ),
    );
    render(<IngredientsPage path="/ingredients" />);

    const eggLink = await screen.findByRole("link", { name: "Egg" });
    expect(eggLink.getAttribute("href")).toBe("/ingredients/7");
    // Oats came first from the API, but the list is by name.
    expect(rowNames()).toEqual(["Egg", "Oats"]);
    // 143.4 kcal rounds to 143; macros keep one decimal.
    expect(cells(eggLink)).toEqual(["Protein", "143", "0.7", "12.6", "9.5"]);
    const oatsLink = screen.getByRole("link", { name: "Oats" });
    expect(oatsLink.getAttribute("href")).toBe("/ingredients/42");
    expect(cells(oatsLink)).toEqual(["Grains", "389", "66.0", "17.0", "7.0"]);
    expect(screen.getByText("2 ingredients · values per 100 g")).toBeTruthy();
  });

  it("AC-15: shows the source chip of an imported ingredient, not of a manual one", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(jsonResponse([eggIngredient, oatsIngredient])),
      ),
    );
    render(<IngredientsPage path="/ingredients" />);
    await screen.findByRole("link", { name: "Oats" });
    expect(screen.getByText("Open Food Facts")).toBeTruthy();
    expect(screen.queryByText("Manual")).toBeNull();
  });

  it("AC-12: search narrows the rows by name, ignoring case, and says when nothing matches", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse([eggIngredient, oatsIngredient, branIngredient]),
        ),
      ),
    );
    render(<IngredientsPage path="/ingredients" />);
    await screen.findByRole("link", { name: "Oats" });

    type(screen.getByRole("searchbox", { name: "Search ingredients" }), "OAT");
    expect(rowNames()).toEqual(["Oat bran", "Oats"]);

    type(
      screen.getByRole("searchbox", { name: "Search ingredients" }),
      "pizza",
    );
    expect(screen.getByText("No ingredients match")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("AC-13: a category tab shows only that category, every tab counts its ingredients, All restores", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse([eggIngredient, oatsIngredient, branIngredient]),
        ),
      ),
    );
    render(<IngredientsPage path="/ingredients" />);
    await screen.findByRole("link", { name: "Oats" });
    expect(screen.getByRole("radio", { name: "All 3" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Dairy 0" })).toBeTruthy();

    fireEvent.click(screen.getByRole("radio", { name: "Grains 2" }));
    expect(rowNames()).toEqual(["Oat bran", "Oats"]);
    // The counts don't follow the filter.
    expect(screen.getByRole("radio", { name: "Protein 1" })).toBeTruthy();

    fireEvent.click(screen.getByRole("radio", { name: "Dairy 0" }));
    expect(screen.getByText("No ingredients match")).toBeTruthy();

    fireEvent.click(screen.getByRole("radio", { name: "All 3" }));
    expect(rowNames()).toEqual(["Egg", "Oat bran", "Oats"]);
  });

  it("AC-14: sorts by name A to Z, or by calories or protein, highest first", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse([eggIngredient, oatsIngredient, branIngredient]),
        ),
      ),
    );
    render(<IngredientsPage path="/ingredients" />);
    await screen.findByRole("link", { name: "Oats" });
    expect(rowNames()).toEqual(["Egg", "Oat bran", "Oats"]);

    type(select("Sort by"), "kcal");
    expect(rowNames()).toEqual(["Oats", "Oat bran", "Egg"]);

    type(select("Sort by"), "protein");
    expect(rowNames()).toEqual(["Oat bran", "Oats", "Egg"]);

    type(select("Sort by"), "name");
    expect(rowNames()).toEqual(["Egg", "Oat bran", "Oats"]);
  });

  it("names the other three sources", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse([
            { ...oatsIngredient, id: 1, source: "ciqual" },
            {
              ...oatsIngredient,
              id: 2,
              name: "Oat bran",
              source: "ai_estimate",
            },
          ]),
        ),
      ),
    );
    render(<IngredientsPage path="/ingredients" />);
    await screen.findByRole("link", { name: "Oats" });
    expect(screen.getByText("Ciqual")).toBeTruthy();
    expect(screen.getByText("AI estimate")).toBeTruthy();
  });

  it("Add ingredient navigates to /ingredients/new", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse([]))),
    );
    render(<IngredientsPage path="/ingredients" />);
    await screen.findByText("No ingredients yet");
    fireEvent.click(screen.getByRole("button", { name: "Add ingredient" }));
    expect(location.pathname).toBe("/ingredients/new");
  });

  it("has no axe violations, populated", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(jsonResponse([eggIngredient, oatsIngredient])),
      ),
    );
    const { container } = render(<IngredientsPage path="/ingredients" />);
    await screen.findByRole("link", { name: "Oats" });
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("IngredientsPage /ingredients/new", () => {
  it("wraps a fresh IngredientEditor in a main landmark", () => {
    vi.stubGlobal("fetch", vi.fn());
    render(<IngredientsPage path="/ingredients/new" />);
    expect(heading().textContent).toBe("New ingredient");
  });

  it("posts the new ingredient and returns to the list on success", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(jsonResponse(oatsIngredient, 201)),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<IngredientsPage path="/ingredients/new" />);

    fillOats();
    clickSave();

    await waitFor(() => expect(location.pathname).toBe("/ingredients"));
    expect(fetchMock).toHaveBeenCalledWith("/api/ingredients", {
      method: "POST",
      headers: { "content-type": "application/json" },
      // fillOats() leaves the optional nutrients empty: the editor sends null.
      body: JSON.stringify({
        ...oatsInput,
        fibre100g: null,
        sodiumMg100g: null,
      }),
    });
  });

  it("shows Save as busy while the request is in flight, and ignores a second submit", async () => {
    let resolvePost!: (v: unknown) => void;
    const pending = new Promise((resolve) => {
      resolvePost = resolve;
    });
    const fetchMock = vi.fn(() => pending);
    vi.stubGlobal("fetch", fetchMock);
    render(<IngredientsPage path="/ingredients/new" />);

    fillOats();
    const save = screen.getByRole("button", { name: "Save" });
    fireEvent.click(save);
    await waitFor(() => expect(save.getAttribute("aria-busy")).toBe("true"));

    fireEvent.submit(save.closest("form")!);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolvePost(jsonResponse(oatsIngredient, 201));
    await waitFor(() => expect(location.pathname).toBe("/ingredients"));
  });

  it("AC-2 (server side): a 409 shows a name-conflict message and keeps the input", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse(
            apiError("CONFLICT", "An ingredient with this name exists"),
            409,
          ),
        ),
      ),
    );
    history.replaceState(null, "", "/ingredients/new");
    render(<IngredientsPage path="/ingredients/new" />);

    fillOats();
    clickSave();

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe(
      "An ingredient with this name already exists.",
    );
    expect(location.pathname).toBe("/ingredients/new");
    expect((box("Name") as HTMLInputElement).value).toBe("Oats");
  });

  it("shows a generic error on any other save failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse(null, 500))),
    );
    render(<IngredientsPage path="/ingredients/new" />);

    fillOats();
    clickSave();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Couldn't save the ingredient. Your input is kept, try again.",
    );
  });

  it("shows a generic error on a network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("offline"))),
    );
    render(<IngredientsPage path="/ingredients/new" />);

    fillOats();
    clickSave();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Couldn't save the ingredient. Your input is kept, try again.",
    );
  });

  it("Cancel goes back to the list", () => {
    vi.stubGlobal("fetch", vi.fn());
    render(<IngredientsPage path="/ingredients/new" />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(location.pathname).toBe("/ingredients");
  });

  it("has no axe violations", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { container } = render(<IngredientsPage path="/ingredients/new" />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("IngredientsPage /ingredients/:id (edit)", () => {
  it("shows a loading state while the ingredient loads", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    render(<IngredientsPage path="/ingredients/42" />);
    expect(screen.getByRole("status").textContent).toBe(
      "Loading the ingredient…",
    );
  });

  it("loads the ingredient and saves changes with a PATCH", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) =>
      Promise.resolve(
        init
          ? jsonResponse({ ...oatsIngredient, name: "Rolled oats" })
          : jsonResponse(oatsIngredient),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<IngredientsPage path="/ingredients/42" />);

    expect(await screen.findByRole("heading", { level: 1 })).toBeTruthy();
    expect(heading().textContent).toBe("Edit ingredient");
    expect((box("Name") as HTMLInputElement).value).toBe("Oats");

    clickSave();
    await waitFor(() => expect(location.pathname).toBe("/ingredients"));

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/ingredients/42");
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/ingredients/42", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(oatsInput),
    });
  });

  it("shows Ingredient not found on a 404, with a link back to the list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse(apiError("NOT_FOUND", "No ingredient 42"), 404),
        ),
      ),
    );
    render(<IngredientsPage path="/ingredients/42" />);

    expect(await screen.findByRole("heading", { level: 1 })).toBeTruthy();
    expect(heading().textContent).toBe("Ingredient not found");
    const link = screen.getByRole("link", { name: "Back to ingredients" });
    expect(link.getAttribute("href")).toBe("/ingredients");
  });

  it("shows a load error other than 404, with Retry", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => Promise.resolve(jsonResponse(null, 500)))
      .mockImplementationOnce(() =>
        Promise.resolve(jsonResponse(oatsIngredient)),
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<IngredientsPage path="/ingredients/42" />);

    const alert = await screen.findByRole("alert");
    expect(
      within(alert).getByText(
        "Couldn't load the ingredient. Check the connection and try again.",
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(heading().textContent).toBe("Edit ingredient"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shows a generic save error on a PATCH failure and keeps the input", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) =>
      Promise.resolve(
        init ? jsonResponse(null, 500) : jsonResponse(oatsIngredient),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<IngredientsPage path="/ingredients/42" />);
    await screen.findByRole("heading", { level: 1 });

    type(box("Name"), "Rolled oats");
    clickSave();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Couldn't save the ingredient. Your input is kept, try again.",
    );
    expect((box("Name") as HTMLInputElement).value).toBe("Rolled oats");
  });

  it("shows a name-conflict message on a 409 PATCH", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) =>
      Promise.resolve(
        init
          ? jsonResponse(
              apiError("CONFLICT", "An ingredient with this name exists"),
              409,
            )
          : jsonResponse(oatsIngredient),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<IngredientsPage path="/ingredients/42" />);
    await screen.findByRole("heading", { level: 1 });

    clickSave();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "An ingredient with this name already exists.",
    );
  });

  it("deletes on confirm and returns to the list", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) =>
      Promise.resolve(
        init?.method === "DELETE"
          ? jsonResponse(null, 204)
          : jsonResponse(oatsIngredient),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<IngredientsPage path="/ingredients/42" />);
    await screen.findByRole("heading", { level: 1 });

    confirmDelete();

    await waitFor(() => expect(location.pathname).toBe("/ingredients"));
    expect(fetchMock).toHaveBeenCalledWith("/api/ingredients/42", {
      method: "DELETE",
    });
  });

  it("AC-9: a 409 delete shows the blocking recipes and keeps the ingredient", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) =>
      Promise.resolve(
        init?.method === "DELETE"
          ? jsonResponse(
              apiError(
                "CONFLICT",
                "Used by these recipes: Oat pancakes, Porridge",
              ),
              409,
            )
          : jsonResponse(oatsIngredient),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    history.replaceState(null, "", "/ingredients/42");
    render(<IngredientsPage path="/ingredients/42" />);
    await screen.findByRole("heading", { level: 1 });

    confirmDelete();

    const alert = await screen.findByRole("alert");
    expect(
      within(alert).getByText("This ingredient can't be deleted."),
    ).toBeTruthy();
    expect(
      within(alert)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual(["Oat pancakes", "Porridge"]);
    expect(location.pathname).toBe("/ingredients/42");
  });

  it("shows a generic delete error on any other failure", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) =>
      Promise.resolve(
        init?.method === "DELETE"
          ? jsonResponse(null, 500)
          : jsonResponse(oatsIngredient),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<IngredientsPage path="/ingredients/42" />);
    await screen.findByRole("heading", { level: 1 });

    confirmDelete();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Couldn't delete the ingredient. Try again.",
    );
  });

  it("a new delete clears a previous error and usedBy list, even before the new response arrives", async () => {
    let resolveSecondDelete!: (v: unknown) => void;
    let deleteCalls = 0;
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (init?.method !== "DELETE")
        return Promise.resolve(jsonResponse(oatsIngredient));
      deleteCalls += 1;
      if (deleteCalls === 1) {
        return Promise.resolve(
          jsonResponse(
            apiError("CONFLICT", "Used by these recipes: Porridge"),
            409,
          ),
        );
      }
      return new Promise((resolve) => {
        resolveSecondDelete = resolve;
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<IngredientsPage path="/ingredients/42" />);
    await screen.findByRole("heading", { level: 1 });

    confirmDelete();
    await screen.findByText("Porridge");

    confirmDelete();
    await waitFor(() => expect(screen.queryByText("Porridge")).toBeNull());

    resolveSecondDelete(jsonResponse(null, 204));
    await waitFor(() => expect(location.pathname).toBe("/ingredients"));
  });

  it("Cancel goes back to the list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse(oatsIngredient))),
    );
    render(<IngredientsPage path="/ingredients/42" />);
    await screen.findByRole("heading", { level: 1 });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(location.pathname).toBe("/ingredients");
  });

  it("has no axe violations", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse(oatsIngredient))),
    );
    const { container } = render(<IngredientsPage path="/ingredients/42" />);
    await screen.findByRole("heading", { level: 1 });
    expect(await axeViolations(container)).toEqual([]);
  });
});
