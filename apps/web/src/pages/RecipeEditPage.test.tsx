import { apiError, type Ingredient, type Recipe } from "@nutrigo/shared";
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
import { RecipeEditPage } from "./RecipeEditPage.tsx";

// jsdom has no modal dialogs: open/close by the attribute, as in IngredientsPage.test.tsx.
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

const oats: Ingredient = {
  id: 42,
  name: "Oats",
  category: "grains",
  kcal100g: 389,
  carbs100g: 66,
  protein100g: 17,
  fat100g: 7,
  fibre100g: null,
  sugars100g: null,
  sodiumMg100g: null,
  defaultUnit: "g",
  gramsPerUnit: null,
  source: "manual",
  updatedAt: "2026-01-01T00:00:00.000Z",
};
const egg: Ingredient = {
  ...oats,
  id: 7,
  name: "Egg",
  category: "protein",
  defaultUnit: "piece",
  gramsPerUnit: 50,
};
const porridge: Recipe = {
  id: 5,
  name: "Porridge",
  description: null,
  mealType: "breakfast",
  servings: 2,
  difficulty: null,
  prepMin: 5,
  cookMin: 10,
  rating: 4,
  notes: null,
  ingredients: [{ ingredientId: 42, quantity: 80, unit: "g", name: "Oats" }],
  steps: [{ title: "Cook", body: "Simmer 5 min" }],
  tools: [],
  photoPath: null,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

// GETs answer with the library and Porridge; a save (any request with init) calls `save`.
function serve(
  save: () => Promise<unknown> = () =>
    Promise.resolve(jsonResponse(porridge, 201)),
) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) =>
    init
      ? save()
      : Promise.resolve(
          url === "/api/ingredients"
            ? jsonResponse([egg, oats])
            : jsonResponse(porridge),
        ),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const heading = () =>
  within(screen.getByRole("main")).getByRole("heading", { level: 1 });
const box = (name: string) =>
  screen.getByRole<HTMLInputElement>("textbox", { name });
const select = (name: string) =>
  screen.getByRole<HTMLSelectElement>("combobox", { name });
const type = (el: HTMLElement, value: string) =>
  fireEvent.change(el, { target: { value } });
const clickSave = () =>
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
const fillMinimal = () => {
  type(box("Name"), "Omelette");
  type(select("Meal type"), "breakfast");
};

describe("RecipeEditPage /recipes/new", () => {
  it("shows a loading state while the ingredients load", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    render(<RecipeEditPage />);
    expect(screen.getByRole("status").textContent).toBe(
      "Loading your ingredients…",
    );
  });

  it("shows a fresh editor whose ingredient lines offer the library", async () => {
    serve();
    render(<RecipeEditPage />);
    await screen.findByRole("heading", { level: 1 });
    expect(heading().textContent).toBe("New recipe");

    fireEvent.click(screen.getByRole("button", { name: "Add ingredient" }));
    const options = [...select("Ingredient").options].map((o) => o.text);
    expect(options).toEqual(["Choose…", "Egg", "Oats"]);
  });

  it("posts the recipe and goes to its page", async () => {
    const fetchMock = serve(() =>
      Promise.resolve(jsonResponse({ ...porridge, id: 9 }, 201)),
    );
    render(<RecipeEditPage />);
    await screen.findByRole("heading", { level: 1 });

    fillMinimal();
    fireEvent.click(screen.getByRole("button", { name: "Add ingredient" }));
    type(select("Ingredient"), "7");
    type(screen.getByRole("spinbutton", { name: "Quantity" }), "2");
    clickSave();

    await waitFor(() => expect(location.pathname).toBe("/recipes/9"));
    const [url, init] = fetchMock.mock.calls.at(-1)!;
    expect(url).toBe("/api/recipes");
    expect(init?.method).toBe("POST");
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      name: "Omelette",
      mealType: "breakfast",
      servings: 1,
      // The Egg's default unit comes with it.
      ingredients: [{ ingredientId: 7, quantity: 2, unit: "piece" }],
    });
  });

  it("keeps the input and shows a message when the save fails", async () => {
    serve(() =>
      Promise.resolve(
        jsonResponse(apiError("VALIDATION_FAILED", "Invalid recipe"), 400),
      ),
    );
    history.replaceState(null, "", "/recipes/new");
    render(<RecipeEditPage />);
    await screen.findByRole("heading", { level: 1 });

    fillMinimal();
    clickSave();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Couldn't save the recipe. Your input is kept, try again.",
    );
    expect(box("Name").value).toBe("Omelette");
    expect(location.pathname).toBe("/recipes/new");
  });

  it("shows the same message on a network failure", async () => {
    serve(() => Promise.reject(new Error("offline")));
    render(<RecipeEditPage />);
    await screen.findByRole("heading", { level: 1 });

    fillMinimal();
    clickSave();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Couldn't save the recipe. Your input is kept, try again.",
    );
  });

  it("shows a load error with Retry, which reloads", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => Promise.reject(new Error("offline")))
      .mockImplementationOnce(() => Promise.resolve(jsonResponse([oats])));
    vi.stubGlobal("fetch", fetchMock);
    render(<RecipeEditPage />);

    const alert = await screen.findByRole("alert");
    expect(
      within(alert).getByText(
        "Couldn't load the recipe editor. Check the connection and try again.",
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(heading().textContent).toBe("New recipe"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("Cancel goes back to the list", async () => {
    serve();
    render(<RecipeEditPage />);
    await screen.findByRole("heading", { level: 1 });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(location.pathname).toBe("/recipes");
  });

  it("has no axe violations", async () => {
    serve();
    const { container } = render(<RecipeEditPage />);
    await screen.findByRole("heading", { level: 1 });
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("RecipeEditPage /recipes/:id/edit", () => {
  it("shows a loading state while the recipe loads", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    render(<RecipeEditPage id="5" />);
    expect(screen.getByRole("status").textContent).toBe("Loading the recipe…");
  });

  it("loads the recipe into the editor and saves it with a PATCH", async () => {
    const fetchMock = serve(() => Promise.resolve(jsonResponse(porridge)));
    render(<RecipeEditPage id="5" />);
    await screen.findByRole("heading", { level: 1 });

    expect(heading().textContent).toBe("Edit recipe");
    expect(box("Name").value).toBe("Porridge");
    expect(select("Ingredient").value).toBe("42");

    type(box("Name"), "Oat porridge");
    clickSave();

    await waitFor(() => expect(location.pathname).toBe("/recipes/5"));
    expect(fetchMock).toHaveBeenCalledWith("/api/ingredients");
    expect(fetchMock).toHaveBeenCalledWith("/api/recipes/5");
    const [url, init] = fetchMock.mock.calls.at(-1)!;
    expect(url).toBe("/api/recipes/5");
    expect(init?.method).toBe("PATCH");
    expect(JSON.parse(String(init?.body))).toMatchObject({
      name: "Oat porridge",
      servings: 2,
      rating: 4,
      ingredients: [{ ingredientId: 42, quantity: 80, unit: "g" }],
      steps: [{ title: "Cook", body: "Simmer 5 min" }],
    });
  });

  it("shows Recipe not found on a 404, with a link back to the list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        Promise.resolve(
          url === "/api/ingredients"
            ? jsonResponse([oats])
            : jsonResponse(apiError("NOT_FOUND", "No recipe 5"), 404),
        ),
      ),
    );
    render(<RecipeEditPage id="5" />);

    expect(await screen.findByRole("heading", { level: 1 })).toBeTruthy();
    expect(heading().textContent).toBe("Recipe not found");
    const link = screen.getByRole("link", { name: "Back to recipes" });
    expect(link.getAttribute("href")).toBe("/recipes");
  });

  it("shows a load error other than 404, with Retry", async () => {
    let fail = true;
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        Promise.resolve(
          url === "/api/ingredients"
            ? jsonResponse([oats])
            : fail
              ? jsonResponse(null, 500)
              : jsonResponse(porridge),
        ),
      ),
    );
    render(<RecipeEditPage id="5" />);

    await screen.findByRole("alert");
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(heading().textContent).toBe("Edit recipe"));
  });

  it("Cancel goes back to the recipe", async () => {
    serve();
    render(<RecipeEditPage id="5" />);
    await screen.findByRole("heading", { level: 1 });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(location.pathname).toBe("/recipes/5");
  });

  it("has no axe violations", async () => {
    serve();
    const { container } = render(<RecipeEditPage id="5" />);
    await screen.findByRole("heading", { level: 1 });
    expect(await axeViolations(container)).toEqual([]);
  });
});
