import type { ReactNode } from "react";

// What every *.playground.tsx exports as default (frontend.md §4).
export type Demo = {
  title: string;
  level: "atom" | "molecule" | "organism";
  states: Record<string, ReactNode>;
};
