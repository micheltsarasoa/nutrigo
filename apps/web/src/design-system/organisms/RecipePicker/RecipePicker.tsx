import { useEffect, useId, useRef, useState } from "react";
import { Button } from "../../atoms/Button/index.ts";
import { SearchField } from "../../atoms/SearchField/index.ts";
import { Stepper } from "../../atoms/Stepper/index.ts";
import { PhotoOrPlaceholder } from "../../molecules/PhotoOrPlaceholder/index.ts";
import styles from "./RecipePicker.module.css";

export type PickerRecipe = {
  id: number;
  title: string;
  mealType: "breakfast" | "lunch" | "snack" | "dinner";
  kcalPerServing: number;
  photo: string | null;
  mosaic: string[];
};

type Props = {
  open: boolean;
  /** Names the dialog, e.g. "Add to Tuesday · Lunch". */
  heading: string;
  /** Already filtered by `query`: the page searches. */
  recipes: PickerRecipe[];
  loading?: boolean;
  query: string;
  /** The add failed: shown above the buttons, the servings step stays. */
  error?: string | null;
  saving?: boolean;
  onQueryChange: (query: string) => void;
  /** The dialog doesn't close itself on Add: the page sets open=false on success. */
  onPick: (recipe: PickerRecipe, servings: number) => void;
  /** Called once whenever the dialog closes: Cancel, Esc, or open turning false. */
  onClose: () => void;
};

// Derived from SettingsDialog (dialog shell) and the RecipeList toolbar (search,
// empty states); no sketch of its own (owner decision, 2026-10-15). Two steps in
// one dialog: search and pick, then servings. Props only, no fetching.
export function RecipePicker({
  open,
  heading,
  recipes,
  loading = false,
  query,
  error,
  saving = false,
  onQueryChange,
  onPick,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [picked, setPicked] = useState<PickerRecipe | null>(null);
  const [servings, setServings] = useState(1);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) {
      setPicked(null);
      setServings(1);
    }
  }, [open]);

  let body;
  if (picked) {
    body = (
      <>
        <div className={styles.row}>
          <PhotoOrPlaceholder {...picked} size="mini" />
          <span className={styles.name}>{picked.title}</span>
        </div>
        <div className={styles.servings}>
          <span aria-hidden="true">Servings</span>
          <Stepper
            label="Servings"
            value={servings}
            min={1}
            max={12}
            onChange={setServings}
          />
          <b className={styles.total}>
            {Math.round(picked.kcalPerServing * servings).toLocaleString("en")}{" "}
            kcal
          </b>
        </div>
      </>
    );
  } else if (loading) {
    body = (
      <p role="status" className={styles.muted}>
        Loading recipes…
      </p>
    );
  } else if (recipes.length === 0) {
    body = (
      <p className={styles.muted}>
        <b>{query === "" ? "No recipes yet" : "No recipes match"}</b>
      </p>
    );
  } else {
    body = (
      <ul className={styles.list}>
        {recipes.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              className={`${styles.row} ${styles.pick}`}
              onClick={() => setPicked(r)}
            >
              <PhotoOrPlaceholder {...r} size="mini" />
              <span className={styles.name}>{r.title}</span>
              <span className={styles.muted}>{r.kcalPerServing} kcal</span>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className={styles.dialog}
      onClose={onClose}
    >
      <div className={styles.content}>
        <h2 id={titleId} className={styles.title}>
          {heading}
        </h2>
        {!picked && (
          <SearchField
            label="Search recipes"
            size="sm"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        )}
        {body}
        {error && (
          <div role="alert" className={styles.alert}>
            <p>{error}</p>
          </div>
        )}
        <div className={styles.actions}>
          {picked && (
            <Button variant="ghost" onClick={() => setPicked(null)}>
              Back
            </Button>
          )}
          <Button variant="ghost" onClick={() => dialogRef.current?.close()}>
            Cancel
          </Button>
          {picked && (
            <Button
              icon="check"
              loading={saving}
              onClick={() => onPick(picked, servings)}
            >
              Add
            </Button>
          )}
        </div>
      </div>
    </dialog>
  );
}
