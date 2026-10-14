The PhotoOrPlaceholder molecule. A molecule in the NutriGo design system.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = {
  photo: string | null;
  // Ingredient product images; only the first 4 are shown.
  mosaic: string[];
  mealType: "breakfast" | "lunch" | "snack" | "dinner";
  size: "hero" | "thumb";
  // Decorative by default: a title sits next to it.
  alt?: string;
};
```

## States shown

- own photo (hero)
- own photo (thumb)
- ingredient mosaic: 1, 2 and 4 images (thumb)
- ingredient mosaic (hero)
- placeholder for each meal type (thumb)
- placeholder (hero)

## Status

done, #139. Issue #101.
