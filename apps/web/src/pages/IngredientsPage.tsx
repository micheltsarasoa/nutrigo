// SPEC-002 US-1 (AC-1, AC-2, AC-9, AC-10): browse, add, edit and delete
// ingredients. The only page that fetches; IngredientEditor stays props-only.
import { Ingredient, IngredientInput, type Source } from "@nutrigo/shared";
import { useEffect, useState } from "react";
import { Button } from "../design-system/atoms/Button/index.ts";
import { Card } from "../design-system/atoms/Card/index.ts";
import { Pill } from "../design-system/atoms/Pill/index.ts";
import { IngredientEditor } from "../design-system/organisms/IngredientEditor/index.ts";
import { navigate } from "../router.ts";
import styles from "./IngredientsPage.module.css";

const LIST_ERROR =
  "Couldn't load your ingredients. Check the connection and try again.";
const LOAD_ERROR =
  "Couldn't load the ingredient. Check the connection and try again.";
const CONFLICT_ERROR = "An ingredient with this name already exists.";
const SAVE_ERROR =
  "Couldn't save the ingredient. Your input is kept, try again.";
const DELETE_CONFLICT = "This ingredient can't be deleted.";
const DELETE_ERROR = "Couldn't delete the ingredient. Try again.";
const USED_BY_PREFIX = "Used by these recipes: ";

// Category and Source from packages/shared, in the wording SPEC-002 §4 uses.
const CATEGORY_LABEL: Record<string, string> = {
  grains: "Grains",
  veggies: "Veggies",
  protein: "Protein",
  fruits: "Fruits",
  dairy: "Dairy",
  others: "Others",
};
const SOURCE_LABEL: Record<Source, string> = {
  manual: "Manual",
  off: "Open Food Facts",
  ciqual: "Ciqual",
  ai_estimate: "AI estimate",
};

export function IngredientsPage({ path }: { path: string }) {
  if (path === "/ingredients/new") return <NewIngredient />;
  const editId = /^\/ingredients\/(\d+)$/.exec(path)?.[1];
  if (editId) return <EditIngredient key={editId} id={editId} />;
  return <IngredientList />;
}

function IngredientList() {
  const [ingredients, setIngredients] = useState<Ingredient[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const res = await fetch("/api/ingredients");
      if (!res.ok) throw new Error();
      setIngredients(Ingredient.array().parse(await res.json()));
    } catch {
      setError(LIST_ERROR);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <main>
      <div className={styles.head}>
        <h1>Ingredients</h1>
        <Button onClick={() => navigate("/ingredients/new")}>
          Add ingredient
        </Button>
      </div>
      {error ? (
        <div role="alert" className={styles.alert}>
          <p>{error}</p>
          <Button variant="ghost" onClick={load}>
            Retry
          </Button>
        </div>
      ) : ingredients === null ? (
        <p role="status">Loading your ingredients…</p>
      ) : ingredients.length === 0 ? (
        <p>No ingredients yet. Add your first one.</p>
      ) : (
        <Card>
          <ul className={styles.list}>
            {ingredients.map((i) => (
              <li key={i.id} className={styles.row}>
                <a href={`/ingredients/${i.id}`} className={styles.link}>
                  {i.name}
                </a>
                <span className={styles.detail}>
                  {CATEGORY_LABEL[i.category] ?? i.category} ·{" "}
                  {Math.round(i.kcal100g)} kcal / 100 g
                </span>
                <Pill variant="grey">{SOURCE_LABEL[i.source]}</Pill>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </main>
  );
}

function NewIngredient() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave(input: IngredientInput) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/ingredients", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (res.status === 409) {
        setError(CONFLICT_ERROR);
        return;
      }
      if (!res.ok) throw new Error();
      navigate("/ingredients");
    } catch {
      setError(SAVE_ERROR);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <IngredientEditor
        saving={saving}
        error={error}
        onSave={onSave}
        onCancel={() => navigate("/ingredients")}
      />
    </main>
  );
}

function EditIngredient({ id }: { id: string }) {
  const [ingredient, setIngredient] = useState<Ingredient | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedBy, setUsedBy] = useState<string[] | null>(null);

  async function load() {
    setLoadError(null);
    setNotFound(false);
    try {
      const res = await fetch(`/api/ingredients/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error();
      setIngredient(Ingredient.parse(await res.json()));
    } catch {
      setLoadError(LOAD_ERROR);
    }
  }

  // Keyed by id, so `id` never changes for this instance.
  useEffect(() => {
    void load();
  }, []);

  async function onSave(input: IngredientInput) {
    setSaving(true);
    setError(null);
    setUsedBy(null);
    try {
      const res = await fetch(`/api/ingredients/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (res.status === 409) {
        setError(CONFLICT_ERROR);
        return;
      }
      if (!res.ok) throw new Error();
      navigate("/ingredients");
    } catch {
      setError(SAVE_ERROR);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    setSaving(true);
    setError(null);
    setUsedBy(null);
    try {
      const res = await fetch(`/api/ingredients/${id}`, { method: "DELETE" });
      if (res.status === 409) {
        const body = await res.json();
        const message: string = body.error.message;
        setError(DELETE_CONFLICT);
        setUsedBy(
          message.startsWith(USED_BY_PREFIX)
            ? message.slice(USED_BY_PREFIX.length).split(", ")
            : [],
        );
        return;
      }
      if (!res.ok) throw new Error();
      navigate("/ingredients");
    } catch {
      setError(DELETE_ERROR);
    } finally {
      setSaving(false);
    }
  }

  if (notFound) {
    return (
      <main>
        <h1>Ingredient not found</h1>
        <p>
          <a href="/ingredients">Back to ingredients</a>
        </p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main>
        <div role="alert" className={styles.alert}>
          <p>{loadError}</p>
          <Button variant="ghost" onClick={load}>
            Retry
          </Button>
        </div>
      </main>
    );
  }

  if (ingredient === null) {
    return (
      <main>
        <p role="status">Loading the ingredient…</p>
      </main>
    );
  }

  return (
    <main>
      <IngredientEditor
        ingredient={ingredient}
        saving={saving}
        error={error}
        usedBy={usedBy}
        onSave={onSave}
        onCancel={() => navigate("/ingredients")}
        onDelete={onDelete}
      />
    </main>
  );
}
