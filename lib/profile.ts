import { z } from "zod";

export const FONT_OPTIONS = [
  { id: "lexend", name: "Lexend", family: "'Lexend', sans-serif" },
  { id: "atkinson", name: "Atkinson Hyperlegible", family: "'Atkinson Hyperlegible', sans-serif" },
  { id: "literata", name: "Literata", family: "'Literata', serif" },
  { id: "system", name: "System Sans", family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
] as const;

export type FontId = (typeof FONT_OPTIONS)[number]["id"];

export const ReadingProfileSchema = z.object({
  font: z.enum(["lexend", "atkinson", "literata", "system"]).default("lexend"),
  size: z.coerce.number().min(16).max(30).default(19),
  letterSpacing: z.coerce.number().min(0).max(0.2).default(0.03),
  wordSpacing: z.coerce.number().min(0).max(0.6).default(0.12),
  lineHeight: z.coerce.number().min(1.3).max(2.4).default(1.7),
  width: z.coerce.number().min(40).max(90).default(65),
  theme: z.enum(["plain", "paper", "mist", "mint", "peach", "dusk"]).default("plain"),
  ruler: z.boolean().default(false),
  ttsRate: z.coerce.number().min(0.6).max(1.6).default(1.0),
});

export type ReadingProfile = z.infer<typeof ReadingProfileSchema>;

export const DEFAULT_PROFILE: ReadingProfile = {
  font: "lexend",
  size: 19,
  letterSpacing: 0.03,
  wordSpacing: 0.12,
  lineHeight: 1.7,
  width: 65,
  theme: "plain",
  ruler: false,
  ttsRate: 1.0,
};

export function parseProfile(raw: unknown): ReadingProfile {
  if (!raw) return DEFAULT_PROFILE;
  try {
    let parsedJson = raw;
    if (typeof raw === "string") {
      parsedJson = JSON.parse(raw);
    }
    const result = ReadingProfileSchema.safeParse(parsedJson);
    if (result.success) {
      return result.data;
    }
  } catch {
    // Return default on error
  }
  return DEFAULT_PROFILE;
}

export function serializeProfile(profile: ReadingProfile): string {
  return JSON.stringify(profile);
}
