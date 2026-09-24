import { useId, type ReactNode } from "react";
import styles from "./Card.module.css";

type Props = {
  /** Shown as a real heading; the card becomes a section named by it. */
  title?: string;
  /** Keeps the page outline right. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Shows the "•••" button. The menu it opens belongs to the caller. */
  onMore?: () => void;
  children: ReactNode;
};

// .card, .card__head, .card__title and .card__more from design/source/nutrigo.css.
export function Card({ title, headingLevel = 2, onMore, children }: Props) {
  const titleId = useId();
  const Heading = `h${headingLevel}` as const;
  const Root = title ? "section" : "div";
  return (
    <Root className={styles.card} aria-labelledby={title ? titleId : undefined}>
      {(title || onMore) && (
        <div className={styles.head}>
          {title && (
            <Heading id={titleId} className={styles.title}>
              {title}
            </Heading>
          )}
          {onMore && (
            <button
              type="button"
              className={styles.more}
              aria-label={title ? `More options for ${title}` : "More options"}
              onClick={onMore}
            >
              {/* The design's "•••"; the Icon set has no dots glyph. */}
              <svg
                className={styles.dots}
                viewBox="0 0 24 24"
                fill="currentColor"
                focusable="false"
                aria-hidden
              >
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </button>
          )}
        </div>
      )}
      {children}
    </Root>
  );
}
