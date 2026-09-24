import js from "@eslint/js";
import tseslint from "typescript-eslint";

const focusedOrSkipped = ["describe", "it", "test"].flatMap((object) =>
  ["only", "skip"].map((property) => ({
    object,
    property,
    message: "Never .only/.skip a test (CLAUDE.md rule 10).",
  })),
);
const onlyShared = "web and api only share code through @nutrigo/shared.";
const noApi = {
  group: ["@nutrigo/api", "**/apps/api/**"],
  message: onlyShared,
};
const noWeb = {
  group: ["@nutrigo/web", "**/apps/web/**"],
  message: onlyShared,
};
const restrict = (...patterns) => ({
  "no-restricted-imports": ["error", { patterns }],
});

// Each atomic level may import only from the levels below it (docs/architecture/frontend.md §2).
// Flat config replaces a rule per file, so each level also repeats the web -> api ban.
const levels = ["atoms", "molecules", "organisms", "pages"];
const levelBoundaries = levels.slice(0, 3).map((level, i) => ({
  files: [`apps/web/src/design-system/${level}/**`],
  rules: restrict(
    noApi,
    ...levels.slice(i + 1).map((above) => ({
      group: [`**/${above}/**`],
      message: `${level} can't import ${above}.`,
    })),
  ),
}));

export default tseslint.config(
  {
    ignores: [
      "**/dist/",
      "**/dist-playground/",
      "**/coverage/",
      "**/playwright-report/",
      "**/test-results/",
      "design/",
      "docs/",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { rules: { "no-restricted-properties": ["error", ...focusedOrSkipped] } },
  {
    files: ["**/*.{js,mjs}"],
    languageOptions: { globals: { process: "readonly", console: "readonly" } },
  },
  { files: ["apps/web/**"], rules: restrict(noApi) },
  { files: ["apps/api/**"], rules: restrict(noWeb) },
  ...levelBoundaries,
);
