By the last key of the Zod issue path; custom issues keep their own message. Organisms are screen sections that take props and never fetch data.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = {
  /** The saved recipe to edit; leave it out for a new one. */
  recipe?: RecipeInput;
  /** The ingredient library, for the ingredient lines. */
  ingredients: { id: number; name: string; defaultUnit: Unit }[];
  saving?: boolean;
  /** A save that failed on the server; the input stays as it is. */
  error?: string | null;
  onSave: (recipe: RecipeInput) => void;
  onCancel: () => void;
};
```

## States shown

- new (empty; press Save for the errors, Tab for the focus ring★)
- edit (3 ingredients, 2 steps, 2 tools; drag a grip ⠿ to reorder, or tap it for the move buttons)
- validation errors (after Save)
- saving (Save busy)
- server error (input kept)
- discard confirmation (change a field, then press Cancel)
- 1280 px (on a phone, scroll this frame sideways)

## Status

done, #147. Issue #105.
