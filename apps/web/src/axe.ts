import axe from "axe-core";

// All rules except color-contrast, which ADR-0008 keeps off for now.
export const axeOptions: axe.RunOptions = {
  rules: { "color-contrast": { enabled: false } },
};

export async function axeViolations(node: Element) {
  return (await axe.run(node, axeOptions)).violations;
}
