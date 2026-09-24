import type { Demo } from "./types.ts";
import "./playground.css";

const LEVELS = [
  ["atom", "Atoms"],
  ["molecule", "Molecules"],
  ["organism", "Organisms"],
] as const;

const slug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const href = (demo: Demo) => `/playground/${demo.level}/${slug(demo.title)}`;

export function Playground({ demos, path }: { demos: Demo[]; path: string }) {
  const [, , level, name] = path.split("/");
  if (!level) return <Index demos={demos} />;
  const demo = demos.find((d) => d.level === level && slug(d.title) === name);
  return (
    <main className="playground">
      <a href="/playground">All components</a>
      <h1>{demo?.title ?? "Component not found"}</h1>
      {demo &&
        Object.entries(demo.states).map(([state, node]) => (
          <section key={state} aria-label={state} className="playground__state">
            <h2>{state}</h2>
            {node}
          </section>
        ))}
    </main>
  );
}

function Index({ demos }: { demos: Demo[] }) {
  const groups = LEVELS.map(
    ([level, label]) =>
      [label, demos.filter((d) => d.level === level)] as const,
  ).filter(([, list]) => list.length > 0);
  return (
    <main className="playground">
      <h1>Playground</h1>
      {groups.length === 0 && <p>No components yet.</p>}
      {groups.map(([label, list]) => (
        <section key={label} aria-label={label}>
          <h2>{label}</h2>
          <ul>
            {list.map((demo) => (
              <li key={demo.title}>
                <a href={href(demo)}>{demo.title}</a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
