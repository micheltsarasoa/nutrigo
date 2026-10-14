The dot is the macro's colour: kcal green, carbs yellow, protein orange, fat grey. Organisms are screen sections that take props and never fetch data.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = {
  // Already filtered and sorted by the page.
  ingredients: IngredientListItem[];
  // How many ingredients each tab holds, before the search and category filter.
  counts: Record<"all" | Category, number>;
  loading?: boolean;
  query: string;
  category: "all" | Category;
  sort: Sort;
  onQueryChange: (query: string) => void;
  onCategoryChange: (category: "all" | Category) => void;
  onSortChange: (sort: Sort) => void;
  onAdd: () => void;
};
```

## States shown

- all
- grains
- veggies
- protein
- fruits
- dairy
- others
- many items (search, filter by category, sort: it's live; press Tab for the focus rings★)
- sorted by protein, highest first
- imported ingredients show their source, manual ones don't
- 1 item
- empty library (with Add your first ingredient)
- no search results
- no results for a category
- loading
- 390 px (the table scrolls sideways inside its card)

## Status

done, #170. Issue #169.
