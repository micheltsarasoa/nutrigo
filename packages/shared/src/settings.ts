import { z } from "zod";

// SPEC-008. S1 edits the locale only; the source and AI fields join in S3 and S5.
export const Locale = z.enum(["fr-FR", "en-IE"]);
export type Locale = z.infer<typeof Locale>;
export const SettingsInput = z.object({ locale: Locale });
export type SettingsInput = z.infer<typeof SettingsInput>;
export const Settings = SettingsInput;
export type Settings = z.infer<typeof Settings>;
