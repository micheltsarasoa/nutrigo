import type { RecipeDetail } from "@nutrigo/shared";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axeViolations } from "../axe.ts";
import { RecipePage } from "./RecipePage.tsx";

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

const bowl: RecipeDetail = {
  id: 5,
  name: "Turkey rice bowl",
  description: "Lean and quick.",
  mealType: "lunch",
  servings: 2,
  difficulty: "easy",
  prepMin: 10,
  cookMin: 65,
  rating: 4,
  notes: "Rest the turkey.\n\nServe warm.",
  ingredients: [
    { ingredientId: 1, name: "Turkey", quantity: 200, unit: "g" },
    { ingredientId: 2, name: "Egg", quantity: 1, unit: "piece" },
  ],
  steps: [{ title: "Sear the turkey", body: "5 min a side" }],
  tools: [{ name: "Pan" }],
  photoPath: null,
  updatedAt: "2026-01-01T00:00:00.000Z",
  nutritionPerServing: {
    kcal: 232.5,
    carbs: 21.2,
    protein: 32.03,
    fat: 1.23,
    fibre: 0,
    sugars: 0.4,
    sodiumMg: 612.6,
  },
  healthScore: 8,
  totalMin: 75,
};

// GETs answer with `recipe`; a DELETE calls `remove`.
function serve(
  recipe: () => Promise<unknown> = () => Promise.resolve(jsonResponse(bowl)),
  remove: () => Promise<unknown> = () =>
    Promise.resolve(jsonResponse(null, 204)),
) {
  const fetchMock = vi.fn((_url: string, init?: RequestInit) =>
    init?.method === "DELETE" ? remove() : recipe(),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const loaded = () =>
  screen.findByRole("heading", { level: 1, name: "Turkey rice bowl" });
const tile = (label: string) =>
  screen.getByText(label, { selector: "span" }).parentElement!.textContent;
const row = (label: string) =>
  screen.getByRole("row", { name: new RegExp(`^${label}`) }).textContent;
const meta = (label: string) =>
  screen.getByText(label, { selector: "dt" }).nextElementSibling!.textContent;
const quantities = () =>
  within(screen.getByRole("heading", { name: "Ingredients" }).parentElement!)
    .getAllByRole("listitem")
    .map((li) => li.textContent);

describe("RecipePage (SPEC-002 US-4, US-5)", () => {
  it("fetches the recipe and shows the loading state first", async () => {
    const fetchMock = serve();
    render(<RecipePage id="5" />);
    expect(screen.getByRole("status").textContent).toBe("Loading recipe…");
    await loaded();
    expect(fetchMock).toHaveBeenCalledWith("/api/recipes/5");
  });

  it("shows the recipe with nutrition per serving, rounded for display", async () => {
    serve();
    render(<RecipePage id="5" />);
    await loaded();
    expect(screen.getByText("Lean and quick.")).toBeTruthy();
    expect(screen.getByText("Lunch")).toBeTruthy();
    expect(tile("Calories")).toContain("233");
    expect(tile("Protein")).toContain("32");
    expect(row("Carbs")).toContain("21 g");
    expect(row("Sodium")).toContain("613 mg");
    expect(quantities()).toEqual([
      expect.stringContaining("200 g"),
      expect.stringContaining("1 piece"),
    ]);
    expect(meta("Prep time")).toBe("10 min");
    expect(meta("Cook time")).toBe("1 h 5 min");
    expect(meta("Difficulty")).toBe("Easy");
    expect(meta("Steps")).toBe("1 step");
    expect(screen.getByText("Sear the turkey")).toBeTruthy();
    expect(screen.getByText("Pan")).toBeTruthy();
    // One note per non-empty line.
    expect(screen.getByText("Rest the turkey.")).toBeTruthy();
    expect(screen.getByText("Serve warm.")).toBeTruthy();
  });

  it("US-5: shows the health score and my rating", async () => {
    serve();
    render(<RecipePage id="5" />);
    await loaded();
    expect(meta("Health score")).toBe("8/10");
    expect(screen.getByRole("img", { name: "Rated 4 out of 5" })).toBeTruthy();
  });

  it("AC-6: + on Servings scales the quantities; nutrition per serving is unchanged", async () => {
    serve();
    render(<RecipePage id="5" />);
    await loaded();
    const before = [tile("Calories"), row("Carbs"), row("Fat")];
    expect(
      screen.getByRole("spinbutton", { name: "Servings" }).textContent,
    ).toBe("2");

    fireEvent.click(screen.getByRole("button", { name: "Increase Servings" }));

    expect(
      screen.getByRole("spinbutton", { name: "Servings" }).textContent,
    ).toBe("3");
    expect(quantities()).toEqual([
      expect.stringContaining("300 g"),
      expect.stringContaining("1.5 piece"),
    ]);
    expect([tile("Calories"), row("Carbs"), row("Fat")]).toEqual(before);
  });

  it("Edit opens the recipe editor", async () => {
    serve();
    render(<RecipePage id="5" />);
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(location.pathname).toBe("/recipes/5/edit");
  });

  it("Delete asks first; cancelling keeps the recipe", async () => {
    const fetchMock = serve();
    vi.stubGlobal(
      "confirm",
      vi.fn(() => false),
    );
    render(<RecipePage id="5" />);
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(confirm).toHaveBeenCalledWith("Delete Turkey rice bowl?");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(location.pathname).toBe("/");
  });

  it("Delete, confirmed, removes the recipe and goes back to the list", async () => {
    const fetchMock = serve();
    vi.stubGlobal("confirm", () => true);
    render(<RecipePage id="5" />);
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await vi.waitFor(() => expect(location.pathname).toBe("/recipes"));
    expect(fetchMock).toHaveBeenLastCalledWith("/api/recipes/5", {
      method: "DELETE",
    });
  });

  it("a failed delete shows an error and keeps the recipe on screen", async () => {
    serve(undefined, () => Promise.resolve(jsonResponse({}, 500)));
    vi.stubGlobal("confirm", () => true);
    render(<RecipePage id="5" />);
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Couldn't delete the recipe. Try again.",
    );
    expect(
      screen.getByRole("heading", { name: "Turkey rice bowl" }),
    ).toBeTruthy();
    expect(location.pathname).toBe("/");
  });

  it("a 404 shows the not-found state, whose button goes back to the list", async () => {
    serve(() => Promise.resolve(jsonResponse({}, 404)));
    render(<RecipePage id="999" />);
    await screen.findByRole("heading", { name: "Recipe not found" });
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Back to recipes" }));
    expect(location.pathname).toBe("/recipes");
  });

  it("a failed load shows an error with Retry, which loads again", async () => {
    let fail = true;
    serve(() =>
      Promise.resolve(fail ? jsonResponse({}, 500) : jsonResponse(bowl)),
    );
    render(<RecipePage id="5" />);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Couldn't load the recipe.",
    );
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await loaded();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("has no axe violations, loaded", async () => {
    serve();
    const { container } = render(<RecipePage id="5" />);
    await loaded();
    expect(await axeViolations(container)).toEqual([]);
  });
});
