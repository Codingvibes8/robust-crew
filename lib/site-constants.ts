export const APP_NAME = "Plainread";
export const APP_TAGLINE = "A reading aid for dyslexia";
export const MEDICAL_DISCLAIMER =
  "Plainread is a reading aid, not a diagnostic or medical tool. It is designed to help you find comfortable display settings and simplify complex text.";

export const COOKIE_ANON_ID = "pr_anon_id";
export const COOKIE_PROFILE = "pr_profile";
export const HEADER_ANON_ID = "x-anon-id";

export const MAX_DOC_WORDS = 6000;
export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const DAILY_FREE_SIMPLIFY_LIMIT = 5;

export const THEMES = {
  plain: {
    id: "plain",
    name: "Plain",
    bg: "#F7F8FA",
    ink: "#1E2733",
    border: "#D8DEE4",
    surface: "#FFFFFF",
    description: "Cool light grey background with deep slate ink",
  },
  paper: {
    id: "paper",
    name: "Paper",
    bg: "#F8F5EE",
    ink: "#2A2723",
    border: "#E2DDD1",
    surface: "#FFFDF9",
    description: "Warm parchment cream with soft warm ink",
  },
  mist: {
    id: "mist",
    name: "Mist",
    bg: "#EEF3F6",
    ink: "#202B33",
    border: "#D0DCE3",
    surface: "#F7FBFC",
    description: "Soft blue-grey with high-legibility slate",
  },
  mint: {
    id: "mint",
    name: "Mint",
    bg: "#EDF6F1",
    ink: "#1D2D24",
    border: "#CEE2D5",
    surface: "#F6FAF7",
    description: "Gentle muted sage green reducing glare",
  },
  peach: {
    id: "peach",
    name: "Peach",
    bg: "#FDF2EB",
    ink: "#35251C",
    border: "#F0DACB",
    surface: "#FFFAF6",
    description: "Warm amber-peach tint that calms visual stress",
  },
  dusk: {
    id: "dusk",
    name: "Dusk",
    bg: "#252B33",
    ink: "#E6ECF2",
    border: "#3B4450",
    surface: "#2D343E",
    description: "Low-contrast dark mode avoiding harsh black",
  },
} as const;

export type ThemeId = keyof typeof THEMES;

export const ACCENT_COLOR = "#136F63"; // Deep teal
export const PRIMARY_INK = "#1E2733";
