import { ReadingProfile, FONT_OPTIONS } from "./profile";
import { THEMES, ACCENT_COLOR } from "./site-constants";

export function profileToCssVars(profile: ReadingProfile): Record<string, string> {
  const fontMeta = FONT_OPTIONS.find((f) => f.id === profile.font) ?? FONT_OPTIONS[0];
  const themeMeta = THEMES[profile.theme] ?? THEMES.plain;

  return {
    "--r-font": fontMeta.family,
    "--r-size": `${profile.size}px`,
    "--r-letter-spacing": `${profile.letterSpacing}em`,
    "--r-word-spacing": `${profile.wordSpacing}em`,
    "--r-line-height": `${profile.lineHeight}`,
    "--r-width": `${profile.width}ch`,
    "--r-bg": themeMeta.bg,
    "--r-ink": themeMeta.ink,
    "--r-border": themeMeta.border,
    "--r-surface": themeMeta.surface,
    "--r-accent": ACCENT_COLOR,
  };
}

export function profileToStyleString(profile: ReadingProfile): string {
  const vars = profileToCssVars(profile);
  return Object.entries(vars)
    .map(([key, val]) => `${key}: ${val};`)
    .join(" ");
}

/**
 * Live updates the root <html> CSS custom properties in the browser
 */
export function applyProfileToDocument(profile: ReadingProfile): void {
  if (typeof document === "undefined") return;
  const vars = profileToCssVars(profile);
  const root = document.documentElement;
  for (const [key, val] of Object.entries(vars)) {
    root.style.setProperty(key, val);
  }
}
