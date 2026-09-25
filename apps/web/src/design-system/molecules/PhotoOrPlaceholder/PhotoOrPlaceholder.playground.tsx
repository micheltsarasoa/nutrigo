import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { PhotoOrPlaceholder } from "./PhotoOrPlaceholder.tsx";

// Stand-in images for the demo only: a soft two-tone gradient with a "plate".
const img = (from: string, to: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="160" height="100" fill="url(#g)"/><circle cx="80" cy="50" r="30" fill="#fff" fill-opacity=".35"/></svg>`,
  )}`;
const own = img("#C2E66E", "#FFA257");
const tomato = img("#FF8A65", "#E64A19");
const rice = img("#F5F0E6", "#D7CCC8");
const greens = img("#AED581", "#558B2F");
const lemon = img("#FFF59D", "#FBC02D");

const row: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fill, minmax(calc(var(--size-media-thumb) * 1.5), 1fr))",
  gap: "var(--space-4)",
};

export default {
  title: "PhotoOrPlaceholder",
  level: "molecule",
  states: {
    "own photo (hero)": (
      <PhotoOrPlaceholder
        photo={own}
        mosaic={[tomato]}
        mealType="lunch"
        size="hero"
      />
    ),
    "own photo (thumb)": (
      <div style={row}>
        <PhotoOrPlaceholder
          photo={own}
          mosaic={[]}
          mealType="lunch"
          size="thumb"
        />
      </div>
    ),
    "ingredient mosaic: 1, 2 and 4 images (thumb)": (
      <div style={row}>
        <PhotoOrPlaceholder
          photo={null}
          mosaic={[tomato]}
          mealType="lunch"
          size="thumb"
        />
        <PhotoOrPlaceholder
          photo={null}
          mosaic={[tomato, rice]}
          mealType="lunch"
          size="thumb"
        />
        <PhotoOrPlaceholder
          photo={null}
          mosaic={[tomato, rice, greens, lemon]}
          mealType="lunch"
          size="thumb"
        />
      </div>
    ),
    "ingredient mosaic (hero)": (
      <PhotoOrPlaceholder
        photo={null}
        mosaic={[tomato, rice, greens, lemon]}
        mealType="dinner"
        size="hero"
      />
    ),
    "placeholder for each meal type (thumb)": (
      <div style={row}>
        <PhotoOrPlaceholder
          photo={null}
          mosaic={[]}
          mealType="breakfast"
          size="thumb"
        />
        <PhotoOrPlaceholder
          photo={null}
          mosaic={[]}
          mealType="lunch"
          size="thumb"
        />
        <PhotoOrPlaceholder
          photo={null}
          mosaic={[]}
          mealType="snack"
          size="thumb"
        />
        <PhotoOrPlaceholder
          photo={null}
          mosaic={[]}
          mealType="dinner"
          size="thumb"
        />
      </div>
    ),
    "placeholder (hero)": (
      <PhotoOrPlaceholder
        photo={null}
        mosaic={[]}
        mealType="breakfast"
        size="hero"
      />
    ),
  },
} satisfies Demo;
