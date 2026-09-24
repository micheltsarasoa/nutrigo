import { describe, expect, it } from "vitest";
import { parseEnv } from "./env.ts";

describe("parseEnv", () => {
  it("defaults to port 3000 and data/nutrigo.db at the repo root", () => {
    const env = parseEnv({});
    expect(env.PORT).toBe(3000);
    expect(env.DATABASE_PATH.replaceAll("\\", "/")).toMatch(
      /\/data\/nutrigo\.db$/,
    );
    expect(env.DATABASE_PATH.replaceAll("\\", "/")).not.toContain("apps/api");
  });

  it("reads PORT and DATABASE_PATH from the environment", () => {
    expect(
      parseEnv({ PORT: "8080", DATABASE_PATH: "/data/nutrigo.db" }),
    ).toEqual({ PORT: 8080, DATABASE_PATH: "/data/nutrigo.db" });
  });

  it("rejects a PORT that isn't a positive integer", () => {
    expect(() => parseEnv({ PORT: "abc" })).toThrow();
  });
});

describe("parseEnv WEB_ROOT", () => {
  it("is unset by default and read when given", () => {
    expect(parseEnv({}).WEB_ROOT).toBeUndefined();
    expect(parseEnv({ WEB_ROOT: "/app/apps/web/dist" }).WEB_ROOT).toBe(
      "/app/apps/web/dist",
    );
  });
});
