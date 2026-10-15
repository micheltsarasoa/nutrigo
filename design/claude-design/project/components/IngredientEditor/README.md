The per-100 g values, in form order. Organisms are screen sections that take props and never fetch data.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = {
  /** The saved ingredient to edit; leave it out for a new one. */
  ingredient?: IngredientInput & { source: Source };
  saving?: boolean;
  /** A save or delete that failed on the server; the input stays as it is. */
  error?: string | null;
  /** The recipes that block a delete (AC-9's 409), shown under the error. */
  usedBy?: string[] | null;
  onSave: (ingredient: IngredientInput) => void;
  onCancel: () => void;
  /** Edit only: shows Delete, which asks first. */
  onDelete?: () => void;
};
```

## States shown

- new (empty, source Manual; press Save for the errors, Tab for the focus ring★)
- edit (Oats, AC-1 values; press Delete for the confirmation, or change a field and press Cancel)
- validation errors (empty kcal, negative fat, after Save)
- saving (Save busy)
- server error (input kept)
- server error: delete refused, used by recipes (AC-9's 409)
- 1280 px (on a phone, scroll this frame sideways)

## Status

done, #148 (44 px Delete hit area since #157). Issue #106, #156.
