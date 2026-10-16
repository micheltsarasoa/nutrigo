import { MacroBar } from "../../molecules/MacroBar/MacroBar.tsx";
import { Ring } from "../Ring/Ring.tsx";
import { useNumber } from "../../../locale.tsx";
import styles from "./CaloriesCard.module.css";

type Macros = { carbs: number; protein: number; fat: number };

type Props = {
  kcal: number;
  /** Daily target in kcal; 0 or missing means no targets: totals only. */
  target?: number;
  macros: Macros;
  targets?: Macros;
  /** Planned kcal for the day, shown under the heading. */
  planned?: number;
};

// CaloriesCard from the Today sketch (#216): Ring left, MacroBars right. Burned calories are out.
export function CaloriesCard({
  kcal,
  target = 0,
  macros,
  targets,
  planned,
}: Props) {
  const n = useNumber();
  if (target <= 0) {
    return (
      <section className={styles.card}>
        <h3 className={styles.title}>Calories intake</h3>
        <div className={styles.totals}>
          <div>
            <b>{n(kcal)}</b>
            <span>kcal</span>
          </div>
          <div>
            <b>{macros.carbs} g</b>
            <span>carbs</span>
          </div>
          <div>
            <b>{macros.protein} g</b>
            <span>protein</span>
          </div>
          <div>
            <b>{macros.fat} g</b>
            <span>fat</span>
          </div>
        </div>
        <p className={styles.hint}>
          Set your daily targets to see the ring and bars.{" "}
          <a className={styles.link} href="/targets">
            Set targets
          </a>
        </p>
      </section>
    );
  }
  return (
    <section className={`${styles.card} ${styles.full}`}>
      <Ring kcal={kcal} target={target} />
      <div className={styles.bars}>
        <h3 className={styles.title}>Calories intake</h3>
        {planned !== undefined && (
          <p className={styles.hint}>{n(planned)} kcal planned</p>
        )}
        <MacroBar
          macro="carbs"
          label="Carbs"
          value={macros.carbs}
          target={targets?.carbs}
        />
        <MacroBar
          macro="protein"
          label="Protein"
          value={macros.protein}
          target={targets?.protein}
        />
        <MacroBar
          macro="fat"
          label="Fat"
          value={macros.fat}
          target={targets?.fat}
        />
      </div>
    </section>
  );
}
