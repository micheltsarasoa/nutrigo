import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { Card } from "./Card.tsx";

describe("Card", () => {
  it("is a section named by its title, shown as an h2 by default", () => {
    render(
      <Card title="Calories Intake">
        <p>1240 kcal</p>
      </Card>,
    );
    const heading = screen.getByRole("heading", {
      level: 2,
      name: "Calories Intake",
    });
    const region = screen.getByRole("region", { name: "Calories Intake" });
    expect(region.tagName).toBe("SECTION");
    expect(region.getAttribute("aria-labelledby")).toBe(heading.id);
    expect(region.textContent).toContain("1240 kcal");
  });

  it("uses the heading level it is given", () => {
    render(
      <Card title="Recent Activity" headingLevel={3}>
        Content
      </Card>,
    );
    expect(
      screen.getByRole("heading", { level: 3, name: "Recent Activity" }),
    ).toBeTruthy();
  });

  it("is a plain div with no header when it has no title", () => {
    const { container } = render(<Card>Only content</Card>);
    const card = container.firstElementChild!;
    expect(card.tagName).toBe("DIV");
    expect(screen.queryByRole("region")).toBeNull();
    expect(screen.queryByRole("heading")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(card.textContent).toBe("Only content");
  });

  it("has no more button without onMore", () => {
    render(<Card title="Weight Data">Content</Card>);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows a keyboard-reachable more button named after the title", () => {
    const onMore = vi.fn();
    render(
      <Card title="Weight Data" onMore={onMore}>
        Content
      </Card>,
    );
    const more = screen.getByRole("button", {
      name: "More options for Weight Data",
    });
    expect(more.getAttribute("type")).toBe("button");
    more.focus();
    expect(document.activeElement).toBe(more);
    fireEvent.click(more);
    expect(onMore).toHaveBeenCalledOnce();
  });

  it("keeps the more button, with a generic name, when there is no title", () => {
    const onMore = vi.fn();
    render(<Card onMore={onMore}>Content</Card>);
    fireEvent.click(screen.getByRole("button", { name: "More options" }));
    expect(onMore).toHaveBeenCalledOnce();
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("has no axe violations in any state", async () => {
    const { container } = render(
      <>
        <Card title="Calories Intake" onMore={() => {}}>
          <p>1240 kcal</p>
        </Card>
        <Card title="Recent Activity" headingLevel={3}>
          <p>Lunch logged</p>
        </Card>
        <Card>
          <p>No header</p>
        </Card>
        <Card onMore={() => {}}>
          <p>More, no title</p>
        </Card>
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
