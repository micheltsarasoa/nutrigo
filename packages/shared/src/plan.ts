import { z } from "zod";
import { MealType } from "./recipes.ts";

// SPEC-003 §5 and §7. Weeks are ISO 8601 (Monday start). Dates are "YYYY-MM-DD"
// and all the maths is in UTC, so a DST change never moves a day.
const DAY = 86_400_000;
const utc = (date: string) => Date.parse(`${date}T00:00:00Z`);
const fmt = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const mondayOffset = (ms: number) => (new Date(ms).getUTCDay() + 6) % 7;

export const IsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((d) => !Number.isNaN(utc(d)) && fmt(utc(d)) === d);

export function isoWeekOf(date: string) {
  const t = utc(date);
  const thursday = t + (3 - mondayOffset(t)) * DAY;
  const year = new Date(thursday).getUTCFullYear();
  const week = Math.floor((thursday - Date.UTC(year, 0, 1)) / DAY / 7) + 1;
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function mondayOf(isoWeek: string) {
  const [, year = "", week = ""] = /^(\d{4})-W(\d{2})$/.exec(isoWeek) ?? [];
  const jan4 = Date.UTC(Number(year), 0, 4); // week 1 contains Jan 4
  return jan4 - mondayOffset(jan4) * DAY + (Number(week) - 1) * 7 * DAY;
}

// 2026-W53 exists, 2027-W53 does not: a real week reads back as itself.
const isRealWeek = (w: string) =>
  /^\d{4}-W\d{2}$/.test(w) && isoWeekOf(fmt(mondayOf(w))) === w;
export const IsoWeek = z.string().refine(isRealWeek);

export function weekDays(isoWeek: string) {
  const monday = mondayOf(isoWeek);
  return Array.from({ length: 7 }, (_, i) => fmt(monday + i * DAY));
}

const part = (date: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...opts }).format(
    utc(date),
  );

// "Oct 5 – 11, 2026"; the month, then the year, shown on both sides when they differ.
export function weekLabel(isoWeek: string) {
  const days = weekDays(isoWeek);
  const [first = "", last = ""] = [days[0], days[6]];
  const y = (d: string) => d.slice(0, 4);
  const md = (d: string) => part(d, { month: "short", day: "numeric" });
  if (y(first) !== y(last))
    return `${md(first)}, ${y(first)} – ${md(last)}, ${y(last)}`;
  const end =
    first.slice(5, 7) === last.slice(5, 7)
      ? part(last, { day: "numeric" })
      : md(last);
  return `${md(first)} – ${end}, ${y(last)}`;
}

export const MealEntryInput = z.object({
  date: IsoDate,
  slot: MealType,
  recipeId: z.number().int().positive(),
  servings: z.number().positive(),
});
export type MealEntryInput = z.infer<typeof MealEntryInput>;
export const MealEntryPatch = MealEntryInput.omit({ recipeId: true })
  .extend({ position: z.number().int().min(0) })
  .partial();
export type MealEntryPatch = z.infer<typeof MealEntryPatch>;
/** SPEC-004 §5: eaten servings, 0.5 to 20 in steps of 0.5; omitted = the planned servings. */
export const EatenInput = z.object({
  servings: z.number().min(0.5).max(20).multipleOf(0.5).optional(),
});
export const MealEntry = MealEntryInput.extend({
  id: z.number().int(),
  isoWeek: IsoWeek,
  position: z.number().int(),
  recipeName: z.string(),
  kcalPerServing: z.number(),
  eatenServings: z.number().positive().nullish(),
  eatenAt: z.string().nullish(),
});
export type MealEntry = z.infer<typeof MealEntry>;

export const Plan = z.object({
  isoWeek: IsoWeek,
  days: z.array(
    z.object({
      date: IsoDate,
      slots: z.record(MealType, z.array(MealEntry)),
    }),
  ),
});
export type Plan = z.infer<typeof Plan>;

export const CopyMode = z.enum(["replace", "merge"]);
export type CopyMode = z.infer<typeof CopyMode>;

export const plannedKcal = (
  entries: { servings: number; kcalPerServing: number }[],
) => entries.reduce((sum, e) => sum + e.servings * e.kcalPerServing, 0);

type Planned = MealEntryInput & { id: number };

// Pure plan of a copy: which target entries to delete and which to create. The
// caller runs it in one transaction. Merge adds to what the target already has.
export function copyWeek(
  from: Planned[],
  fromWeek: string,
  toWeek: string,
  target: Planned[],
  mode: CopyMode,
) {
  const shift = mondayOf(toWeek) - mondayOf(fromWeek);
  return {
    remove: mode === "replace" ? target.map((e) => e.id) : [],
    add: from.map(({ date, slot, recipeId, servings }) => ({
      date: fmt(utc(date) + shift),
      slot,
      recipeId,
      servings,
    })),
  };
}
