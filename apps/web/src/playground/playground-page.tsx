import { Playground } from "./playground.tsx";
import type { Demo } from "./types.ts";

// Every component registers itself by having a *.playground.tsx next to it (ADR-0006).
const modules = import.meta.glob<{ default: Demo }>(
  "../design-system/**/*.playground.tsx",
  { eager: true },
);
const demos = Object.values(modules).map((m) => m.default);

export default function PlaygroundPage({ path }: { path: string }) {
  return <Playground demos={demos} path={path} />;
}
