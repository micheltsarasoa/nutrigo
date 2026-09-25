import { describe, expect, it } from "vitest";
import { SettingsInput } from "./settings.ts";

describe("SettingsInput", () => {
  it("SPEC-008 US-1: accepts fr-FR and en-IE", () => {
    expect(SettingsInput.parse({ locale: "fr-FR" })).toEqual({
      locale: "fr-FR",
    });
    expect(SettingsInput.parse({ locale: "en-IE" })).toEqual({
      locale: "en-IE",
    });
  });

  it("rejects an unknown locale", () => {
    expect(SettingsInput.safeParse({ locale: "en-US" }).success).toBe(false);
  });
});
