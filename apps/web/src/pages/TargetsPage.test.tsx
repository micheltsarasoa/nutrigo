import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TargetsPage } from "./TargetsPage.tsx";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });
const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const value = (label: string) =>
  (screen.getByLabelText(label) as HTMLInputElement).value;

afterEach(() => vi.unstubAllGlobals());

describe("TargetsPage", () => {
  it("shows an empty form when no targets are set", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(null)));
    render(<TargetsPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Targets" }),
    ).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("Loading…");
    await screen.findByLabelText("Calories");
    expect(value("Calories")).toBe("");
  });

  it("fills the form with the saved targets", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          json({ kcal: 2990, carbs: 325, protein: null, fat: 44 }),
        ),
    );
    render(<TargetsPage />);
    await screen.findByLabelText("Calories");
    expect(value("Calories")).toBe("2990");
    expect(value("Carbs")).toBe("325");
    expect(value("Protein")).toBe("");
    expect(value("Fat")).toBe("44");
  });

  it("saves with PUT /api/targets and confirms", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(null))
      .mockResolvedValueOnce(
        json({ kcal: 2990, carbs: 325, protein: 75, fat: 44 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<TargetsPage />);
    await screen.findByLabelText("Calories");
    type("Calories", "2990");
    type("Carbs", "325");
    type("Protein", "75");
    type("Fat", "44");
    fireEvent.click(screen.getByRole("button", { name: "Save targets" }));
    expect((await screen.findByRole("status")).textContent).toBe(
      "Targets saved.",
    );
    const [url, init] = fetchMock.mock.calls[1]!;
    expect(url).toBe("/api/targets");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body)).toEqual({
      kcal: 2990,
      carbs: 325,
      protein: 75,
      fat: 44,
    });
  });

  it("shows an error when saving fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(json(null))
        .mockResolvedValueOnce(json({ error: "VALIDATION_FAILED" }, 400)),
    );
    render(<TargetsPage />);
    await screen.findByLabelText("Calories");
    type("Calories", "2000");
    fireEvent.click(screen.getByRole("button", { name: "Save targets" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(
      /Couldn’t save/,
    );
  });

  it("shows an error when loading fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<TargetsPage />);
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toMatch(/Couldn’t load/),
    );
    expect(screen.queryByLabelText("Calories")).toBeNull();
  });
});
