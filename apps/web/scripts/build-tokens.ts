import { readFileSync, writeFileSync } from "node:fs";
import { tokensToCss } from "../src/design-system/tokens.ts";

const json = JSON.parse(
  readFileSync(
    new URL("../../../docs/design-system/tokens.json", import.meta.url),
    "utf8",
  ),
);
writeFileSync(
  new URL("../src/design-system/tokens.css", import.meta.url),
  tokensToCss(json),
);
