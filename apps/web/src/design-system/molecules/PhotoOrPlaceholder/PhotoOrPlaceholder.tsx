import { Icon } from "../../atoms/Icon/index.ts";
import styles from "./PhotoOrPlaceholder.module.css";

type Props = {
  photo: string | null;
  // Ingredient product images; only the first 4 are shown.
  mosaic: string[];
  mealType: "breakfast" | "lunch" | "snack" | "dinner";
  size: "hero" | "thumb";
  // Decorative by default: a title sits next to it.
  alt?: string;
};

// .rd-hero (Recipe Details) and .menu-item__media (Healthy Menu).
// Fallbacks (PRD §5.8): own photo, then ingredient mosaic, then meal-type placeholder.
export function PhotoOrPlaceholder({
  photo,
  mosaic,
  mealType,
  size,
  alt = "",
}: Props) {
  const box = `${styles.media} ${styles[size]}`;
  if (photo) {
    return <img className={box} src={photo} alt={alt} />;
  }
  const tiles = mosaic.slice(0, 4);
  if (tiles.length > 0) {
    return (
      <div className={`${box} ${styles.mosaic}`} data-count={tiles.length}>
        {tiles.map((src) => (
          <img key={src} src={src} alt="" />
        ))}
      </div>
    );
  }
  return (
    <div
      className={`${box} ${styles.placeholder} ${styles[mealType]}`}
      data-meal-type={mealType}
    >
      <Icon name="menu" size="lg" />
    </div>
  );
}
