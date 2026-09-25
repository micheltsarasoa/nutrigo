import styles from "./NoteItem.module.css";

type Props = {
  text: string;
};

// .note from Recipe Details. Goes inside a <ul>; one per paragraph of notes_md,
// shown as plain text.
export function NoteItem({ text }: Props) {
  return (
    <li className={styles.note}>
      <span className={styles.dot} aria-hidden />
      <p className={styles.text}>{text}</p>
    </li>
  );
}
