import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { MenuListItem } from "./MenuListItem.tsx";

// Stand-ins for the media slot; the recipe list passes a PhotoOrPlaceholder (#101).
const box: CSSProperties = {
  display: "block",
  width: "100%",
  height: "calc(var(--size-menu-media) * 0.75)",
  borderRadius: "var(--radius-md)",
  objectFit: "cover",
};
const photo = (
  <img
    style={box}
    alt=""
    src={`data:image/svg+xml,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="#C2E66E"/><stop offset="1" stop-color="#FFA257"/></linearGradient></defs><rect width="160" height="100" fill="url(#g)"/><circle cx="80" cy="50" r="30" fill="#fff" fill-opacity=".35"/></svg>',
    )}`}
  />
);
const placeholder = (
  <div style={{ ...box, background: "var(--meal-slot-dinner)" }} />
);

const recipe = {
  href: "#recipe",
  media: photo,
  title: "Grilled turkey with brown rice and asparagus",
  mealType: "lunch" as const,
  mealLabel: "Lunch",
  kcal: 540,
  totalTime: "35 min",
  healthScore: 9,
  rating: 4,
};

const list: CSSProperties = { display: "grid", gap: "var(--space-3)" };
const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fill, minmax(calc(var(--size-aside) * 0.7), 1fr))",
  gap: "var(--space-3)",
};

export default {
  title: "MenuListItem",
  level: "molecule",
  states: {
    "list variant (hover it; press Tab to see the focus ring★)": (
      <div style={list}>
        <MenuListItem {...recipe} variant="list" />
        <MenuListItem
          {...recipe}
          media={placeholder}
          title="Salmon poke bowl"
          mealType="dinner"
          mealLabel="Dinner"
          kcal={610}
          totalTime="20 min"
          healthScore={8}
          rating={5}
          variant="list"
        />
      </div>
    ),
    "grid variant": (
      <div style={grid}>
        <MenuListItem {...recipe} variant="grid" />
        <MenuListItem
          {...recipe}
          media={placeholder}
          title="Overnight oats"
          mealType="breakfast"
          mealLabel="Breakfast"
          kcal={380}
          variant="grid"
        />
        <MenuListItem
          {...recipe}
          title="Apple and peanut butter"
          mealType="snack"
          mealLabel="Snack"
          kcal={210}
          totalTime="5 min"
          variant="grid"
        />
      </div>
    ),
    "without photo (placeholder in the slot)": (
      <div style={list}>
        <MenuListItem {...recipe} media={placeholder} variant="list" />
      </div>
    ),
    "long title (2 lines, then ellipsis)": (
      <div style={grid}>
        <MenuListItem
          {...recipe}
          title="Slow-roasted Mediterranean vegetables with herbed quinoa, feta crumbles, toasted pine nuts and a lemon tahini dressing"
          variant="grid"
        />
      </div>
    ),
    "no rating, no total time (–)": (
      <div style={list}>
        <MenuListItem
          {...recipe}
          totalTime={null}
          rating={null}
          variant="list"
        />
      </div>
    ),
  },
} satisfies Demo;
