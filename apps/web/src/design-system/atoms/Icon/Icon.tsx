import type { ReactNode } from "react";
import styles from "./Icon.module.css";

// Drawn from docs/design-system/index.html §06: 24 grid, round strokes, stroke width per icon as designed.
const ICONS = {
  dashboard: [
    1.9,
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>,
  ],
  calendar: [
    1.9,
    <>
      <rect x="3" y="4.5" width="18" height="16" rx="3" />
      <path d="M8 3v3M16 3v3M3 10h18" />
    </>,
  ],
  menu: [
    1.9,
    <>
      <path d="M5 3v7a2 2 0 0 0 4 0V3M7 10v11M15 3c-1.5 2-1.5 5 0 6.5V21" />
      <path d="M19 3v18" />
    </>,
  ],
  diary: [
    1.9,
    <>
      <rect x="4" y="3" width="16" height="18" rx="3" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>,
  ],
  items: [
    2,
    <>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
      <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
    </>,
  ],
  kcal: [2, <path d="M12 3s5 4.5 5 9a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5" />],
  carbs: [
    2,
    <>
      <path d="M5 9h14l-1.5 10h-11z" />
      <path d="M9 9V6h6v3" />
    </>,
  ],
  protein: [
    2,
    <>
      <path d="M14 4l6 6-9 9H5v-6z" />
      <path d="M9 15l3-3" />
    </>,
  ],
  fat: [2, <path d="M12 3c3 4 5 6.5 5 9a5 5 0 0 1-10 0c0-2.5 2-5 5-9z" />],
  cost: [
    2,
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.4 0-2.5.8-2.5 2s1.1 1.8 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6.5v11" />
    </>,
  ],
  search: [
    2,
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>,
  ],
  filter: [2, <path d="M3 5h18l-7 8v6l-4-2v-4z" />],
  add: [2.4, <path d="M12 5v14M5 12h14" />],
  check: [3.2, <path d="M5 13l4 4 10-10" />],
  time: [
    2,
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>,
  ],
  difficulty: [2, <path d="M5 20V12M10 20V6M15 20v-5M20 20V9" />],
  "health-score": [2, <path d="M3 12h4l2-4 3 8 2.5-5 1.5 3h5" />],
  steps: [2, <path d="M4 7h16M4 12h16M4 17h10" />],
  prev: [2.4, <path d="M15 6l-6 6 6 6" />],
  chevron: [2.2, <path d="M6 9l6 6 6-6" />],
} satisfies Record<string, [number, ReactNode]>;

export type IconName = keyof typeof ICONS;
export const ICON_NAMES = Object.keys(ICONS) as IconName[];

type Props = {
  name: IconName;
  size?: "xs" | "sm" | "md" | "lg";
  /** Give a label only when the icon carries meaning on its own; otherwise it's decorative. */
  label?: string;
};

export function Icon({ name, size = "md", label }: Props) {
  const [strokeWidth, shape] = ICONS[name];
  return (
    <svg
      className={`${styles.icon} ${styles[size]}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      focusable="false"
      {...(label
        ? { role: "img", "aria-label": label }
        : { "aria-hidden": true })}
    >
      {shape}
    </svg>
  );
}
