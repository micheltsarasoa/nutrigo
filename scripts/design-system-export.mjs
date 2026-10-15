// Builds the generated half of the Claude Design System copy in design/claude-design/project/:
// tokens.json, fonts, the component bundle + previews + READMEs, and the icon/logo SVGs.
// The brand-book *.md files and Cover/preview.html in that folder are hand-written; this never touches them.
import { build } from "esbuild";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const root = join(import.meta.dirname, "..");
const src = join(root, "apps/web/src/design-system");
const out = join(root, "design/claude-design/project");
const scratch = mkdtempSync(join(tmpdir(), "ds-export-"));
const write = (path, text) => {
  mkdirSync(dirname(join(out, path)), { recursive: true });
  writeFileSync(join(out, path), text);
};

// ---- tokens.json (list shape the page reads, from docs/design-system/tokens.json) ----
const source = JSON.parse(
  readFileSync(join(root, "docs/design-system/tokens.json"), "utf8"),
);
const flat = (tree, path = []) =>
  Object.entries(tree).flatMap(([key, node]) => {
    if (key.startsWith("$") || typeof node !== "object" || node === null)
      return [];
    return "$value" in node
      ? [[[...path, key].join("-"), node]]
      : flat(node, [...path, key]);
  });
const byName = new Map();
for (const [group, tree] of Object.entries(source)) {
  if (!group.startsWith("$"))
    for (const [name, node] of flat(tree, group === "semantic" ? [] : [group]))
      byName.set(name, { ...node, group });
}
const literal = (value) =>
  String(value).replace(
    /\{([^}]+)\}/g,
    (_, p) => byName.get(p.replaceAll(".", "-")).$value,
  );
const alias = (value) =>
  value.replace(/\{([^}]+)\}/g, (_, p) => `{${p.replaceAll(".", "-")}}`);
const neutralUsage = {
  "color-neutral-ink":
    "Primary text, icons on light fills, and the focus ring.",
  "color-neutral-muted": "Secondary text on cream and surface.",
  "color-neutral-faint":
    "Decorative text only (placeholders, axis); never required reading.",
  "color-neutral-cream": "Page ground.",
  "color-neutral-surface": "Card surface.",
  "color-neutral-subtle": "Subtle fills behind grouped content.",
  "color-neutral-line": "Hairlines and gridlines.",
  "color-neutral-track": "Track of progress bars and rings.",
};
const family_ = {
  green: "grains, success, calories",
  yellow: "veggies, carbs, to-do",
  orange: "protein, emphasis",
};
const rules = [
  [
    /^color-(green|yellow|orange)-(medium|light)$/,
    (m) =>
      `${m[2] === "medium" ? "Medium" : "Light"} tint of the ${m[1]} family (${family_[m[1]]}): fills behind ink text.`,
  ],
  [
    /^macro-(\w+)$/,
    (m) =>
      `Colour of ${m[1]} in tiles, bars and charts. Order is always kcal, carbs, protein, fat.`,
  ],
  [/^meal-slot-(\w+)$/, (m) => `Colour of the ${m[1]} meal slot.`],
  [
    /^food-category-(\w+)$/,
    (m) => `Colour of the ${m[1]} grocery aisle. Six categories at most.`,
  ],
  [
    /^space-(\d+)$/,
    () =>
      "Spacing step on the 4 px base. Snap other values to the nearest token.",
  ],
  [/^radius-xl$/, () => "Cards."],
  [/^radius-pill$/, () => "Pills and fully rounded controls."],
  [/^radius-/, () => "Corner radius step."],
  [/^shadow-soft$/, () => "Tooltips. One of the two elevation levels."],
  [/^shadow-card$/, () => "Cards. One of the two elevation levels."],
  [/^shadow-phone$/, () => "Phone frame mock-ups only."],
  [/^size-sidebar$/, () => "Sidebar width at 1200 px and up."],
  [/^size-aside$/, () => "Aside width at 1440 px and up."],
  [/^size-control-sm$/, () => "Height of small controls (44 px hit area)."],
  [
    /^breakpoint-/,
    () => "Layout breakpoint. Only 1200 px and up is built before v1.0.0.",
  ],
  [/^focus-width$/, () => "Focus ring thickness."],
  [/^focus-offset$/, () => "Gap between a control and its focus ring."],
  [/^focus-color$/, () => "Focus ring colour."],
  [/^font-weight-/, () => "Poppins weight."],
  [/^color-neutral-scrollbar$/, () => "Scrollbar thumb."],
];
const usage = (name, node) =>
  node.role ??
  node.use ??
  neutralUsage[name] ??
  (node.from
    ? `Derived from ${node.from}.`
    : (rules.flatMap(([re, fn]) => {
        const m = re.exec(name);
        return m ? [fn(m)] : [];
      })[0] ?? `${node.group} token.`));
const family = (group, map = (name, node) => literal(node.$value)) => ({
  tokens: [...byName]
    .filter(([, n]) => n.group === group)
    .map(([name, node]) => ({
      name,
      value: map(name, node),
      usage: usage(name, node),
    })),
});

const colorNodes = [...byName].filter(
  ([name, n]) =>
    ["color", "semantic"].includes(n.group) || name === "focus-color",
);
const tokens = {
  name: "NutriGo",
  version: 1,
  meta: {
    source: "docs/design-system/tokens.json",
    synced: new Date().toISOString().slice(0, 10),
  },
  color: {
    themes: [{ id: "light", name: "Light" }],
    tokens: colorNodes.map(([name, node]) => {
      const v = String(node.$value);
      return {
        name,
        value: v.startsWith("{") ? alias(v) : v.toLowerCase(),
        usage: usage(name, node),
      };
    }),
  },
  type: {
    fonts: [400, 500, 600, 700, 800].map((w) => ({
      family: "Poppins",
      file: `fonts/poppins-${w}.woff2`,
      weight: String(w),
      style: "normal",
    })),
    families: { sans: '"Poppins", system-ui, -apple-system, sans-serif' },
    groups: [
      {
        name: "Scale",
        family: "sans",
        styles: [
          ["page", 26, 800, "Meal Plan"],
          ["figure", 28, 800, "1 240 kcal"],
          ["figure-sm", 20, 800, "450 kcal"],
          ["title", 16, 600, "Calories Intake"],
          [
            "body",
            14,
            400,
            "A lean and balanced meal for a post-workout lunch.",
          ],
          ["caption", 12, 500, "Per serving"],
          ["micro", 11, 500, "Per serving"],
        ].map(([name, fontSize, fontWeight, sample]) => ({
          name,
          fontSize: `${fontSize}px`,
          fontWeight,
          sample,
        })),
      },
    ],
  },
  spacing: family("space"),
  radius: family("radius"),
  shadow: family("shadow"),
  size: { tokens: [...family("size").tokens, ...family("breakpoint").tokens] },
  opacity: family("opacity"),
  focus: {
    tokens: family("focus").tokens.filter((t) => t.name !== "focus-color"),
  },
  font: {
    tokens: family("font").tokens.filter((t) => t.name !== "font-family-sans"),
  },
};
write("tokens.json", JSON.stringify(tokens, null, 2) + "\n");

write(
  "component-status.md",
  readFileSync(join(root, "docs/design-system/components-status.md"), "utf8"),
);

// ---- fonts ----
for (const w of [400, 500, 600, 700, 800]) {
  mkdirSync(join(out, "fonts"), { recursive: true });
  cpSync(
    join(src, `fonts/poppins-${w}.woff2`),
    join(out, `fonts/poppins-${w}.woff2`),
  );
}

// ---- components: one bundle that runs every playground page ----
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
const demos = walk(src)
  .filter((f) => f.endsWith(".playground.tsx"))
  .map((file) => ({
    file,
    name: basename(file, ".playground.tsx"),
    level: file.slice(src.length + 1).split("/")[0],
  }))
  .sort(
    (a, b) =>
      ["atoms", "molecules", "organisms"].indexOf(a.level) -
        ["atoms", "molecules", "organisms"].indexOf(b.level) ||
      a.name.localeCompare(b.name),
  );

const entry = join(scratch, "entry.jsx");
writeFileSync(
  entry,
  `import { createElement as h, Fragment } from "react";
import { createRoot } from "react-dom/client";
import ${JSON.stringify(join(src, "global.css"))};
${demos.map((d, i) => `import d${i} from ${JSON.stringify(d.file)};`).join("\n")}
const demos = { ${demos.map((d, i) => `${d.name}: d${i}`).join(", ")} };
const label = { margin: "0 0 var(--space-2)", fontSize: "var(--font-size-caption)", fontWeight: "var(--font-weight-medium)", color: "var(--color-neutral-muted)" };
function mount(name, el) {
  const states = Object.entries(demos[name].states);
  createRoot(el).render(h(Fragment, null, states.map(([text, node]) =>
    h("section", { key: text, style: { marginBottom: "var(--space-6)" } }, h("p", { style: label }, text), node))));
}
window.NutriGo = { demos, mount };
`,
);
await build({
  entryPoints: [entry],
  outdir: scratch,
  bundle: true,
  format: "iife",
  minify: true,
  jsx: "automatic",
  target: "es2022",
  define: { "process.env.NODE_ENV": '"production"' },
  loader: {
    ".module.css": "local-css",
    ".svg": "dataurl",
    ".png": "dataurl",
    ".woff2": "dataurl",
  },
  nodePaths: [join(root, "node_modules")],
  logLevel: "warning",
});
const names = demos.map((d) => ({ name: d.name }));
const js = readFileSync(join(scratch, "entry.js"), "utf8")
  .replaceAll("</script", "<\\/script")
  .replaceAll("<!--", "<\\!--");
write(
  "components/bundle.js",
  `/* @ds-bundle: ${JSON.stringify({ format: 4, namespace: "NutriGo", components: names })} */\n${js}`,
);
write(
  "components/bundle.css",
  `:root{--font-family-sans:var(--font-sans);--motion-fast:150ms ease}\n${readFileSync(join(scratch, "entry.css"), "utf8")}`,
);

// ---- per-component preview + README ----
const status = Object.fromEntries(
  [
    ...readFileSync(
      join(root, "docs/design-system/components-status.md"),
      "utf8",
    ).matchAll(/^\| ([A-Za-z]+) \| ([^|]*) \| ([^|]*) \| `([^`]+)` \|/gm),
  ].map((m) => [
    m[1],
    { issue: m[2].trim(), where: m[3].trim(), status: m[4] },
  ]),
);
const heights = { atoms: 60, molecules: 90, organisms: 0 };
for (const { file, name, level } of demos) {
  const code = readFileSync(file.replace(".playground.tsx", ".tsx"), "utf8");
  const states = [
    ...readFileSync(file, "utf8").matchAll(
      /^ {4}("(?:[^"\\]|\\.)*"|[A-Za-z_]\w*):/gm,
    ),
  ].map((m) => m[1].replace(/^"|"$/g, ""));
  const props = /^type Props =[\s\S]*?^\};/m.exec(code)?.[0];
  const comment = /(?:^|\n)((?:\/\/[^\n]*\n)+)(?:export )?(?:function|const) /
    .exec(code)?.[1]
    .replace(/^\/\/ ?/gm, "")
    .trim()
    .replace(/\n/g, " ");
  const summary =
    comment && /^[A-Z]\S* \S+ \S+ \S+/.test(comment)
      ? comment
      : `The ${name} ${level.slice(0, -1)}.`;
  const group = level[0].toUpperCase() + level.slice(1);
  const size =
    level === "organisms"
      ? "width=1200 height=720"
      : `height=${Math.min(Math.max(states.length * heights[level], 120), 900)}`;
  write(
    `components/${name}/preview.html`,
    `<!-- @dsCard group="${group}" ${size} subtitle="${states.length} state${states.length === 1 ? "" : "s"}" -->
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${name}</title></head>
<body style="margin:0;padding:var(--space-4)"><div id="root"></div>
<script>NutriGo.mount(${JSON.stringify(name)}, document.getElementById("root"));</script></body></html>
`,
  );
  const s = status[name];
  write(
    `components/${name}/README.md`,
    `${summary.replace(/([^.!?])$/, "$1.")} ${level === "organisms" ? "Organisms are screen sections that take props and never fetch data." : `A${level === "atoms" ? "n atom" : " molecule"} in the NutriGo design system.`}

Use it instead of building a new one. Pass the props below; style only through tokens.

${props ? `\`\`\`ts\n${props}\n\`\`\`\n` : ""}
## States shown

${states.map((t) => `- ${t}`).join("\n")}

${s ? `## Status\n\n${s.status}, ${s.where}. Issue ${s.issue}.\n` : ""}`,
  );
}

// ---- icons and logo as single-ink SVG ----
const iconsEntry = join(scratch, "icons.mjs");
const iconsOut = join(root, "node_modules/.cache/ds-export-icons.mjs"); // inside the repo so react resolves
writeFileSync(
  iconsEntry,
  `import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Icon, ICON_NAMES } from ${JSON.stringify(join(src, "atoms/Icon/Icon.tsx"))};
export default Object.fromEntries(ICON_NAMES.map((n) => [n, renderToStaticMarkup(h(Icon, { name: n }))]));
`,
);
await build({
  entryPoints: [iconsEntry],
  outfile: iconsOut,
  bundle: true,
  packages: "external",
  format: "esm",
  platform: "node",
  jsx: "automatic",
  loader: { ".module.css": "local-css" },
  logLevel: "warning",
});
const icons = (await import(pathToFileURL(iconsOut).href)).default;
const ink = byName.get("color-neutral-ink").$value;
for (const [name, svg] of Object.entries(icons)) {
  write(
    `assets/Icons/${name}.svg`,
    svg
      .replace(
        / class="[^"]*"/,
        ` xmlns="http://www.w3.org/2000/svg" width="24" height="24"`,
      )
      .replace(' aria-hidden="true"', "")
      .replace(' focusable="false"', "")
      .replaceAll("currentColor", ink) + "\n",
  );
}
const mark = byName;
write(
  "assets/Logos/nutrigo-mark.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26"><path fill="${mark.get("color-yellow-base").$value}" d="M4 3.5h18a9 9 0 0 1-18 0z"/><path fill="${mark.get("color-green-base").$value}" d="M4 14h18a9 9 0 0 1-18 0z"/></svg>\n`,
);
write(
  "assets/Icons/README.md",
  `Single-ink line icons on a 24 px grid, 1.9 to 2 px round strokes, drawn in \`color-neutral-ink\` (${ink}). Used by the \`Icon\` component; the SVG files are for reference and export. Recolour by editing the file, not with CSS, because an \`<img>\` cannot inherit \`currentColor\`.\n`,
);
write(
  "assets/Logos/README.md",
  `The NutriGo mark: two stacked bowls, yellow over green (\`color-yellow-base\` over \`color-green-base\`), on a 26 px grid. The wordmark "NutriGo" is set in Poppins next to it. Keep clear space of half the mark height; minimum 20 px. Never rotate, recolour or stretch.\n`,
);
console.log(
  `${demos.length} components, ${Object.keys(icons).length} icons, ${tokens.color.tokens.length} colours`,
);
