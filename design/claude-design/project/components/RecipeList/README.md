The RecipeList organism. Organisms are screen sections that take props and never fetch data.

Use it instead of building a new one. Pass the props below; style only through tokens.

```ts
type Props = {
  recipes: RecipeListItem[];
  loading?: boolean;
  query: string;
  mealType: "all" | MealType;
  sort: Sort;
  view: View;
  onQueryChange: (query: string) => void;
  onMealTypeChange: (mealType: "all" | MealType) => void;
  onSortChange: (sort: Sort) => void;
  onViewChange: (view: View) => void;
  onAdd: () => void;
};
```

## States shown

- id
- title
- mealType
- kcal
- totalTime
- healthScore
- rating
- photo
- id
- title
- mealType
- kcal
- totalTime
- healthScore
- rating
- mosaic
- id
- title
- mealType
- kcal
- totalTime
- healthScore
- rating
- mosaic
- id
- title
- mealType
- kcal
- totalTime
- healthScore
- rating
- id
- title
- mealType
- kcal
- totalTime
- healthScore
- rating
- photo
- id
- title
- mealType
- kcal
- totalTime
- healthScore
- rating
- name
- kcal
- health
- time
- rating
- many items, list view (search, filter, sort and switch view: it's live; press Tab for the focus rings★)
- many items, grid view (2 columns from 768 px, 1 on a phone)
- 1 item
- empty library (with Add recipe)
- no search results
- no results for a meal type
- loading
- 320 px, list view
- 1280 px, grid view (on a phone, scroll this frame sideways)

## Status

done, #143. Issue #103.
