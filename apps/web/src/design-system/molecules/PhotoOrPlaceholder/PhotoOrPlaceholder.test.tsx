import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { PhotoOrPlaceholder } from "./PhotoOrPlaceholder.tsx";

const imgs = (container: HTMLElement) => [...container.querySelectorAll("img")];

describe("PhotoOrPlaceholder", () => {
  it("shows the recipe's own photo first, even when ingredient images exist", () => {
    const { container } = render(
      <PhotoOrPlaceholder
        photo="/own.jpg"
        mosaic={["/a.jpg"]}
        mealType="lunch"
        size="hero"
      />,
    );
    expect(imgs(container).map((i) => i.getAttribute("src"))).toEqual([
      "/own.jpg",
    ]);
  });

  it("falls back to a mosaic of up to 4 ingredient images", () => {
    const { container } = render(
      <PhotoOrPlaceholder
        photo={null}
        mosaic={["/1.jpg", "/2.jpg", "/3.jpg", "/4.jpg", "/5.jpg"]}
        mealType="lunch"
        size="thumb"
      />,
    );
    expect(imgs(container).map((i) => i.getAttribute("src"))).toEqual([
      "/1.jpg",
      "/2.jpg",
      "/3.jpg",
      "/4.jpg",
    ]);
  });

  it("falls back to a meal-type placeholder with an icon when there is no image", () => {
    const { container } = render(
      <PhotoOrPlaceholder
        photo={null}
        mosaic={[]}
        mealType="dinner"
        size="thumb"
      />,
    );
    expect(imgs(container)).toEqual([]);
    expect(
      container.querySelector("[data-meal-type='dinner'] svg"),
    ).not.toBeNull();
  });

  it("is decorative by default (alt is empty), and takes an alt when it stands alone", () => {
    const { container, rerender } = render(
      <PhotoOrPlaceholder
        photo="/own.jpg"
        mosaic={[]}
        mealType="lunch"
        size="hero"
      />,
    );
    expect(imgs(container)[0].getAttribute("alt")).toBe("");
    rerender(
      <PhotoOrPlaceholder
        photo="/own.jpg"
        mosaic={[]}
        mealType="lunch"
        size="hero"
        alt="Grilled turkey breast"
      />,
    );
    expect(imgs(container)[0].getAttribute("alt")).toBe(
      "Grilled turkey breast",
    );
  });

  it("is not focusable: it only displays", () => {
    const { container } = render(
      <PhotoOrPlaceholder
        photo={null}
        mosaic={["/1.jpg"]}
        mealType="snack"
        size="thumb"
      />,
    );
    expect(container.querySelector("a, button, [tabindex]")).toBeNull();
  });

  it("has no axe violations in each fallback", async () => {
    const { container } = render(
      <>
        <PhotoOrPlaceholder
          photo="/own.jpg"
          mosaic={[]}
          mealType="lunch"
          size="hero"
        />
        <PhotoOrPlaceholder
          photo={null}
          mosaic={["/1.jpg", "/2.jpg"]}
          mealType="lunch"
          size="thumb"
        />
        <PhotoOrPlaceholder
          photo={null}
          mosaic={[]}
          mealType="breakfast"
          size="thumb"
        />
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
