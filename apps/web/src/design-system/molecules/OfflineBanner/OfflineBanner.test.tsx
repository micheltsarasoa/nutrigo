import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { OfflineBanner } from "./OfflineBanner.tsx";

describe("OfflineBanner", () => {
  it("says changes are saved on the device when offline with nothing pending", () => {
    render(<OfflineBanner state="offline" pending={0} />);
    expect(screen.getByRole("status").textContent).toBe(
      "Offline · changes are saved on this device",
    );
  });

  it("counts pending changes, singular and plural", () => {
    const { rerender } = render(<OfflineBanner state="offline" pending={6} />);
    expect(screen.getByRole("status").textContent).toBe(
      "Offline · 6 changes pending",
    );
    rerender(<OfflineBanner state="offline" pending={1} />);
    expect(screen.getByRole("status").textContent).toBe(
      "Offline · 1 change pending",
    );
  });

  it("announces syncing politely", () => {
    render(<OfflineBanner state="syncing" pending={6} />);
    expect(screen.getByRole("status").textContent).toBe("Syncing 6 changes…");
  });

  it("is an alert with a Retry button on a sync error", () => {
    const onRetry = vi.fn();
    render(<OfflineBanner state="error" pending={6} onRetry={onRetry} />);
    expect(screen.getByRole("alert").textContent).toContain(
      "Couldn't sync 6 changes",
    );
    expect(screen.queryByRole("status")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("has no Retry button without a handler", () => {
    render(<OfflineBanner state="error" pending={2} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it.each(["offline", "syncing", "error"] as const)(
    "has no axe violations (%s)",
    async (state) => {
      const { container } = render(
        <OfflineBanner state={state} pending={3} onRetry={() => {}} />,
      );
      expect(await axeViolations(container)).toEqual([]);
    },
  );
});
