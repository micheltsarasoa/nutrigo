import { Button } from "../../atoms/Button/index.ts";
import { Pill } from "../../atoms/Pill/index.ts";
import { StarRating } from "../../atoms/StarRating/index.ts";
import { Stepper } from "../../atoms/Stepper/index.ts";
import { IngredientRow } from "../../molecules/IngredientRow/index.ts";
import { MacroTile } from "../../molecules/MacroTile/index.ts";
import { MetaRow } from "../../molecules/MetaRow/index.ts";
import { NoteItem } from "../../molecules/NoteItem/index.ts";
import { NutritionRow } from "../../molecules/NutritionRow/index.ts";
import { PhotoOrPlaceholder } from "../../molecules/PhotoOrPlaceholder/index.ts";
import { RecipeStep } from "../../molecules/RecipeStep/index.ts";
import { ToolItem } from "../../molecules/ToolItem/index.ts";
import styles from "./RecipeDetail.module.css";

const MEALS = {
  breakfast: { label: "Breakfast", pill: "green" },
  lunch: { label: "Lunch", pill: "yellow" },
  snack: { label: "Snack", pill: "grey" },
  dinner: { label: "Dinner", pill: "orange" },
} as const;

// Everything comes formatted for the locale by the page, and the ingredient
// quantities come already scaled to `servings` (scaleQuantities in packages/shared).
export type RecipeDetailData = {
  title: string;
  mealType: keyof typeof MEALS;
  description: string | null;
  photo: string | null;
  mosaic: string[];
  prepTime: string | null;
  cookTime: string | null;
  difficulty: string | null;
  healthScore: number;
  rating: number | null;
  // Per serving: kcal, then grams.
  macros: { kcal: string; carbs: string; protein: string; fat: string };
  // Per serving, after the Calories row.
  nutrition: { label: string; value: string | null }[];
  ingredients: { quantity: string; name: string }[];
  steps: { title: string; body: string }[];
  tools: string[];
  notes: string[];
};

type Props = {
  // null: not found, unless loading.
  recipe: RecipeDetailData | null;
  loading?: boolean;
  servings: number;
  onServingsChange: (servings: number) => void;
  onBack: () => void;
};

// .rd-grid from Recipe Details (Reviews, Eat time and Vitamin C removed, SPEC-002 §4).
// The source order is the phone order; a wide container floats the rail and the
// aside cards to the left of the recipe text.
export function RecipeDetail({
  recipe,
  loading = false,
  servings,
  onServingsChange,
  onBack,
}: Props) {
  if (loading) {
    return (
      <p role="status" className={styles.message}>
        Loading recipe…
      </p>
    );
  }
  if (!recipe) {
    return (
      <div className={styles.message}>
        <h1 className={styles.messageTitle}>Recipe not found</h1>
        <p>It may have been deleted.</p>
        <Button icon="prev" onClick={onBack}>
          Back to recipes
        </Button>
      </div>
    );
  }
  const meal = MEALS[recipe.mealType];
  const { kcal, carbs, protein, fat } = recipe.macros;
  const steps = recipe.steps.length;
  return (
    <div className={styles.frame}>
      <div className={styles.detail}>
        <div className={`${styles.side} ${styles.hero}`}>
          <PhotoOrPlaceholder
            photo={recipe.photo}
            mosaic={recipe.mosaic}
            mealType={recipe.mealType}
            size="hero"
          />
        </div>

        <div className={`${styles.main} ${styles.head}`}>
          <h1 className={styles.title}>{recipe.title}</h1>
          <div className={styles.tags}>
            <Pill variant={meal.pill}>{meal.label}</Pill>
            {recipe.rating !== null && <StarRating value={recipe.rating} />}
          </div>
          {recipe.description && (
            <p className={styles.description}>{recipe.description}</p>
          )}
        </div>

        <dl className={`${styles.side} ${styles.card} ${styles.meta}`}>
          <MetaRow icon="prep" label="Prep time" value={recipe.prepTime} />
          <MetaRow icon="cook" label="Cook time" value={recipe.cookTime} />
          <MetaRow
            icon="difficulty"
            label="Difficulty"
            value={recipe.difficulty}
          />
          <MetaRow
            icon="steps"
            label="Steps"
            value={steps ? `${steps} ${steps === 1 ? "step" : "steps"}` : null}
          />
          <MetaRow
            icon="health-score"
            label="Health score"
            value={`${recipe.healthScore}/10`}
          />
        </dl>

        <div className={`${styles.side} ${styles.tiles}`}>
          <MacroTile macro="kcal" label="Calories" value={kcal} />
          <MacroTile macro="carbs" label="Carbs" value={carbs} />
          <MacroTile macro="protein" label="Protein" value={protein} />
          <MacroTile macro="fat" label="Fat" value={fat} />
        </div>

        <section className={`${styles.side} ${styles.card}`}>
          <div className={styles.servings}>
            <span className={styles.servingsLabel} aria-hidden="true">
              Servings
            </span>
            <Stepper
              label="Servings"
              value={servings}
              min={1}
              max={12}
              onChange={onServingsChange}
            />
          </div>
          <h2 className={styles.cardTitle}>Ingredients</h2>
          <ol className={styles.list}>
            {recipe.ingredients.map((ing, i) => (
              <IngredientRow
                key={i}
                n={i + 1}
                quantity={ing.quantity}
                name={ing.name}
              />
            ))}
          </ol>
        </section>

        {/* Last on a phone (SPEC-002 §4), but under the ingredients in the wide layout. */}
        <section
          className={`${styles.side} ${styles.card} ${styles.nutrition}`}
        >
          <h2 className={styles.cardTitle}>Nutrition facts</h2>
          <table className={styles.table}>
            <tbody>
              <NutritionRow
                label="Calories"
                value={`${kcal} kcal`}
                caption="Per serving"
              />
              {recipe.nutrition.map((n) => (
                <NutritionRow key={n.label} label={n.label} value={n.value} />
              ))}
            </tbody>
          </table>
        </section>

        {steps > 0 && (
          <section className={`${styles.main} ${styles.block}`}>
            <h2 className={styles.blockTitle}>Directions</h2>
            <ol className={styles.list}>
              {recipe.steps.map((s, i) => (
                <RecipeStep key={i} n={i + 1} title={s.title} body={s.body} />
              ))}
            </ol>
          </section>
        )}

        {recipe.tools.length > 0 && (
          <section className={`${styles.main} ${styles.block}`}>
            <h2 className={styles.blockTitle}>Tools &amp; equipment</h2>
            <ol className={`${styles.list} ${styles.tools}`}>
              {recipe.tools.map((t, i) => (
                <ToolItem key={i} n={i + 1} name={t} />
              ))}
            </ol>
          </section>
        )}

        {recipe.notes.length > 0 && (
          <section className={`${styles.main} ${styles.block}`}>
            <h2 className={styles.blockTitle}>Notes</h2>
            <ul className={styles.list}>
              {recipe.notes.map((n, i) => (
                <NoteItem key={i} text={n} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
