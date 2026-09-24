import { expect, it } from "vitest";

// Throwaway probe for SPEC-001 AC-5: this PR must not be mergeable. Never merge.
it("fails on purpose", () => {
  expect(1).toBe(2);
});
