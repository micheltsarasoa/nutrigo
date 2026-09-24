type Tree = { [key: string]: unknown };

const HEADER =
  "/* Generated from docs/design-system/tokens.json by `npm run tokens -w @nutrigo/web`. Don't edit by hand. */\n";

// "{color.green.base}" -> "var(--color-green-base)"
const resolve = (value: unknown) =>
  typeof value === "string"
    ? value.replace(
        /\{([^}]+)\}/g,
        (_, path: string) => `var(--${path.replaceAll(".", "-")})`,
      )
    : String(value);

function* declarations(tree: Tree, path: string[]): Generator<string> {
  for (const [key, node] of Object.entries(tree)) {
    if (key.startsWith("$") || typeof node !== "object" || node === null)
      continue;
    const next = [...path, key];
    if ("$value" in node)
      yield `  --${next.join("-")}: ${resolve(node.$value)};\n`;
    else yield* declarations(node as Tree, next);
  }
}

export function tokensToCss(tokens: Tree): string {
  // Semantic tokens read better without the group name: --macro-kcal, not --semantic-macro-kcal.
  const { semantic, ...rest } = tokens;
  const body = [
    ...declarations(rest, []),
    ...declarations((semantic ?? {}) as Tree, []),
  ].join("");
  return `${HEADER}:root {\n${body}}\n`;
}
