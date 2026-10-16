import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Ring } from "./design-system/organisms/Ring/Ring.tsx";
import { LocaleProvider } from "./locale.tsx";

// PRD C-1, SPEC-008 AC-1/AC-2: 1240 kcal reads "1 240" in fr-FR and "1,240" in en-IE.
describe("locale", () => {
  it("formats kcal with the saved locale", () => {
    const { rerender } = render(
      <LocaleProvider value="fr-FR">
        <Ring kcal={1240} target={2990} />
      </LocaleProvider>,
    );
    expect(screen.getByRole("img").getAttribute("aria-label")).toMatch(
      /^1\s240 kcal of 2\s990$/,
    );
    rerender(
      <LocaleProvider value="en-IE">
        <Ring kcal={1240} target={2990} />
      </LocaleProvider>,
    );
    expect(screen.getByRole("img").getAttribute("aria-label")).toBe(
      "1,240 kcal of 2,990",
    );
  });

  it("leaves numbers as they are without a provider (tests, playground)", () => {
    render(<Ring kcal={1240} target={2990} />);
    expect(screen.getByRole("img").getAttribute("aria-label")).toBe(
      "1240 kcal of 2990",
    );
  });
});
